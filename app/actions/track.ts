"use server";
import { and, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

export type TrackState = { error?: string };

const schema = z.object({
  number: z.string().trim().toUpperCase().regex(/^(CL-)?\d{4,8}$/, "Enter your order number, e.g. CL-10482"),
  email: z.string().trim().toLowerCase().email("Enter the email you ordered with"),
});

/** Guests can open their order by order number + the email used. Same error either way so it can't be used to probe orders. */
export async function trackOrder(_prev: TrackState | null, fd: FormData): Promise<TrackState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`track:${ip}`, 10, 10 * 60_000)) return { error: "Too many attempts. Please try again in a few minutes." };
  const p = schema.safeParse({ number: fd.get("number"), email: fd.get("email") });
  if (!p.success) return { error: p.error.issues[0].message };
  const number = p.data.number.startsWith("CL-") ? p.data.number : `CL-${p.data.number}`;
  const [o] = await db.select({ id: orders.id }).from(orders).where(and(sql`${orders.number} = ${number}`, sql`lower(${orders.email}) = ${p.data.email}`)).limit(1);
  if (!o) return { error: "We couldn't find an order with that number and email." };
  redirect(`/order/${o.id}`);
}

export async function getProductsByIds(ids: string[]) {
  const { inArray, and: and2, eq } = await import("drizzle-orm");
  const { products } = await import("@/db/schema");
  const clean = ids.filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 60);
  if (!clean.length) return [];
  return db.select().from(products).where(and2(inArray(products.id, clean), eq(products.isLive, true)));
}
