import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { MAX_ATTEMPTS, codesMatch } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { createSession, fail, ok, publicUser } from "@/lib/mobile-api";

const body = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });

/** Checks the emailed code and signs the person in (creating the account on first use). */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Enter the 6-digit code.");
  const { email, code } = parsed.data;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`m-otp-verify:${ip}`, 20, 10 * 60_000)) return fail("Too many attempts. Please wait a few minutes.", 429);

  const [row] = await db.select().from(s.loginCodes)
    .where(and(eq(s.loginCodes.email, email), eq(s.loginCodes.purpose, "login"), isNull(s.loginCodes.usedAt), gt(s.loginCodes.expiresAt, new Date())))
    .orderBy(desc(s.loginCodes.createdAt)).limit(1);
  if (!row) return fail("That code has expired. Request a new one.", 400);
  if (row.attempts >= MAX_ATTEMPTS) {
    await db.update(s.loginCodes).set({ usedAt: new Date() }).where(eq(s.loginCodes.id, row.id));
    return fail("Too many wrong attempts. Request a new code.", 429);
  }
  if (!codesMatch(code, email, row.codeHash)) {
    await db.update(s.loginCodes).set({ attempts: row.attempts + 1 }).where(eq(s.loginCodes.id, row.id));
    return fail(`That code isn't right. ${MAX_ATTEMPTS - row.attempts - 1} attempt(s) left.`, 400);
  }
  await db.update(s.loginCodes).set({ usedAt: new Date() }).where(eq(s.loginCodes.id, row.id));

  let [user] = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  if (!user) [user] = await db.insert(s.users).values({ email, emailVerified: new Date() }).returning();
  else if (!user.emailVerified) await db.update(s.users).set({ emailVerified: new Date() }).where(eq(s.users.id, user.id));
  const token = await createSession(user.id);
  return ok({ token, user: publicUser(user) });
}
