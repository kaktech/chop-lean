import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";

type Plan = {
  slug: string; name: string; kcalPerDay: number; mealsPerDay: number; daysPerWeek: number;
  priceWeekly: number; compareAt: number | null; badge: string | null; goal: string;
  tags: string[]; protein: number; carbs: number; fat: number; image: string;
  description?: string; calorieOptions?: Record<string, number>;
};
type Meal = {
  slug: string; name: string; slot: string; kcal: number; protein: number;
  image: string; price: number; description?: string; tags?: string[];
};
type Seed = {
  plans: Plan[]; meals: Meal[]; drinks: Meal[];
  weeklyMenu: { weekOf: string; days: Record<string, string[]> };
  deliveryZones: { id: string; name: string; areas: string; fee: number }[];
  promoCodes: { code: string; type: string; value: number; appliesTo: string }[];
};

const kobo = (naira: number) => Math.round(naira * 100);
const SLOTS = ["breakfast", "lunch", "dinner"];

async function main() {
  const { db } = await import("./index");
  const s = await import("./schema");
  const data: Seed = JSON.parse(readFileSync("seed/menu.json", "utf8"));

  // Delivery zones
  for (const [i, z] of data.deliveryZones.entries()) {
    await db.insert(s.deliveryZones)
      .values({ id: z.id, name: z.name, areas: z.areas, feeKobo: kobo(z.fee), sort: i })
      .onConflictDoUpdate({ target: s.deliveryZones.id, set: { name: z.name, areas: z.areas, feeKobo: kobo(z.fee), sort: i } });
  }

  // Promo codes
  for (const p of data.promoCodes) {
    const value = p.type === "percent" ? p.value : kobo(p.value);
    await db.insert(s.promoCodes)
      .values({ code: p.code, type: p.type, value, appliesTo: p.appliesTo })
      .onConflictDoUpdate({ target: s.promoCodes.code, set: { type: p.type, value, appliesTo: p.appliesTo } });
  }

  // Store settings (bank details are filled in from /admin)
  await db.insert(s.storeSettings)
    .values({ id: 1, setup: { plans: true, zones: true, bank: false, paystack: false, domain: false } })
    .onConflictDoNothing();

  // Categories (Shop by Goal)
  const cats = [
    { slug: "calorie-counted", name: "Calorie-Counted Plans", image: "efo-riro.jpg", blurb: "1200-1800 kcal / day" },
    { slug: "swallow-smart", name: "Swallow Smart", image: "egusi.jpg", blurb: "Soups + light swallow" },
    { slug: "low-carb", name: "Low-Carb Owambe", image: "pepper-soup.jpg", blurb: "No rice, all flavour" },
    { slug: "high-protein", name: "High-Protein Cut", image: "moi-moi.jpg", blurb: "For gym days" },
    { slug: "office-lunch", name: "Office Lunch Lean", image: "meal-box.jpg", blurb: "5 lunches a week" },
  ];
  for (const [i, c] of cats.entries()) {
    await db.insert(s.categories).values({ ...c, sort: i })
      .onConflictDoUpdate({ target: s.categories.slug, set: { name: c.name, image: c.image, blurb: c.blurb, sort: i } });
  }

  // Plans
  for (const p of data.plans) {
    const row = {
      slug: p.slug, type: "plan" as const, name: p.name, description: p.description ?? null,
      image: p.image, kcal: p.kcalPerDay, proteinG: p.protein, carbsG: p.carbs, fatG: p.fat,
      priceKobo: kobo(p.priceWeekly), compareAtKobo: p.compareAt ? kobo(p.compareAt) : null,
      badge: p.badge, goal: p.goal, tags: p.tags, mealsPerDay: p.mealsPerDay, daysPerWeek: p.daysPerWeek,
    };
    const [prod] = await db.insert(s.products).values(row)
      .onConflictDoUpdate({ target: s.products.slug, set: row }).returning({ id: s.products.id });
    if (p.calorieOptions) {
      for (const [kcal, price] of Object.entries(p.calorieOptions)) {
        await db.insert(s.planCalorieOptions)
          .values({ productId: prod.id, kcal: Number(kcal), priceKobo: kobo(price) })
          .onConflictDoUpdate({ target: [s.planCalorieOptions.productId, s.planCalorieOptions.kcal], set: { priceKobo: kobo(price) } });
      }
    }
  }

  // Meals and drinks
  const mealIds = new Map<string, string>();
  for (const m of [...data.meals, ...data.drinks]) {
    const isDrink = m.slot === "drink";
    const row = {
      slug: m.slug, type: (isDrink ? "drink" : "meal") as "drink" | "meal", name: m.name,
      description: m.description ?? null, image: m.image, kcal: m.kcal, proteinG: m.protein,
      priceKobo: kobo(m.price), slot: m.slot, tags: m.tags ?? [], badge: isDrink ? null : "NEW",
    };
    const [prod] = await db.insert(s.products).values(row)
      .onConflictDoUpdate({ target: s.products.slug, set: row }).returning({ id: s.products.id });
    mealIds.set(m.slug, prod.id);
  }

  // Weekly menu
  const [menu] = await db.insert(s.weeklyMenus).values({ weekOf: data.weeklyMenu.weekOf })
    .onConflictDoUpdate({ target: s.weeklyMenus.weekOf, set: { weekOf: data.weeklyMenu.weekOf } })
    .returning({ id: s.weeklyMenus.id });
  await db.delete(s.weeklyMenuItems).where(eq(s.weeklyMenuItems.menuId, menu.id));
  for (const [day, slugs] of Object.entries(data.weeklyMenu.days)) {
    for (const [i, slug] of slugs.entries()) {
      const mealId = mealIds.get(slug);
      if (!mealId) throw new Error(`Weekly menu references unknown meal: ${slug}`);
      await db.insert(s.weeklyMenuItems).values({ menuId: menu.id, day, slot: SLOTS[i], mealId });
    }
  }

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.products);
  console.log(`Seeded. products=${n}, zones=${data.deliveryZones.length}, menu week=${data.weeklyMenu.weekOf}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
