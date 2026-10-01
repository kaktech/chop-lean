import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { formatNaira } from "@/lib/money";
import { StatusSelect, STATUS_STYLE } from "@/components/admin/AdminBits";

export const metadata: Metadata = { title: "Orders and delivery" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && status in STATUS_STYLE ? status : null;
  const rows = await db.select({ o: s.orders, zone: s.deliveryZones.name }).from(s.orders).innerJoin(s.deliveryZones, eq(s.deliveryZones.id, s.orders.zoneId))
    .where(filter ? eq(s.orders.status, filter as "cooking") : undefined).orderBy(desc(s.orders.createdAt)).limit(100);
  const items = rows.length ? await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, rows.map((r) => r.o.id))) : [];
  return (
    <>
      <h1 className="mb-4 text-[34px] md:text-[40px]">Orders and delivery</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/orders" className={`tap flex items-center rounded-full border px-4 text-[13px] no-underline ${!filter ? "border-ink bg-ink text-white" : "border-line bg-surface text-fg"}`}>All</Link>
        {Object.entries(STATUS_STYLE).map(([k, [l]]) => <Link key={k} href={`/admin/orders?status=${k}`} className={`tap flex items-center rounded-full border px-4 text-[13px] no-underline ${filter === k ? "border-fg bg-ink text-white" : "border-line bg-surface text-fg"}`}>{l}</Link>)}
      </div>
      <section className="rounded-[24px] border border-line bg-surface p-5 md:p-6">
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="py-3">Order</th><th>Customer</th><th>Items</th><th>Deliver</th><th>Zone</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{rows.map(({ o, zone }) => <tr key={o.id} className="border-b border-line align-top last:border-0">
            <td className="py-3 font-bold"><Link href={`/order/${o.id}`} className="text-fg no-underline hover:underline">{o.number}</Link></td>
            <td>{o.firstName} {o.lastName}<br /><span className="text-xs text-muted">{o.phone}</span></td>
            <td className="max-w-[220px]">{items.filter((i) => i.orderId === o.id).map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}</td>
            <td className="text-muted">{o.deliveryDate}<br />{o.deliveryWindow.split(" (")[0]}</td><td className="text-muted">{zone.replace("Lagos ", "")}</td>
            <td className="capitalize text-muted">{o.paymentMethod === "pod" ? "On delivery" : o.paymentMethod ?? "–"}<br /><span className="text-xs">{o.paymentStatus.replace("_", " ")}</span></td>
            <td className="font-bold">{formatNaira(o.totalKobo)}</td><td><StatusSelect orderId={o.id} status={o.status} /></td></tr>)}
            {rows.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted">No orders.</td></tr>}</tbody></table></div>
      </section>
    </>
  );
}
