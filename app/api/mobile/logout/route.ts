import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { ok } from "@/lib/mobile-api";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (token) await db.delete(s.sessions).where(eq(s.sessions.sessionToken, token));
  return ok({ ok: true });
}
