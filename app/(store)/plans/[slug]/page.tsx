import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCalorieOptions, getProductBySlug, getProductReviews, getReviewStats, getWeeklyMenu } from "@/lib/queries";
import { describeDate, nextDeliveryDates, toISODate } from "@/lib/lagos-time";
import { PlanProvider } from "@/components/product/PlanContext";
import { PlanPurchase, type Shot } from "@/components/product/PlanPurchase";
import { WeeklyMenu } from "@/components/product/WeeklyMenu";
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

  const [options, menu, reviews, stats] = await Promise.all([getCalorieOptions(p.id), getWeeklyMenu(), getProductReviews(p.id), getReviewStats(p.id)]);

  const lunches = menu?.days.map((d) => ({ d: d.day, m: d.meals.find((m) => m.menuSlot === "lunch") })).filter((x) => x.m) ?? [];
  const dinner = menu?.days[0]?.meals.find((m) => m.menuSlot === "dinner");
  const FULL: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
  const shots: Shot[] = [
    ...lunches.slice(0, 3).map((x) => ({ src: x.m!.image!, title: x.m!.name, day: `${FULL[x.d]} lunch` })),
    ...(dinner ? [{ src: dinner.image!, title: dinner.name, day: "Monday dinner" }] : []),
  ];
  if (!shots.length && p.image) shots.push({ src: p.image, title: p.name, day: "Sample plate" });

  const dates = nextDeliveryDates(new Date(), 3).map((d) => ({ iso: toISODate(d), label: describeDate(d).short }));
  const soldOut = (await isInventoryLocked()) && p.weeklySlots != null && p.slotsTaken >= p.weeklySlots;

  return (
    <>
      <JsonLd data={productJsonLd(p, stats)} />
      <nav aria-label="Breadcrumb" className="container-x pt-5 text-xs text-muted md:text-[13px]">
        <Link href="/" className="text-green underline">Home</Link> / <Link href="/shop?tab=plans" className="text-green underline">Meal Plans</Link> / {p.name}
      </nav>
      <PlanProvider>
        <PlanPurchase
          product={{ id: p.id, slug: p.slug, name: p.name, image: p.image, badge: p.badge, description: p.description, kcal: p.kcal, proteinG: p.proteinG, carbsG: p.carbsG, fatG: p.fatG, compareAtKobo: p.compareAtKobo, priceKobo: p.priceKobo, goal: p.goal, mealsPerDay: p.mealsPerDay, daysPerWeek: p.daysPerWeek }}
          pricing={{ basePriceKobo: p.priceKobo, baseKcal: p.kcal, baseMealsPerDay: p.mealsPerDay, baseDaysPerWeek: p.daysPerWeek, calorieOptions: options.map((o) => ({ kcal: o.kcal, priceKobo: o.priceKobo })) }}
          shots={shots} dates={dates} soldOut={soldOut} rating={{ count: stats.count, avg: stats.avg }}
        />
        {menu && <WeeklyMenu menu={menu} />}
      </PlanProvider>
      <ProductInfo />
      <ReviewsSection productId={p.id} productName={p.name} reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </>
  );
}
