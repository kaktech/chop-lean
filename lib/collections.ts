import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import type { Product } from "@/lib/queries";

export type CollectionDef = {
  slug: string;
  title: string;
  accent: string;
  eyebrow: string;
  blurb: string;
  image: string;
  position?: string;
  /** How a dish qualifies, shown on the page so the grouping is transparent. */
  rule: string;
  plans?: (p: Product) => boolean;
  meals?: (p: Product) => boolean;
  drinks?: boolean;
};

const SOUPY = /soup|swallow|efo|egusi|okra|ofe/i;

export const COLLECTIONS: CollectionDef[] = [
  { slug: "breakfast", title: "Breakfast", accent: "that fuels", eyebrow: "Morning plates", blurb: "Moi moi, akara, plantain and egg sauce, made with measured oil so the morning stays light.", image: "moi-moi.jpg", rule: "Meals served as breakfast", meals: (p) => p.slot === "breakfast" },
  { slug: "lunch", title: "Lunch", accent: "worth waiting for", eyebrow: "Midday mains", blurb: "Efo riro, ofada, jollof and egusi: the lunches you grew up on, weighed and counted.", image: "jollof.jpg", rule: "Meals served as lunch", meals: (p) => p.slot === "lunch" },
  { slug: "dinner", title: "Dinner", accent: "without the guilt", eyebrow: "Evening plates", blurb: "Pepper soup, grilled fish and okra: lighter evenings with all the pepper left in.", image: "pepper-soup.jpg", rule: "Meals served as dinner", meals: (p) => p.slot === "dinner" },
  { slug: "swallow-and-soups", title: "Swallow", accent: "and soups", eyebrow: "Soul food", blurb: "Efo riro, egusi, okra and white soup with weighed oat and wheat swallows in 150g balls.", image: "egusi.jpg", rule: "Soups and swallow dishes, plus plans built around them", plans: (p) => p.tags.includes("swallow"), meals: (p) => SOUPY.test(p.name) },
  { slug: "high-protein", title: "High-protein", accent: "for gym days", eyebrow: "Build and recover", blurb: "Grilled fish, chicken and eggs. Every dish here carries 30g of protein or more.", image: "grilled-fish.jpg", rule: "Dishes with 30g+ protein, plus high-protein plans", plans: (p) => p.tags.includes("high-protein"), meals: (p) => (p.proteinG ?? 0) >= 30 },
  { slug: "low-carb", title: "Low-carb", accent: "Owambe", eyebrow: "Party flavour", blurb: "Cauliflower rice, extra protein and all the party flavour, without the heavy carbs.", image: "chicken-salad.jpg", rule: "Plans tagged low-carb", plans: (p) => p.tags.includes("low-carb") },
  { slug: "office-lunch", title: "Office lunch", accent: "lean", eyebrow: "Desk-friendly", blurb: "A labelled lunch box delivered for the working week, around 450 kcal each.", image: "meal-box.jpg", rule: "Lunch plans, plus lunches of 450 kcal or less", plans: (p) => p.tags.includes("lunch"), meals: (p) => p.slot === "lunch" && (p.kcal ?? 999) <= 450 },
  { slug: "drinks", title: "Snacks", accent: "and drinks", eyebrow: "Between meals", blurb: "Zero-sugar zobo and unsweetened tiger nut drink, for the 4pm hunger.", image: "zobo.jpg", rule: "Drinks and snacks", drinks: true },
];

export const getCollectionDef = (slug: string) => COLLECTIONS.find((c) => c.slug === slug) ?? null;

export async function getCollectionItems(def: CollectionDef) {
  const rows = await db.select().from(products).where(eq(products.isLive, true)).orderBy(asc(products.createdAt));
  return {
    plans: def.plans ? rows.filter((p) => p.type === "plan" && def.plans!(p)) : [],
    meals: def.meals ? rows.filter((p) => p.type === "meal" && def.meals!(p)) : [],
    drinks: def.drinks ? rows.filter((p) => p.type === "drink") : [],
  };
}

export async function getCollectionCounts() {
  const rows = await db.select().from(products).where(and(eq(products.isLive, true)));
  return Object.fromEntries(
    COLLECTIONS.map((c) => [
      c.slug,
      rows.filter((p) => (p.type === "plan" && c.plans?.(p)) || (p.type === "meal" && c.meals?.(p)) || (p.type === "drink" && c.drinks)).length,
    ]),
  ) as Record<string, number>;
}
