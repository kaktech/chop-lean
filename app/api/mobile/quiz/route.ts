import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { dailyKcalTarget } from "@/lib/pricing";
import { fail, imageUrl, mobileUser, ok } from "@/lib/mobile-api";

const body = z.object({
  goal: z.enum(["lose", "keep", "gain"]),
  sex: z.enum(["female", "male"]),
  age: z.number().int().min(18, "You must be 18 or over for a calorie-reduced plan").max(90),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
  goalWeightKg: z.number().min(35).max(250).optional(),
  activity: z.enum(["light", "moderate", "active"]),
  exclusions: z.array(z.string().max(40)).max(12),
  pepper: z.number().int().min(1).max(5),
});

/** The same calculation as the website's plan finder (Mifflin-St Jeor, 500 kcal deficit, 1,200 floor). Saves to the profile when signed in. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check your answers.");
  const d = parsed.data;
  const calc = dailyKcalTarget({ sex: d.sex, weightKg: d.weightKg, heightCm: d.heightCm, age: d.age, activity: d.activity, goal: d.goal });
  const protein = Math.round((d.weightKg * (d.goal === "gain" ? 1.6 : 1.3)) / 5) * 5;

  const plans = await db.select().from(s.products).where(eq(s.products.type, "plan")).orderBy(asc(s.products.createdAt));
  const live = plans.filter((p) => p.isLive && p.kcal);
  const avoidSwallow = d.exclusions.includes("No swallow");
  const same = live.filter((p) => p.kcal === calc.plan && !(avoidSwallow && (p.tags ?? []).includes("swallow")));
  const match = same.find((p) => p.slug.startsWith("naija-lean")) ?? same[0] ?? live.reduce((b, p) => (Math.abs(p.kcal! - calc.plan) < Math.abs(b.kcal! - calc.plan) ? p : b), live[0]);

  const user = await mobileUser(req);
  let saved = false;
  if (user) {
    const values = { userId: user.id, sex: d.sex, age: d.age, heightCm: Math.round(d.heightCm), startWeightKg: d.weightKg, goalWeightKg: d.goalWeightKg ?? null, activity: d.activity, dailyKcalTarget: calc.target, exclusions: d.exclusions, pepperLevel: d.pepper, updatedAt: new Date() };
    const { userId, ...rest } = values;
    await db.insert(s.profiles).values(values).onConflictDoUpdate({ target: s.profiles.userId, set: rest });
    void userId;
    saved = true;
  }
  return ok({
    dailyKcal: Math.round(calc.target / 10) * 10, protein, saved,
    pace: d.goal === "lose" ? "about 0.5 kg a week" : d.goal === "gain" ? "about 0.25 kg gained a week" : "steady weight",
    match: match ? { id: match.id, slug: match.slug, name: match.name, kcal: match.kcal, priceKobo: match.priceKobo, image: imageUrl(match.image) } : null,
  });
}
