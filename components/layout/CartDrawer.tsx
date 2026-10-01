"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, X } from "lucide-react";
import { cartSubtotal, useCart, useUI } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatNaira } from "@/lib/money";
import { imgSrc } from "@/lib/img";

export function describeOptions(o: { kcal?: number; mealsPerDay?: number; daysPerWeek?: number }, type: string) {
  if (type !== "plan") return "";
  return [o.kcal && `${o.kcal.toLocaleString("en-NG")} kcal`, o.mealsPerDay && `${o.mealsPerDay} meals`, o.daysPerWeek && `${o.daysPerWeek} days`]
    .filter(Boolean)
    .join(" · ");
}

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const setOpen = useUI((s) => s.setCartOpen);
  const hydrated = useHydrated();
  const { lines, setQty, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  const close = () => setOpen(false);
  const items = hydrated ? lines : [];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your cart">
      <button type="button" aria-label="Close cart" onClick={close} className="cl-fade absolute inset-0 bg-black/60" />
      <aside className="cl-sheet md:cl-drawer absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-canvas shadow-chip md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-[28px]">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-2xl">Your cart</h2>
          <button type="button" onClick={close} aria-label="Close cart" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface">
            <X size={20} aria-hidden />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <p className="font-serif text-2xl">Your cart is empty.</p>
            <p className="text-muted">Pick a plan and we&apos;ll do the cooking.</p>
            <Link href="/shop" onClick={close} className="cl-btn rounded-full bg-yellow px-6 py-3 font-bold text-canvas no-underline">Browse plans</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((l) => (
                <li key={l.id} className="flex gap-4 py-5">
                  <Image src={imgSrc(l.image)} alt="" width={72} height={72} className="size-[72px] rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <Link href={`/${l.type === "plan" ? "plans" : "meals"}/${l.slug}`} onClick={close} className="font-display font-bold leading-snug text-fg no-underline">{l.name}</Link>
                      <span className="font-display font-bold">{formatNaira(l.unitKobo * l.qty)}</span>
                    </div>
                    <div className="text-[13px] text-muted">{describeOptions(l.options, l.type)}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-input-line bg-surface">
                        <button type="button" aria-label={`Decrease ${l.name}`} onClick={() => setQty(l.id, l.qty - 1)} className="tap flex items-center justify-center"><Minus size={16} aria-hidden /></button>
                        <span className="min-w-6 text-center text-sm font-bold" aria-live="polite">{l.qty}</span>
                        <button type="button" aria-label={`Increase ${l.name}`} onClick={() => setQty(l.id, l.qty + 1)} className="tap flex items-center justify-center"><Plus size={16} aria-hidden /></button>
                      </div>
                      <button type="button" onClick={() => remove(l.id)} className="min-h-11 px-2 text-[13px] text-muted underline">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-surface px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
              <div className="mb-1 flex justify-between text-[15px]"><span>Subtotal</span><b className="font-display text-xl">{formatNaira(cartSubtotal(items))}</b></div>
              <p className="mb-4 text-[13px] text-muted">Delivery and promo codes are applied at checkout.</p>
              <Link href="/checkout" onClick={close} className="cl-btn block rounded-full bg-ink py-4 text-center font-bold uppercase tracking-[0.12em] text-white no-underline">Checkout</Link>
              <Link href="/cart" onClick={close} className="mt-2 block py-3 text-center text-sm font-bold text-leaf underline">View full cart</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
