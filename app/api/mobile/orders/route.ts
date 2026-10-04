import { desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { fail, mobileUser, ok } from "@/lib/mobile-api";

export async function GET(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in again.", 401);
  const orders = await db.select().from(s.orders)
    .where(or(eq(s.orders.userId, user.id), user.email ? sql`lower(${s.orders.email}) = ${user.email.toLowerCase()}` : sql`false`))
    .orderBy(desc(s.orders.createdAt)).limit(20);
  const items = orders.length ? await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, orders.map((o) => o.id))) : [];
  return ok({
    orders: orders.map((o) => ({
      id: o.id, number: o.number, status: o.status, paymentStatus: o.paymentStatus, totalKobo: o.totalKobo, createdAt: o.createdAt.toISOString(), deliveryDate: o.deliveryDate,
      items: items.filter((i) => i.orderId === o.id).map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`),
    })),
  });
}
