import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews, getReviewStats } from "@/lib/queries";
import { MealPurchase } from "@/components/product/MealPurchase";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { JsonLd, productJsonLd } from "@/components/product/JsonLd";
import { imgSrc } from "@/lib/img";
import { isInventoryLocked } from "@/lib/admin";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p || p.type === "plan") return {};
  return { title: p.name, description: `${p.name}, ${p.kcal} kcal. Calorie-counted and cooked fresh in Lagos.`, openGraph: { images: [imgSrc(p.image)] } };
}

export default async function MealPage({ params }: P) {
  const p = await getProductBySlug((await params).slug);
  if (!p || p.type === "plan" || !p.isLive) notFound();
  const [reviews, stats] = await Promise.all([getProductReviews(p.id), getReviewStats(p.id)]);
  const soldOut = (await isInventoryLocked()) && p.weeklySlots != null && p.slotsTaken >= p.weeklySlots;
  return (
    <>
      <JsonLd data={productJsonLd(p, stats)} />
      <nav aria-label="Breadcrumb" className="container-x pt-5 text-xs text-muted md:text-[13px]">
        <Link href="/" className="text-green underline">Home</Link> / <Link href={`/shop?tab=${p.type === "drink" ? "drinks" : "meals"}`} className="text-green underline">{p.type === "drink" ? "Snacks and Drinks" : "Single Meals"}</Link> / {p.name}
      </nav>
      <MealPurchase product={{ id: p.id, slug: p.slug, type: p.type, name: p.name, image: p.image, priceKobo: p.priceKobo }} kcal={p.kcal} protein={p.proteinG} carbs={p.carbsG} fat={p.fatG} description={p.description ?? `${p.kcal} kcal, ${p.proteinG ?? 0}g protein. Cooked fresh with measured oil and weighed portions.`} soldOut={soldOut} />
      <ProductInfo />
      <ReviewsSection productId={p.id} productName={p.name} reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </>
  );
}
