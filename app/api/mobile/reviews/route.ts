import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";
import { fail, mobileUser, ok } from "@/lib/mobile-api";

const body = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1, "Choose a star rating").max(5),
  body: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1500),
  name: z.string().trim().min(2, "Add your name").max(60).optional(),
});

/** Posts a review as the signed-in customer. It is marked Verified when they have an order containing the product. */
export async function POST(req: Request) {
  const user = await mobileUser(req);
  if (!user) return fail("Please sign in to write a review.", 401);
  if (!rateLimit(`m-review:${user.id}`, 3, 10 * 60_000)) return fail("Too many reviews. Try again in a few minutes.", 429);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check your review and try again.");
  const d = parsed.data;

  const email = user.email ?? "";
  const [bought] = email
    ? await db.select({ id: s.orders.id }).from(s.orders).innerJoin(s.orderItems, eq(s.orderItems.orderId, s.orders.id))
        .where(and(sql`lower(${s.orders.email}) = ${email.toLowerCase()}`, eq(s.orderItems.productId, d.productId))).limit(1)
    : [];
  await db.insert(s.reviews).values({
    productId: d.productId, userId: user.id, orderId: bought?.id ?? null, rating: d.rating, body: d.body,
    name: d.name ?? user.name ?? email.split("@")[0] ?? "Customer", email, verified: !!bought,
  });
  return ok({ ok: true, verified: !!bought });
}
