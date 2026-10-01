"use server";
import { and, eq, isNull, lt } from "drizzle-orm";
import { put } from "@vercel/blob";
import { db } from "@/db";
import * as s from "@/db/schema";
import { auth } from "@/auth";
import { ADDRESS_MESSAGE, checkoutSchema, isDetailedAddress, lineSchema } from "@/lib/checkout-schema";
import { buildQuote, isFirstOrder, nextOrderNumber, QuoteError } from "@/lib/orders";
import { initializeTransaction, paystackConfigured, verifyTransaction } from "@/lib/paystack";
import { markOrderPaid } from "@/lib/payments";
import { notifyOrderPlaced, notifyTransferSent } from "@/lib/notify";
import { z } from "zod";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; message: string; errors?: Record<string, string> };

const fieldErrors = (e: z.ZodError) => {
  const errors: Record<string, string> = {};
  for (const i of e.issues) errors[String(i.path[0])] ??= i.message;
  return errors;
};

/** Preview a promo code against the real cart (validated server-side). */
export async function applyPromo(input: { code: string; lines: unknown; zoneId?: string; email?: string }): Promise<ActionResult<{ code: string; discountKobo: number; message: string }>> {
  const lines = z.array(lineSchema).safeParse(input.lines);
  if (!lines.success || !lines.data.length) return { ok: false, message: "Your cart is empty." };
  const session = await auth().catch(() => null);
  try {
    const q = await buildQuote({ lines: lines.data, zoneId: input.zoneId || "mainland", promoCode: input.code, email: input.email || session?.user?.email || undefined, userId: session?.user?.id });
    if (!q.promo) return { ok: false, message: q.promoError ?? "That code isn't valid." };
    return { ok: true, code: q.promo.code, discountKobo: q.promo.discountKobo, message: `${q.promo.code} applied: 20% off your first week's plan` };
  } catch (e) {
    return { ok: false, message: e instanceof QuoteError ? e.message : "Couldn't check that code." };
  }
}

/** Server-side quote for the order summary (so the UI never calculates money). */
export async function getQuote(input: { lines: unknown; zoneId?: string; promo?: string; email?: string; payment?: "card" | "transfer" | "pod" }) {
  const lines = z.array(lineSchema).safeParse(input.lines);
  if (!lines.success || !lines.data.length) return null;
  const session = await auth().catch(() => null);
  try {
    const q = await buildQuote({ lines: lines.data, zoneId: input.zoneId, promoCode: input.promo, email: input.email || session?.user?.email || undefined, userId: session?.user?.id, payment: input.payment });
    return { totals: q.totals, promo: q.promo, promoError: q.promoError, zoneName: q.zone.name, lines: q.lines.map((l) => ({ productId: l.productId, name: l.name, image: l.image, qty: l.qty, unitKobo: l.unitKobo, type: l.type })) };
  } catch {
    return null;
  }
}

/** "Review order": validates everything and creates the pending order. */
export async function createOrder(raw: unknown): Promise<ActionResult<{ orderId: string }>> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;

  try {
    const quote = await buildQuote({ lines: d.lines, zoneId: d.zoneId, promoCode: d.promo, email: d.email, userId, deliveryDate: d.deliveryDate });
    const pickup = quote.zone.id === "pickup";
    if (!pickup && !isDetailedAddress(d.address, quote.zone.areas)) {
      return { ok: false, message: ADDRESS_MESSAGE, errors: { address: ADDRESS_MESSAGE } };
    }
    if (d.promo && !quote.promo) return { ok: false, message: quote.promoError ?? "That promo code isn't valid.", errors: { promo: quote.promoError ?? "Invalid code" } };

    // Tidy up this customer's abandoned, unpaid, unchosen orders from the last day.
    await db.delete(s.orders).where(and(eq(s.orders.email, d.email), eq(s.orders.status, "pending_payment"), isNull(s.orders.paymentMethod), lt(s.orders.createdAt, new Date(Date.now() - 60 * 60 * 1000))));

    const number = await nextOrderNumber();
    const [order] = await db.insert(s.orders).values({
      number, userId, email: d.email, firstName: d.firstName, lastName: d.lastName, phone: d.phone, zoneId: quote.zone.id,
      address: pickup ? "Pickup from our kitchen, Yaba" : d.address, deliveryDate: d.deliveryDate, deliveryWindow: d.deliveryWindow, notes: d.notes || null,
      subtotalKobo: quote.totals.subtotalKobo, discountKobo: quote.totals.discountKobo, deliveryKobo: quote.totals.deliveryKobo, podFeeKobo: 0,
      totalKobo: quote.totals.totalKobo, promoCode: quote.promo?.code ?? null,
    }).returning({ id: s.orders.id });

    await db.insert(s.orderItems).values(quote.lines.map((l) => ({ orderId: order.id, productId: l.productId, name: l.name, qty: l.qty, unitPriceKobo: l.unitKobo, options: l.options as Record<string, unknown> })));
    return { ok: true, orderId: order.id };
  } catch (e) {
    if (e instanceof QuoteError) return { ok: false, message: e.message };
    console.error("[createOrder]", e);
    return { ok: false, message: "Something went wrong creating your order. Please try again." };
  }
}

async function loadOrder(orderId: string) {
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId)).limit(1);
  return o ?? null;
}

/** Re-derive totals for the chosen payment method (pay-on-delivery adds the fee). */
async function applyMethod(orderId: string, method: "card" | "transfer" | "pod") {
  const order = await loadOrder(orderId);
  if (!order) return null;
  const pod = method === "pod" ? 50_000 : 0;
  const totalKobo = order.subtotalKobo - order.discountKobo + order.deliveryKobo + pod;
  await db.update(s.orders).set({ paymentMethod: method, podFeeKobo: pod, totalKobo }).where(eq(s.orders.id, orderId));
  return { ...order, podFeeKobo: pod, totalKobo, paymentMethod: method };
}

export async function chooseTransfer(orderId: string): Promise<ActionResult<{ redirect: string }>> {
  const order = await applyMethod(orderId, "transfer");
  if (!order) return { ok: false, message: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: true, redirect: `/order/${orderId}` };
  const existing = await db.select().from(s.payments).where(and(eq(s.payments.orderId, orderId), eq(s.payments.method, "transfer"))).limit(1);
  if (!existing.length) await db.insert(s.payments).values({ orderId, method: "transfer", amountKobo: order.totalKobo, status: "pending" });
  else await db.update(s.payments).set({ amountKobo: order.totalKobo }).where(eq(s.payments.id, existing[0].id));
  await notifyOrderPlaced(orderId);
  return { ok: true, redirect: `/checkout/transfer/${orderId}` };
}

export async function choosePayOnDelivery(orderId: string): Promise<ActionResult<{ redirect: string }>> {
  const order = await loadOrder(orderId);
  if (!order) return { ok: false, message: "Order not found." };
  if (!(await isFirstOrder(order.email, order.userId))) return { ok: false, message: "Pay on delivery is only available on your first order." };
  const updated = await applyMethod(orderId, "pod");
  if (!updated) return { ok: false, message: "Order not found." };
  await db.insert(s.payments).values({ orderId, method: "pod", amountKobo: updated.totalKobo, status: "pending" });
  await db.update(s.orders).set({ status: "cooking" }).where(eq(s.orders.id, orderId));
  const { takePlanSlots } = await import("@/lib/payments");
  await takePlanSlots(orderId);
  await notifyOrderPlaced(orderId);
  return { ok: true, redirect: `/order/${orderId}` };
}

/** Starts a Paystack transaction. The amount comes from our database, never the browser. */
export async function startCardPayment(orderId: string): Promise<ActionResult<{ accessCode: string; reference: string; publicKey: string }>> {
  if (!paystackConfigured()) return { ok: false, message: "Card payments aren't switched on yet. Please choose bank transfer or pay on delivery." };
  const order = await applyMethod(orderId, "card");
  if (!order) return { ok: false, message: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: false, message: "This order is already paid." };
  const reference = `${order.number}-${Date.now().toString(36)}`;
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const tx = await initializeTransaction({ email: order.email, amountKobo: order.totalKobo, reference, callbackUrl: `${site}/checkout/pay?o=${orderId}`, metadata: { orderId, orderNumber: order.number } });
    await db.insert(s.payments).values({ orderId, method: "card", amountKobo: order.totalKobo, status: "pending", providerRef: reference });
    return { ok: true, accessCode: tx.access_code, reference, publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY! };
  } catch (e) {
    console.error("[paystack init]", e);
    return { ok: false, message: "We couldn't start the card payment. Please try again or use bank transfer." };
  }
}

/** Called by the browser after the Paystack popup closes. We re-verify with Paystack ourselves. */
export async function verifyCardPayment(orderId: string, reference: string): Promise<ActionResult<{ redirect: string }>> {
  const [pay] = await db.select().from(s.payments).where(and(eq(s.payments.orderId, orderId), eq(s.payments.providerRef, reference))).limit(1);
  const order = await loadOrder(orderId);
  if (!pay || !order) return { ok: false, message: "Payment not found." };
  try {
    const v = await verifyTransaction(reference);
    if (v.status === "success" && v.amount === order.totalKobo && v.currency === "NGN") {
      await markOrderPaid(orderId, { providerRef: reference, notify: "placed" });
      return { ok: true, redirect: `/order/${orderId}` };
    }
    await db.update(s.payments).set({ status: "failed" }).where(eq(s.payments.id, pay.id));
    return { ok: true, redirect: `/checkout/failed?o=${orderId}` };
  } catch (e) {
    console.error("[paystack verify]", e);
    return { ok: false, message: "We couldn't confirm that payment yet. If you were charged, it will update shortly." };
  }
}

export async function uploadReceipt(orderId: string, formData: FormData): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a file first." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, message: "File is too large (max 5MB)." };
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return { ok: false, message: "Upload a JPG, PNG or PDF." };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { ok: false, message: "Receipt uploads aren't set up yet. You can still tap “I've sent the money”." };
  const order = await loadOrder(orderId);
  if (!order) return { ok: false, message: "Order not found." };
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const blob = await put(`receipts/${order.number}-${Date.now()}.${ext}`, file, { access: "public" });
  await db.update(s.payments).set({ receiptUrl: blob.url }).where(and(eq(s.payments.orderId, orderId), eq(s.payments.method, "transfer")));
  return { ok: true, url: blob.url };
}

export async function markTransferSent(orderId: string): Promise<ActionResult> {
  const order = await loadOrder(orderId);
  if (!order) return { ok: false, message: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: true };
  await db.update(s.orders).set({ paymentStatus: "awaiting_confirmation" }).where(eq(s.orders.id, orderId));
  await db.update(s.payments).set({ status: "awaiting_confirmation" }).where(and(eq(s.payments.orderId, orderId), eq(s.payments.method, "transfer")));
  await notifyTransferSent(orderId);
  return { ok: true };
}
