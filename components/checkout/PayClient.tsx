"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { chooseTransfer, choosePayOnDelivery, startCardPayment, verifyCardPayment } from "@/app/actions/checkout";
import { formatNaira, formatNairaFull } from "@/lib/money";
import { POD_FEE_KOBO } from "@/lib/pricing";
import { describeDate } from "@/lib/lagos-time";

type Order = { id: string; number: string; firstName: string; lastName: string; phone: string; address: string; deliveryDate: string; deliveryWindow: string; zoneName: string; subtotalKobo: number; discountKobo: number; deliveryKobo: number; totalKobo: number; promoCode: string | null };
type Item = { name: string; qty: number; unitPriceKobo: number; isPlan: boolean };
type Method = "card" | "transfer" | "pod";

export function PayClient({ order, items, podAllowed, cardEnabled, weeklyKobo, returnedReference }: { order: Order; items: Item[]; podAllowed: boolean; cardEnabled: boolean; weeklyKobo: number; returnedReference: string | null }) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("card");
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const verified = useRef(false);

  const [y, m, d] = order.deliveryDate.split("-").map(Number);
  const dd = describeDate({ y, m, d });
  const fullDow = { Mon: "Monday", Wed: "Wednesday", Fri: "Friday" }[dd.dow] ?? dd.dow;
  const total = order.totalKobo + (method === "pod" ? POD_FEE_KOBO : 0);

  // Returning from Paystack's hosted page (callback_url): verify automatically.
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
    if (!agree) { setError("Please accept the terms to continue."); return; }
    start(async () => {
      if (method === "transfer") {
        const r = await chooseTransfer(order.id);
        if (r.ok) router.push(r.redirect); else setError(r.message);
      } else if (method === "pod") {
        const r = await choosePayOnDelivery(order.id);
        if (r.ok) router.push(r.redirect); else setError(r.message);
      } else {
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
      }
    });
  };

  const methods: { key: Method; title: string; sub: string; disabled?: boolean }[] = [
    { key: "card", title: "Card", sub: "Verve, Visa, Mastercard" },
    { key: "transfer", title: "Bank transfer", sub: "From any Nigerian bank app" },
    { key: "pod", title: "Pay on delivery", sub: podAllowed ? "First week only" : "First orders only", disabled: !podAllowed },
  ];

  return (
    <div className="container-x relative grid gap-8 pb-32 pt-8 lg:grid-cols-[1fr_510px] lg:pb-16">
      <div className="min-w-0">
        <h1 className="text-[40px] tracking-[-0.03em] md:text-[56px]">Review and <span className="text-leaf">pay</span></h1>

        <section className="mt-6 grid gap-5 rounded-[24px] border border-line bg-surface p-6 sm:grid-cols-2" aria-label="Delivery details">
          <div><div className="label-sm text-[11px] text-muted">Deliver to</div>
            <p className="mt-2 text-[15px] leading-relaxed">{order.firstName} {order.lastName} · {order.phone}<br />{order.address}</p></div>
          <div><div className="label-sm text-[11px] text-muted">First delivery</div>
            <p className="mt-2 text-[15px] leading-relaxed">{fullDow} {dd.day} {dd.month} · {order.deliveryWindow.split(" (")[0].replace(" – ", " – ")}<br />Then every Mon, Wed, Fri</p></div>
          <Link href="/checkout" className="text-sm font-bold text-leaf underline sm:col-span-2">Edit details</Link>
        </section>

        <h2 className="mb-4 mt-9 text-[26px]">How would you like to pay?</h2>
        <fieldset className="grid gap-2.5 sm:grid-cols-3">
          <legend className="sr-only">Payment method</legend>
          {methods.map((mm) => (
            <label key={mm.key} className={`flex min-h-[80px] flex-col justify-center rounded-[18px] border px-5 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-green ${mm.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${method === mm.key ? "border-2 border-green bg-tint-green" : "border-line bg-surface"}`}>
              <input type="radio" name="method" value={mm.key} checked={method === mm.key} disabled={mm.disabled} onChange={() => setMethod(mm.key)} className="sr-only" />
              <b className="font-display text-[17px]">{mm.title}</b><span className="text-[13px] text-muted">{mm.sub}</span>
            </label>
          ))}
        </fieldset>

        <section className="mt-5 rounded-[24px] border border-line bg-surface p-6" aria-live="polite">
          {method === "card" && (
            <>
              <div className="flex items-center justify-between"><h3 className="text-lg">Pay securely with Paystack</h3>
                <span className="flex gap-1.5">{["VERVE", "VISA", "MASTERCARD"].map((b) => <span key={b} className="rounded border border-fg px-2 py-0.5 text-[10px] font-bold">{b}</span>)}</span></div>
              <p className="mt-3 text-sm leading-relaxed text-muted">A secure Paystack window opens for your card details and bank OTP. Chop Lean never sees or stores your card number.</p>
              {!cardEnabled && <p className="mt-3 rounded-xl bg-tint-amber px-4 py-3 text-sm">Card payments aren&apos;t switched on yet (Paystack keys missing). Choose bank transfer or pay on delivery.</p>}
            </>
          )}
          {method === "transfer" && <p className="text-sm leading-relaxed text-body">You&apos;ll get our account details and a 30-minute hold on your delivery slot. Put <b>{order.number}</b> in the narration so we can match your payment quickly.</p>}
          {method === "pod" && <p className="text-sm leading-relaxed text-body">Pay the rider when your first delivery arrives (cash or transfer). A {formatNaira(POD_FEE_KOBO)} pay-on-delivery fee applies and this option is for your first order only.</p>}
        </section>

        <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="size-[22px] accent-green" />
          <span>I agree to the <Link href="/" className="text-leaf underline">Terms</Link> and understand I can pause or skip any week before Thursday 6pm.</span>
        </label>
      </div>

      <aside className="h-fit rounded-[26px] border border-line bg-surface p-6 md:p-8 lg:sticky lg:top-6" aria-label="Order summary">
        <h2 className="text-2xl">Order {order.number}</h2>
        <dl className="mt-5 flex flex-col gap-2.5 text-[15px]">
          {items.map((i, k) => <div key={k} className="flex justify-between gap-4"><dt>{i.name} × {i.qty}{i.isPlan ? ` week${i.qty > 1 ? "s" : ""}` : ""}</dt><dd>{formatNairaFull(i.unitPriceKobo * i.qty)}</dd></div>)}
          {order.discountKobo > 0 && <div className="flex justify-between text-leaf"><dt>{order.promoCode}</dt><dd>- {formatNairaFull(order.discountKobo)}</dd></div>}
          <div className="flex justify-between text-muted"><dt>Delivery ({order.zoneName})</dt><dd>{order.deliveryKobo ? formatNairaFull(order.deliveryKobo) : "Free"}</dd></div>
          {method === "pod" && <div className="flex justify-between text-muted"><dt>Pay on delivery fee</dt><dd>{formatNairaFull(POD_FEE_KOBO)}</dd></div>}
        </dl>
        <div className="mt-5 border-t border-line pt-5">
          <div className="label-sm text-[11px] text-muted">Total to pay</div>
          <div className="font-display text-[42px] font-bold leading-tight tracking-tight">{formatNairaFull(total)}</div>
          {weeklyKobo > 0 && <p className="mt-1 text-sm text-muted">From week 2: {formatNaira(weeklyKobo)} / week (plan + delivery)</p>}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-tint-red px-4 py-3 text-sm text-price-red">{error}</p>}
        <button type="button" onClick={pay} disabled={pending || (method === "card" && !cardEnabled)} className="cl-btn mt-5 hidden min-h-14 w-full rounded-full bg-yellow text-base font-bold text-canvas disabled:opacity-60 lg:block">
          {pending ? "One moment…" : method === "card" ? `Pay ${formatNairaFull(total)}` : method === "transfer" ? "Continue to bank details" : "Place order"}
        </button>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        {error && <p role="alert" className="mb-2 text-sm text-price-red">{error}</p>}
        <button type="button" onClick={pay} disabled={pending || (method === "card" && !cardEnabled)} className="cl-btn min-h-12 w-full rounded-full bg-yellow font-bold text-canvas disabled:opacity-60">
          {pending ? "One moment…" : method === "card" ? `Pay ${formatNairaFull(total)}` : method === "transfer" ? "Continue to bank details" : "Place order"}
        </button>
      </div>
    </div>
  );
}
