import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { notifyOrderPlaced, notifyPaymentConfirmed } from "@/lib/notify";

/** Idempotently marks an order paid (card webhook/verify, or admin confirming a transfer). */
export async function markOrderPaid(orderId: string, opts: { providerRef?: string; notify: "placed" | "confirmed" }) {
  const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId)).limit(1);
  if (!order) return { ok: false as const, reason: "not_found" };
  if (order.paymentStatus === "paid") return { ok: true as const, already: true };

  await db.update(s.orders).set({ paymentStatus: "paid", status: order.status === "pending_payment" ? "cooking" : order.status }).where(eq(s.orders.id, orderId));
  const set = { status: "paid" as const, ...(opts.providerRef ? { providerRef: opts.providerRef } : {}) };
  if (opts.providerRef) {
    await db.update(s.payments).set(set).where(and(eq(s.payments.orderId, orderId), eq(s.payments.providerRef, opts.providerRef)));
  } else {
    await db.update(s.payments).set(set).where(and(eq(s.payments.orderId, orderId), sql`${s.payments.status} <> 'failed'`));
  }
  await takePlanSlots(orderId);
  if (opts.notify === "placed") await notifyOrderPlaced(orderId);
  else await notifyPaymentConfirmed(orderId);
  return { ok: true as const, already: false };
}

/** Counts one weekly slot against each plan in the order (used by "lock inventory"). */
export async function takePlanSlots(orderId: string) {
  const items = await db.select({ productId: s.orderItems.productId }).from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
  for (const id of new Set(items.map((i) => i.productId).filter((x): x is string => !!x))) {
    await db.update(s.products).set({ slotsTaken: sql`${s.products.slotsTaken} + 1` }).where(and(eq(s.products.id, id), eq(s.products.type, "plan")));
  }
}
