import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutHeader } from "@/components/checkout/CheckoutShell";
import { getOrderFull } from "@/lib/orders";
import { formatNairaFull } from "@/lib/money";

export const metadata: Metadata = { title: "Payment didn't go through", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FailedPage({ searchParams }: { searchParams: Promise<{ o?: string }> }) {
  const { o } = await searchParams;
  const f = o && /^[0-9a-f-]{36}$/i.test(o) ? await getOrderFull(o) : null;
  return (
    <>
      <CheckoutHeader />
      <div className="container-x py-12 md:py-20">
        <div className="mx-auto max-w-[680px] rounded-[28px] border border-line bg-white p-8 md:p-12">
          <span className="flex size-14 items-center justify-center rounded-full bg-pink text-2xl font-bold text-price-red" aria-hidden>!</span>
          <h1 className="mt-5 text-[34px] tracking-[-0.03em] md:text-[44px]">Your payment didn&apos;t go through</h1>
          <p className="mt-3 text-body">Your bank declined the card, so you haven&apos;t been charged. Your cart and delivery slot are saved for the next 30 minutes.</p>
          <ul className="mt-5 flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
            <li>Not enough funds, or the daily online spending limit on your card was reached</li>
            <li>The OTP expired or was entered incorrectly</li>
            <li>Your card isn&apos;t enabled for online payments (your bank app can switch this on)</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            {f && <Link href={`/checkout/pay?o=${f.order.id}`} className="cl-btn rounded-full bg-yellow px-7 py-3.5 font-bold text-ink no-underline">Try card again</Link>}
            {f && <Link href={`/checkout/pay?o=${f.order.id}`} className="cl-btn rounded-full border-[1.5px] border-ink px-7 py-3 font-bold text-ink no-underline">Pay by bank transfer</Link>}
            {!f && <Link href="/checkout" className="cl-btn rounded-full bg-yellow px-7 py-3.5 font-bold text-ink no-underline">Back to checkout</Link>}
          </div>
          {f && <p className="mt-6 text-[13px] text-muted">Order {f.order.number} · {formatNairaFull(f.order.totalKobo)} · Need help? <a href="https://wa.me/2340000000000" className="font-bold text-green underline">Chat on WhatsApp</a></p>}
        </div>
      </div>
    </>
  );
}
