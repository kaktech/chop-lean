import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { fail, imageUrl, ok } from "@/lib/mobile-api";

/** Public: one product with its visible reviews. `?slug=naija-lean-1400` */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const [p] = await db.select().from(s.products).where(and(eq(s.products.slug, slug), eq(s.products.isLive, true))).limit(1);
  if (!p) return fail("That item isn't available.", 404);
  const rows = await db.select().from(s.reviews).where(and(eq(s.reviews.productId, p.id), eq(s.reviews.isVisible, true))).orderBy(desc(s.reviews.verified), desc(s.reviews.createdAt)).limit(30);
  const avg = rows.length ? rows.reduce((n, r) => n + r.rating, 0) / rows.length : 0;
  return ok({
    product: {
      id: p.id, slug: p.slug, type: p.type, name: p.name, description: p.description, image: imageUrl(p.image),
      gallery: (p.gallery ?? []).map((g) => imageUrl(g)), kcal: p.kcal, proteinG: p.proteinG, carbsG: p.carbsG, fatG: p.fatG,
      priceKobo: p.priceKobo, compareAtKobo: p.compareAtKobo, badge: p.badge, tags: p.tags,
      mealsPerDay: p.mealsPerDay, daysPerWeek: p.daysPerWeek, slot: p.slot,
    },
    reviews: rows.map((r) => ({ id: r.id, rating: r.rating, body: r.body, name: r.name, verified: r.verified, createdAt: r.createdAt.toISOString(), weightChange: r.weightChange })),
    stats: { count: rows.length, avg: Math.round(avg * 10) / 10 },
  });
}
