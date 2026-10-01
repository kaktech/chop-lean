import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";

export type Product = typeof s.products.$inferSelect;

export async function getPlans(limit?: number) {
  const q = db.select().from(s.products).where(and(eq(s.products.type, "plan"), eq(s.products.isLive, true))).orderBy(asc(s.products.createdAt));
  return limit ? q.limit(limit) : q;
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (!slugs.length) return [];
  const rows = await db.select().from(s.products).where(and(inArray(s.products.slug, slugs), eq(s.products.isLive, true)));
  return slugs.map((slug) => rows.find((r) => r.slug === slug)).filter((r): r is Product => !!r);
}

export async function getCategories() {
  return db.select().from(s.categories).orderBy(asc(s.categories.sort));
}

export async function getProductBySlug(slug: string) {
  const [p] = await db.select().from(s.products).where(eq(s.products.slug, slug)).limit(1);
  return p ?? null;
}

export async function getCalorieOptions(productId: string) {
  return db.select().from(s.planCalorieOptions).where(eq(s.planCalorieOptions.productId, productId)).orderBy(asc(s.planCalorieOptions.kcal));
}

export async function getRecentReviews(limit = 2) {
  return db
    .select({ id: s.reviews.id, rating: s.reviews.rating, body: s.reviews.body, name: s.reviews.name, verified: s.reviews.verified, product: s.products.name })
    .from(s.reviews)
    .innerJoin(s.products, eq(s.products.id, s.reviews.productId))
    .where(and(eq(s.reviews.isVisible, true), eq(s.reviews.verified, true)))
    .orderBy(desc(s.reviews.createdAt))
    .limit(limit);
}

export async function getReviewStats(productId: string) {
  const [r] = await db
    .select({ count: sql<number>`count(*)::int`, avg: sql<number>`coalesce(avg(${s.reviews.rating}), 0)::float` })
    .from(s.reviews)
    .where(and(eq(s.reviews.productId, productId), eq(s.reviews.isVisible, true)));
  return r;
}

export async function getReviewStatsForProducts(ids: string[]) {
  if (!ids.length) return {} as Record<string, { count: number; avg: number }>;
  const rows = await db
    .select({ id: s.reviews.productId, count: sql<number>`count(*)::int`, avg: sql<number>`avg(${s.reviews.rating})::float` })
    .from(s.reviews)
    .where(and(inArray(s.reviews.productId, ids), eq(s.reviews.isVisible, true)))
    .groupBy(s.reviews.productId);
  return Object.fromEntries(rows.map((r) => [r.id, { count: r.count, avg: r.avg }]));
}

export type MenuMeal = { id: string; slug: string; name: string; kcal: number | null; image: string | null; slot: string | null; priceKobo: number };
export type WeeklyMenuData = {
  weekOf: string;
  days: { day: string; total: number; meals: (MenuMeal & { menuSlot: string })[] }[];
  alternatives: MenuMeal[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** The current or next weekly menu (latest week that has not ended), with swap alternatives. */
export async function getWeeklyMenu(): Promise<WeeklyMenuData | null> {
  const today = new Date().toISOString().slice(0, 10);
  const menus = await db.select().from(s.weeklyMenus).orderBy(desc(s.weeklyMenus.weekOf));
  const menu = [...menus].reverse().find((m) => m.weekOf >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)) ?? menus[0] ?? (void today, undefined);
  if (!menu) return null;
  const rows = await db
    .select({ day: s.weeklyMenuItems.day, menuSlot: s.weeklyMenuItems.slot, m: s.products })
    .from(s.weeklyMenuItems)
    .innerJoin(s.products, eq(s.products.id, s.weeklyMenuItems.mealId))
    .where(eq(s.weeklyMenuItems.menuId, menu.id));
  const order = ["breakfast", "lunch", "dinner"];
  const pick = (m: Product): MenuMeal => ({ id: m.id, slug: m.slug, name: m.name, kcal: m.kcal, image: m.image, slot: m.slot, priceKobo: m.priceKobo });
  const days = DAYS.map((day) => {
    const meals = rows
      .filter((r) => r.day === day)
      .sort((a, b) => order.indexOf(a.menuSlot) - order.indexOf(b.menuSlot))
      .map((r) => ({ ...pick(r.m), menuSlot: r.menuSlot }));
    return { day, total: meals.reduce((n, m) => n + (m.kcal ?? 0), 0), meals };
  });
  const alts = await db.select().from(s.products).where(and(eq(s.products.type, "meal"), eq(s.products.isLive, true)));
  return { weekOf: menu.weekOf, days, alternatives: alts.map(pick) };
}

export async function getProductReviews(productId: string) {
  return db
    .select({
      id: s.reviews.id, rating: s.reviews.rating, body: s.reviews.body, name: s.reviews.name, verified: s.reviews.verified,
      fullness: s.reviews.fullness, pepper: s.reviews.pepper, weightChange: s.reviews.weightChange, createdAt: s.reviews.createdAt,
    })
    .from(s.reviews)
    .where(and(eq(s.reviews.productId, productId), eq(s.reviews.isVisible, true)))
    .orderBy(desc(s.reviews.createdAt))
    .limit(100);
}
