"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import * as s from "@/db/schema";
import { auth } from "@/auth";
import { isPastPauseCutoff, nextWeekMonday } from "@/lib/lagos-time";

async function requireUser() {
  const session = await auth().catch(() => null);
  if (!session?.user?.id) throw new Error("Please sign in.");
  return session.user.id;
}

export async function logWeight(_prev: { ok: boolean; message: string } | null, formData: FormData) {
  const userId = await requireUser();
  const kg = z.coerce.number().min(30, "Enter a weight in kg").max(300, "Enter a weight in kg").safeParse(formData.get("kg"));
  if (!kg.success) return { ok: false, message: kg.error.issues[0].message };
  const today = new Date(Date.now() + 3600_000).toISOString().slice(0, 10); // Lagos date
  await db.insert(s.weightLogs).values({ userId, kg: kg.data, loggedOn: today }).onConflictDoUpdate({ target: [s.weightLogs.userId, s.weightLogs.loggedOn], set: { kg: kg.data } });
  revalidatePath("/account");
  return { ok: true, message: "Weigh-in saved." };
}

export async function pauseNextWeek(): Promise<{ ok: boolean; message: string }> {
  const userId = await requireUser();
  if (isPastPauseCutoff()) return { ok: false, message: "The Thursday 6pm cutoff has passed for next week. You can pause the week after." };
  const weekOf = nextWeekMonday();
  await db.insert(s.pausedWeeks).values({ userId, weekOf }).onConflictDoNothing();
  revalidatePath("/account");
  return { ok: true, message: "Next week is paused. No charge, no delivery." };
}

export async function resumeNextWeek(): Promise<{ ok: boolean; message: string }> {
  const userId = await requireUser();
  if (isPastPauseCutoff()) return { ok: false, message: "The Thursday 6pm cutoff has passed, so this week can't change." };
  await db.delete(s.pausedWeeks).where(and(eq(s.pausedWeeks.userId, userId), eq(s.pausedWeeks.weekOf, nextWeekMonday())));
  revalidatePath("/account");
  return { ok: true, message: "Welcome back. Next week is on." };
}

/** Returns the current catalogue data for an old order, ready to drop into the cart. */
export async function reorderLines(orderId: string) {
  const userId = await requireUser();
  const [order] = await db.select().from(s.orders).where(and(eq(s.orders.id, orderId), eq(s.orders.userId, userId))).limit(1);
  if (!order) return [];
  const items = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
  const ids = items.map((i) => i.productId).filter((x): x is string => !!x);
  if (!ids.length) return [];
  const prods = await db.select().from(s.products).where(and(inArray(s.products.id, ids), eq(s.products.isLive, true)));
  return items.flatMap((i) => {
    const p = prods.find((x) => x.id === i.productId);
    if (!p) return [];
    return [{ productId: p.id, slug: p.slug, type: p.type, name: p.name, image: p.image ?? "meal-box.jpg", unitKobo: i.unitPriceKobo, qty: i.qty, options: { ...(i.options as object), firstDelivery: undefined, subscribe: undefined } }];
  });
}

export async function setPassword(_prev: { ok: boolean; message: string } | null, fd: FormData): Promise<{ ok: boolean; message: string }> {
  const userId = await requireUser();
  const { hashPassword, passwordProblem, verifyPassword } = await import("@/lib/password");
  const next = String(fd.get("newPassword") ?? "");
  const current = String(fd.get("currentPassword") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { ok: false, message: problem };
  const [user] = await db.select().from(s.users).where(eq(s.users.id, userId)).limit(1);
  if (user?.passwordHash && !(await verifyPassword(current, user.passwordHash))) return { ok: false, message: "Your current password isn't right." };
  await db.update(s.users).set({ passwordHash: await hashPassword(next) }).where(eq(s.users.id, userId));
  return { ok: true, message: user?.passwordHash ? "Password changed." : "Password added. You can now sign in with it." };
}
