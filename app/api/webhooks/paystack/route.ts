import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { validSignature } from "@/lib/paystack";
import { markOrderPaid } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  let event: { event: string; data: { reference: string; amount: number; status: string; currency?: string } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  if (event.event === "charge.success") {
    const ref = event.data.reference;
    const [pay] = await db.select().from(payments).where(eq(payments.providerRef, ref)).limit(1);
    if (pay) {
      const [order] = await db.select().from(orders).where(eq(orders.id, pay.orderId)).limit(1);
      // Only accept if the amount paid matches what we charged.
      if (order && event.data.amount === order.totalKobo && event.data.status === "success") {
        await markOrderPaid(order.id, { providerRef: ref, notify: "placed" });
      } else {
        console.error(`[paystack] amount mismatch for ${ref}`);
      }
    }
  } else if (event.event === "charge.failed") {
    await db.update(payments).set({ status: "failed" }).where(eq(payments.providerRef, event.data.reference));
  }
  return NextResponse.json({ received: true });
}
