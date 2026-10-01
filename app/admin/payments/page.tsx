import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { formatNaira } from "@/lib/money";
import { startOfLagosWeek } from "@/lib/admin-queries";
import { TransferActions } from "@/components/admin/AdminBits";

export const metadata: Metadata = { title: "Payments" };
const card = "rounded-[24px] border border-line bg-surface p-6";
const ago = (d: Date) => { const m = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} hr ago` : `${Math.round(m / 1440)} d ago`; };
const PILL: Record<string, [string, string, string]> = { paid: ["Paid", "#1F3A22", "#B6E39A"], awaiting_confirmation: ["Awaiting", "#3A2F14", "#F6D58A"], pending: ["Awaiting", "#3A2F14", "#F6D58A"], failed: ["Failed", "#4A2222", "#FFB4A8"] };
const METHOD: Record<string, string> = { card: "Card", transfer: "Transfer", pod: "On delivery" };

export default async function AdminPayments() {
  const week = startOfLagosWeek();
  const [[col], [await_], [fail], [pod]] = await Promise.all([
    db.select({ t: sql<number>`coalesce(sum(${s.payments.amountKobo}),0)::bigint` }).from(s.payments).where(and(eq(s.payments.status, "paid"), gte(s.payments.createdAt, week))),
    db.select({ n: sql<number>`count(*)::int` }).from(s.payments).where(and(eq(s.payments.method, "transfer"), eq(s.payments.status, "awaiting_confirmation"))),
    db.select({ n: sql<number>`count(*)::int` }).from(s.payments).where(eq(s.payments.status, "failed")),
    db.select({ n: sql<number>`count(*)::int` }).from(s.payments).where(and(eq(s.payments.method, "pod"), eq(s.payments.status, "pending"))),
  ]);
  const transfers = await db.select({ p: s.payments, o: s.orders }).from(s.payments).innerJoin(s.orders, eq(s.orders.id, s.payments.orderId)).where(and(eq(s.payments.method, "transfer"), eq(s.payments.status, "awaiting_confirmation"))).orderBy(desc(s.payments.createdAt));
  const all = await db.select({ p: s.payments, o: s.orders }).from(s.payments).innerJoin(s.orders, eq(s.orders.id, s.payments.orderId)).orderBy(desc(s.payments.createdAt)).limit(30);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[34px] md:text-[40px]">Payments</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Collected this week", formatNaira(Number(col.t))], ["Awaiting confirmation", String(await_.n)], ["Pay on delivery pending", String(pod.n)], ["Failed payments", String(fail.n)]].map(([l, v]) => <div key={l} className={card}><div className="text-sm text-muted">{l}</div><div className="mt-1.5 font-display text-[34px] font-bold">{v}</div></div>)}
      </div>

      <section className={card} aria-label="Transfers to confirm">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl">Transfers to confirm</h2><span className="text-[13px] text-muted">Confirming emails the customer and moves the order to Cooking</span></div>
        {transfers.length === 0 ? <p className="mt-4 text-muted">No transfers waiting. They appear here when a customer taps “I&apos;ve sent the money”.</p> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="py-3">Reference</th><th>Customer</th><th>Expected</th><th>Reported</th><th>Receipt</th><th /></tr></thead>
            <tbody>{transfers.map(({ p, o }) => <tr key={p.id} className="border-b border-line last:border-0"><td className="py-3 font-bold">{o.number}</td><td>{o.firstName} {o.lastName.charAt(0)}.</td><td className="font-bold">{formatNaira(p.amountKobo)}</td><td className="text-muted">{ago(p.createdAt)}</td><td>{p.receiptUrl ? <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-leaf underline">View receipt</a> : <span className="font-bold text-leaf underline">No receipt</span>}</td><td className="text-right"><TransferActions orderId={o.id} /></td></tr>)}</tbody></table></div>
        )}
      </section>

      <section className={card} aria-label="All payments">
        <h2 className="text-xl">All payments</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="py-3">Date</th><th>Reference</th><th>Customer</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{all.map(({ p, o }) => { const [l, bg, fg] = PILL[p.status] ?? PILL.pending; return <tr key={p.id} className="border-b border-line last:border-0"><td className="py-3 text-muted">{p.createdAt.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}</td><td className="font-bold"><Link href={`/order/${o.id}`} className="text-fg no-underline hover:underline">{o.number}</Link></td><td>{o.firstName} {o.lastName.charAt(0)}.</td><td>{METHOD[p.method]}</td><td className="font-bold">{formatNaira(p.amountKobo)}</td><td><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: bg, color: fg }}>{l}</span></td></tr>; })}
            {all.length === 0 && <tr><td colSpan={6} className="py-6 text-muted">No payments yet.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}
