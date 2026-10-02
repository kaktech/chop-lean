import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, Flame, Scale, Truck } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getPlans, getRecentReviews } from "@/lib/queries";
import { getCollectionCounts } from "@/lib/collections";
import { PlanCard } from "@/components/shop/ProductCard";
import { MenuList, type MenuItem } from "@/components/home/MenuList";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const dynamic = "force-dynamic";

const STEPS = [
  ["01", "Take the 2-min quiz", "Your height, weight, goal and what you won't eat. We work out a daily calorie target."],
  ["02", "Get your plan", "We match you to a 1,200–1,800 kcal plan. Swap any meal on the week's menu."],
  ["03", "We cook and deliver", "Chilled, labelled meals arrive Mon, Wed and Fri. Microwave for 3 minutes and eat."],
  ["04", "Weigh in weekly", "Log your weight in your account. Your plan adjusts as you go."],
];

const CATS = [
  { href: "/shop?tab=plans", t: "Meal plans", sub: "Weekly subscriptions", img: "ofada.jpg", key: null },
  { href: "/collections/breakfast", t: "Breakfast", sub: "Moi moi, akara, plantain", img: "moi-moi.jpg", key: "breakfast" },
  { href: "/collections/swallow-and-soups", t: "Swallow and soups", sub: "Efo riro, egusi, okra", img: "efo-riro.jpg", key: "swallow-and-soups" },
  { href: "/collections/drinks", t: "Snacks and drinks", sub: "Zobo, tiger nut", img: "zobo.jpg", key: "drinks" },
];

export default async function HomePage() {
  const [plans, reviews, allMenu, counts] = await Promise.all([
    getPlans(4),
    getRecentReviews(2),
    db.select().from(products).where(eq(products.isLive, true)).orderBy(asc(products.createdAt)),
    getCollectionCounts(),
  ]);
  const toItem = (p: (typeof allMenu)[number]): MenuItem => ({ id: p.id, slug: p.slug, type: p.type, name: p.name, image: p.image, kcal: p.kcal, proteinG: p.proteinG, priceKobo: p.priceKobo, slot: p.slot });
  const groups = {
    breakfast: allMenu.filter((p) => p.type === "meal" && p.slot === "breakfast").map(toItem),
    lunch: allMenu.filter((p) => p.type === "meal" && p.slot === "lunch").map(toItem),
    dinner: allMenu.filter((p) => p.type === "meal" && p.slot === "dinner").map(toItem),
    drinks: allMenu.filter((p) => p.type === "drink").map(toItem),
  };
  const planCount = allMenu.filter((p) => p.type === "plan").length;
  const mealCount = allMenu.filter((p) => p.type === "meal").length;

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="relative md:min-h-[640px]">
          <Image src="/images/hero-wide.jpg" alt="A couple eating Chop Lean meals from containers at their dining table" fill priority sizes="100vw" className="-z-20 hidden object-cover [object-position:70%_center] md:block" />
          <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-canvas via-canvas/75 to-canvas/10 md:block" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 hidden h-40 bg-gradient-to-t from-canvas to-transparent md:block" />

          <div className="container-x relative flex flex-col gap-8 pb-10 pt-10 md:min-h-[640px] md:justify-center md:pb-20 md:pt-20">
            <div className="max-w-[640px]">
              <div className="eyebrow cl-up cl-d1">Dietitian-planned · Lagos meal delivery</div>
              <h1 className="display-xl cl-up cl-d2 mt-4 text-[40px] md:text-[54px] lg:text-[62px] xl:text-[72px]">
                Lose weight eating the food you <span className="serif-accent">grew up on</span>
              </h1>
              <p className="cl-up cl-d3 mt-5 max-w-[520px] text-base leading-relaxed text-body md:text-lg">
                Efo riro, ofada, jollof and pepper soup, cooked the Naija way with weighed portions and counted calories. Tell us your goal; we deliver a week that fits it.
              </p>
              <div className="cl-up cl-d4 mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/quiz" className="btn-primary cl-btn">Find my plan in 2 minutes <ArrowRight size={18} aria-hidden /></Link>
                <Link href="/menu" className="btn-outline cl-btn">Explore the menu</Link>
              </div>
            </div>

            <ul className="cl-up cl-d5 flex flex-wrap gap-x-8 gap-y-3 text-sm text-body">
              {[[Flame, "Calories counted"], [Scale, "Portions weighed"], [Truck, "Mon · Wed · Fri delivery"]].map(([Icon, l]) => {
                const I = Icon as typeof Flame;
                return <li key={l as string} className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-full border border-yellow/40 text-yellow"><I size={17} aria-hidden /></span>{l as string}</li>;
              })}
            </ul>

            <div className="cl-up cl-d5 relative h-[440px] overflow-hidden rounded-[28px] border border-line shadow-chip md:hidden">
              <Image src="/images/hero-tall.jpg" alt="A smiling woman holding a Chop Lean jollof meal box" fill priority sizes="100vw" className="object-cover [object-position:center_30%]" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas/70 via-transparent to-transparent" />
            </div>

          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="container-x py-14 md:py-20">
        <SectionTitle eyebrow="Weekly plans" watermark="Plans" sub="Weekly subscriptions. Pause, skip or swap meals any time before Thursday 6pm.">This week&apos;s plans</SectionTitle>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {plans.map((p) => (<div key={p.id} className="w-[270px] shrink-0 snap-start md:w-auto"><PlanCard p={p} /></div>))}
        </div>
        <div className="mt-8 text-center"><Link href="/shop?tab=plans" className="btn-outline cl-btn">All {planCount} plans</Link></div>
      </section>

      {/* EXPLORE */}
      <section className="container-x py-14 md:py-20">
        <SectionTitle eyebrow="Explore" sub="Pick a collection, or browse everything on the full menu.">Find your <span className="serif-accent">next plate</span></SectionTitle>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {CATS.map((c) => (
            <Reveal key={c.t} className="w-[260px] shrink-0 snap-start md:w-auto">
              <Link href={c.href} className="cl-zoom group relative block h-[320px] overflow-hidden rounded-[26px] border border-line no-underline md:h-[400px]">
                <Image src={`/images/${c.img}`} alt="" fill sizes="(min-width:768px) 25vw, 260px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="eyebrow !text-[11px]">{c.key ? `${counts[c.key] ?? 0} items` : `${planCount} plans`}</div>
                  <div className="mt-2 font-display text-2xl font-bold text-fg">{c.t}</div>
                  <div className="mt-1 flex items-center justify-between text-sm text-body">{c.sub}<span className="flex size-9 items-center justify-center rounded-full bg-yellow text-canvas transition-transform group-hover:translate-x-1"><ArrowRight size={16} aria-hidden /></span></div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center"><Link href="/collections" className="text-sm font-bold uppercase tracking-[0.14em] text-yellow underline-offset-8 hover:underline">View all collections</Link></div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-14 md:py-20">
          <SectionTitle eyebrow="Simple" sub="From quiz to your door in four steps.">How it works</SectionTitle>
          <ol className="relative grid gap-5 md:grid-cols-4">
            <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[34px] hidden h-px border-t border-dashed border-white/20 md:block" />
            {STEPS.map(([n, t, d], i) => (
              <Reveal as="li" key={n} delay={i * 0.07} className="relative flex flex-col items-center text-center md:px-3">
                <span className="relative z-10 flex size-[68px] items-center justify-center rounded-full border border-yellow/50 bg-surface font-serif text-3xl text-yellow">{n}</span>
                <h3 className="mt-5 font-display text-xl">{t}</h3>
                <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-muted">{d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* MENU */}
      <section className="relative overflow-hidden border-y border-line bg-surface">
        <div aria-hidden className="watermark absolute -top-6 right-0 hidden text-[200px] md:block">Menu</div>
        <div className="container-x relative grid gap-12 py-14 md:py-20 lg:grid-cols-[360px_1fr]">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <div className="eyebrow">Menu of Chop Lean</div>
            <h2 className="display-xl mt-3 text-[34px] md:text-[48px]">A collection of <span className="serif-accent">comfort foods</span></h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{mealCount} dishes, each with calories and protein on the label. Order a single plate, or let a plan do the choosing.</p>
            <div className="relative mt-8 hidden aspect-[4/5] overflow-hidden rounded-[26px] border border-line lg:block"><Image src="/images/kitchen.jpg" alt="A chef cooking in the Chop Lean kitchen" fill sizes="360px" className="object-cover" /></div>
            <Link href="/menu" className="btn-outline cl-btn mt-6">See the full menu</Link>
          </div>
          <MenuList groups={groups} tabs={[{ key: "breakfast", label: "Breakfast" }, { key: "lunch", label: "Lunch" }, { key: "dinner", label: "Dinner" }, { key: "drinks", label: "Drinks" }]} />
        </div>
      </section>

      {/* REVIEWS (real reviews only) */}
      <section id="results" className="container-x py-14 md:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col justify-between gap-5 overflow-hidden rounded-[26px] bg-green pb-9 text-white">
            <Image src="/images/woman-cafe.jpg" alt="Woman enjoying a meal at a table" width={600} height={190} className="h-[190px] w-full object-cover" />
            <span className="px-9 pt-1.5 font-serif text-[44px] leading-[1.05]">Real people.<br /><span className="italic text-yellow">Real plates.</span></span>
            <span className="px-9 text-[15px] leading-relaxed text-mint">Reviews from real customers, with a Verified badge when the order checks out. New ones appear here as soon as they are posted.</span>
            <Link href="/results" className="mx-9 text-sm font-bold text-yellow underline">See all results →</Link>
          </div>
          {[0, 1].map((i) => {
            const r = reviews[i];
            if (!r) {
              return i === 0 || !reviews[0] ? (
                <div key={i} className="flex flex-col justify-center gap-4 rounded-[26px] border border-dashed border-line bg-surface p-[34px]">
                  <span className="font-serif text-2xl leading-snug">{i === 0 ? "No reviews yet. Be the first." : "Tried a plan? Tell us how it went."}</span>
                  <span className="text-sm text-muted">Open any plan or meal and tap “Write a review”. Yours shows up here straight away.</span>
                  <Link href="/shop" className="cl-btn tap inline-flex w-fit items-center rounded-full bg-yellow px-5 text-sm font-bold text-canvas no-underline">Browse plans</Link>
                </div>
              ) : null;
            }
            return (
              <div key={i} className="flex flex-col gap-[18px] rounded-[26px] border border-line bg-surface p-[34px]">
                <span className="text-xl tracking-[2px] text-yellow" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}</span>
                <span className="font-serif text-2xl leading-snug">{`“${r.body}”`}</span>
                <span className="mt-auto flex items-center gap-3"><span className={`flex size-11 items-center justify-center rounded-full font-bold ${i ? "bg-tint-blue" : "bg-tint-red"}`}>{r.name.charAt(0).toUpperCase()}</span><span className="flex flex-col"><b>{r.name}{r.verified && <span className="ml-2 rounded-full bg-tint-green px-2 py-0.5 text-[11px] font-bold text-leaf-soft">Verified</span>}</b><span className="text-[13px] text-muted">{r.product}</span></span></span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
