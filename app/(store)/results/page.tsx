import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { PageHero } from "@/components/ui/PageHero";
import { productHref } from "@/lib/product-ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Results and reviews", description: "Real reviews from verified Chop Lean orders, including weigh-in progress." };

export default async function ResultsPage() {
  const rows = await db
    .select({ id: reviews.id, rating: reviews.rating, body: reviews.body, name: reviews.name, verified: reviews.verified, weightChange: reviews.weightChange, createdAt: reviews.createdAt, pName: products.name, pSlug: products.slug, pType: products.type })
    .from(reviews).innerJoin(products, eq(products.id, reviews.productId)).where(eq(reviews.isVisible, true)).orderBy(desc(reviews.createdAt)).limit(60);
  const avg = rows.length ? rows.reduce((n, r) => n + r.rating, 0) / rows.length : null;

  return (
    <>
      <PageHero image="woman-cafe.jpg" eyebrow="Results" title="Real people." accent="Real plates." blurb="Reviews come from customers only. A “Verified order” badge means the order number and email matched an order." crumbs={[{ label: "Home", href: "/" }, { label: "Results" }]} size="sm" position="center 35%">
        {avg && <div className="glass inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm"><span className="text-yellow">★ {avg.toFixed(1)}</span><span className="text-body">from {rows.length} review{rows.length === 1 ? "" : "s"}</span></div>}
      </PageHero>
      <div className="container-x py-14 md:py-20">
        {rows.length === 0 ? (
          <div className="mx-auto max-w-[620px] rounded-[28px] border-2 border-dashed border-input-line px-8 py-16 text-center">
            <p className="font-serif text-4xl">No reviews yet.</p>
            <p className="mt-3 text-muted">We only show real reviews, never made-up ones. Once customers finish a week on a plan and share how it went, you&apos;ll see their results here.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/shop?tab=plans" className="btn-primary cl-btn">Browse plans</Link><Link href="/quiz" className="btn-outline cl-btn">Take the quiz</Link></div>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-4 rounded-[24px] border border-line bg-surface p-7">
                <div className="flex items-center justify-between gap-3"><span className="tracking-[2px] text-yellow" role="img" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-input-line">{"★".repeat(5 - r.rating)}</span></span>{r.verified && <span className="rounded-full bg-tint-green px-2.5 py-1 text-[11px] font-bold text-leaf-soft">Verified order</span>}</div>
                <p className="font-serif text-xl leading-snug">“{r.body}”</p>
                {r.weightChange && <p className="text-sm text-leaf">{r.weightChange}</p>}
                <div className="mt-auto text-sm"><b>{r.name}</b><div className="text-muted"><Link href={productHref(r.pType, r.pSlug)} className="text-muted underline">{r.pName}</Link> · {r.createdAt.toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</div></div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-10 text-center text-sm text-muted">Finished a week? Open your plan page and tap <b className="text-fg">Add a review</b> to share your results.</p>
      </div>
    </>
  );
}
