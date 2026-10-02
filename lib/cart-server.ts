import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";

/** Empties a user's saved cart once they have an order. Server-only on purpose: never expose this as a server action. */
export async function clearSavedCart(userId: string): Promise<void> {
  const [cart] = await db.select({ id: s.carts.id }).from(s.carts).where(eq(s.carts.userId, userId)).limit(1);
  if (cart) await db.delete(s.cartItems).where(eq(s.cartItems.cartId, cart.id));
}
