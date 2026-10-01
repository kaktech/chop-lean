import { describe, expect, it } from "vitest";
import { buildPlanMenu } from "./plan-menu";
import type { MenuMeal, WeeklyMenuData } from "./queries";

const m = (id: string, name: string, slot: string, kcal: number, proteinG: number): MenuMeal => ({ id, slug: id, name, kcal, proteinG, image: "a.jpg", slot, priceKobo: 1 });
const pool = [
  m("b1", "Moi moi with egg", "breakfast", 330, 22), m("b2", "Akara and pap", "breakfast", 340, 16), m("b3", "Moi moi and grilled chicken", "breakfast", 360, 32),
  m("l1", "Efo riro with oat swallow", "lunch", 410, 34), m("l2", "Cauli-blend jollof and chicken", "lunch", 450, 38), m("l3", "Plantain porridge", "lunch", 420, 20), m("l4", "Egusi with oat swallow", "lunch", 460, 30),
  m("d1", "Catfish pepper soup", "dinner", 380, 36), m("d2", "Chicken suya salad", "dinner", 360, 35), m("d3", "Okra soup with prawns", "dinner", 400, 32), m("d4", "Grilled croaker", "dinner", 380, 40),
  m("z1", "Tiger nut drink", "drink", 140, 2),
];
const base: WeeklyMenuData = { weekOf: "2026-10-05", days: [], alternatives: pool };

describe("buildPlanMenu", () => {
  it("swallow plans lean on soups at lunch and dinner", () => {
    const menu = buildPlanMenu({ slug: "swallow", kcal: 1500, mealsPerDay: 3, tags: ["swallow"] }, base);
    const soupy = menu.days.flatMap((d) => d.meals).filter((x) => x.menuSlot !== "breakfast" && /soup|swallow|efo|egusi|okra/i.test(x.name));
    expect(soupy.length).toBeGreaterThanOrEqual(8);
  });
  it("low-carb plans avoid porridge", () => {
    const menu = buildPlanMenu({ slug: "lc", kcal: 1300, mealsPerDay: 3, tags: ["low-carb"] }, base);
    expect(menu.days.flatMap((d) => d.meals).some((x) => /porridge/i.test(x.name))).toBe(false);
  });
  it("one-meal plans only serve lunch", () => {
    const menu = buildPlanMenu({ slug: "office", kcal: 450, mealsPerDay: 1, tags: ["lunch"] }, base);
    expect(menu.days.every((d) => d.meals.length === 1 && d.meals[0].menuSlot === "lunch")).toBe(true);
  });
  it("four-meal plans add a snack and prefer high protein", () => {
    const menu = buildPlanMenu({ slug: "pc", kcal: 1800, mealsPerDay: 4, tags: ["high-protein"] }, base);
    expect(menu.days.every((d) => d.meals.some((x) => x.menuSlot === "snack"))).toBe(true);
    const avgP = menu.days.flatMap((d) => d.meals).filter((x) => x.menuSlot === "dinner").reduce((n, x) => n + (x.proteinG ?? 0), 0) / 5;
    expect(avgP).toBeGreaterThanOrEqual(35);
  });
  it("different plans produce different weeks", () => {
    const a = buildPlanMenu({ slug: "a", kcal: 1500, mealsPerDay: 3, tags: ["swallow"] }, base).days.map((d) => d.meals.map((x) => x.id).join());
    const b = buildPlanMenu({ slug: "b", kcal: 1300, mealsPerDay: 3, tags: ["low-carb"] }, base).days.map((d) => d.meals.map((x) => x.id).join());
    expect(a).not.toEqual(b);
  });
});
