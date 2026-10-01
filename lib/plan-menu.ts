import type { MenuMeal, WeeklyMenuData } from "@/lib/queries";

export type PlanForMenu = { slug: string; kcal: number | null; mealsPerDay: number | null; tags: string[] };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const SHARE: Record<string, number> = { breakfast: 0.26, lunch: 0.4, dinner: 0.34 };
const SOUPY = /soup|swallow|efo|egusi|okra|ofe/i;
const LEAN_PROTEIN = /cauli|salad|suya|pepper soup|croaker|egg sauce|grilled|prawns|chicken/i;
const HEAVY_CARB = /porridge|beans|plantain|akara|potato|jollof|fried rice|pap/i;
const LOW_GI = /beans|unripe|ofada|oat|moi moi|egusi|okra|efo|croaker/i;

/** Small deterministic jitter so different plans pick different dishes without randomness. */
const jitter = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 100) / 100; };

function fit(plan: PlanForMenu, m: MenuMeal, slot: string): number {
  let sc = 0;
  const has = (t: string) => plan.tags.includes(t);
  if (has("swallow") && slot !== "breakfast" && SOUPY.test(m.name)) sc += 3;
  if (has("low-carb")) { if (LEAN_PROTEIN.test(m.name)) sc += 2; if (HEAVY_CARB.test(m.name) && !/cauli/i.test(m.name)) sc -= 2.5; }
  if (has("high-protein")) sc += ((m.proteinG ?? 0) - 25) / 3;
  if (has("low-gi")) { if (LOW_GI.test(m.name)) sc += 2; if (/fried rice|jollof|potato|white soup/i.test(m.name)) sc -= 1.5; }
  if (has("lunch") && (m.kcal ?? 999) <= 450) sc += 2;
  if ((plan.kcal ?? 1400) <= 1250) sc -= ((m.kcal ?? 400) - 340) / 40; // smallest portions plan prefers lighter dishes
  return sc;
}

/**
 * Builds a plan-specific week from the shared meal pool. The curated base menu stays the default for the
 * balanced plan; other plans re-pick dishes by tag (swallow, low-carb, high-protein, low-GI, lunch) and size.
 */
export function buildPlanMenu(plan: PlanForMenu, base: WeeklyMenuData): WeeklyMenuData {
  const meals = base.alternatives.filter((m) => m.slot && m.slot !== "drink");
  const drinks = base.alternatives.filter((m) => m.slot === "drink");
  const slots = plan.mealsPerDay === 1 ? ["lunch"] : plan.mealsPerDay === 2 ? ["lunch", "dinner"] : ["breakfast", "lunch", "dinner"];
  const balanced = plan.tags.includes("balanced") && (plan.kcal ?? 1400) > 1250;
  const used = new Map<string, number>();

  const days = DAYS.map((day, di) => {
    const baseDay = base.days.find((d) => d.day === day);
    const picked: (MenuMeal & { menuSlot: string })[] = [];
    for (const slot of slots) {
      const baseMeal = baseDay?.meals.find((m) => m.menuSlot === slot);
      const target = (plan.kcal ?? 1400) * (SHARE[slot] ?? 0.35);
      const best = meals.filter((m) => m.slot === slot).map((m) => ({
        m,
        score: fit(plan, m, slot) + (balanced && baseMeal?.id === m.id ? 1.6 : 0) - (used.get(m.id) ?? 0) * 1.3 - Math.abs((m.kcal ?? target) - target) / 400 + jitter(`${plan.slug}${day}${m.id}`) * 0.6,
      })).sort((a, b) => b.score - a.score)[0]?.m;
      if (best) { picked.push({ ...best, menuSlot: slot }); used.set(best.id, (used.get(best.id) ?? 0) + 1); }
    }
    if ((plan.mealsPerDay ?? 3) >= 4 && drinks.length) picked.push({ ...drinks[di % drinks.length], menuSlot: "snack" });
    return { day, total: picked.reduce((n, m) => n + (m.kcal ?? 0), 0), meals: picked };
  });
  return { ...base, days };
}
