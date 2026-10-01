import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getOrderFull } from "@/lib/orders";
import { formatNaira, formatNairaFull } from "@/lib/money";
import { describeDate } from "@/lib/lagos-time";
import { ClearCart } from "@/components/checkout/ClearCart";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { pending_payment: "Awaiting payment", cooking: "Cooking", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const f = await getOrderFull(id);
  if (!f) notFound();
  const { order, items } = f;
  const [y, m, d] = order.deliveryDate.split("-").map(Number);
  const dd = describeDate({ y, m, d });
  const transfer = order.paymentMethod === "transfer";
  const pod = order.paymentMethod === "pod";
  const confirmingCard = order.paymentMethod === "card" && order.paymentStatus !== "paid";

  return (
    <div className="container-x py-10 md:py-16">
      <ClearCart />
      <div className="mx-auto grid max-w-[1000px] gap-8 lg:grid-cols-[1fr_340px]">
        <section className="relative overflow-hidden rounded-[28px] bg-green p-8 text-white md:p-12">
          <div aria-hidden className="absolute -bottom-10 right-0 font-serif text-[200px] italic leading-none text-white/[0.06]">Ese</div>
          <span className="cl-pop flex size-16 items-center justify-center rounded-full bg-yellow text-canvas"><Check size={30} strokeWidth={3} aria-hidden /></span>
          <h1 className="cl-up mt-8 text-[40px] leading-[1.05] tracking-[-0.03em] md:text-[56px]">
            {confirmingCard ? "Confirming your payment." : "Order confirmed."}{" "}
            <span className="font-serif font-normal italic text-yellow">{confirmingCard ? "One moment…" : "Your first week is on the stove."}</span>
          </h1>
          <p className="cl-up cl-d2 mt-6 max-w-[520px] text-base leading-relaxed text-[#E8F2DF]">
            {transfer ? "We've emailed your receipt and bank transfer details. Your order is confirmed once payment is received, and we'll message you on WhatsApp when the rider is on the way."
              : pod ? "We've emailed your receipt. Please have the amount ready for the rider on delivery, and we'll message you on WhatsApp when they're on the way."
              : confirmingCard ? "Your bank is still confirming the payment. This page and your email update automatically; refresh in a minute."
              : "We've emailed your receipt. We'll message you on WhatsApp when the rider is on the way."}
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            {[["Order number", order.number], ["First delivery", `${dd.dow} ${dd.day} ${dd.month.slice(0, 3)}`], ["Total", formatNaira(order.totalKobo)]].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-white/15 px-4 py-3"><dt className="text-xs text-[#DCEFD2]">{l}</dt><dd className="font-display text-lg font-bold">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/account" className="cl-btn rounded-full bg-yellow px-6 py-3 font-bold text-canvas no-underline">Track my order</Link>
            <Link href="/account#weight" className="cl-btn rounded-full border border-white/70 px-6 py-3 font-bold text-white no-underline">Log my starting weight</Link>
          </div>
        </section>

        <aside className="h-fit rounded-[24px] border border-line bg-surface p-6" aria-label="Order details">
          <div className="flex items-center justify-between"><h2 className="text-xl">{order.number}</h2><span className="rounded-full bg-tint-amber px-3 py-1 text-xs font-bold text-[#F6D58A]">{STATUS[order.status]}</span></div>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {items.map((i) => <li key={i.id} className="flex justify-between gap-3"><span>{i.name} × {i.qty}</span><b>{formatNaira(i.unitPriceKobo * i.qty)}</b></li>)}
            {order.discountKobo > 0 && <li className="flex justify-between text-leaf"><span>{order.promoCode}</span><b>- {formatNaira(order.discountKobo)}</b></li>}
            <li className="flex justify-between text-muted"><span>Delivery · {f.zone?.name}</span><span>{order.deliveryKobo ? formatNaira(order.deliveryKobo) : "Free"}</span></li>
            {order.podFeeKobo > 0 && <li className="flex justify-between text-muted"><span>Pay on delivery fee</span><span>{formatNaira(order.podFeeKobo)}</span></li>}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4"><b>Total</b><b className="font-display text-lg">{formatNairaFull(order.totalKobo)}</b></div>
          <p className="mt-4 text-[13px] text-muted">Delivering {dd.dow} {dd.day} {dd.month}, {order.deliveryWindow}<br />{order.address}</p>
        </aside>
      </div>
    </div>
  );
}
