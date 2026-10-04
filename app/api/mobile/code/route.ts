import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { createElement } from "react";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { CODE_TTL_MS, generateCode, hashCode } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { fail, ok } from "@/lib/mobile-api";
import LoginCode from "@/emails/LoginCode";

/** Emails a 6-digit sign-in code. Signing in with a code also creates the account if the email is new. */
export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(120) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter a valid email address.");
  const { email } = parsed.data;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`m-otp-ip:${ip}`, 10, 10 * 60_000)) return fail("Too many requests. Please wait a few minutes.", 429);

  const [recent] = await db.select({ n: sql<number>`count(*)::int` }).from(s.loginCodes).where(and(eq(s.loginCodes.email, email), gt(s.loginCodes.createdAt, new Date(Date.now() - 10 * 60_000))));
  if ((recent?.n ?? 0) >= 4) return fail("We've already sent several codes. Use the latest one, or try again in a few minutes.", 429);

  const code = generateCode();
  await db.update(s.loginCodes).set({ usedAt: new Date() }).where(and(eq(s.loginCodes.email, email), eq(s.loginCodes.purpose, "login"), isNull(s.loginCodes.usedAt)));
  await db.insert(s.loginCodes).values({ email, purpose: "login", payload: null, codeHash: hashCode(code, email), expiresAt: new Date(Date.now() + CODE_TTL_MS) });
  const sent = await sendEmail({ to: email, subject: `${code} is your Chop Lean sign-in code`, react: createElement(LoginCode, { code, purpose: "login" }), as: "accounts" });
  if (!sent) return fail("We couldn't send the email just now. Please try again in a minute.", 502);
  return ok({ sent: true });
}
