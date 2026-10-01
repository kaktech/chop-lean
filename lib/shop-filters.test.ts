import { describe, expect, it } from "vitest";
import { applyFilters, parseFilters, toQuery } from "./shop-filters";
import type { Product } from "./queries";

const mk = (o: Partial<Product>): Product => ({
  id: o.slug ?? "x", slug: "x", type: "plan", name: "Plan", description: "", image: "a.jpg", gallery: [], kcal: 1400,
  proteinG: 1, carbsG: 1, fatG: 1, priceKobo: 100, compareAtKobo: null, badge: null, goal: "lose", slot: null, tags: [],
  categoryId: null, mealsPerDay: 3, daysPerWeek: 5, weeklySlots: null, slotsTaken: 0, isLive: true, createdAt: new Date(0), ...o,
});

describe("shop filters", () => {
  const all = [
    mk({ slug: "a", name: "Naija Lean 1400", kcal: 1400, priceKobo: 300, tags: ["balanced"] }),
    mk({ slug: "b", name: "Low-Carb Owambe", kcal: 1300, priceKobo: 100, tags: ["low-carb"], goal: "lose" }),
    mk({ slug: "c", name: "Office Lunch", kcal: 450, mealsPerDay: 1, priceKobo: 200, goal: "keep" }),
  ];
  it("filters by kcal bucket and sorts", () => {
    const f = parseFilters({ kcal: "1200-1300,1400-1500", sort: "price-asc" });
    expect(applyFilters(all, f).items.map((p) => p.slug)).toEqual(["b", "a"]);
  });
  it("searches by name and kcal number", () => {
    expect(applyFilters(all, parseFilters({ q: "owambe" })).items.map((p) => p.slug)).toEqual(["b"]);
    expect(applyFilters(all, parseFilters({ q: "1400 kcal plan" })).items.map((p) => p.slug)).toEqual(["a"]);
  });
  it("filters by goal, tag and meals per day", () => {
    expect(applyFilters(all, parseFilters({ goal: "keep" })).total).toBe(1);
    expect(applyFilters(all, parseFilters({ diet: "low-carb" })).total).toBe(1);
    expect(applyFilters(all, parseFilters({ meals: "1" })).items[0].slug).toBe("c");
  });
  it("round-trips to a clean query string", () => {
    expect(toQuery(parseFilters({ tab: "meals", kcal: "0-350", page: "2" }))).toBe("/shop?tab=meals&kcal=0-350&page=2");
    expect(toQuery(parseFilters({}))).toBe("/shop");
  });
});
