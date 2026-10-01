import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlans, getCalorieOptions, getProductBySlug, getProductReviews, getReviewStats, getWeeklyMenu } from "@/lib/queries";
import { describeDate, nextDeliveryDates, toISODate } from "@/lib/lagos-time";
import { PlanProvider } from "@/components/product/PlanContext";
import { PlanPurchase, type Shot } from "@/components/product/PlanPurchase";
import { WeeklyMenu } from "@/components/product/WeeklyMenu";
import { ComparePlans, PlanHighlights } from "@/components/product/PlanDetails";
import { buildPlanMenu } from "@/lib/plan-menu";
import { planContentFor } from "@/lib/plan-content";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { JsonLd, productJsonLd } from "@/components/product/JsonLd";
import { imgSrc } from "@/lib/img";
import { isInventoryLocked } from "@/lib/admin";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p || p.type !== "plan") return {};
  return { title: p.name, description: p.description ?? undefined, openGraph: { title: p.name, description: p.description ?? undefined, images: [imgSrc(p.image)] } };
}

export default async function PlanPage({ params }: P) {
  const p = await getProductBySlug((await params).slug);
  if (!p || p.type !== "plan" || !p.isLive) notFound();

  const [options, baseMenu, reviews, stats, allPlans] = await Promise.all([getCalorieOptions(p.id), getWeeklyMenu(), getProductReviews(p.id), getReviewStats(p.id), getPlans()]);
  const content = planContentFor(p.slug);
  const menu = baseMenu ? buildPlanMenu({ slug: p.slug, kcal: p.kcal, mealsPerDay: p.mealsPerDay, tags: p.tags }, baseMenu) : null;

  const FULL: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
  const LABEL: Record<string, string> = { breakfast: "breakfast", lunch: "lunch", dinner: "dinner", snack: "snack" };
  const seen = new Set<string>(p.image ? [p.image] : []);
  const shots: Shot[] = p.image ? [{ src: p.image, title: p.name, day: "The plan" }] : [];
  for (const d of menu?.days ?? []) for (const m of d.meals) {
    if (shots.length >= 4 || !m.image || seen.has(m.image) || m.menuSlot === "snack") continue;
    seen.add(m.image);
    shots.push({ src: m.image, title: m.name, day: `${FULL[d.day]} ${LABEL[m.menuSlot]}` });
  }

  const dates = nextDeliveryDates(new Date(), 3).map((d) => ({ iso: toISODate(d), label: describeDate(d).short }));
  const soldOut = (await isInventoryLocked()) && p.weeklySlots != null && p.slotsTaken >= p.weeklySlots;

  return (
    <>
      <JsonLd data={productJsonLd(p, stats)} />
      <nav aria-label="Breadcrumb" className="container-x pt-5 text-xs text-muted md:text-[13px]">
        <Link href="/" className="text-leaf underline">Home</Link> / <Link href="/shop?tab=plans" className="text-leaf underline">Meal Plans</Link> / {p.name}
      </nav>
      <PlanProvider>
        <PlanPurchase
          product={{ id: p.id, slug: p.slug, name: p.name, image: p.image, badge: p.badge, description: p.description, kcal: p.kcal, proteinG: p.proteinG, carbsG: p.carbsG, fatG: p.fatG, compareAtKobo: p.compareAtKobo, priceKobo: p.priceKobo, goal: p.goal, mealsPerDay: p.mealsPerDay, daysPerWeek: p.daysPerWeek }}
          pricing={{ basePriceKobo: p.priceKobo, baseKcal: p.kcal, baseMealsPerDay: p.mealsPerDay, baseDaysPerWeek: p.daysPerWeek, calorieOptions: options.map((o) => ({ kcal: o.kcal, priceKobo: o.priceKobo })) }}
          shots={shots} dates={dates} soldOut={soldOut} rating={{ count: stats.count, avg: stats.avg }} tagline={content.tagline} accent={content.accent} intro={content.intro || p.description || ""}
        />
        <PlanHighlights plan={p} content={content} />
        {menu && <WeeklyMenu menu={menu} planName={p.name} />}
      </PlanProvider>
      <ComparePlans plans={allPlans} currentSlug={p.slug} />
      <ProductInfo />
      <ReviewsSection productId={p.id} productName={p.name} reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </>
  );
}
