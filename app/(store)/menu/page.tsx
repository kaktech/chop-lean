import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PageHero } from "@/components/ui/PageHero";
import { MenuList, type MenuItem } from "@/components/home/MenuList";
import { COLLECTIONS, getCollectionCounts } from "@/lib/collections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Full menu", description: "Every Chop Lean dish with calories, protein and price: breakfast, lunch, dinner, snacks and drinks." };

export default async function MenuPage() {
  const [rows, counts] = await Promise.all([db.select().from(products).where(eq(products.isLive, true)).orderBy(asc(products.createdAt)), getCollectionCounts()]);
  const item = (p: (typeof rows)[number]): MenuItem => ({ id: p.id, slug: p.slug, type: p.type, name: p.name, image: p.image, kcal: p.kcal, proteinG: p.proteinG, priceKobo: p.priceKobo, slot: p.slot });
  const groups = {
    all: rows.filter((p) => p.type !== "plan").map(item),
    breakfast: rows.filter((p) => p.type === "meal" && p.slot === "breakfast").map(item),
    lunch: rows.filter((p) => p.type === "meal" && p.slot === "lunch").map(item),
    dinner: rows.filter((p) => p.type === "meal" && p.slot === "dinner").map(item),
    drinks: rows.filter((p) => p.type === "drink").map(item),
  };
  return (
    <>
      <PageHero image="jollof.jpg" eyebrow="Menu of Chop Lean" title="The full" accent="menu" blurb="Every dish is cooked fresh in Lagos with weighed portions and counted calories. Add single plates to your cart, or choose a weekly plan." crumbs={[{ label: "Home", href: "/" }, { label: "Menu" }]} position="center 60%" />
      <section className="container-x py-12 md:py-20">
        <MenuList groups={groups} tabs={[{ key: "all", label: "All dishes" }, { key: "breakfast", label: "Breakfast" }, { key: "lunch", label: "Lunch" }, { key: "dinner", label: "Dinner" }, { key: "drinks", label: "Snacks and drinks" }]} />
      </section>
      <section className="border-y border-line bg-surface">
        <div className="container-x grid gap-8 py-14 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="eyebrow">Prefer us to choose?</div>
            <h2 className="display-xl mt-3 text-[30px] md:text-[44px]">Let a plan <span className="serif-accent">do the planning</span></h2>
            <p className="mt-3 max-w-[560px] text-muted">A weekly plan gives you three meals a day, delivered Mon, Wed and Fri, with a menu you can swap until Thursday 6pm.</p>
          </div>
          <div className="flex flex-wrap gap-3"><Link href="/shop?tab=plans" className="btn-primary cl-btn">Browse plans</Link><Link href="/quiz" className="btn-outline cl-btn">Take the quiz</Link></div>
        </div>
      </section>
      <section className="container-x py-14 md:py-20">
        <h2 className="display-xl text-[28px] md:text-[40px]">Browse by <span className="serif-accent">collection</span></h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}><Link href={`/collections/${c.slug}`} className="tap flex items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-fg no-underline hover:border-yellow hover:text-yellow">{c.title} {c.accent}<span className="text-muted">({counts[c.slug] ?? 0})</span></Link></li>
          ))}
        </ul>
      </section>
    </>
  );
}
