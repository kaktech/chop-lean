import type { Product } from "@/lib/queries";

export function productJsonLd(p: Product, stats: { count: number; avg: number }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description ?? `${p.name} from Chop Lean`,
    image: `${site}/images/${p.image}`,
    brand: { "@type": "Brand", name: "Chop Lean" },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: (p.priceKobo / 100).toFixed(2),
      availability: p.weeklySlots != null && p.slotsTaken >= p.weeklySlots ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${site}/${p.type === "plan" ? "plans" : "meals"}/${p.slug}`,
    },
    // Only emit ratings when real reviews exist.
    ...(stats.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: stats.avg.toFixed(1), reviewCount: stats.count } } : {}),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
