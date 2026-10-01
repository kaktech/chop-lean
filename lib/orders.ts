import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { canOrderFor } from "@/lib/lagos-time";
import { computeTotals, planUnitPrice, validatePromo, type PromoRule, type Totals } from "@/lib/pricing";
import type { CheckoutLine } from "@/lib/checkout-schema";
import { isInventoryLocked } from "@/lib/admin";

export type QuoteLine = {
  productId: string; slug: string; type: "plan" | "meal" | "drink"; name: string; image: string | null;
  qty: number; unitKobo: number; options: CheckoutLine["options"];
};

export type Quote = {
  lines: QuoteLine[];
  totals: Totals;
  zone: { id: string; name: string; feeKobo: number; areas: string };
  promo: { code: string; discountKobo: number } | null;
  promoError: string | null;
  isFirstOrder: boolean;
};

export class QuoteError extends Error {}

/** True when this email/user has no earlier (non-cancelled) order. */
export async function isFirstOrder(email: string, userId?: string | null) {
  const cond = userId ? sql`(${s.orders.userId} = ${userId} or lower(${s.orders.email}) = ${email.toLowerCase()})` : sql`lower(${s.orders.email}) = ${email.toLowerCase()}`;
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(s.orders).where(and(cond, ne(s.orders.status, "cancelled"), ne(s.orders.paymentStatus, "failed"), ne(s.orders.status, "pending_payment")));
  return (row?.n ?? 0) === 0;
}

/** Rebuild prices, promo and totals from the database. Never trusts client prices. */
export async function buildQuote(args: {
  lines: CheckoutLine[]; zoneId?: string; promoCode?: string; email?: string; userId?: string | null;
  payment?: "card" | "transfer" | "pod"; deliveryDate?: string;
}): Promise<Quote> {
  const locked = await isInventoryLocked();
  const ids = [...new Set(args.lines.map((l) => l.productId))];
  const prods = await db.select().from(s.products).where(inArray(s.products.id, ids));
  const opts = await db.select().from(s.planCalorieOptions).where(inArray(s.planCalorieOptions.productId, ids));

  const lines: QuoteLine[] = args.lines.map((l) => {
    const p = prods.find((x) => x.id === l.productId);
    if (!p || !p.isLive) throw new QuoteError("An item in your cart is no longer available.");
    if (locked && p.weeklySlots != null && p.slotsTaken >= p.weeklySlots) throw new QuoteError(`${p.name} is sold out for this week.`);
    const unitKobo =
      p.type === "plan"
        ? planUnitPrice(
            { basePriceKobo: p.priceKobo, baseKcal: p.kcal, baseMealsPerDay: p.mealsPerDay, baseDaysPerWeek: p.daysPerWeek, calorieOptions: opts.filter((o) => o.productId === p.id).map((o) => ({ kcal: o.kcal, priceKobo: o.priceKobo })) },
            l.options,
          )
        : p.priceKobo;
    return { productId: p.id, slug: p.slug, type: p.type, name: p.name, image: p.image, qty: l.qty, unitKobo, options: l.options };
  });

  const zone = args.zoneId
    ? (await db.select().from(s.deliveryZones).where(and(eq(s.deliveryZones.id, args.zoneId), eq(s.deliveryZones.isActive, true))).limit(1))[0]
    : { id: "", name: "", feeKobo: 0, areas: "" };
  if (!zone) throw new QuoteError("Choose a delivery zone.");

  if (args.deliveryDate) {
    const [y, m, d] = args.deliveryDate.split("-").map(Number);
    if (!canOrderFor({ y, m, d })) throw new QuoteError("That delivery date is no longer available. Pick another day (orders close 6pm the day before).");
  }

  const first = args.email ? await isFirstOrder(args.email, args.userId) : true;
  let promo: PromoRule | null = null;
  let promoError: string | null = null;
  if (args.promoCode) {
    const [row] = await db.select().from(s.promoCodes).where(eq(s.promoCodes.code, args.promoCode.toUpperCase())).limit(1);
    const check = validatePromo(row ? ({ ...row, type: row.type as "percent" | "fixed" }) : null, { isFirstOrder: first, hasPlan: lines.some((l) => l.type === "plan") });
    if (check.ok) promo = check.promo; else promoError = check.reason;
  }

  const totals = computeTotals({ lines, zoneFeeKobo: zone.feeKobo, promo, payment: args.payment });
  return { lines, totals, zone: { id: zone.id, name: zone.name, feeKobo: zone.feeKobo, areas: zone.areas }, promo: promo ? { code: promo.code, discountKobo: totals.discountKobo } : null, promoError, isFirstOrder: first };
}

export async function nextOrderNumber(): Promise<string> {
  const res = await db.execute(sql`select nextval('order_number_seq') as n`);
  const n = (res.rows[0] as { n: string }).n;
  return `CL-${n}`;
}

export async function getOrderFull(id: string) {
  const [order] = await db.select().from(s.orders).where(eq(s.orders.id, id)).limit(1);
  if (!order) return null;
  const [items, pays, [zone]] = await Promise.all([
    db.select().from(s.orderItems).where(eq(s.orderItems.orderId, id)),
    db.select().from(s.payments).where(eq(s.payments.orderId, id)).orderBy(desc(s.payments.createdAt)),
    db.select().from(s.deliveryZones).where(eq(s.deliveryZones.id, order.zoneId)).limit(1),
  ]);
  return { order, items, payments: pays, zone };
}
export type OrderFull = NonNullable<Awaited<ReturnType<typeof getOrderFull>>>;

export async function getBankDetails() {
  const [row] = await db.select().from(s.storeSettings).where(eq(s.storeSettings.id, 1)).limit(1);
  return {
    bankName: row?.bankName || "[Bank name]",
    accountNumber: row?.accountNumber || "[0000000000]",
    accountName: row?.accountName || "Chop Lean Foods Ltd",
    configured: !!(row?.bankName && row?.accountNumber),
  };
}
