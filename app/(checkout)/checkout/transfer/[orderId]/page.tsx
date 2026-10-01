import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckoutHeader } from "@/components/checkout/CheckoutShell";
import { TransferClient } from "@/components/checkout/TransferClient";
import { getBankDetails, getOrderFull } from "@/lib/orders";
import { formatNaira } from "@/lib/money";
import { describeDate } from "@/lib/lagos-time";

export const metadata: Metadata = { title: "Bank transfer", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TransferPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound();
  const f = await getOrderFull(orderId);
  if (!f) notFound();
  if (f.order.paymentStatus === "paid") redirect(`/order/${orderId}`);
  const transfer = f.payments.find((p) => p.method === "transfer");
  if (!transfer) redirect(`/checkout/pay?o=${orderId}`);
  const bank = await getBankDetails();
  const [y, m, d] = f.order.deliveryDate.split("-").map(Number);
  const dd = describeDate({ y, m, d });
  const title = f.items.map((i) => (i.name.length > 18 ? i.name.split(",")[0] : i.name)).join(" + ");

  return (
    <>
      <CheckoutHeader right={<>Order {f.order.number}</>} />
      <TransferClient
        orderId={orderId} number={f.order.number} totalKobo={f.order.totalKobo} bank={bank}
        heldUntil={new Date(transfer.createdAt.getTime() + 30 * 60 * 1000).toISOString()}
        awaiting={f.order.paymentStatus === "awaiting_confirmation"} receiptUploaded={!!transfer.receiptUrl}
        summary={{ title, subtotal: f.order.subtotalKobo, discount: f.order.discountKobo, delivery: f.order.deliveryKobo, promo: f.order.promoCode, deliveryLine: `First delivery ${dd.dow} ${dd.day} ${dd.month}, ${f.order.deliveryWindow.split(" (")[0].replace(/\s/g, "")} · ${f.zone?.name ?? ""}`, fmt: formatNaira(f.order.totalKobo) }}
      />
      <p className="container-x pb-10 text-sm"><Link href={`/checkout/pay?o=${orderId}`} className="text-leaf underline">Pay with card instead</Link></p>
    </>
  );
}
