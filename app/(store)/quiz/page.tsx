import type { Metadata } from "next";
import { auth } from "@/auth";
import { getPlans } from "@/lib/queries";
import { QuizClient } from "@/components/quiz/QuizClient";

export const metadata: Metadata = { title: "Find my plan", description: "Answer a few questions and we'll work out your daily calorie target and the right Chop Lean plan." };
export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const [plans, session] = await Promise.all([getPlans(), auth().catch(() => null)]);
  return <QuizClient plans={plans.filter((p) => p.kcal).map((p) => ({ slug: p.slug, name: p.name, kcal: p.kcal!, tags: p.tags }))} signedIn={!!session?.user} />;
}
