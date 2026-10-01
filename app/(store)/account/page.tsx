import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { auth, signOut } from "@/auth";
import { formatNaira } from "@/lib/money";
import { describeDate, isPastPauseCutoff, nextDeliveryDates, nextWeekMonday } from "@/lib/lagos-time";
import { PasswordForm, PauseButton, ReorderButton, SyncQuiz, WeightChart, WeightForm, type WeightPoint } from "@/components/account/AccountClient";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

const PILL: Record<string, [string, string, string]> = {
  pending_payment: ["Pending payment", "#3A2F14", "#F6D58A"],
  cooking: ["Cooking", "#232A55", "#C5CBFF"],
  out_for_delivery: ["Out for delivery", "#4A2222", "#FFB4A8"],
  delivered: ["Delivered", "#1F3A22", "#B6E39A"],
  cancelled: ["Cancelled", "#2A332E", "#C8D0CA"],
};

export default async function AccountPage() {
  const session = await auth().catch(() => null);
  const user = session?.user;
  if (!user?.id) redirect("/signin?callbackUrl=/account");
  const uid = user.id;

  const [dbUser] = await db.select({ pw: s.users.passwordHash }).from(s.users).where(eq(s.users.id, uid)).limit(1);
  const hasPassword = !!dbUser?.pw;
  const [profile] = await db.select().from(s.profiles).where(eq(s.profiles.userId, uid)).limit(1);
  const orders = await db.select().from(s.orders).where(or(eq(s.orders.userId, uid), user.email ? sql`lower(${s.orders.email}) = ${user.email.toLowerCase()}` : sql`false`)).orderBy(desc(s.orders.createdAt)).limit(20);
  const orderIds = orders.map((o) => o.id);
  const items = orderIds.length ? await db.select().from(s.orderItems).where(inArray(s.orderItems.orderId, orderIds)) : [];
  const logs = await db.select().from(s.weightLogs).where(eq(s.weightLogs.userId, uid)).orderBy(asc(s.weightLogs.loggedOn));
  const paused = (await db.select().from(s.pausedWeeks).where(and(eq(s.pausedWeeks.userId, uid), eq(s.pausedWeeks.weekOf, nextWeekMonday()))).limit(1)).length > 0;

  const activeOrder = orders.find((o) => o.status !== "cancelled" && (o.paymentStatus === "paid" || o.paymentMethod === "pod" || o.paymentStatus === "awaiting_confirmation") && items.some((i) => i.orderId === o.id && /plan|lean|smart|cut|owambe/i.test(i.name)));
  const activePlan = activeOrder ? items.find((i) => i.orderId === activeOrder.id && /plan|lean|smart|cut|owambe/i.test(i.name)) : null;
  const next = nextDeliveryDates(new Date(), 1)[0];
  const nextLabel = next ? `${describeDate(next).short}` : "";

  const first = logs[0]?.kg ?? profile?.startWeightKg ?? null;
  const points: WeightPoint[] = logs.slice(-8).map((l, i, arr) => ({ label: `Wk ${logs.length - arr.length + i + 1}`, kg: l.kg, pace: first ? +(first - 0.5 * (logs.length - arr.length + i)).toFixed(1) : l.kg }));
  const latest = logs.at(-1)?.kg ?? null;
  const lost = first != null && latest != null ? +(first - latest).toFixed(1) : null;
  const emailName = (user.email ?? "").split("@")[0].replace(/[._+\d]+/g, " ").trim().split(" ")[0];
  const displayName = user.name ?? user.email ?? "You";
  const firstName = (user.name ?? (emailName ? emailName.charAt(0).toUpperCase() + emailName.slice(1) : "there")).split(" ")[0];
  const initial = firstName.charAt(0).toUpperCase();

  const nav = [["Overview", "#overview"], ["My plan and menu", "#plan"], ["Weight tracker", "#weight"], ["Orders", "#orders"], ["Dietary preferences", "#preferences"], ["Password", "#security"]];
  const card = "rounded-[26px] border border-line bg-surface p-6 md:p-7";

  return (
    <div className="container-x grid gap-8 py-8 md:py-12 lg:grid-cols-[296px_1fr]">
      <SyncQuiz />
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center gap-4">
          <span className="flex size-[52px] items-center justify-center rounded-full bg-tint-red font-display text-xl font-bold">{initial}</span>
          <div><b className="block break-all font-display">{displayName}</b><span className="text-[13px] text-muted">{user.image ? "Signed in with Google" : "Signed in with email"}</span></div>
        </div>
        <nav aria-label="Account" className="mt-6 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {nav.map(([l, h], i) => <a key={l} href={h} className={`flex min-h-11 shrink-0 items-center rounded-xl px-4 text-[15px] no-underline ${i === 0 ? "bg-ink font-medium text-white" : "text-fg hover:bg-surface"}`}>{l}</a>)}
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className="flex min-h-11 w-full shrink-0 items-center rounded-xl px-4 text-left text-[15px] hover:bg-surface">Log out</button></form>
        </nav>
      </aside>

      <div className="min-w-0">
        <h1 id="overview" className="text-[34px] tracking-[-0.03em] md:text-[48px]">Welcome back, {firstName}</h1>

        <div className="mt-6 grid gap-5 md:grid-cols-2" id="plan">
          <section className="relative overflow-hidden rounded-[26px] bg-green p-7 text-white" aria-label="Active plan">
            <span className="label-sm text-[11px] tracking-[0.16em] text-yellow">Active plan</span>
            {activePlan ? (
              <>
                <h2 className="mt-3 text-[28px]">{activePlan.name}</h2>
                <p className="mt-2 text-sm text-mint">{paused ? <b className="text-white">Next week is paused.</b> : <>Next delivery: <b className="text-white">{nextLabel}{activeOrder ? `, ${activeOrder.deliveryWindow.split(" (")[0]}` : ""}</b></>}{activeOrder && f(activeOrder.address)}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href={`/plans/${slugFor(activePlan.name)}#menu`} className="cl-btn tap flex items-center rounded-full bg-yellow px-5 text-[13px] font-bold text-canvas no-underline">Swap meals</Link>
                  <PauseButton paused={paused} locked={isPastPauseCutoff()} />
                </div>
                <p className="mt-3 text-xs text-mint">Pause or skip before Thursday 6pm.</p>
              </>
            ) : (
              <>
                <h2 className="mt-3 text-[28px]">No active plan yet</h2>
                <p className="mt-2 text-sm text-mint">Take the 2-minute quiz and we&apos;ll match you to a plan.</p>
                <Link href="/quiz" className="cl-btn mt-5 inline-flex min-h-11 items-center rounded-full bg-yellow px-5 text-[13px] font-bold text-canvas no-underline">Find my plan</Link>
              </>
            )}
          </section>

          <section className={card} id="weight" aria-label="Log weight">
            <div className="label-sm text-[11px] text-muted">Log this week&apos;s weight</div>
            <div className="mt-3"><WeightForm latest={latest} /></div>
            <p className="mt-2 text-[13px] text-muted">Weigh yourself on the same day each week, in the morning before breakfast.</p>
          </section>
        </div>

        <section className={`${card} mt-5`} aria-label="Weight tracker">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">Weight tracker</h2>
            {lost != null && <span className="text-sm text-muted"><b className="text-leaf">{lost > 0 ? "−" : "+"}{Math.abs(lost)} kg</b> since you started{profile?.goalWeightKg ? ` · goal ${profile.goalWeightKg} kg` : ""}</span>}
          </div>
          <div className="mt-4"><WeightChart data={points} goal={profile?.goalWeightKg ?? null} /></div>
          <p className="mt-2 text-xs text-muted">The dashed line is the pace your plan aims for (about 0.5 kg per week).</p>
        </section>

        <section className={`${card} mt-5`} id="orders" aria-label="Order history">
          <h2 className="text-2xl">Order history</h2>
          {orders.length === 0 ? <p className="mt-4 text-muted">No orders yet. <Link href="/shop" className="font-bold text-leaf underline">Browse plans</Link></p> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="py-3">Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {orders.map((o) => {
                    const [label, bg, fg] = PILL[o.status] ?? PILL.pending_payment;
                    return (
                      <tr key={o.id} className="border-b border-line last:border-0">
                        <td className="py-4 font-bold"><Link href={`/order/${o.id}`} className="text-fg no-underline hover:underline">{o.number}</Link></td>
                        <td>{o.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="max-w-[240px]">{items.filter((i) => i.orderId === o.id).map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}</td>
                        <td className="font-bold">{formatNaira(o.totalKobo)}</td>
                        <td><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: bg, color: fg }}>{label}</span></td>
                        <td className="text-right"><ReorderButton orderId={o.id} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${card} mt-5`} id="preferences" aria-label="Dietary preferences">
          <h2 className="text-2xl">Dietary preferences</h2>
          {profile?.dailyKcalTarget ? (
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="label-sm text-[11px] text-muted">Daily target</dt><dd className="mt-1 font-display text-xl font-bold">{profile.dailyKcalTarget.toLocaleString("en-NG")} kcal</dd></div>
              <div><dt className="label-sm text-[11px] text-muted">Leave out</dt><dd className="mt-1">{profile.exclusions.length ? profile.exclusions.join(", ") : "Nothing"}</dd></div>
              <div><dt className="label-sm text-[11px] text-muted">Pepper level</dt><dd className="mt-1">{profile.pepperLevel ?? 3} / 5</dd></div>
            </dl>
          ) : <p className="mt-3 text-muted">You haven&apos;t taken the quiz yet.</p>}
          <Link href="/quiz" className="mt-4 inline-block min-h-11 font-bold text-leaf underline">{profile?.dailyKcalTarget ? "Retake the quiz" : "Take the quiz"}</Link>
        </section>

        <section className={`${card} mt-5`} id="security" aria-label="Password">
          <h2 className="text-2xl">Password</h2>
          <p className="mt-1 text-sm text-muted">{hasPassword ? "Change the password you use with your email." : "Add a password so you can also sign in with your email and password."}</p>
          <PasswordForm hasPassword={hasPassword} />
        </section>
      </div>
    </div>
  );
}

const f = (a: string) => ` · ${a.split(",").slice(0, 2).join(",")}`;
const slugFor = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
