import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { CalendarClock, MapPin, Snowflake, Timer } from "lucide-react";
import { db } from "@/db";
import { deliveryZones } from "@/db/schema";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { formatNaira } from "@/lib/money";
import { DELIVERY_WINDOWS } from "@/lib/checkout-schema";
import { describeDate, nextDeliveryDates } from "@/lib/lagos-time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Delivery zones and times", description: "Chop Lean delivers chilled meals across Lagos on Monday, Wednesday and Friday. See zones, fees, windows and cut-off times." };

export default async function DeliveryPage() {
  const zones = await db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true)).orderBy(asc(deliveryZones.sort));
  const next = nextDeliveryDates(new Date(), 3).map((d) => describeDate(d).short);
  const facts = [
    { icon: CalendarClock, t: "Mon, Wed and Fri", d: "Meals are delivered on these three days. Each delivery covers the days until the next one." },
    { icon: Timer, t: "Order by 6pm the day before", d: "The cut-off for any delivery day is 6pm Lagos time on the day before." },
    { icon: Snowflake, t: "Delivered chilled", d: "Packed cold and labelled per person. Keep refrigerated and eat within 3 days." },
    { icon: MapPin, t: "Lagos only, for now", d: "We deliver to the zones below. Not sure if you're covered? Message us." },
  ];
  return (
    <>
      <PageHero image="rider.jpg" eyebrow="Delivery" title="Fresh to your" accent="gate" blurb="Cooked in Yaba every delivery morning and on a bike by 7am." crumbs={[{ label: "Home", href: "/" }, { label: "Delivery" }]} position="center 40%" />
      <section className="container-x py-14 md:py-20">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ icon: Icon, t, d }, i) => (
            <Reveal as="li" key={t} delay={i * 0.06} className="rounded-[24px] border border-line bg-surface p-6">
              <span className="flex size-12 items-center justify-center rounded-full border border-yellow/40 bg-yellow/10 text-yellow"><Icon size={22} strokeWidth={1.6} aria-hidden /></span>
              <h2 className="mt-4 font-display text-lg">{t}</h2><p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
            </Reveal>
          ))}
        </ul>
        {next.length > 0 && <p className="mt-6 text-sm text-body">Next open delivery days: <b className="text-yellow">{next.join(" · ")}</b></p>}
      </section>

      <section className="border-y border-line bg-surface">
        <div className="container-x py-14 md:py-20">
          <h2 className="display-xl text-[28px] md:text-[42px]">Zones and <span className="serif-accent">fees</span></h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center gap-5 rounded-[22px] border border-line bg-canvas p-6">
                <div className="min-w-0 flex-1"><h3 className="font-display text-xl">{z.name}</h3><p className="mt-1 text-sm text-muted">{z.areas}</p></div>
                <b className="font-display text-2xl text-yellow">{z.feeKobo ? formatNaira(z.feeKobo) : "Free"}</b>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted">Fees are charged once per order. Pickup is from our kitchen in Yaba from 11am on delivery days.</p>
        </div>
      </section>

      <section className="container-x grid gap-12 py-14 md:grid-cols-2 md:py-20">
        <div>
          <h2 className="display-xl text-[26px] md:text-[36px]">Delivery <span className="serif-accent">windows</span></h2>
          <ul className="mt-5 flex flex-col gap-3">{DELIVERY_WINDOWS.map((w) => <li key={w} className="rounded-2xl border border-line bg-surface px-5 py-4 text-body">{w}</li>)}</ul>
          <p className="mt-4 text-sm text-muted">Choose your window at checkout. A rider will message you on WhatsApp when they&apos;re on the way.</p>
        </div>
        <div className="prose-cl">
          <h2 className="!mt-0">Pausing and skipping</h2>
          <p>Change, pause or skip any week from your <Link href="/account">account</Link> before <strong>Thursday 6pm</strong>. There are no fees and no long contracts.</p>
          <h2>Heating your meals</h2>
          <p>Loosen the lid and microwave for 3 minutes, or heat in a pot. Stir halfway. Soups and stews reheat best in a pot.</p>
          <h2>Something wrong with your delivery?</h2>
          <p>Message us on WhatsApp or through the <Link href="/contact">contact form</Link> with your order number and we&apos;ll sort it out.</p>
        </div>
      </section>
    </>
  );
}
