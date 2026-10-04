import { and, eq, gt, like } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import * as s from "@/db/schema";
import { newSessionToken } from "@/lib/otp";

const safeTo = (p: string | null) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/checkout");

/** Opens the website signed in as the app's user. The link works once and expires after 2 minutes. */
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? "";
  const to = safeTo(req.nextUrl.searchParams.get("to"));
  const [row] = t ? await db.select().from(s.verificationTokens).where(and(eq(s.verificationTokens.token, t), like(s.verificationTokens.identifier, "handoff:%"), gt(s.verificationTokens.expires, new Date()))).limit(1) : [];
  if (!row) return NextResponse.redirect(new URL("/signin", req.nextUrl.origin));
  await db.delete(s.verificationTokens).where(and(eq(s.verificationTokens.identifier, row.identifier), eq(s.verificationTokens.token, row.token)));

  const userId = row.identifier.slice("handoff:".length);
  const sessionToken = newSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 3600_000);
  await db.insert(s.sessions).values({ sessionToken, userId, expires });
  const secure = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  (await cookies()).set(secure ? "__Secure-authjs.session-token" : "authjs.session-token", sessionToken, { httpOnly: true, sameSite: "lax", secure, path: "/", expires });
  return NextResponse.redirect(new URL(to, req.nextUrl.origin));
}
