import Link from "next/link";
import { getDashboard } from "@/lib/admin-queries";
import { getSettings } from "@/lib/admin";
import { db } from "@/db";
import { deliveryZones, products } from "@/db/schema";
import { sql } from "drizzle-orm";
import { formatNaira } from "@/lib/money";
import { PrintButton, StatusSelect } from "@/components/admin/AdminBits";
import { paystackConfigured } from "@/lib/paystack";

const card = "rounded-[22px] border border-line bg-surface p-6";

export default async function AdminDashboard() {
  const [d, settings, [{ plans }], [{ zones }]] = await Promise.all([
    getDashboard(), getSettings(),
    db.select({ plans: sql<number>`count(*)::int` }).from(products).where(sql`${products.type} = 'plan'`),
    db.select({ zones: sql<number>`count(*)::int` }).from(deliveryZones),
  ]);
  const checklist = [
    ["Add plans and meals", plans > 0, "/admin/products"],
    ["Set delivery zones", zones > 0, "/admin/settings"],
    ["Add bank details", !!(settings.bankName && settings.accountNumber), "/admin/settings"],
    ["Connect Paystack", paystackConfigured(), "/admin/settings"],
    ["Connect Mailgun", !!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN, "/admin/settings"],
  ] as const;
  const pct = Math.round((checklist.filter((c) => c[1]).length / checklist.length) * 100);
  const maxMix = Math.max(1, ...d.mix.map((m) => m[1]));
  const circ = 2 * Math.PI * 46;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3"><h1 className="text-[34px] md:text-[40px]">Dashboard</h1>
        <Link href="/admin/products" className="cl-btn tap flex items-center rounded-xl bg-green px-5 text-sm font-bold text-white no-underline">+ Add product</Link></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Revenue this week", formatNaira(d.revenueKobo), `${d.paidThisWeek} paid orders`], ["Active subscribers", String(d.subscribers), `${d.paused} paused next week`], [`Meals to cook ${d.nextDay?.dow ?? ""}`, String(d.mealsToCook), `Across ${d.dishCount} dishes`], ["Awaiting payment", String(d.awaiting), "Bank transfer, not yet confirmed"]].map(([l, v, sub]) => (
          <div key={l} className={card}><div className="text-sm text-muted">{l}</div><div className="mt-2 font-display text-[34px] font-bold tracking-tight">{v}</div><div className="text-[13px] text-muted">{sub}</div></div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className={`${card} flex items-center gap-6`}>
          <div className="relative size-[104px] shrink-0">
            <svg viewBox="0 0 104 104" className="size-full -rotate-90" aria-hidden><circle cx="52" cy="52" r="46" fill="none" stroke="#EDE8D8" strokeWidth="9" /><circle cx="52" cy="52" r="46" fill="none" stroke="#3D6B1F" strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} /></svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold">{pct}%</span>
          </div>
          <div><h2 className="text-lg">Store setup</h2>
            <ul className="mt-1 text-[13px]">{checklist.map(([l, done, href]) => <li key={l}>{done ? <span className="text-muted line-through">✓ {l}</span> : <Link href={href} className="font-bold text-leaf underline">○ {l}</Link>}</li>)}</ul></div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between"><h2 className="text-lg">Storefront theme</h2><Link href="/" className="text-[13px] font-bold text-leaf underline">View store</Link></div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="overflow-hidden rounded-xl border-2 border-green"><div className="flex h-12"><span className="flex-1 bg-canvas" /><span className="flex-1 bg-green" /></div><div className="flex justify-between px-2.5 py-1.5"><b>Editorial Green</b><span className="text-leaf">Live</span></div></div>
            <div className="overflow-hidden rounded-xl border border-line opacity-60"><div className="flex h-12"><span className="flex-1 bg-ink" /><span className="flex-1 bg-yellow" /></div><div className="flex justify-between px-2.5 py-1.5"><b>Night Market</b><span>Soon</span></div></div>
          </div>
        </div>
        <div className="rounded-[22px] bg-ink p-6 text-white">
          <h2 className="text-lg">First 100 orders challenge</h2>
          <p className="mt-2 text-sm text-[#B9BDB4]">Reach 100 paid orders to unlock a free month of featured placement.</p>
          <div className="mt-6 flex justify-between text-[11px] font-bold uppercase tracking-[0.12em]"><span className="text-[#B9BDB4]">Progress</span><span>{d.paidAll} / 100</span></div>
          <div className="mt-2 h-2.5 rounded-full bg-white/15"><div className="h-full rounded-full bg-yellow" style={{ width: `${Math.min(100, d.paidAll)}%` }} /></div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className={card} aria-label="Kitchen prep list">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl">Kitchen prep list{d.nextDay ? ` · ${d.nextDay.label}` : ""}</h2><PrintButton>Print labels</PrintButton></div>
          {d.prep.length === 0 ? <p className="mt-4 text-muted">Nothing to cook yet. Orders for the next delivery day will list their dishes here.</p> : (
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="py-3">Dish</th><th>Qty</th><th>Calories</th><th>Allergy notes</th></tr></thead>
              <tbody>{d.prep.map((p) => <tr key={p.name} className="border-b border-line last:border-0"><td className="py-3.5 pr-3">{p.name}</td><td className="font-display text-lg font-bold">{p.qty}</td><td className="text-muted">{p.kcal ? `${p.kcal} kcal` : "–"}</td><td className="text-muted">{p.notes.join(", ") || "–"}</td></tr>)}</tbody></table></div>
          )}
          <p className="mt-3 text-xs text-muted">Counts active plan orders against the weekly menu (Mon delivery covers Mon+Tue, Wed covers Wed+Thu, Fri covers Fri), with each customer&apos;s swaps applied, plus single meals ordered for that day.</p>
        </section>
        <section className={card} aria-label="Plans by subscribers">
          <h2 className="text-xl">Plans by subscribers</h2>
          {d.mix.length === 0 ? <p className="mt-4 text-muted">No plan orders yet.</p> : (
            <ul className="mt-4 flex flex-col gap-3">{d.mix.map(([n, c]) => <li key={n}><div className="flex justify-between text-sm"><span>{n}</span><b>{c}</b></div><div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-green" style={{ width: `${(c / maxMix) * 100}%` }} /></div></li>)}</ul>
          )}
        </section>
      </div>

      <section className={card} aria-label="Recent orders">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl">Recent orders</h2><span className="text-[13px] text-muted">Changing a status emails the customer</span></div>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="py-3">Order</th><th>Customer</th><th>Plan</th><th>Zone</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{d.recent.map((o) => <tr key={o.id} className="border-b border-line last:border-0"><td className="py-3 font-bold"><Link href={`/order/${o.id}`} className="text-fg no-underline hover:underline">{o.number}</Link></td><td>{o.customer}</td><td className="max-w-[200px] truncate">{o.plan}</td><td className="text-muted">{o.zone}</td><td className="capitalize text-muted">{o.payment === "pod" ? "On delivery" : o.payment}</td><td className="font-bold">{formatNaira(o.totalKobo)}</td><td><StatusSelect orderId={o.id} status={o.status} /></td></tr>)}
            {d.recent.length === 0 && <tr><td colSpan={7} className="py-6 text-muted">No orders yet.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}
