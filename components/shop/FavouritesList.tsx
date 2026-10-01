"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProductsByIds } from "@/app/actions/track";
import { useFavs } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { MealCard, PlanCard } from "./ProductCard";
import type { Product } from "@/lib/queries";

export function FavouritesList() {
  const hydrated = useHydrated();
  const ids = useFavs((s) => s.ids);
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!ids.length) { setItems([]); return; }
    getProductsByIds(ids).then((rows) => setItems(rows as unknown as Product[]));
  }, [hydrated, ids]);

  if (items === null) return <p className="text-muted" role="status">Loading your saved dishes…</p>;
  const shown = items.filter((p) => ids.includes(p.id));
  if (!shown.length) {
    return (
      <div className="mx-auto max-w-[560px] rounded-[28px] border-2 border-dashed border-input-line px-8 py-16 text-center">
        <p className="font-serif text-3xl">Nothing saved yet.</p>
        <p className="mt-3 text-muted">Tap the heart on any plan or dish to keep it here.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/shop?tab=plans" className="btn-primary cl-btn">Browse plans</Link><Link href="/menu" className="btn-outline cl-btn">See the menu</Link></div>
      </div>
    );
  }
  const plans = shown.filter((p) => p.type === "plan");
  const others = shown.filter((p) => p.type !== "plan");
  return (
    <div className="flex flex-col gap-12">
      {plans.length > 0 && <section><h2 className="display-xl mb-6 text-[26px] md:text-[34px]">Saved <span className="serif-accent">plans</span></h2><div className="grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4">{plans.map((p) => <PlanCard key={p.id} p={p} showHeart />)}</div></section>}
      {others.length > 0 && <section><h2 className="display-xl mb-6 text-[26px] md:text-[34px]">Saved <span className="serif-accent">dishes</span></h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{others.map((p) => <MealCard key={p.id} p={p} />)}</div></section>}
    </div>
  );
}
