import type { MetadataRoute } from "next";
import { getPlans } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const plans = await getPlans();
  return [
    { url: site, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/quiz`, priority: 0.7 },
    ...["menu", "collections", "about", "dietitian", "delivery", "faq", "contact", "gift-cards", "results", "terms", "privacy"].map((p) => ({ url: `${site}/${p}`, priority: 0.6 })),
    ...["breakfast", "lunch", "dinner", "swallow-and-soups", "high-protein", "low-carb", "office-lunch", "drinks"].map((c) => ({ url: `${site}/collections/${c}`, priority: 0.6 })),
    ...plans.map((p) => ({ url: `${site}/plans/${p.slug}`, priority: 0.8 })),
  ];
}
