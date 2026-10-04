"use server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { auth } from "@/auth";
import { lineSchema } from "@/lib/checkout-schema";
import { loadCart, saveCartLines, type ServerCartLine } from "@/lib/cart-server";

const load = loadCart;
const save = saveCartLines;

/** Server copy of the signed-in user's cart: the single source of truth every device syncs to. */
export async function getSavedCart(): Promise<ServerCartLine[] | null> {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) return null;
  return load(session.user.id);
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
