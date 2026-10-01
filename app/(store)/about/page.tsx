import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = { title: "Our kitchen", description: "How Chop Lean cooks, packs and delivers calorie-counted Nigerian meals from its kitchen in Yaba, Lagos." };

const PRINCIPLES = [
  ["Measured oil", "Oil is measured by the tablespoon, never free-poured. It is the single biggest calorie swing in Nigerian cooking."],
  ["Weighed portions", "Rice, swallow, protein and soup are weighed per portion, so the calories on the lid match what's in the box."],
  ["Grilled, not fried", "Chicken and fish are grilled or air-fried. Plantain is baked or boiled. The pepper stays exactly where it was."],
  ["Swaps, not substitutes", "Cauliflower rice blended into jollof and oat or wheat swallow keep the taste you know with fewer calories."],
  ["Cooked the same day", "Meals are cooked fresh in the morning of each delivery, with no leftovers carried over."],
  ["Labelled for you", "Every lid carries the name, day and calories, so you always know what you're eating."],
];

export default function AboutPage() {
  return (
    <>
      <PageHero image="kitchen.jpg" eyebrow="Our kitchen" title="Cooked in Yaba," accent="eaten anywhere" blurb="One kitchen, one rule: Nigerian food should still taste like Nigerian food when you're counting calories." crumbs={[{ label: "Home", href: "/" }, { label: "Our kitchen" }]} position="center 30%" size="lg" />

      <section className="container-x grid items-center gap-12 py-16 md:grid-cols-2 md:py-28">
        <div>
          <div className="eyebrow">The idea</div>
          <h2 className="display-xl mt-3 text-[32px] md:text-[48px]">Diets shouldn&apos;t <span className="serif-accent">take your food away</span></h2>
          <div className="prose-cl mt-5">
            <p>Most weight-loss plans ask you to give up the food you love. We started from the other end: keep efo riro, ofada, jollof and pepper soup, and change how they&apos;re cooked.</p>
            <p>Every dish is weighed, measured and counted, then sold as a weekly plan or a single plate. You get the taste of home and a calorie number you can actually plan around.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/menu" className="btn-primary cl-btn">See the menu</Link><Link href="/dietitian" className="btn-outline cl-btn">How we set calories</Link></div>
        </div>
        <Reveal className="relative aspect-[4/4.4] overflow-hidden rounded-[28px] border border-line"><Image src="/images/meal-box.jpg" alt="Labelled meal prep containers stacked in the kitchen" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" /></Reveal>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="container-x py-16 md:py-24">
          <SectionTitle eyebrow="How we cook" sub="Six habits that keep a plate around 450 kcal without making it taste like a diet.">The kitchen <span className="serif-accent">rules</span></SectionTitle>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={(i % 3) * 0.06} className="rounded-[24px] border border-line bg-canvas p-7">
                <span className="font-serif text-3xl text-yellow">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-xl">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{d}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-x py-16 md:py-28">
        <SectionTitle eyebrow="From stove to door">A delivery <span className="serif-accent">morning</span></SectionTitle>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {[
            ["kitchen.jpg", "Cooked fresh", "Measured oil, weighed portions, no leftovers."],
            ["meal-box.jpg", "Packed and labelled", "Name, day and calories on every lid."],
            ["rider.jpg", "On a bike by 7am", "Mon, Wed and Fri across Lagos, delivered chilled."],
          ].map(([img, t, d]) => (
            <Reveal key={t}>
              <figure className="cl-zoom relative h-[380px] overflow-hidden rounded-[26px] border border-line">
                <Image src={`/images/${img}`} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas/90 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-5 bottom-5"><b className="block font-display text-xl">{t}</b><span className="text-sm text-body">{d}</span></figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-x pb-20">
        <div className="relative isolate overflow-hidden rounded-[28px] border border-line p-8 text-center md:p-16">
          <Image src="/images/jollof.jpg" alt="" fill sizes="1200px" className="-z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-canvas/80" />
          <h2 className="display-xl text-[30px] md:text-[48px]">Ready to <span className="serif-accent">taste it?</span></h2>
          <p className="mx-auto mt-3 max-w-[480px] text-body">Take the two-minute quiz and we&apos;ll match you to a plan.</p>
          <Link href="/quiz" className="btn-primary cl-btn mt-6">Find my plan</Link>
        </div>
      </section>
    </>
  );
}
