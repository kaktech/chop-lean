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
    <div className="container-x relative grid gap-8 pb-32 pt-8 lg:grid-cols-[1fr_480px] lg:pb-16">
      <div className="min-w-0">
        <h1 className="cl-up text-[36px] tracking-[-0.03em] md:text-[52px]">Review and <span className="text-leaf">pay</span></h1>

        <section className="cl-up cl-d1 mt-6 grid gap-5 rounded-[22px] border border-line bg-surface p-5 sm:grid-cols-2 md:p-6" aria-label="Delivery details">
          <div><div className="label-sm text-[11px] text-muted">Deliver to</div>
            <p className="mt-2 text-[15px] leading-relaxed">{order.firstName} {order.lastName} · {order.phone}<br />{order.address}</p></div>
          <div><div className="label-sm text-[11px] text-muted">First delivery</div>
            <p className="mt-2 text-[15px] leading-relaxed">{fullDow} {dd.day} {dd.month} · {order.deliveryWindow.split(" (")[0]}<br />Then every Mon, Wed, Fri</p></div>
          <Link href="/checkout" className="text-sm font-bold text-leaf underline sm:col-span-2">Edit details</Link>
        </section>

        <section className="cl-up cl-d2 mt-5 rounded-[22px] border border-line bg-surface p-5 md:p-6" aria-label="Payment">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl"><Lock size={18} aria-hidden className="text-leaf" />Pay securely with Paystack</h2>
            <span className="flex gap-1.5">{["VERVE", "VISA", "MASTERCARD"].map((b) => <span key={b} className="rounded border border-line px-2 py-0.5 text-[10px] font-bold text-muted">{b}</span>)}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">A secure Paystack window opens for your card details or bank transfer and your bank&apos;s OTP. Chop Lean never sees or stores your card number.</p>
          {!cardEnabled && <p role="status" className="mt-4 rounded-xl bg-tint-amber px-4 py-3 text-sm">Online payment is being switched on. Please check back shortly.</p>}
        </section>
      </div>

      <aside className="cl-up cl-d3 h-fit rounded-[24px] border border-line bg-surface p-5 md:p-7 lg:sticky lg:top-6" aria-label="Order summary">
        <h2 className="text-2xl">Order {order.number}</h2>
        <dl className="mt-5 flex flex-col gap-2.5 text-[15px]">
          {items.map((i, k) => <div key={k} className="flex justify-between gap-4"><dt>{i.name} × {i.qty}{i.isPlan ? ` week${i.qty > 1 ? "s" : ""}` : ""}</dt><dd>{formatNairaFull(i.unitPriceKobo * i.qty)}</dd></div>)}
          {order.discountKobo > 0 && <div className="flex justify-between text-leaf"><dt>{order.promoCode}</dt><dd>- {formatNairaFull(order.discountKobo)}</dd></div>}
          <div className="flex justify-between text-muted"><dt>Delivery ({order.zoneName})</dt><dd>{order.deliveryKobo ? formatNairaFull(order.deliveryKobo) : "Free"}</dd></div>
        </dl>
        <div className="mt-5 border-t border-line pt-5">
          <div className="label-sm text-[11px] text-muted">Total to pay</div>
          <div className="font-display text-[40px] font-bold leading-tight tracking-tight">{formatNairaFull(order.totalKobo)}</div>
          {weeklyKobo > 0 && <p className="mt-1 text-sm text-muted">From week 2: {formatNaira(weeklyKobo)} / week (plan + delivery)</p>}
        </div>
        {error && <p role="alert" className="cl-fade mt-4 rounded-xl bg-tint-red px-4 py-3 text-sm text-price-red">{error}</p>}
        <button type="button" onClick={pay} disabled={disabled} className="cl-btn mt-5 hidden min-h-14 w-full items-center justify-center gap-2 rounded-full bg-yellow text-base font-bold text-canvas disabled:opacity-60 lg:flex">
          {pending && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />}{payLabel}
        </button>
        <p className="mt-3 hidden items-center justify-center gap-1.5 text-xs text-muted lg:flex"><ShieldCheck size={14} aria-hidden />Payments are processed by Paystack</p>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        {error && <p role="alert" className="cl-fade mb-2 text-sm text-price-red">{error}</p>}
        <button type="button" onClick={pay} disabled={disabled} className="cl-btn flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-yellow font-bold text-canvas disabled:opacity-60">
          {pending && <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />}{payLabel}
        </button>
      </div>
    </div>
  );
}
