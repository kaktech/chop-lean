"use server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { auth } from "@/auth";
import { lineSchema } from "@/lib/checkout-schema";

export type ServerCartLine = {
  productId: string; slug: string; type: "plan" | "meal" | "drink"; name: string; image: string; unitKobo: number; qty: number;
  options: Record<string, unknown>;
};

async function load(userId: string): Promise<ServerCartLine[]> {
  const [cart] = await db.select().from(s.carts).where(eq(s.carts.userId, userId)).limit(1);
  if (!cart) return [];
  const rows = await db.select({ i: s.cartItems, p: s.products }).from(s.cartItems).innerJoin(s.products, eq(s.products.id, s.cartItems.productId)).where(eq(s.cartItems.cartId, cart.id));
  return rows.filter((r) => r.p.isLive).map((r) => ({
    productId: r.p.id, slug: r.p.slug, type: r.p.type, name: r.p.name, image: r.p.image ?? "meal-box.jpg",
    unitKobo: (r.i.options as { unitKobo?: number }).unitKobo ?? r.p.priceKobo, qty: r.i.qty, options: r.i.options,
  }));
}

async function save(userId: string, lines: { productId: string; qty: number; options: Record<string, unknown> }[]) {
  const [cart] = await db.insert(s.carts).values({ userId }).onConflictDoUpdate({ target: s.carts.userId, set: { updatedAt: new Date() } }).returning({ id: s.carts.id });
  await db.delete(s.cartItems).where(eq(s.cartItems.cartId, cart.id));
  if (lines.length) await db.insert(s.cartItems).values(lines.map((l) => ({ cartId: cart.id, productId: l.productId, qty: l.qty, options: l.options })));
}

const incoming = z.array(lineSchema.extend({ unitKobo: z.number().int().optional() })).max(30);

/** On sign-in: merge the guest (localStorage) cart into the saved cart and return the merged result. */
export async function mergeCart(guestLines: unknown): Promise<ServerCartLine[] | null> {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return null;
  const parsed = incoming.safeParse(guestLines);
  const guest = parsed.success ? parsed.data : [];
  const saved = await load(session.user.id);
  const key = (l: { productId: string; options: Record<string, unknown> }) => `${l.productId}:${JSON.stringify(l.options)}`;
  const merged = new Map<string, { productId: string; qty: number; options: Record<string, unknown> }>();
  for (const l of saved) merged.set(key(l), { productId: l.productId, qty: l.qty, options: { ...l.options } });
  for (const l of guest) {
    const o = { ...l.options, ...(l.unitKobo ? { unitKobo: l.unitKobo } : {}) } as Record<string, unknown>;
    const k = key({ productId: l.productId, options: o });
    const ex = merged.get(k);
    if (ex) ex.qty = Math.min(20, Math.max(ex.qty, l.qty)); else merged.set(k, { productId: l.productId, qty: l.qty, options: o });
  }
  await save(session.user.id, [...merged.values()]);
  return load(session.user.id);
}

export async function saveCart(lines: unknown): Promise<void> {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return;
  const parsed = incoming.safeParse(lines);
  if (!parsed.success) return;
  await save(session.user.id, parsed.data.map((l) => ({ productId: l.productId, qty: l.qty, options: { ...l.options, ...(l.unitKobo ? { unitKobo: l.unitKobo } : {}) } as Record<string, unknown> })));
}
