import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { COLLECTIONS, getCollectionCounts } from "@/lib/collections";
import { Reveal } from "@/components/ui/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections", description: "Browse Chop Lean by breakfast, lunch, dinner, swallow and soups, high-protein, low-carb, office lunch and drinks." };

export default async function CollectionsPage() {
  const counts = await getCollectionCounts();
  return (
    <>
      <PageHero image="egusi.jpg" eyebrow="Collections" title="Eat by" accent="mood" blurb="Eight ways into the menu. Each collection groups plans and plates by how you want to eat." crumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
      <section className="container-x grid gap-5 py-12 md:grid-cols-2 md:py-20 xl:grid-cols-4">
        {COLLECTIONS.map((c) => (
          <Reveal key={c.slug}>
            <Link href={`/collections/${c.slug}`} className="cl-zoom group relative block h-[360px] overflow-hidden rounded-[26px] border border-line no-underline">
              <Image src={`/images/${c.image}`} alt="" fill sizes="(min-width:1280px) 25vw, (min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="eyebrow !text-[11px]">{counts[c.slug] ?? 0} items</div>
                <div className="mt-2 font-display text-2xl font-bold text-fg">{c.title} <span className="serif-accent">{c.accent}</span></div>
                <p className="mt-1 line-clamp-2 text-sm text-body">{c.blurb}</p>
                <span className="mt-3 inline-flex size-9 items-center justify-center rounded-full bg-yellow text-canvas transition-transform group-hover:translate-x-1"><ArrowRight size={16} aria-hidden /></span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
