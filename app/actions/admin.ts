"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { markOrderPaid } from "@/lib/payments";
import { notifyStatusChange } from "@/lib/notify";

type R = { ok: boolean; message: string };
const STATUSES = ["pending_payment", "cooking", "out_for_delivery", "delivered", "cancelled"] as const;

export async function updateOrderStatus(orderId: string, status: string): Promise<R> {
  await requireAdmin();
  const st = z.enum(STATUSES).safeParse(status);
  if (!st.success) return { ok: false, message: "Unknown status." };
  const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId)).limit(1);
  if (!order) return { ok: false, message: "Order not found." };
  await db.update(s.orders).set({ status: st.data }).where(eq(s.orders.id, orderId));
  // Pay-on-delivery is settled when the rider hands over the food.
  if (st.data === "delivered" && order.paymentMethod === "pod" && order.paymentStatus !== "paid") {
    await db.update(s.orders).set({ paymentStatus: "paid" }).where(eq(s.orders.id, orderId));
    await db.update(s.payments).set({ status: "paid" }).where(and(eq(s.payments.orderId, orderId), eq(s.payments.method, "pod")));
  }
  await notifyStatusChange(orderId, st.data);
  revalidatePath("/admin", "layout");
  return { ok: true, message: `Order ${order.number} marked ${st.data.replace(/_/g, " ")}. Customer emailed.` };
}

export async function confirmTransfer(orderId: string): Promise<R> {
  await requireAdmin();
  const r = await markOrderPaid(orderId, { notify: "confirmed" });
  revalidatePath("/admin", "layout");
  return r.ok ? { ok: true, message: "Payment confirmed. Order moved to Cooking and customer emailed." } : { ok: false, message: "Order not found." };
}

export async function rejectTransfer(orderId: string): Promise<R> {
  await requireAdmin();
  await db.update(s.orders).set({ paymentStatus: "pending" }).where(eq(s.orders.id, orderId));
  await db.update(s.payments).set({ status: "failed" }).where(and(eq(s.payments.orderId, orderId), eq(s.payments.method, "transfer")));
  await notifyStatusChange(orderId, "pending_payment");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Marked as not received. Customer emailed." };
}

/* ---------- Products ---------- */

const productSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["plan", "meal", "drink"]),
  name: z.string().trim().min(2).max(80),
  priceNaira: z.coerce.number().min(0).max(10_000_000),
  compareAtNaira: z.coerce.number().min(0).max(10_000_000).optional(),
  kcal: z.coerce.number().int().min(0).max(5000).optional(),
  weeklySlots: z.coerce.number().int().min(0).max(100_000).optional(),
  tags: z.string().max(200).optional(),
  slot: z.string().max(20).optional(),
  description: z.string().max(400).optional(),
});

const slugify = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const blank = (v: FormDataEntryValue | null) => (v === null || v === "" ? undefined : v);

export async function saveProduct(_prev: R | null, fd: FormData): Promise<R> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    id: blank(fd.get("id")), type: fd.get("type"), name: fd.get("name"), priceNaira: fd.get("priceNaira"), compareAtNaira: blank(fd.get("compareAtNaira")),
    kcal: blank(fd.get("kcal")), weeklySlots: blank(fd.get("weeklySlots")), tags: blank(fd.get("tags")), slot: blank(fd.get("slot")), description: blank(fd.get("description")),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`)[0] };
  const d = parsed.data;

  let image: string | undefined;
  const file = fd.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, message: "Photo must be JPG, PNG or WebP." };
    if (file.size > 4 * 1024 * 1024) return { ok: false, message: "Photo must be under 4MB." };
    if (!process.env.BLOB_READ_WRITE_TOKEN) return { ok: false, message: "Photo uploads need BLOB_READ_WRITE_TOKEN (see README). Save without a photo, or add the token." };
    const blob = await put(`products/${slugify(d.name)}-${Date.now()}.${file.type.split("/")[1]}`, file, { access: "public" });
    image = blob.url;
  }

  const values = {
    type: d.type, name: d.name, description: d.description ?? null, priceKobo: Math.round(d.priceNaira * 100),
    compareAtKobo: d.compareAtNaira ? Math.round(d.compareAtNaira * 100) : null, kcal: d.kcal ?? null, weeklySlots: d.weeklySlots ?? null,
    tags: (d.tags ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean), slot: d.slot ?? null, ...(image ? { image } : {}),
  };
  if (d.id) {
    await db.update(s.products).set(values).where(eq(s.products.id, d.id));
  } else {
    let slug = slugify(d.name), n = 1;
    while ((await db.select({ id: s.products.id }).from(s.products).where(eq(s.products.slug, slug)).limit(1)).length) slug = `${slugify(d.name)}-${++n}`;
    await db.insert(s.products).values({ ...values, slug, image: image ?? "meal-box.jpg", ...(d.type === "plan" ? { mealsPerDay: 3, daysPerWeek: 5 } : {}) });
  }
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true, message: d.id ? "Changes saved." : "Product created." };
}

export async function toggleLive(productId: string, live: boolean): Promise<R> {
  await requireAdmin();
  await db.update(s.products).set({ isLive: live }).where(eq(s.products.id, productId));
  revalidatePath("/admin/products"); revalidatePath("/shop"); revalidatePath("/");
  return { ok: true, message: live ? "Product is live." : "Product hidden from the store." };
}

export async function setInventoryLock(locked: boolean): Promise<R> {
  await requireAdmin();
  const cur = (await db.select().from(s.storeSettings).where(eq(s.storeSettings.id, 1)).limit(1))[0];
  const setup = { ...(cur?.setup ?? {}), lockInventory: locked };
  await db.insert(s.storeSettings).values({ id: 1, setup }).onConflictDoUpdate({ target: s.storeSettings.id, set: { setup } });
  revalidatePath("/admin/products");
  return { ok: true, message: locked ? "Inventory locked: plans sell out when their weekly slots are full." : "Inventory unlocked." };
}

export async function resetWeeklySlots(): Promise<R> {
  await requireAdmin();
  await db.update(s.products).set({ slotsTaken: 0 });
  revalidatePath("/admin/products");
  return { ok: true, message: "Weekly slot counts reset." };
}

/* ---------- Settings ---------- */

const bankSchema = z.object({ bankName: z.string().trim().min(2).max(60), accountNumber: z.string().trim().regex(/^\d{10}$/, "Account number must be 10 digits"), accountName: z.string().trim().min(2).max(80) });

export async function saveBankDetails(_prev: R | null, fd: FormData): Promise<R> {
  await requireAdmin();
  const p = bankSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const cur = (await db.select().from(s.storeSettings).where(eq(s.storeSettings.id, 1)).limit(1))[0];
  const setup = { ...(cur?.setup ?? {}), bank: true };
  await db.insert(s.storeSettings).values({ id: 1, ...p.data, setup }).onConflictDoUpdate({ target: s.storeSettings.id, set: { ...p.data, setup } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Bank details saved. They now appear on the transfer page and in emails." };
}

/* ---------- Weekly menu ---------- */

const menuSchema = z.object({ weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), items: z.array(z.object({ day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri"]), slot: z.enum(["breakfast", "lunch", "dinner"]), mealId: z.string().uuid() })).max(15) });

export async function saveWeeklyMenu(input: unknown): Promise<R> {
  await requireAdmin();
  const p = menuSchema.safeParse(input);
  if (!p.success) return { ok: false, message: "Pick a dish for every slot." };
  if (new Date(p.data.weekOf + "T12:00:00Z").getUTCDay() !== 1) return { ok: false, message: "Week must start on a Monday." };
  const [menu] = await db.insert(s.weeklyMenus).values({ weekOf: p.data.weekOf }).onConflictDoUpdate({ target: s.weeklyMenus.weekOf, set: { weekOf: p.data.weekOf } }).returning({ id: s.weeklyMenus.id });
  await db.delete(s.weeklyMenuItems).where(eq(s.weeklyMenuItems.menuId, menu.id));
  if (p.data.items.length) await db.insert(s.weeklyMenuItems).values(p.data.items.map((i) => ({ menuId: menu.id, ...i })));
  revalidatePath("/admin/menu"); revalidatePath("/plans", "layout");
  return { ok: true, message: "Weekly menu saved." };
}

