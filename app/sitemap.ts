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
    ...plans.map((p) => ({ url: `${site}/plans/${p.slug}`, priority: 0.8 })),
  ];
}
