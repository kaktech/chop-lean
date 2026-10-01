import { describe, expect, it } from "vitest";
import { computeTotals, dailyKcalTarget, planUnitPrice, validatePromo, bmr, type PromoRule } from "./pricing";

const naija = {
  basePriceKobo: 5_250_000, baseKcal: 1400, baseMealsPerDay: 3, baseDaysPerWeek: 5,
  calorieOptions: [
    { kcal: 1200, priceKobo: 4_900_000 }, { kcal: 1400, priceKobo: 5_250_000 },
    { kcal: 1600, priceKobo: 5_600_000 }, { kcal: 1800, priceKobo: 6_000_000 },
  ],
};
const promo: PromoRule = { code: "CHOPLEAN20", type: "percent", value: 20, appliesTo: "first_week_plan", isActive: true };

describe("planUnitPrice", () => {
  it("uses the calorie option price", () => {
    expect(planUnitPrice(naija, { kcal: 1600 })).toBe(5_600_000);
    expect(planUnitPrice(naija, {})).toBe(5_250_000);
  });
  it("scales for fewer meals and days, rounded to ₦100", () => {
    expect(planUnitPrice(naija, { mealsPerDay: 2 })).toBe(3_500_000);
    expect(planUnitPrice(naija, { daysPerWeek: 3 })).toBe(3_150_000);
  });
  it("applies the 10% subscribe discount", () => {
    expect(planUnitPrice(naija, { subscribe: true })).toBe(4_725_000);
  });
  it("ignores an unknown calorie option", () => {
    expect(planUnitPrice(naija, { kcal: 2500 })).toBe(5_250_000);
  });
});

describe("computeTotals", () => {
  it("matches the checkout design: plan + zobo, CHOPLEAN20, Lagos Island", () => {
    const t = computeTotals({
      lines: [{ type: "plan", unitKobo: 5_250_000, qty: 1 }, { type: "drink", unitKobo: 720_000, qty: 1 }],
      zoneFeeKobo: 350_000, promo, payment: "card",
    });
    expect(t).toEqual({ subtotalKobo: 5_970_000, discountKobo: 1_050_000, deliveryKobo: 350_000, podFeeKobo: 0, totalKobo: 5_270_000 });
  });
  it("discounts only the first week of a multi-week plan", () => {
    const t = computeTotals({ lines: [{ type: "plan", unitKobo: 5_250_000, qty: 4 }], zoneFeeKobo: 0, promo });
    expect(t.discountKobo).toBe(1_050_000);
  });
  it("adds the pay-on-delivery fee", () => {
    const t = computeTotals({ lines: [{ type: "meal", unitKobo: 500_000, qty: 2 }], zoneFeeKobo: 250_000, payment: "pod" });
    expect(t.podFeeKobo).toBe(50_000);
    expect(t.totalKobo).toBe(1_300_000);
  });
  it("never goes below the delivery fee", () => {
    const t = computeTotals({ lines: [{ type: "plan", unitKobo: 100, qty: 1 }], zoneFeeKobo: 0, promo: { ...promo, type: "fixed", value: 999_999 } });
    expect(t.totalKobo).toBe(0);
  });
});

describe("validatePromo", () => {
  it("accepts a first plan order", () => {
    expect(validatePromo(promo, { isFirstOrder: true, hasPlan: true }).ok).toBe(true);
  });
  it("rejects without a plan, on repeat orders, unknown or expired codes", () => {
    expect(validatePromo(promo, { isFirstOrder: true, hasPlan: false }).ok).toBe(false);
    expect(validatePromo(promo, { isFirstOrder: false, hasPlan: true }).ok).toBe(false);
    expect(validatePromo(null, { isFirstOrder: true, hasPlan: true }).ok).toBe(false);
    expect(validatePromo({ ...promo, expiresAt: new Date(0) }, { isFirstOrder: true, hasPlan: true }).ok).toBe(false);
  });
});

describe("dailyKcalTarget (Mifflin-St Jeor)", () => {
  it("computes BMR", () => {
    expect(Math.round(bmr("female", 80, 165, 30))).toBe(1_520);
  });
  it("applies a 500 kcal deficit and rounds to the nearest plan", () => {
    const r = dailyKcalTarget({ sex: "female", weightKg: 80, heightCm: 165, age: 30, activity: "light", goal: "lose" });
    expect(r.tdee).toBe(2_090);
    expect(r.target).toBe(1_590);
    expect(r.plan).toBe(1_600);
  });
  it("clamps to 1,200 kcal", () => {
    const r = dailyKcalTarget({ sex: "female", weightKg: 50, heightCm: 150, age: 60, activity: "sedentary", goal: "lose" });
    expect(r.target).toBe(1_200);
    expect(r.plan).toBe(1_200);
  });
});
