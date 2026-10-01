import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { MenuBuilder } from "@/components/admin/MenuBuilder";
import { nextWeekMonday } from "@/lib/lagos-time";

export const metadata: Metadata = { title: "Weekly menu" };

export default async function AdminMenu() {
  const [menus, meals, items] = await Promise.all([
    db.select().from(s.weeklyMenus).orderBy(asc(s.weeklyMenus.weekOf)),
    db.select().from(s.products).where(eq(s.products.type, "meal")).orderBy(asc(s.products.name)),
    db.select({ weekOf: s.weeklyMenus.weekOf, day: s.weeklyMenuItems.day, slot: s.weeklyMenuItems.slot, mealId: s.weeklyMenuItems.mealId }).from(s.weeklyMenuItems).innerJoin(s.weeklyMenus, eq(s.weeklyMenus.id, s.weeklyMenuItems.menuId)),
  ]);
  // Offer existing weeks plus the next six Mondays so a new week can be built from scratch.
  const mondays = Array.from({ length: 6 }, (_, i) => { const d = new Date(nextWeekMonday() + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 7 * i); return d.toISOString().slice(0, 10); });
  const weeks = [...new Set([...menus.map((m) => m.weekOf), ...mondays])].sort();
  const initial: Record<string, Record<string, string>> = {};
  for (const i of items) (initial[i.weekOf] ??= {})[`${i.day}-${i.slot}`] = i.mealId;
  return (
    <>
      <h1 className="text-[34px] md:text-[40px]">Weekly menu</h1>
      <p className="mb-5 mt-1 text-muted">Choose the dish for every slot. Customers see this on plan pages and can swap for similar-calorie dishes.</p>
      <MenuBuilder weeks={weeks} meals={meals.map((m) => ({ id: m.id, name: m.name, kcal: m.kcal, slot: m.slot }))} initial={initial} />
    </>
  );
}
