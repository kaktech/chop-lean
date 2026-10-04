import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { fail, mobileUser, ok, publicUser } from "@/lib/mobile-api";

export async function GET(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in again.", 401);
  const [profile] = await db.select().from(s.profiles).where(eq(s.profiles.userId, user.id)).limit(1);
  const [latest] = await db.select().from(s.weightLogs).where(eq(s.weightLogs.userId, user.id)).orderBy(desc(s.weightLogs.loggedOn)).limit(1);
  return ok({
    user: publicUser(user),
    profile: profile ? { dailyKcalTarget: profile.dailyKcalTarget, goalWeightKg: profile.goalWeightKg, startWeightKg: profile.startWeightKg, exclusions: profile.exclusions, pepperLevel: profile.pepperLevel } : null,
    latestWeightKg: latest?.kg ?? null,
  });
}
