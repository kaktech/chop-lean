"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { applyPromo, getQuote } from "@/app/actions/checkout";
import { cartSubtotal, useCart } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatNaira, formatNairaFull } from "@/lib/money";
import { describeOptions } from "@/components/layout/CartDrawer";
import { useAddToCart, type AddableProduct } from "@/lib/use-add-to-cart";
import { describeDate, nextDeliveryDates } from "@/lib/lagos-time";

type Upsell = (AddableProduct & { kcal: number | null }) | null;

export function CartView({ upsell }: { upsell: Upsell }) {
  const hydrated = useHydrated();
  const { lines, setQty, remove, promo, setPromo } = useCart();
  const addToCart = useAddToCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [totals, setTotals] = useState<{ subtotalKobo: number; discountKobo: number; totalKobo: number } | null>(null);

  const items = hydrated ? lines : [];
  const key = JSON.stringify(items.map((l) => [l.productId, l.qty, l.options])) + (promo ?? "");

  useEffect(() => {
    if (!items.length) { setTotals(null); return; }
    let live = true;
    getQuote({ lines: items.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options })), promo: promo ?? undefined }).then((q) => {
      if (live && q) setTotals(q.totals);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const apply = async () => {
    if (!code.trim()) return;
    const r = await applyPromo({ code, lines: items.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options })) });
    if (r.ok) { setPromo(r.code); setMsg({ ok: true, text: r.message }); setCode(""); } else setMsg({ ok: false, text: r.message });
  };

  const count = items.reduce((n, l) => n + l.qty, 0);
  const first = nextDeliveryDates(new Date(), 1)[0];
  const subtotal = totals?.subtotalKobo ?? cartSubtotal(items);
  const hasUpsell = upsell && !items.some((l) => l.productId === upsell.id);

  return (
    <div className="container-x relative pb-20 pt-8 md:pt-12">
      <div aria-hidden className="watermark absolute right-8 top-0 hidden text-[170px] md:block">Basket</div>
      <h1 className="relative text-[34px] tracking-[-0.03em] md:text-[56px]">Your Cart</h1>
      <p className="relative mt-1 text-muted">{count} item{count === 1 ? "" : "s"}{first && items.length ? ` · first delivery ${describeDate(first).dow === "Mon" ? "Monday" : describeDate(first).dow === "Wed" ? "Wednesday" : "Friday"}, ${first.d} ${describeDate(first).month}` : ""}</p>

      {items.length === 0 ? (
        <div className="relative mt-10 rounded-[26px] border border-dashed border-input-line bg-white px-6 py-20 text-center">
          <p className="font-serif text-3xl">Your cart is empty.</p>
          <p className="mt-2 text-muted">Pick a plan and we&apos;ll do the cooking.</p>
          <Link href="/shop" className="cl-btn mt-6 inline-block rounded-full bg-yellow px-7 py-3.5 font-bold text-ink no-underline">Browse plans</Link>
        </div>
      ) : (
        <div className="relative mt-8 grid gap-8 lg:grid-cols-[1fr_440px]">
          <div className="flex flex-col gap-4">
            {items.map((l) => (
              <article key={l.id} className="flex flex-wrap items-center gap-4 rounded-[24px] border border-line bg-white p-4 md:flex-nowrap md:gap-6 md:p-5">
                <Image src={`/images/${l.image}`} alt="" width={130} height={130} className="size-[88px] rounded-2xl object-cover md:size-[130px]" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg md:text-[22px]">{l.name}</h2>
                  <p className="mt-1 text-sm text-muted">{describeOptions(l.options, l.type) || (l.type === "drink" ? "Drink" : "Single meal")}{l.options.subscribe ? " · Subscribe & save 10%" : ""}{l.options.exclusions ? ` · ${l.options.exclusions}` : ""}</p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <Link href={`/${l.type === "plan" ? "plans" : "meals"}/${l.slug}`} className="min-h-6 text-green underline">Edit</Link>
                    <button type="button" onClick={() => remove(l.id)} className="text-price-red underline">Remove</button>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-4 md:w-auto">
                  <div className="flex items-center rounded-full border border-input-line bg-white">
                    <button type="button" aria-label={`Decrease ${l.name}`} onClick={() => setQty(l.id, l.qty - 1)} className="tap flex items-center justify-center"><Minus size={16} aria-hidden /></button>
                    <span className="min-w-9 text-center font-bold" aria-live="polite">{l.qty}</span>
                    <button type="button" aria-label={`Increase ${l.name}`} onClick={() => setQty(l.id, l.qty + 1)} className="tap flex items-center justify-center"><Plus size={16} aria-hidden /></button>
                  </div>
                  <span className="min-w-[96px] text-right font-display text-xl font-bold">{formatNaira(l.unitKobo * l.qty)}</span>
                </div>
              </article>
            ))}

            {hasUpsell && upsell && (
              <div className="flex flex-wrap items-center gap-4 rounded-[24px] bg-butter p-4 md:flex-nowrap">
                <Image src={`/images/${upsell.image}`} alt="" width={96} height={96} className="size-24 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1"><h2 className="font-serif text-2xl">Add a drink for the 4pm hunger?</h2><p className="text-sm text-body">Unsweetened tiger nut, date and coconut · 35cl · {upsell.kcal} kcal</p></div>
                <b className="font-display text-xl">{formatNaira(upsell.priceKobo)}</b>
                <button type="button" onClick={() => addToCart(upsell)} className="cl-btn tap rounded-full bg-ink px-5 text-sm font-bold text-white">+ Add</button>
              </div>
            )}
            <Link href="/shop" className="font-bold text-green underline">← Keep shopping</Link>
          </div>

          <aside className="h-fit rounded-[26px] border border-line bg-white p-6 md:p-7" aria-label="Order summary">
            <h2 className="text-2xl">Order Summary</h2>
            <dl className="mt-5 flex flex-col gap-3 text-[15px] text-body">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNairaFull(subtotal)}</dd></div>
              {totals && totals.discountKobo > 0 && <div className="flex justify-between text-green"><dt>{promo}</dt><dd>- {formatNairaFull(totals.discountKobo)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd>Choose zone at checkout</dd></div>
            </dl>
            <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="mt-5 flex gap-2">
              <label htmlFor="cart-promo" className="sr-only">Promo code</label>
              <input id="cart-promo" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Promo code" className="min-h-11 min-w-0 flex-1 rounded-xl border border-input-line px-3.5 uppercase tracking-wide" />
              <button className="cl-btn tap rounded-xl bg-ink px-5 text-xs font-bold uppercase tracking-[0.1em] text-white">Apply</button>
            </form>
            <p role="status" className={`mt-2 min-h-5 text-[13px] ${msg?.ok ? "font-bold text-green" : "text-price-red"}`}>{promo && !msg ? `✓ ${promo} applied` : msg?.text}</p>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-5"><span className="font-bold">Total</span><span className="font-display text-[32px] font-bold">{formatNairaFull(totals ? totals.totalKobo : subtotal)}</span></div>
            <Link href="/checkout" className="cl-btn mt-5 block rounded-xl bg-ink py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-white no-underline">Checkout</Link>
            <p className="mt-4 text-center text-xs text-muted">You can pause or skip any week from your account.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
