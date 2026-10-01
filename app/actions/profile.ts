"use server";
import { quizSchema, type QuizData } from "@/lib/quiz-schema";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "@/auth";

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
