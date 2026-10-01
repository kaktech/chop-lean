import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { JsonLd } from "@/components/product/JsonLd";

export const metadata: Metadata = { title: "FAQs", description: "Answers about Chop Lean plans, delivery, payments, pausing and health." };

const GROUPS: { title: string; items: [string, string][] }[] = [
  { title: "Plans and ordering", items: [
    ["How do plans work?", "A plan is a weekly subscription. Pick your calories, meals per day and days per week, and we deliver a menu you can swap meals on until Thursday 6pm."],
    ["Can I just order single meals?", "Yes. Every dish on the menu can be ordered on its own, with no subscription."],
    ["How do I know which plan to choose?", "Take the two-minute quiz. We use the Mifflin-St Jeor equation, subtract a gentle deficit if you want to lose weight, and round to the nearest plan."],
    ["What is the order cut-off?", "6pm Lagos time on the day before delivery. Deliveries are on Monday, Wednesday and Friday."],
    ["Can I leave out ingredients?", "Yes. Add allergies or ingredients to leave out on the plan page or at checkout. We can't guarantee a dish is free of traces, so please contact us if your allergy is severe."],
  ] },
  { title: "Delivery", items: [
    ["Where do you deliver?", "Across Lagos Mainland, Lagos Island and Lekki to Ajah, or you can pick up from our kitchen in Yaba. See the delivery page for areas and fees."],
    ["How are meals delivered?", "Chilled, packed per person and labelled with the name, day and calories. Keep them refrigerated and eat within 3 days."],
    ["How do I heat them?", "Loosen the lid and microwave for 3 minutes, or heat in a pot."],
  ] },
  { title: "Payments", items: [
    ["How can I pay?", "By card (Paystack: Verve, Visa or Mastercard), by bank transfer, or pay on delivery for your first order."],
    ["How does bank transfer work?", "You get our account details and a 30-minute hold on your delivery slot. Put your order number in the narration. Tap “I've sent the money” and we'll confirm and email you."],
    ["Is pay on delivery available every time?", "No. It's for your first order only and adds a ₦500 fee."],
    ["Is my card information safe?", "Card details are entered in Paystack's secure window. Chop Lean never sees or stores your card number."],
    ["What does the promo code CHOPLEAN20 do?", "It takes 20% off the first week of a plan on your first order. It doesn't apply to single meals or drinks."],
  ] },
  { title: "Pausing and changes", items: [
    ["How do I pause or skip a week?", "Open your account and choose Pause next week. It must be done before Thursday 6pm."],
    ["Can I swap meals?", "Yes. On the plan page, tap Swap on any dish to choose another with similar calories."],
  ] },
  { title: "Health", items: [
    ["Are your plans medical treatment?", "No. They support weight management. Speak to your doctor first if you have a health condition, are pregnant or breastfeeding, or are under 18."],
    ["How fast will I lose weight?", "A 500 kcal daily deficit is about 0.5 kg a week for most people. Results vary, and we never go below 1,200 kcal a day."],
  ] },
];

export default function FaqPage() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: GROUPS.flatMap((g) => g.items).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <JsonLd data={ld} />
      <PageHero image="woman-cafe.jpg" eyebrow="Help" title="Frequently asked" accent="questions" blurb="Can't find what you need? Message us and we'll reply the same day." crumbs={[{ label: "Home", href: "/" }, { label: "FAQs" }]} size="sm" position="center 35%" />
      <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-[240px_1fr]">
        <nav aria-label="FAQ sections" className="hidden lg:block"><ul className="sticky top-40 flex flex-col gap-1">{GROUPS.map((g) => <li key={g.title}><a href={`#${g.title.replace(/\W+/g, "-").toLowerCase()}`} className="flex min-h-11 items-center text-sm font-bold text-muted no-underline hover:text-yellow">{g.title}</a></li>)}</ul></nav>
        <div className="max-w-[820px]">
          {GROUPS.map((g) => (
            <section key={g.title} id={g.title.replace(/\W+/g, "-").toLowerCase()} className="mb-12 scroll-mt-40">
              <h2 className="display-xl text-[26px] md:text-[34px]">{g.title}</h2>
              <div className="mt-5 flex flex-col gap-3">
                {g.items.map(([q, a]) => (
                  <details key={q} className="group rounded-2xl border border-line bg-surface px-5 py-1 open:border-yellow/40 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-display text-[17px] font-bold">{q}<span aria-hidden className="text-xl text-yellow transition-transform group-open:rotate-45">+</span></summary>
                    <p className="pb-4 text-[15px] leading-relaxed text-muted">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <div className="rounded-[26px] border border-line bg-surface p-8 text-center"><p className="font-serif text-2xl">Still have a question?</p><Link href="/contact" className="btn-primary cl-btn mt-5">Contact us</Link></div>
        </div>
      </div>
    </>
  );
}
