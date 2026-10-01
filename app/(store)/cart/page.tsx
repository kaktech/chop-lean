import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries";
import { CartView } from "@/components/checkout/CartView";

export const metadata: Metadata = { title: "Your cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const tiger = await getProductBySlug("tiger-nut");
  return <CartView upsell={tiger && tiger.isLive ? { id: tiger.id, slug: tiger.slug, type: tiger.type, name: tiger.name, image: tiger.image, priceKobo: tiger.priceKobo, kcal: tiger.kcal } : null} />;
}
