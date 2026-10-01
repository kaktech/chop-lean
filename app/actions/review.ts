"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders, products, reviews } from "@/db/schema";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Choose a star rating").max(5),
  body: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1500),
  fullness: z.coerce.number().int().min(1).max(5).default(3),
  pepper: z.coerce.number().int().min(1).max(5).default(3),
  weightChange: z.string().trim().max(80).optional().transform((v) => v || null),
  name: z.string().trim().min(2, "Add your name").max(60),
  orderNumber: z.string().trim().toUpperCase().max(20).optional().transform((v) => v || null),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email")]).optional().transform((v) => v || null),
});

export type ReviewResult = { ok: boolean; message: string; errors?: Record<string, string> };

export async function submitReview(_prev: ReviewResult | null, formData: FormData): Promise<ReviewResult> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`review:${ip}`, 3, 10 * 60_000)) return { ok: false, message: "Too many reviews from this connection. Try again later." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: Object.values(errors)[0], errors };
  }
  const d = parsed.data;

  // Verified = the order ID and email match an order that contained this product.
  let verified = false;
  let orderId: string | null = null;
  if (d.orderNumber && d.email) {
    const [o] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.number, d.orderNumber), sql`lower(${orders.email}) = ${d.email}`, eq(orderItems.productId, d.productId)))
      .limit(1);
    if (o) { verified = true; orderId = o.id; }
  }

  const session = await auth().catch(() => null);
  const [prod] = await db.select({ slug: products.slug, type: products.type }).from(products).where(eq(products.id, d.productId)).limit(1);
  if (!prod) return { ok: false, message: "That product no longer exists." };

  await db.insert(reviews).values({
    productId: d.productId, userId: session?.user?.id ?? null, orderId, rating: d.rating, body: d.body,
    fullness: d.fullness, pepper: d.pepper, weightChange: d.weightChange, name: d.name, email: d.email ?? session?.user?.email ?? "", verified,
  });
  revalidatePath(`/${prod.type === "plan" ? "plans" : "meals"}/${prod.slug}`);
  return { ok: true, message: verified ? "Thanks! Your verified review is live." : "Thanks! Your review is live." };
}
