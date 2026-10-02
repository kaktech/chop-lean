import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutHeader } from "@/components/checkout/CheckoutShell";
import { PayClient } from "@/components/checkout/PayClient";
import { getOrderFull } from "@/lib/orders";
import { paystackConfigured } from "@/lib/paystack";

export const metadata: Metadata = { title: "Review and pay", robots: { index: false } };
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

export default async function PayPage({ searchParams }: { searchParams: Promise<{ o?: string; reference?: string; trxref?: string }> }) {
  const sp = await searchParams;
  if (!sp.o || !UUID.test(sp.o)) redirect("/checkout");
  const f = await getOrderFull(sp.o);
  if (!f) redirect("/checkout");
  if (f.order.paymentStatus === "paid") redirect(`/order/${f.order.id}`);

  const planWeekly = f.items.filter((i) => (i.options as { kcal?: number })?.kcal != null || /plan|lean|smart|cut|owambe/i.test(i.name)).reduce((n, i) => n + i.unitPriceKobo, 0);

  return (
    <>
      <CheckoutHeader step={3} />
      <PayClient
        order={{ id: f.order.id, number: f.order.number, firstName: f.order.firstName, lastName: f.order.lastName, phone: f.order.phone, address: f.order.address, deliveryDate: f.order.deliveryDate, deliveryWindow: f.order.deliveryWindow, zoneName: f.zone?.name ?? "", subtotalKobo: f.order.subtotalKobo, discountKobo: f.order.discountKobo, deliveryKobo: f.order.deliveryKobo, totalKobo: f.order.totalKobo, promoCode: f.order.promoCode }}
        items={f.items.map((i) => ({ name: i.name, qty: i.qty, unitPriceKobo: i.unitPriceKobo, isPlan: (i.options as { kcal?: number })?.kcal != null }))}
        cardEnabled={paystackConfigured()}
        weeklyKobo={planWeekly ? planWeekly + f.order.deliveryKobo : 0}
        returnedReference={sp.reference ?? sp.trxref ?? null}
      />
    </>
  );
}
