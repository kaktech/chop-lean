import type { Metadata } from "next";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { isInventoryLocked } from "@/lib/admin";
import { ProductsClient } from "@/components/admin/ProductsClient";

export const metadata: Metadata = { title: "Products and plans" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ tab?: string; id?: string; new?: string }> }) {
  const sp = await searchParams;
  const tab = (["plans", "meals", "drinks"] as const).find((t) => t === sp.tab) ?? "plans";
  const type = tab === "plans" ? "plan" : tab === "meals" ? "meal" : "drink";
  const [rows, countRows, locked] = await Promise.all([
    db.select().from(products).where(eq(products.type, type)).orderBy(asc(products.createdAt)),
    db.select({ type: products.type, n: sql<number>`count(*)::int` }).from(products).groupBy(products.type),
    isInventoryLocked(),
  ]);
  const counts = { plans: 0, meals: 0, drinks: 0 } as Record<string, number>;
  for (const c of countRows) counts[c.type === "plan" ? "plans" : c.type === "meal" ? "meals" : "drinks"] = c.n;
  return (
    <>
      <h1 className="mb-5 text-[34px] md:text-[40px]">Products and plans</h1>
      <ProductsClient tab={tab} counts={counts} locked={locked} selectedId={sp.id ?? null} creating={sp.new === "1"}
        products={rows.map((p) => ({ id: p.id, slug: p.slug, type: p.type, name: p.name, description: p.description, image: p.image, kcal: p.kcal, priceKobo: p.priceKobo, compareAtKobo: p.compareAtKobo, weeklySlots: p.weeklySlots, slotsTaken: p.slotsTaken, isLive: p.isLive, tags: p.tags, slot: p.slot }))} />
    </>
  );
}
