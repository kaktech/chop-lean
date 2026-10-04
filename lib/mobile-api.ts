import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import * as s from "@/db/schema";
import { newSessionToken } from "@/lib/otp";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chop-lean.vercel.app";
export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export const imageUrl = (image: string | null | undefined) =>
  !image ? `${SITE}/images/meal-box.jpg` : image.startsWith("http") ? image : `${SITE}/images/${image}`;

/** Creates the same kind of database session the website uses, and returns its token for the app to keep. */
export async function createSession(userId: string, days = 90) {
  const token = newSessionToken();
  const expires = new Date(Date.now() + days * 24 * 3600_000);
  await db.insert(s.sessions).values({ sessionToken: token, userId, expires });
  return token;
}

/** Reads `Authorization: Bearer <session token>` and returns the signed-in user, or null. */
export async function mobileUser(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const [row] = await db
    .select({ id: s.users.id, email: s.users.email, name: s.users.name, image: s.users.image })
    .from(s.sessions)
    .innerJoin(s.users, eq(s.users.id, s.sessions.userId))
    .where(and(eq(s.sessions.sessionToken, token), gt(s.sessions.expires, new Date())))
    .limit(1);
  return row ?? null;
}

export const publicUser = (u: { id: string; email: string | null; name: string | null; image: string | null }) => ({ id: u.id, email: u.email, name: u.name, image: u.image });
