"use client";
import Image from "next/image";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatNaira } from "@/lib/money";
import { useAddToCart, type AddableProduct } from "@/lib/use-add-to-cart";
import { imgSrc } from "@/lib/img";

export function MealPurchase({ product, kcal, protein, carbs, fat, description, soldOut }: { product: AddableProduct; kcal: number | null; protein: number | null; carbs: number | null; fat: number | null; description: string | null; soldOut: boolean }) {
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);
  const tiles: [string, string][] = [[`${kcal ?? "–"}`, "kcal"], [protein != null ? `${protein}g` : "–", "protein"], ...(carbs != null ? [[`${carbs}g`, "carbs"] as [string, string]] : []), ...(fat != null ? [[`${fat}g`, "fat"] as [string, string]] : [])];
  return (
    <section className="container-x grid gap-8 pb-28 pt-5 md:grid-cols-2 md:gap-12 md:pb-20 md:pt-8">
      <div className="relative aspect-square overflow-hidden rounded-[28px] border border-line bg-surface">
        <Image src={imgSrc(product.image)} alt={product.name} fill priority sizes="(min-width:768px) 45vw, 100vw" className="object-cover" />
      </div>
      <div>
        <div className="label-sm text-red">{product.type === "drink" ? "Snack or drink" : "Single meal"}</div>
        <h1 className="mt-2 text-[34px] leading-none tracking-[-0.03em] md:text-[52px]">{product.name}</h1>
        <div className="mt-4 font-display text-[28px] font-bold text-price-red md:text-4xl">{formatNaira(product.priceKobo * qty)}</div>
        {description && <p className="mt-4 max-w-[520px] text-body">{description}</p>}
        <dl className="mt-5 grid grid-cols-4 gap-2.5">
          {tiles.map(([v, l]) => <div key={l} className="rounded-2xl border border-line bg-surface px-3 py-3 text-center"><dt className="sr-only">{l}</dt><dd className="font-display text-lg font-bold">{v}<span className="block text-[11px] font-normal text-muted">{l}</span></dd></div>)}
        </dl>
        <p className="mt-5 text-sm text-muted">Delivered chilled on Mon, Wed or Fri. Order by 6pm the day before.</p>
        {soldOut && <p role="status" className="mt-4 rounded-2xl bg-tint-amber px-4 py-3 text-sm font-medium">Sold out for now.</p>}
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
          <div className="flex items-center rounded-full border border-input-line bg-surface">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="tap flex items-center justify-center"><Minus size={16} aria-hidden /></button>
            <span className="min-w-10 text-center text-sm font-bold" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(20, q + 1))} className="tap flex items-center justify-center"><Plus size={16} aria-hidden /></button>
          </div>
          <button type="button" disabled={soldOut} onClick={() => addToCart(product, { qty, openDrawer: true })} className="cl-btn min-h-12 flex-1 rounded-full bg-green px-4 font-bold text-white disabled:opacity-50">Add to Cart · {formatNaira(product.priceKobo * qty)}</button>
        </div>
      </div>
    </section>
  );
}
