import { randomBytes } from "node:crypto";
import { db } from "@/db";
import * as s from "@/db/schema";
import { SITE, fail, mobileUser, ok } from "@/lib/mobile-api";

/** Gives the app a one-time, 2-minute link that opens the website already signed in (used for checkout and payment). */
export async function POST(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in again.", 401);
  const token = randomBytes(24).toString("hex");
  await db.insert(s.verificationTokens).values({ identifier: `handoff:${user.id}`, token, expires: new Date(Date.now() + 2 * 60_000) });
  return ok({ url: `${SITE}/m/handoff?t=${token}&to=/checkout` });
}
