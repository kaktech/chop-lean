import { asc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { fail, mobileUser, ok } from "@/lib/mobile-api";

export async function GET(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in again.", 401);
  const logs = await db.select().from(s.weightLogs).where(eq(s.weightLogs.userId, user.id)).orderBy(asc(s.weightLogs.loggedOn));
  return ok({ logs: logs.map((l) => ({ kg: l.kg, loggedOn: l.loggedOn })) });
}

/** Logs today's weight (Lagos date). Shows up on the website's weight tracker straight away. */
export async function POST(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in again.", 401);
  const parsed = z.object({ kg: z.number().min(30, "Enter a weight in kg").max(300, "Enter a weight in kg") }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Enter a weight in kg.");
  const today = new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
  await db.insert(s.weightLogs).values({ userId: user.id, kg: parsed.data.kg, loggedOn: today }).onConflictDoUpdate({ target: [s.weightLogs.userId, s.weightLogs.loggedOn], set: { kg: parsed.data.kg } });
  const logs = await db.select().from(s.weightLogs).where(eq(s.weightLogs.userId, user.id)).orderBy(asc(s.weightLogs.loggedOn));
  return ok({ logs: logs.map((l) => ({ kg: l.kg, loggedOn: l.loggedOn })) });
}
