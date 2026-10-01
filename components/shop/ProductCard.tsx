"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import type { Product } from "@/lib/queries";
import { formatNaira } from "@/lib/money";
import { badgeStyle, planMeta, productHref } from "@/lib/product-ui";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { Reveal } from "@/components/ui/Reveal";
import { imgSrc } from "@/lib/img";

type Rating = { count: number; avg: number } | undefined;

export function PlanCard({ p, rating, showHeart = false, sizes }: { p: Product; rating?: Rating; showHeart?: boolean; sizes?: string }) {
  return (
    <Reveal className="h-full">
      <Link
        href={productHref(p.type, p.slug)}
        className="cl-lift cl-zoom relative flex h-full flex-col gap-3 rounded-[22px] border border-line bg-surface p-3.5 text-fg no-underline md:p-[18px]"
      >
        {p.badge && <span className={`absolute left-4 top-4 z-10 rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide md:left-[26px] md:top-[26px] ${badgeStyle(p.badge)}`}>{p.badge}</span>}
        {showHeart && <span className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-surface shadow-soft md:right-[26px] md:top-[26px]"><Heart size={15} aria-hidden /></span>}
        <div className="cl-zoom relative h-[170px] overflow-hidden rounded-2xl md:h-[220px]">
          <Image src={imgSrc(p.image)} alt={p.name} fill sizes={sizes ?? "(min-width:1024px) 25vw, 50vw"} className="object-cover" />
        </div>
        <span className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-tint-green px-2.5 py-1 text-xs font-bold text-leaf-soft">{p.mealsPerDay === 1 ? `≈ ${p.kcal} kcal` : `${p.kcal?.toLocaleString("en-NG")} kcal${showHeart ? "" : "/day"}`}</span>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-body">{planMeta(p.mealsPerDay, p.daysPerWeek)}</span>
        </span>
        <span className="font-display text-[19px] font-bold tracking-tight md:text-xl">{p.name}</span>
        <span className={`min-h-[42px] text-sm leading-normal text-muted ${showHeart ? "hidden md:block" : ""}`}>{p.description}</span>
        {showHeart && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <span aria-hidden className="tracking-widest text-input-line">★★★★★</span>
            {rating && rating.count > 0 ? `${rating.avg.toFixed(1)} (${rating.count})` : "(reviews)"}
          </span>
        )}
        <span className="mt-auto flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-price-red">{formatNaira(p.priceKobo)}</span>
          {p.compareAtKobo && !showHeart && <span className="text-[13px] text-muted line-through">{formatNaira(p.compareAtKobo)}</span>}
          <span className="text-[13px] text-muted">/ week</span>
          {showHeart && (
            <span aria-hidden className="ml-auto flex size-10 items-center justify-center rounded-full bg-yellow text-canvas"><Plus size={18} strokeWidth={2.5} /></span>
          )}
        </span>
        {!showHeart && <span className="cl-btn mt-1 rounded-full bg-ink py-3 text-center text-sm font-bold text-white">Choose this plan</span>}
      </Link>
    </Reveal>
  );
}

export function MealCard({ p, layout = "row" }: { p: Product; layout?: "row" | "stack" }) {
  const addToCart = useAddToCart();
  const add = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ id: p.id, slug: p.slug, type: p.type, name: p.name, image: p.image, priceKobo: p.priceKobo });
  };
  const stack = layout === "stack";
  return (
    <Reveal className="h-full">
      <Link
        href={productHref(p.type, p.slug)}
        className={`cl-lift cl-zoom relative grid h-full gap-4 rounded-[22px] border border-line bg-surface p-[18px] text-fg no-underline ${stack ? "" : "grid-cols-2 items-center"}`}
      >
        {p.badge && <span className="absolute left-[30px] top-[30px] z-10 rounded-md bg-red px-2 py-1 text-[11px] font-bold text-white">{p.badge}</span>}
        <div className={`cl-zoom relative overflow-hidden rounded-[14px] ${stack ? "h-[200px]" : "h-[150px] md:h-[180px]"}`}>
          <Image src={imgSrc(p.image)} alt={p.name} fill sizes="(min-width:1024px) 20vw, 45vw" className="object-cover" />
        </div>
        <span className="flex flex-col gap-2">
          <span className="text-base font-bold leading-snug">{p.name}</span>
          <span className="text-[13px] text-muted">{p.kcal} kcal{p.proteinG ? ` · ${p.proteinG}g protein` : ""}</span>
          <span className="font-display text-lg font-bold text-price-red">{formatNaira(p.priceKobo)}</span>
          <button type="button" onClick={add} className="cl-btn tap self-start rounded-full bg-yellow px-3.5 text-[13px] font-bold text-canvas">+ Add</button>
        </span>
      </Link>
    </Reveal>
  );
}
