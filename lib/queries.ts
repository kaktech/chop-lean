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
