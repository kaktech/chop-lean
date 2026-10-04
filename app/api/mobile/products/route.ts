import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { imageUrl, ok } from "@/lib/mobile-api";

/** Public: the live catalogue (plans, meals, drinks) for the app's menu. */
export async function GET() {
  const rows = await db.select().from(s.products).where(eq(s.products.isLive, true)).orderBy(asc(s.products.createdAt));
  return ok({
    products: rows.map((p) => ({
      id: p.id, slug: p.slug, type: p.type, name: p.name, description: p.description, image: imageUrl(p.image),
      kcal: p.kcal, proteinG: p.proteinG, priceKobo: p.priceKobo, compareAtKobo: p.compareAtKobo, badge: p.badge,
      mealsPerDay: p.mealsPerDay, daysPerWeek: p.daysPerWeek, slot: p.slot,
    })),
  });
}
