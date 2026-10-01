import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { PageHero } from "@/components/ui/PageHero";
import { MealCard, PlanCard } from "@/components/shop/ProductCard";
import { FilterSidebar, MobileFilterButton, SortSelect } from "@/components/shop/FilterPanel";
import { TABS, applyFilters, buckets, facetCounts, groupsFor, parseFilters, tagLabel, toQuery, GOALS, MEALS_PER_DAY, SLOTS, type Filters } from "@/lib/shop-filters";
import { getReviewStatsForProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop meal plans, meals and drinks" };

const COPY = {
  plans: ["Meal Plans", "Every plan is a weekly subscription. Pick your calories, meals per day and delivery days, then swap dishes whenever you like.", "Plans"],
  meals: ["Single Meals", "One plate at a time. Cooked fresh, calorie counted, delivered chilled on Mon, Wed or Fri.", "Meals"],
  drinks: ["Snacks and Drinks", "Zero-sugar zobo, tiger nut and more, to go with your plan.", "Drinks"],
} as const;

const HERO_IMG = { plans: "ofada.jpg", meals: "efo-riro.jpg", drinks: "zobo.jpg" } as const;

type SP = Promise<Record<string, string | string[] | undefined>>;

function chipLabels(f: Filters): { label: string; href: string }[] {
  const chips: { label: string; href: string }[] = [];
  const drop = (field: keyof Filters, key: string) => toQuery(f, { [field]: (f[field] as string[]).filter((k) => k !== key), page: 1 });
  for (const k of f.kcal) chips.push({ label: `${buckets(f.tab).find((b) => b.key === k)?.label ?? k} kcal`, href: drop("kcal", k) });
  for (const k of f.goal) chips.push({ label: GOALS.find((g) => g.key === k)?.label ?? k, href: drop("goal", k) });
  for (const k of f.diet) chips.push({ label: tagLabel(k), href: drop("diet", k) });
  for (const k of f.meals) chips.push({ label: MEALS_PER_DAY.find((m) => m.key === k)?.label ?? k, href: drop("meals", k) });
  for (const k of f.slot) chips.push({ label: SLOTS.find((m) => m.key === k)?.label ?? k, href: drop("slot", k) });
  if (f.q) chips.push({ label: `“${f.q}”`, href: toQuery(f, { q: "", page: 1 }) });
  return chips;
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const f = parseFilters(await searchParams);
  const type = TABS.find((t) => t.key === f.tab)!.type;

  const [all, tabCounts] = await Promise.all([
    db.select().from(products).where(and(eq(products.type, type), eq(products.isLive, true))),
    Promise.all(TABS.map(async (t) => (await db.select({ id: products.id }).from(products).where(and(eq(products.type, t.type), eq(products.isLive, true)))).length)),
  ]);

  const { total, pages, page, items } = applyFilters(all, f);
  const { count, tags } = facetCounts(all, f);
  const groups = groupsFor(f, tags.filter((t) => t !== "weight-loss"));
  const counts: Record<string, number> = {};
  for (const g of groups) for (const o of g.options) counts[`${g.field}:${o.key}`] = count(g.field, o.key);
  const ratings = f.tab === "plans" ? await getReviewStatsForProducts(items.map((i) => i.id)) : {};
  const chips = chipLabels(f);
  const [title, blurb, watermark] = COPY[f.tab];

  return (
    <>
      <PageHero image={HERO_IMG[f.tab]} eyebrow={watermark} title={title} blurb={blurb} crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: title }]} size="sm" position="center 55%">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:gap-3 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Product type">
          {TABS.map((t, i) => (
            <Link key={t.key} href={toQuery({ tab: t.key })} role="tab" aria-selected={f.tab === t.key}
              className={`tap flex shrink-0 items-center rounded-full border px-5 text-sm font-medium no-underline md:text-[15px] ${f.tab === t.key ? "border-yellow bg-yellow font-bold text-canvas" : "border-white/40 text-fg hover:border-yellow"}`}>
              {t.label} ({tabCounts[i]})
            </Link>
          ))}
        </div>
      </PageHero>

      <div className="container-x flex gap-9 py-5 md:py-10">
        <FilterSidebar f={f} groups={groups} counts={counts} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5 md:mb-5 md:gap-3">
            <MobileFilterButton f={f} groups={groups} counts={counts} />
            <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 md:mx-0 md:order-2 md:flex-none md:justify-end md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              {chips.map((c) => (
                <Link key={c.label} href={c.href} scroll={false} aria-label={`Remove filter ${c.label}`} className="tap flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] no-underline text-fg">
                  {c.label} <span aria-hidden>×</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="my-4 flex items-center justify-between md:my-0 md:mb-5">
            <p className="text-sm text-muted" aria-live="polite">Showing {total} {f.tab === "plans" ? (total === 1 ? "plan" : "plans") : total === 1 ? "item" : "items"}</p>
            <SortSelect f={f} />
          </div>

          {items.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-input-line bg-surface px-6 py-16 text-center">
              <p className="font-serif text-2xl">Nothing matches that.</p>
              <p className="mt-2 text-muted">Try removing a filter or searching for something else.</p>
              <Link href={toQuery({ tab: f.tab })} className="cl-btn mt-5 inline-block rounded-full bg-yellow px-6 py-3 font-bold text-canvas no-underline">Clear filters</Link>
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-3 md:gap-5 ${f.tab === "plans" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              {items.map((p) => (f.tab === "plans" ? <PlanCard key={p.id} p={p} rating={ratings[p.id]} showHeart /> : <MealCard key={p.id} p={p} layout="stack" />))}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={toQuery(f, { page: n })} aria-current={n === page ? "page" : undefined} className={`flex size-11 items-center justify-center rounded-full text-[15px] font-medium no-underline ${n === page ? "bg-ink text-white" : "border border-line bg-surface text-fg"}`}>{n}</Link>
              ))}
              {page < pages && <Link href={toQuery(f, { page: page + 1 })} aria-label="Next page" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-fg no-underline">→</Link>}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}

