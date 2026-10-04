import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";

export type ServerCartLine = {
  productId: string; slug: string; type: "plan" | "meal" | "drink"; name: string; image: string; unitKobo: number; qty: number;
  options: Record<string, unknown>;
};
export type CartInput = { productId: string; qty: number; options: Record<string, unknown> };

/** The saved cart of a signed-in user: the one cart every device (web and mobile) reads and writes. */
export async function loadCart(userId: string): Promise<ServerCartLine[]> {
  const [cart] = await db.select().from(s.carts).where(eq(s.carts.userId, userId)).limit(1);
  if (!cart) return [];
  const rows = await db.select({ i: s.cartItems, p: s.products }).from(s.cartItems).innerJoin(s.products, eq(s.products.id, s.cartItems.productId)).where(eq(s.cartItems.cartId, cart.id));
  return rows.filter((r) => r.p.isLive).map((r) => ({
    productId: r.p.id, slug: r.p.slug, type: r.p.type, name: r.p.name, image: r.p.image ?? "meal-box.jpg",
    unitKobo: (r.i.options as { unitKobo?: number }).unitKobo ?? r.p.priceKobo, qty: r.i.qty, options: r.i.options,
  }));
}

export async function saveCartLines(userId: string, lines: CartInput[]) {
  const [cart] = await db.insert(s.carts).values({ userId }).onConflictDoUpdate({ target: s.carts.userId, set: { updatedAt: new Date() } }).returning({ id: s.carts.id });
  // One batch = one transaction, so a failed insert can never leave the saved cart empty.
  const wipe = db.delete(s.cartItems).where(eq(s.cartItems.cartId, cart.id));
  if (lines.length) await db.batch([wipe, db.insert(s.cartItems).values(lines.map((l) => ({ cartId: cart.id, productId: l.productId, qty: l.qty, options: l.options })))]);
  else await db.batch([wipe]);
}

/** Empties a user's saved cart once they have an order. Server-only on purpose: never expose this as a server action. */
export async function clearSavedCart(userId: string): Promise<void> {
  const [cart] = await db.select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.userId, userId)).limit(1);
  if (cart) await db.delete(s.cartItems).where(eq(s.cartItems.cartId, cart.id));
}

const norm = (o: Record<string, unknown>) => JSON.stringify(Object.keys(o).filter((k) => k !== "unitKobo").sort().map((k) => [k, o[k]]));

export type CartOp =
  | { op: "add"; productId: string; qty?: number; options?: Record<string, unknown> }
  | { op: "setQty"; productId: string; options?: Record<string, unknown>; qty: number }
  | { op: "remove"; productId: string; options?: Record<string, unknown> }
  | { op: "clear" };

/** Applies one change to the saved cart on the server, so two devices editing at once can't overwrite each other. */
export async function applyCartOp(userId: string, c: CartOp): Promise<ServerCartLine[]> {
  const current = await loadCart(userId);
  let next: CartInput[] = current.map((l) => ({ productId: l.productId, qty: l.qty, options: { ...l.options } }));
  if (c.op === "clear") next = [];
  else {
    const options = c.options ?? {};
    const same = (l: CartInput) => l.productId === c.productId && norm(l.options) === norm(options);
    if (c.op === "add") {
      const [p] = await db.select().from(s.products).where(eq(s.products.id, c.productId)).limit(1);
      if (!p || !p.isLive) throw new Error("That item isn't available.");
      const qty = Math.max(1, Math.min(c.qty ?? 1, 20));
      const hit = next.find(same);
      if (hit) hit.qty = Math.min(hit.qty + qty, 20);
      else {
        const base = p.type === "plan" ? { kcal: p.kcal ?? undefined, mealsPerDay: p.mealsPerDay ?? undefined, daysPerWeek: p.daysPerWeek ?? undefined } : {};
        next.push({ productId: p.id, qty, options: { ...base, ...options, unitKobo: p.priceKobo } });
      }
    } else if (c.op === "setQty") {
      next = c.qty <= 0 ? next.filter((l) => !same(l)) : next.map((l) => (same(l) ? { ...l, qty: Math.min(c.qty, 20) } : l));
    } else if (c.op === "remove") {
      next = next.filter((l) => !same(l));
    }
  }
  await saveCartLines(userId, next);
  return loadCart(userId);
}
