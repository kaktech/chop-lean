"use client";
import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { formatNaira } from "@/lib/money";
import { imgSrc } from "@/lib/img";
import { productHref } from "@/lib/product-ui";
import { useAddToCart } from "@/lib/use-add-to-cart";

export type MenuItem = { id: string; slug: string; type: "plan" | "meal" | "drink"; name: string; image: string | null; kcal: number | null; proteinG: number | null; priceKobo: number; slot: string | null };

/** Tabbed menu in the "name ........ price" style, with one-tap add to cart. */
export function MenuList({ groups, tabs }: { groups: Record<string, MenuItem[]>; tabs: { key: string; label: string }[] }) {
  const [tab, setTab] = useState(tabs[0].key);
  const addToCart = useAddToCart();
  const id = useId();
  const items = groups[tab] ?? [];
  return (
    <div>
      <div role="tablist" aria-label="Menu categories" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} role="tab" id={`${id}-${t.key}`} aria-selected={tab === t.key} aria-controls={`${id}-panel`} onClick={() => setTab(t.key)}
            className={`tap rounded-full border px-5 text-[13px] font-bold uppercase tracking-[0.12em] ${tab === t.key ? "border-yellow bg-yellow text-canvas" : "border-line text-fg hover:border-yellow"}`}>
            {t.label} <span className={tab === t.key ? "text-canvas/70" : "text-muted"}>({groups[t.key]?.length ?? 0})</span>
          </button>
        ))}
      </div>
      <ul id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}`} className="mt-6 grid gap-x-10 gap-y-1 md:grid-cols-2">
        {items.map((m) => (
          <li key={m.id} className="group flex items-center gap-4 border-b border-line py-4">
            <Link href={productHref(m.type, m.slug)} className="relative size-16 shrink-0 overflow-hidden rounded-full border border-line" tabIndex={-1} aria-hidden>
              <Image src={imgSrc(m.image)} alt="" fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <Link href={productHref(m.type, m.slug)} className="font-display text-[17px] font-bold leading-snug text-fg no-underline hover:text-yellow">{m.name}</Link>
                <span aria-hidden className="dotted-leader hidden sm:block" />
                <b className="shrink-0 font-display text-lg text-yellow">{formatNaira(m.priceKobo)}</b>
              </div>
              <div className="mt-0.5 text-[13px] text-muted">{m.kcal} kcal{m.proteinG ? ` · ${m.proteinG}g protein` : ""}</div>
            </div>
            <button type="button" aria-label={`Add ${m.name} to cart`} onClick={() => addToCart({ id: m.id, slug: m.slug, type: m.type, name: m.name, image: m.image, priceKobo: m.priceKobo })}
              className="cl-btn flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-fg hover:border-yellow hover:bg-yellow hover:text-canvas"><Plus size={18} aria-hidden /></button>
          </li>
        ))}
        {items.length === 0 && <li className="py-10 text-muted">Nothing here yet.</li>}
      </ul>
    </div>
  );
}
