import { getRecentReviews, getReviewStatsForProducts } from "@/lib/queries";
import { db } from "@/db";
import * as s from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok } from "@/lib/mobile-api";

/** Public: what the home screen shows besides the catalogue itself (real reviews and ratings only). */
export async function GET() {
  const live = await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.isLive, true));
  const [reviews, ratings] = await Promise.all([getRecentReviews(4), getReviewStatsForProducts(live.map((p) => p.id))]);
  return ok({ reviews, ratings });
}
