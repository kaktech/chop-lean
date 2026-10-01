/**
 * Server-side pricing. The client only displays prices; every total is recomputed here
 * from product ids, options, zone and promo. All values are kobo integers.
 */

export const POD_FEE_KOBO = 50_000; // ₦500
export const SUBSCRIBE_DISCOUNT = 0.1;

export type PlanPricingInput = {
  basePriceKobo: number;
  baseKcal: number | null;
  baseMealsPerDay: number | null;
  baseDaysPerWeek: number | null;
  calorieOptions: { kcal: number; priceKobo: number }[];
};

export type LineOptions = {
  kcal?: number;
  mealsPerDay?: number;
  daysPerWeek?: number;
  subscribe?: boolean;
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Weekly unit price of a plan for the chosen options. */
export function planUnitPrice(p: PlanPricingInput, o: LineOptions = {}): number {
  let price = p.basePriceKobo;
  if (o.kcal) {
    const opt = p.calorieOptions.find((c) => c.kcal === o.kcal);
    if (opt) price = opt.priceKobo;
  }
  const meals = o.mealsPerDay ?? p.baseMealsPerDay ?? 1;
  const days = o.daysPerWeek ?? p.baseDaysPerWeek ?? 5;
  const mealFactor = p.baseMealsPerDay ? meals / p.baseMealsPerDay : 1;
  const dayFactor = p.baseDaysPerWeek ? days / p.baseDaysPerWeek : 1;
  price = roundTo(price * mealFactor * dayFactor, 10_000); // nearest ₦100
  if (o.subscribe) price = Math.round(price * (1 - SUBSCRIBE_DISCOUNT));
  return price;
}

export type PricedLine = { type: "plan" | "meal" | "drink"; unitKobo: number; qty: number };

export type PromoRule = { code: string; type: "percent" | "fixed"; value: number; appliesTo: string; isActive: boolean; expiresAt?: Date | null };

export type PromoCheck = { ok: true; promo: PromoRule } | { ok: false; reason: string };

export function validatePromo(promo: PromoRule | null | undefined, ctx: { isFirstOrder: boolean; hasPlan: boolean; now?: Date }): PromoCheck {
  if (!promo || !promo.isActive) return { ok: false, reason: "That code isn't valid." };
  if (promo.expiresAt && promo.expiresAt.getTime() < (ctx.now ?? new Date()).getTime()) return { ok: false, reason: "That code has expired." };
  if (promo.appliesTo === "first_week_plan") {
    if (!ctx.hasPlan) return { ok: false, reason: "This code applies to meal plans. Add a plan to use it." };
    if (!ctx.isFirstOrder) return { ok: false, reason: "This code is for first orders only." };
  }
  return { ok: true, promo };
}

export type Totals = {
  subtotalKobo: number;
  discountKobo: number;
  deliveryKobo: number;
  podFeeKobo: number;
  totalKobo: number;
};

export function computeTotals(args: {
  lines: PricedLine[];
  zoneFeeKobo: number;
  promo?: PromoRule | null;
  payment?: "card" | "transfer" | "pod";
}): Totals {
  const subtotalKobo = args.lines.reduce((n, l) => n + l.unitKobo * l.qty, 0);
  let discountKobo = 0;
  if (args.promo) {
    // "first_week_plan": the discount applies to one week of each plan line, not to meals or drinks.
    const base = args.promo.appliesTo === "first_week_plan"
      ? args.lines.filter((l) => l.type === "plan").reduce((n, l) => n + l.unitKobo, 0)
      : subtotalKobo;
    discountKobo = args.promo.type === "percent" ? Math.round((base * args.promo.value) / 100) : Math.min(args.promo.value, base);
  }
  const podFeeKobo = args.payment === "pod" ? POD_FEE_KOBO : 0;
  const totalKobo = Math.max(0, subtotalKobo - discountKobo) + args.zoneFeeKobo + podFeeKobo;
  return { subtotalKobo, discountKobo, deliveryKobo: args.zoneFeeKobo, podFeeKobo, totalKobo };
}

/* ---------- Calorie target (quiz) ---------- */

export const ACTIVITY_FACTORS = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 } as const;
export type Activity = keyof typeof ACTIVITY_FACTORS;
export const PLAN_KCALS = [1200, 1400, 1600, 1800] as const;

/** Mifflin-St Jeor BMR. */
export function bmr(sex: "female" | "male", weightKg: number, heightCm: number, age: number) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

export function dailyKcalTarget(a: { sex: "female" | "male"; weightKg: number; heightCm: number; age: number; activity: Activity; goal: "lose" | "keep" | "gain" }) {
  const tdee = bmr(a.sex, a.weightKg, a.heightCm, a.age) * ACTIVITY_FACTORS[a.activity];
  const adjust = a.goal === "lose" ? -500 : a.goal === "gain" ? 300 : 0;
  const target = Math.max(1200, Math.round(tdee + adjust));
  const plan = PLAN_KCALS.reduce((best, k) => (Math.abs(k - target) < Math.abs(best - target) ? k : best), PLAN_KCALS[0]);
  return { tdee: Math.round(tdee), target, plan };
}
