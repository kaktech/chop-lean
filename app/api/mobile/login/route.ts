import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { createSession, fail, ok, publicUser } from "@/lib/mobile-api";

const body = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
const MAX_FAILS = 5;

/** Email + password sign-in for the mobile app. Same users, same password check as the website. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter your email and password.");
  const { email, password } = parsed.data;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`m-pw-ip:${ip}`, 30, 10 * 60_000)) return fail("Too many attempts. Please wait a few minutes.", 429);

  const key = `pw:${email}`;
  const [fails] = await db.select({ n: sql<number>`count(*)::int` }).from(s.loginAttempts).where(and(eq(s.loginAttempts.key, key), gt(s.loginAttempts.createdAt, new Date(Date.now() - 15 * 60_000))));
  if ((fails?.n ?? 0) >= MAX_FAILS) return fail("Too many failed attempts. Try again in 15 minutes.", 429);

  const [user] = await db.select().from(s.users).where(eq(s.users.email, email)).limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await db.insert(s.loginAttempts).values({ key });
    return fail(user && !user.passwordHash ? "This account has no password yet. Use “Email me a code”, then add one on the website." : "Email or password is incorrect.", 401);
  }
  await db.delete(s.loginAttempts).where(eq(s.loginAttempts.key, key));
  const token = await createSession(user.id);
  return ok({ token, user: publicUser(user) });
}
