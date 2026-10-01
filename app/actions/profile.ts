"use server";
import { z } from "zod";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "@/auth";

export const quizSchema = z.object({
  goal: z.enum(["lose", "keep", "gain"]),
  sex: z.enum(["female", "male"]),
  age: z.number().int().min(18, "You must be 18 or over for a calorie-reduced plan").max(90),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
  goalWeightKg: z.number().min(35).max(250).optional(),
  activity: z.enum(["light", "moderate", "active"]),
  exclusions: z.array(z.string().max(40)).max(12),
  pepper: z.number().int().min(1).max(5),
  dailyKcal: z.number().int().min(1200).max(3500),
  phone: z.string().max(20).optional(),
});
export type QuizData = z.infer<typeof quizSchema>;

/** Saves the quiz result onto the signed-in user's profile. Returns false when signed out (the client keeps it in localStorage). */
export async function saveQuizProfile(input: unknown): Promise<{ ok: boolean; saved: boolean; message?: string }> {
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) return { ok: false, saved: false, message: parsed.error.issues[0].message };
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return { ok: true, saved: false };
  const d = parsed.data;
  const values = {
    userId: session.user.id, sex: d.sex, age: d.age, heightCm: Math.round(d.heightCm), startWeightKg: d.weightKg, goalWeightKg: d.goalWeightKg ?? null,
    activity: d.activity, dailyKcalTarget: d.dailyKcal, exclusions: d.exclusions, pepperLevel: d.pepper, updatedAt: new Date(),
  };
  const { userId, ...rest } = values;
  await db.insert(profiles).values(values).onConflictDoUpdate({ target: profiles.userId, set: rest });
  void userId;
  return { ok: true, saved: true };
}
