import "server-only";
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { describeDate, nextDeliveryDates, nextWeekMonday, toISODate, type LagosDate } from "@/lib/lagos-time";

export const startOfLagosWeek = () => {
  const w = new Date(Date.now() + 3600_000);
  const dow = w.getUTCDay() || 7;
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate() - (dow - 1)) - 3600_000);
};

const isPlanName = (n: string) => /plan|lean|smart|cut|owambe/i.test(n);
const weekdayName = (d: LagosDate) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay()];
/** Menu days cooked for a delivery weekday: Mon covers Mon+Tue, Wed covers Wed+Thu, Fri covers Fri. */
const COVERS: Record<string, string[]> = { Mon: ["Mon", "Tue"], Wed: ["Wed", "Thu"], Fri: ["Fri"] };
const SLOTS_FOR = (mealsPerDay: number) => (mealsPerDay >= 3 ? ["breakfast", "lunch", "dinner"] : mealsPerDay === 2 ? ["lunch", "dinner"] : ["lunch"]);

export async function getDashboard() {
  const weekStart = startOfLagosWeek();
  const [paidWeek] = await db.select({ total: sql<number>`coalesce(sum(${s.orders.totalKobo}),0)::bigint`, n: sql<number>`count(*)::int` }).from(s.orders).where(and(eq(s.orders.paymentStatus, "paid"), gte(s.orders.createdAt, weekStart)));
  const [awaiting] = await db.select({ n: sql<number>`count(*)::int` }).from(s.orders).where(and(eq(s.orders.paymentMethod, "transfer"), inArray(s.orders.paymentStatus, ["pending", "awaiting_confirmation"]), ne(s.orders.status, "cancelled")));
  const [paidAll] = await db.select({ n: sql<number>`count(*)::int` }).from(s.orders).where(eq(s.orders.paymentStatus, "paid"));
  const [paused] = await db.select({ n: sql<number>`count(*)::int` }).from(s.pausedWeeks).where(eq(s.pausedWeeks.weekOf, nextWeekMonday()));

  const live = await db.select({ o: s.orders, i: s.orderItems }).from(s.orders).innerJoin(s.orderItems, eq(s.orderItems.orderId, s.orders.id))
    .where(and(ne(s.orders.status, "cancelled"), gte(s.orders.createdAt, new Date(Date.now() - 30 * 86400_000))));
  const planRows = live.filter((r) => isPlanName(r.i.name));
  const subscribers = new Set(planRows.map((r) => r.o.email.toLowerCase())).size;

  // Plan mix
  const mixMap = new Map<string, number>();
  for (const r of planRows) mixMap.set(r.i.name, (mixMap.get(r.i.name) ?? 0) + 1);
  const mix = [...mixMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Kitchen prep list for the next delivery day
  const nextDay = nextDeliveryDates(new Date(), 1)[0];
  const prep = new Map<string, { name: string; qty: number; kcal: number | null; notes: Map<string, number> }>();
  let totalMeals = 0;
  if (nextDay) {
    const target = toISODate(nextDay);
    const covered = COVERS[weekdayName(nextDay)] ?? [];
    const [menu] = await db.select().from(s.weeklyMenus).where(sql`${s.weeklyMenus.weekOf} <= ${target}`).orderBy(desc(s.weeklyMenus.weekOf)).limit(1);
    const menuItems = menu ? await db.select({ day: s.weeklyMenuItems.day, slot: s.weeklyMenuItems.slot, m: s.products }).from(s.weeklyMenuItems).innerJoin(s.products, eq(s.products.id, s.weeklyMenuItems.mealId)).where(eq(s.weeklyMenuItems.menuId, menu.id)) : [];
    const meals = await db.select().from(s.products).where(eq(s.products.type, "meal"));
    const add = (id: string, name: string, kcal: number | null, qty: number, note?: string) => {
      const row = prep.get(id) ?? { name, qty: 0, kcal, notes: new Map<string, number>() };
      row.qty += qty; totalMeals += qty;
      if (note) row.notes.set(note, (row.notes.get(note) ?? 0) + 1);
      prep.set(id, row);
    };
    for (const r of planRows) {
      const o = r.o;
      const first = new Date(o.deliveryDate + "T12:00:00Z").getTime();
      const weeks = Math.max(1, r.i.qty);
      const active = first <= new Date(target + "T12:00:00Z").getTime() + 86400_000 && new Date(target + "T12:00:00Z").getTime() < first + weeks * 7 * 86400_000;
      if (!active) continue;
      const opts = r.i.options as { mealsPerDay?: number; exclusions?: string; swaps?: Record<string, string> };
      const slots = SLOTS_FOR(opts.mealsPerDay ?? 3);
      for (const day of covered) for (const slot of slots) {
        const base = menuItems.find((m) => m.day === day && m.slot === slot);
        if (!base) continue;
        const swapId = opts.swaps?.[`${day}-${slot}`];
        const dish = (swapId && meals.find((m) => m.id === swapId)) || base.m;
        add(dish.id, dish.name, dish.kcal, 1, opts.exclusions?.trim().toLowerCase() || undefined);
      }
    }
    // Single meals and drinks ordered for that day
    const singles = await db.select({ o: s.orders, i: s.orderItems }).from(s.orders).innerJoin(s.orderItems, eq(s.orderItems.orderId, s.orders.id)).where(and(eq(s.orders.deliveryDate, target), ne(s.orders.status, "cancelled")));
    for (const r of singles) if (!isPlanName(r.i.name) && r.i.productId) add(r.i.productId, r.i.name, null, r.i.qty);
  }

  const recent = await db.select({ o: s.orders, zone: s.deliveryZones.name }).from(s.orders).innerJoin(s.deliveryZones, eq(s.deliveryZones.id, s.orders.zoneId)).orderBy(desc(s.orders.createdAt)).limit(8);
  const recentItems = recent.length ? await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, recent.map((r) => r.o.id))) : [];

  return {
    revenueKobo: Number(paidWeek.total), paidThisWeek: paidWeek.n, subscribers, paused: paused.n, awaiting: awaiting.n, paidAll: paidAll.n,
    mealsToCook: totalMeals, dishCount: prep.size, nextDay: nextDay ? { label: `${describeDate(nextDay).dow} ${nextDay.d} ${describeDate(nextDay).month.slice(0, 3)}`, dow: describeDate(nextDay).dow } : null,
    prep: [...prep.values()].sort((a, b) => b.qty - a.qty).map((p) => ({ name: p.name, qty: p.qty, kcal: p.kcal, notes: [...p.notes.entries()].slice(0, 2).map(([n, c]) => `${c} × ${n}`) })),
    mix, recent: recent.map((r) => ({ id: r.o.id, number: r.o.number, customer: `${r.o.firstName} ${r.o.lastName.charAt(0)}.`, plan: recentItems.filter((i) => i.orderId === r.o.id).map((i) => i.name).join(", "), zone: r.zone.replace("Lagos ", ""), payment: r.o.paymentMethod ?? "–", totalKobo: r.o.totalKobo, status: r.o.status })),
  };
}
