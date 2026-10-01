import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { PlanCard, MealCard } from "@/components/shop/ProductCard";
import { COLLECTIONS, getCollectionCounts, getCollectionDef, getCollectionItems } from "@/lib/collections";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = getCollectionDef((await params).slug);
  return c ? { title: `${c.title} ${c.accent}`, description: c.blurb } : {};
}

export default async function CollectionPage({ params }: P) {
  const def = getCollectionDef((await params).slug);
  if (!def) notFound();
  const [items, counts] = await Promise.all([getCollectionItems(def), getCollectionCounts()]);
  const total = items.plans.length + items.meals.length + items.drinks.length;
  const block = "mb-8 flex items-end justify-between gap-4";

  return (
    <>
      <PageHero image={def.image} eyebrow={def.eyebrow} title={def.title} accent={def.accent} blurb={def.blurb} crumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: def.title }]}>
        <div className="flex flex-wrap items-center gap-3 text-sm text-body"><span className="glass rounded-full px-4 py-2">{total} item{total === 1 ? "" : "s"}</span><span className="text-muted">{def.rule}</span></div>
      </PageHero>

      <div className="container-x py-12 md:py-20">
        {items.plans.length > 0 && (
          <section aria-labelledby="c-plans" className="mb-16">
            <div className={block}><h2 id="c-plans" className="display-xl text-[26px] md:text-[38px]">Weekly <span className="serif-accent">plans</span></h2><Link href="/shop?tab=plans" className="text-sm font-bold text-yellow underline">All plans</Link></div>
            <div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">{items.plans.map((p) => <PlanCard key={p.id} p={p} showHeart />)}</div>
          </section>
        )}
        {items.meals.length > 0 && (
          <section aria-labelledby="c-meals" className="mb-16">
            <div className={block}><h2 id="c-meals" className="display-xl text-[26px] md:text-[38px]">Single <span className="serif-accent">plates</span></h2><Link href="/menu" className="text-sm font-bold text-yellow underline">Full menu</Link></div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">{items.meals.map((p) => <MealCard key={p.id} p={p} />)}</div>
          </section>
        )}
        {items.drinks.length > 0 && (
          <section aria-labelledby="c-drinks" className="mb-16">
            <div className={block}><h2 id="c-drinks" className="display-xl text-[26px] md:text-[38px]">Drinks and <span className="serif-accent">snacks</span></h2></div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">{items.drinks.map((p) => <MealCard key={p.id} p={p} />)}</div>
          </section>
        )}
        {total === 0 && <div className="rounded-[26px] border border-dashed border-input-line px-6 py-20 text-center"><p className="font-serif text-3xl">Nothing here yet.</p><p className="mt-2 text-muted">New dishes land every Sunday.</p><Link href="/menu" className="btn-primary cl-btn mt-6">See the full menu</Link></div>}

        <nav aria-label="Other collections" className="border-t border-line pt-10">
          <div className="label-sm mb-4 text-[11px] text-yellow">More collections</div>
          <ul className="flex flex-wrap gap-3">
            {COLLECTIONS.filter((c) => c.slug !== def.slug).map((c) => <li key={c.slug}><Link href={`/collections/${c.slug}`} className="tap flex items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-fg no-underline hover:border-yellow hover:text-yellow">{c.title} {c.accent}<span className="text-muted">({counts[c.slug] ?? 0})</span></Link></li>)}
          </ul>
        </nav>
      </div>
    </>
  );
}
