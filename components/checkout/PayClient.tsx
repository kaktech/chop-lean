"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { startCardPayment, verifyCardPayment } from "@/app/actions/checkout";
import { formatNaira, formatNairaFull } from "@/lib/money";
import { describeDate } from "@/lib/lagos-time";

type Order = { id: string; number: string; firstName: string; lastName: string; phone: string; address: string; deliveryDate: string; deliveryWindow: string; zoneName: string; subtotalKobo: number; discountKobo: number; deliveryKobo: number; totalKobo: number; promoCode: string | null };
type Item = { name: string; qty: number; unitPriceKobo: number; isPlan: boolean };

/** Paystack is the only way to pay: a secure popup for card details and bank OTP, verified on the server afterwards. */
export function PayClient({ order, items, cardEnabled, weeklyKobo, returnedReference }: { order: Order; items: Item[]; cardEnabled: boolean; weeklyKobo: number; returnedReference: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const verified = useRef(false);

  const [y, m, d] = order.deliveryDate.split("-").map(Number);
  const dd = describeDate({ y, m, d });
  const fullDow = { Mon: "Monday", Wed: "Wednesday", Fri: "Friday" }[dd.dow] ?? dd.dow;

  // Coming back from Paystack's hosted page (callback_url): verify automatically.
  useEffect(() => {
    if (!returnedReference || verified.current) return;
    verified.current = true;
    start(async () => {
      const r = await verifyCardPayment(order.id, returnedReference);
      if (r.ok) router.replace(r.redirect); else setError(r.message);
    });
  }, [returnedReference, order.id, router]);

  const pay = () => {
    setError(null);
    start(async () => {
      const r = await startCardPayment(order.id);
      if (!r.ok) { setError(r.message); return; }
      const { default: PaystackPop } = await import("@paystack/inline-js");
      const popup = new PaystackPop();
      popup.resumeTransaction(r.accessCode, {
        onSuccess: (tx: { reference?: string }) => {
          start(async () => {
            const v = await verifyCardPayment(order.id, tx.reference ?? r.reference);
            if (v.ok) router.push(v.redirect); else setError(v.message);
          });
        },
        onCancel: () => setError("Payment window closed. You haven't been charged."),
      });
    });
  };

  const payLabel = pending ? "One moment…" : `Pay ${formatNairaFull(order.totalKobo)}`;
  const disabled = pending || !cardEnabled;

  return (
    <div className="container-x mx-auto max-w-[640px] pb-16 pt-8 md:pt-12">
      <div className="cl-up text-center">
        <span className="label-sm text-[11px] tracking-[0.16em] text-yellow">Order {order.number}</span>
        <h1 className="mt-2 text-[34px] tracking-[-0.03em] md:text-[44px]">Review and <span className="text-leaf">pay</span></h1>
      </div>

      <div className="cl-up cl-d1 mt-7 overflow-hidden rounded-[24px] border border-line bg-surface">
        <ul className="divide-y divide-line px-5 md:px-7" aria-label="Your order">
          {items.map((i, k) => (
            <li key={k} className="flex items-start justify-between gap-4 py-4 text-[15px]">
              <span>{i.name}<span className="block text-[13px] text-muted">{i.qty} {i.isPlan ? `week${i.qty > 1 ? "s" : ""}` : `item${i.qty > 1 ? "s" : ""}`}</span></span>
              <b className="font-display">{formatNairaFull(i.unitPriceKobo * i.qty)}</b>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line bg-surface-2 px-5 py-4 text-[15px] md:px-7">
          {order.discountKobo > 0 && <div className="flex justify-between text-leaf"><dt>{order.promoCode}</dt><dd>- {formatNairaFull(order.discountKobo)}</dd></div>}
          <div className="flex justify-between text-muted"><dt>Delivery ({order.zoneName})</dt><dd>{order.deliveryKobo ? formatNairaFull(order.deliveryKobo) : "Free"}</dd></div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-display text-lg">Total</dt>
            <dd key={order.totalKobo} className="font-display text-[32px] font-bold leading-none tracking-tight">{formatNairaFull(order.totalKobo)}</dd>
          </div>
          {weeklyKobo > 0 && <p className="pt-1 text-sm text-muted">From week 2: {formatNaira(weeklyKobo)} / week (plan + delivery)</p>}
        </dl>
      </div>

      <section className="cl-up cl-d2 mt-4 flex items-start justify-between gap-4 rounded-[20px] border border-line bg-surface p-5 md:px-7" aria-label="Delivery details">
        <p className="text-[15px] leading-relaxed">
          <span className="label-sm block text-[11px] text-muted">Delivering to</span>
          <span className="mt-1.5 block">{order.firstName} {order.lastName} · {order.phone}</span>
          <span className="block text-muted">{order.address}</span>
          <span className="mt-2 block"><b>{fullDow} {dd.day} {dd.month}</b> · {order.deliveryWindow.split(" (")[0]}, then every Mon, Wed, Fri</span>
        </p>
        <Link href="/checkout" className="shrink-0 text-sm font-bold text-leaf underline">Edit</Link>
      </section>

      <div className="cl-up cl-d3 mt-6">
        {error && <p role="alert" className="cl-fade mb-3 rounded-xl bg-tint-red px-4 py-3 text-sm text-price-red">{error}</p>}
        {!cardEnabled && <p role="status" className="mb-3 rounded-xl bg-tint-amber px-4 py-3 text-sm">Online payment is being switched on. Please check back shortly.</p>}
        <button type="button" onClick={pay} disabled={disabled} className="cl-btn flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-yellow text-base font-bold text-canvas disabled:opacity-60">
          {pending ? <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" /> : <Lock size={16} aria-hidden />}{payLabel}
        </button>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} aria-hidden />Secured by Paystack</span>
          {["Verve", "Visa", "Mastercard", "Bank transfer"].map((b) => <span key={b} className="rounded border border-line px-1.5 py-0.5">{b}</span>)}
        </p>
        <p className="mt-2 text-center text-xs text-muted">Chop Lean never sees or stores your card details.</p>
      </div>
    </div>
  );
}
