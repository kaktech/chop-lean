import "server-only";
import { createElement } from "react";
import { getBankDetails, getOrderFull, type OrderFull } from "@/lib/orders";
import { sendEmail } from "@/lib/email";
import type { EmailOrder } from "@/emails/Layout";
import OrderConfirmation from "@/emails/OrderConfirmation";
import AdminNewOrder from "@/emails/AdminNewOrder";
import PaymentConfirmed from "@/emails/PaymentConfirmed";
import StatusUpdate from "@/emails/StatusUpdate";
import { adminEmails } from "@/auth";

export function toEmailOrder(f: OrderFull): EmailOrder {
  const o = f.order;
  return {
    number: o.number, firstName: o.firstName, email: o.email, phone: o.phone, address: o.address,
    deliveryDate: o.deliveryDate, deliveryWindow: o.deliveryWindow, zoneName: f.zone?.name ?? "Lagos", paymentMethod: o.paymentMethod,
    notes: o.notes, paymentStatus: o.paymentStatus, paymentRef: f.payments.find((p) => p.providerRef)?.providerRef ?? o.number,
    placedAt: o.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }),
    subtotalKobo: o.subtotalKobo, discountKobo: o.discountKobo, deliveryKobo: o.deliveryKobo, podFeeKobo: o.podFeeKobo, totalKobo: o.totalKobo, promoCode: o.promoCode,
    items: f.items.map((i) => ({ name: i.name, qty: i.qty, unitPriceKobo: i.unitPriceKobo, isPlan: (i.options as { kcal?: number })?.kcal != null || /\b(plan|lean|smart|cut|owambe)\b/i.test(i.name) })),
  };
}

const run = async (label: string, fn: () => Promise<unknown>) => {
  try { await fn(); } catch (e) { console.error(`[notify] ${label} failed`, e); }
};

/** Customer confirmation + admin alert. Safe to call without awaiting results. */
export async function notifyOrderPlaced(orderId: string) {
  await run("order placed", async () => {
    const f = await getOrderFull(orderId);
    if (!f) return;
    const eo = toEmailOrder(f);
    const bank = f.order.paymentMethod === "transfer" ? await getBankDetails() : undefined;
    await sendEmail({ to: f.order.email, subject: `Your Chop Lean order ${f.order.number} is confirmed`, react: createElement(OrderConfirmation, { order: eo, orderId, bank }) });
    const admins = adminEmails();
    if (admins.length) await sendEmail({ to: admins, subject: `New order ${f.order.number} (${f.order.paymentMethod})`, react: createElement(AdminNewOrder, { order: eo, orderId }) });
  });
}

export async function notifyPaymentConfirmed(orderId: string) {
  await run("payment confirmed", async () => {
    const f = await getOrderFull(orderId);
    if (!f) return;
    await sendEmail({ to: f.order.email, subject: `Payment received for ${f.order.number}`, react: createElement(PaymentConfirmed, { order: toEmailOrder(f), orderId }) });
  });
}

export async function notifyStatusChange(orderId: string, status: string) {
  await run("status change", async () => {
    const f = await getOrderFull(orderId);
    if (!f) return;
    await sendEmail({ to: f.order.email, subject: `Order ${f.order.number}: ${status.replace(/_/g, " ")}`, react: createElement(StatusUpdate, { order: toEmailOrder(f), orderId, status }) });
  });
}

export async function notifyTransferSent(orderId: string) {
  await run("transfer sent", async () => {
    const f = await getOrderFull(orderId);
    const admins = adminEmails();
    if (!f || !admins.length) return;
    await sendEmail({ to: admins, subject: `Transfer claimed for ${f.order.number}`, react: createElement(AdminNewOrder, { order: toEmailOrder(f), orderId }) });
  });
}
