import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, ChefHat, Flame, Scale, Snowflake, Truck } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getPlans, getProductsBySlugs, getRecentReviews } from "@/lib/queries";
import { getCollectionCounts } from "@/lib/collections";
import { PlanCard } from "@/components/shop/ProductCard";
import { MenuList, type MenuItem } from "@/components/home/MenuList";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const dynamic = "force-dynamic";

const TICKER = [
  ["Efo riro", "efo-riro-prawns-swallow", "efo-riro.jpg"],
  ["Jollof and chicken", "cauli-jollof-chicken", "jollof.jpg"],
  ["Ofada and ayamase", "ofada-ayamase", "ofada.jpg"],
  ["Catfish pepper soup", "catfish-pepper-soup", "pepper-soup.jpg"],
  ["Moi moi", "moi-moi-egg-fish", "moi-moi.jpg"],
  ["Okra and prawns", "okra-prawns", "okra-soup.jpg"],
] as const;

const FEATURES = [
  { icon: Scale, t: "Weighed to the gram", d: "Every scoop, ladle and drizzle of oil is measured, so the calories on the lid are the calories in the box." },
  { icon: ChefHat, t: "Cooked the Naija way", d: "Efo riro, ofada, jollof and pepper soup with the flavour you know. We grill instead of fry and keep the pepper in." },
  { icon: Snowflake, t: "Delivered chilled", d: "Packed and labelled per person, on a bike by 7am on Mon, Wed and Fri. Three minutes in the microwave and it's ready." },
];

const STEPS = [
  ["01", "Take the 2-min quiz", "Your height, weight, goal and what you won't eat. We work out a daily calorie target."],
  ["02", "Get your plan", "We match you to a 1,200–1,800 kcal plan. Swap any meal on the week's menu."],
  ["03", "We cook and deliver", "Chilled, labelled meals arrive Mon, Wed and Fri. Microwave for 3 minutes and eat."],
  ["04", "Weigh in weekly", "Log your weight in your account. Your plan adjusts as you go."],
];

const COMPARE = [
  ["Rice", "2 full scoops", "1 scoop + cauli rice"],
  ["Oil", "Free pour", "1 tbsp, measured"],
  ["Protein", "Fried chicken", "Grilled, skin off"],
  ["Calories", "≈ 900 kcal", "≈ 450 kcal"],
];

const CATS = [
  { href: "/shop?tab=plans", t: "Meal plans", sub: "Weekly subscriptions", img: "ofada.jpg", key: null },
  { href: "/collections/breakfast", t: "Breakfast", sub: "Moi moi, akara, plantain", img: "moi-moi.jpg", key: "breakfast" },
  { href: "/collections/swallow-and-soups", t: "Swallow and soups", sub: "Efo riro, egusi, okra", img: "efo-riro.jpg", key: "swallow-and-soups" },
  { href: "/collections/drinks", t: "Snacks and drinks", sub: "Zobo, tiger nut", img: "zobo.jpg", key: "drinks" },
];

export default async function HomePage() {
  const [plans, tickerMeals, reviews, allMenu, counts] = await Promise.all([
    getPlans(4),
    getProductsBySlugs(TICKER.map((t) => t[1])),
    getRecentReviews(2),
    db.select().from(products).where(eq(products.isLive, true)).orderBy(asc(products.createdAt)),
    getCollectionCounts(),
  ]);
  const kcalOf = (slug: string) => tickerMeals.find((m) => m.slug === slug)?.kcal;
  const ticker = [...TICKER, ...TICKER];
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
        <div className="relative md:min-h-[760px]">
          <Image src="/images/hero-wide.jpg" alt="A couple eating Chop Lean meals from containers at their dining table" fill priority sizes="100vw" className="-z-20 hidden object-cover [object-position:70%_center] md:block" />
          <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-canvas via-canvas/75 to-canvas/10 md:block" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 hidden h-40 bg-gradient-to-t from-canvas to-transparent md:block" />

          <div className="container-x relative flex flex-col gap-8 pb-10 pt-10 md:min-h-[760px] md:justify-center md:pb-24 md:pt-24">
            <div className="max-w-[680px]">
              <div className="eyebrow cl-up cl-d1">Dietitian-planned · Lagos meal delivery</div>
              <h1 className="display-xl cl-up cl-d2 mt-4 text-[44px] md:text-[84px]">
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
              <div className="glass absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl py-2.5 pl-2.5 pr-4"><Image src="/images/jollof.jpg" alt="" width={44} height={44} className="size-11 rounded-xl object-cover" /><span className="leading-snug"><b className="block text-sm text-fg">Jollof and chicken</b><span className="text-xs text-muted">450 kcal · 38g protein</span></span></div>
            </div>

            <div className="cl-float glass absolute bottom-28 right-6 hidden items-center gap-3.5 rounded-[20px] py-3 pl-3 pr-[18px] lg:flex xl:right-[8%]">
              <Image src="/images/jollof.jpg" alt="" width={56} height={56} className="size-14 rounded-[14px] object-cover" />
              <div className="leading-snug"><div className="text-[15px] font-bold text-fg">Jollof, chicken and plantain</div><div className="text-[13px] text-muted">450 kcal · 38g protein</div></div>
            </div>
            <div aria-hidden className="absolute right-6 top-28 hidden size-[132px] items-center justify-center rounded-full border border-white/15 bg-canvas/70 backdrop-blur md:flex xl:right-[10%]">
              <svg className="cl-spin" viewBox="0 0 120 120" width={120} height={120}>
                <defs><path id="clCirc" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
                <text style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10.5, fontWeight: 700, letterSpacing: 2.6, fill: "#F6B81A" }}><textPath href="#clCirc">CALORIE COUNTED • NAIJA MADE • </textPath></text>
              </svg>
              <span className="absolute font-serif text-[30px] text-fg">-0.5<span className="text-sm">kg</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="overflow-hidden border-y border-line bg-surface" aria-label="Popular dishes">
        <div className="cl-marquee flex w-max py-3.5 md:py-4">
          {ticker.map(([name, slug, img], i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap px-6 font-display text-base font-semibold text-fg md:px-8 md:text-xl" aria-hidden={i >= TICKER.length}>
              <Image src={`/images/${img}`} alt="" width={40} height={40} className="size-9 rounded-full object-cover md:size-10" />
              {name}
              {kcalOf(slug) && <span className="text-xs font-bold text-yellow md:text-sm">{kcalOf(slug)} kcal</span>}
              <span className="text-xl text-leaf/70">✱</span>
            </span>
          ))}
        </div>
      </div>

      {/* WHY */}
      <section className="container-x grid items-center gap-12 py-16 md:grid-cols-2 md:gap-16 md:py-28">
        <div>
          <div className="eyebrow">Why Chop Lean</div>
          <h2 className="display-xl mt-3 text-[34px] md:text-[56px]">Real Naija food, <span className="serif-accent">measured</span> to the gram</h2>
          <ul className="mt-8 flex flex-col gap-7">
            {FEATURES.map(({ icon: Icon, t, d }, i) => (
              <Reveal as="li" key={t} delay={i * 0.08} className="flex gap-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-yellow/40 bg-yellow/10 text-yellow"><Icon size={24} strokeWidth={1.6} aria-hidden /></span>
                <div><h3 className="font-display text-xl">{t}</h3><p className="mt-1.5 max-w-[460px] text-[15px] leading-relaxed text-muted">{d}</p></div>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal className="relative mx-auto aspect-[5/5.4] w-full max-w-[560px]">
          <div className="absolute left-0 top-0 h-[72%] w-[72%] overflow-hidden rounded-[28px] border border-line shadow-chip"><Image src="/images/jollof.jpg" alt="Cauli-blend jollof with chicken and plantain" fill sizes="(min-width:768px) 36vw, 70vw" className="object-cover" /></div>
          <div className="absolute bottom-0 right-0 h-[58%] w-[58%] overflow-hidden rounded-full border-[10px] border-canvas shadow-chip"><Image src="/images/efo-riro.jpg" alt="Efo riro with prawns" fill sizes="(min-width:768px) 30vw, 60vw" className="object-cover" /></div>
          <div className="glass cl-float2 absolute bottom-[8%] left-[2%] rounded-2xl px-5 py-4"><div className="font-display text-3xl font-extrabold text-yellow">≈ 450</div><div className="text-xs text-body">kcal per plate,<br />not 900</div></div>
        </Reveal>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-line bg-surface">
        <div className="container-x py-16 md:py-24">
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

      {/* EXPLORE */}
      <section className="container-x py-16 md:py-28">
        <SectionTitle eyebrow="Explore" sub="Pick a collection, or browse everything on the full menu.">Find your <span className="serif-accent">next plate</span></SectionTitle>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {CATS.map((c) => (
            <Reveal key={c.t} className="w-[260px] shrink-0 snap-start md:w-auto">
              <Link href={c.href} className="cl-zoom group relative block h-[380px] overflow-hidden rounded-[26px] border border-line no-underline md:h-[460px]">
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

      {/* MENU */}
      <section className="relative overflow-hidden border-y border-line bg-surface">
        <div aria-hidden className="watermark absolute -top-6 right-0 hidden text-[200px] md:block">Menu</div>
        <div className="container-x relative grid gap-12 py-16 md:py-24 lg:grid-cols-[360px_1fr]">
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

      {/* PLANS */}
      <section className="container-x py-16 md:py-28">
        <SectionTitle eyebrow="Weekly plans" watermark="Plans" sub="Weekly subscriptions. Pause, skip or swap meals any time before Thursday 6pm.">This week&apos;s plans</SectionTitle>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {plans.map((p) => (<div key={p.id} className="w-[270px] shrink-0 snap-start md:w-auto"><PlanCard p={p} /></div>))}
        </div>
        <div className="mt-8 text-center"><Link href="/shop?tab=plans" className="btn-outline cl-btn">All {planCount} plans</Link></div>
      </section>

      {/* OFFERS */}
      <section className="container-x pb-16 md:pb-28">
        <div className="grid gap-4 md:h-[470px] md:grid-cols-5 md:grid-rows-2 md:gap-5">
          <Reveal className="relative flex min-h-[420px] flex-col gap-3 overflow-hidden rounded-[26px] border border-line bg-tint-green p-7 md:col-span-3 md:row-span-2 md:p-11">
            <span className="eyebrow">First week 20% off</span>
            <span className="display-xl text-[44px] md:text-[64px]">Start <span className="serif-accent">lighter</span></span>
            <span className="max-w-[300px] text-base text-body">Any plan, first 7 days. Use code <b className="text-yellow">CHOPLEAN20</b> at checkout.</span>
            <Link href="/shop?tab=plans" className="btn-primary cl-btn mt-3 self-start">Shop plans</Link>
            <Image src="/images/fried-rice.jpg" alt="Fried rice with chicken" width={360} height={360} className="absolute -bottom-14 -right-10 size-[300px] rounded-full border-[10px] border-canvas object-cover shadow-chip md:size-[360px]" />
          </Reveal>
          <Reveal className="cl-lift relative hidden overflow-hidden rounded-[26px] border border-line bg-tint-red p-[30px] md:col-span-2 md:block">
            <div className="font-display text-[30px] font-bold tracking-tight">Swallow Smart</div>
            <div className="mt-1 max-w-[220px] text-sm text-body">Oat, wheat and plantain swallows in 150g balls</div>
            <Link href="/collections/swallow-and-soups" className="mt-4 inline-block rounded-full bg-red px-4 py-2.5 text-[13px] font-bold text-white no-underline">Shop now</Link>
            <Image src="/images/egusi.jpg" alt="Egusi soup" width={190} height={190} className="absolute -bottom-10 -right-5 size-[190px] rounded-full border-[6px] border-canvas object-cover" />
          </Reveal>
          <Reveal className="cl-lift relative hidden overflow-hidden rounded-[26px] border border-line bg-tint-blue p-[30px] md:col-span-2 md:block">
            <div className="font-serif text-[32px]">Zero-sugar drinks</div>
            <div className="mt-1.5 text-[13px] text-body">Zobo and tiger nut for the 4pm hunger</div>
            <Link href="/collections/drinks" className="mt-4 inline-block rounded-full bg-[#4B55B0] px-4 py-2.5 text-[13px] font-bold text-white no-underline">Shop now</Link>
            <Image src="/images/zobo.jpg" alt="Zobo drink bottles" width={150} height={200} className="absolute bottom-[22px] right-[22px] top-[22px] h-[calc(100%-44px)] w-[150px] rounded-[18px] object-cover" />
          </Reveal>
        </div>
      </section>

      {/* METHOD */}
      <section className="relative overflow-hidden border-y border-line bg-surface">
        <div aria-hidden className="absolute -right-10 top-2.5 font-serif text-[110px] italic leading-none text-white/[0.035] md:text-[220px]">Jollof</div>
        <div className="container-x relative grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="flex flex-col gap-5">
            <span className="eyebrow">The Chop Lean method</span>
            <h2 className="font-serif text-[34px] font-normal leading-[1.05] tracking-normal md:text-[58px]">Same jollof. <span className="italic text-leaf">Half the oil.</span><span className="hidden md:inline"> A plate you can finish without guilt.</span></h2>
            <p className="hidden max-w-[500px] text-[17px] leading-[1.7] text-muted md:block">We don&apos;t take Nigerian food away from you. We weigh every scoop, swap in some cauliflower rice, grill instead of fry and measure the oil. You get the taste you know and a calorie count you can plan around.</p>
          </div>
          <Reveal className="rounded-[26px] border border-line bg-dark-card p-6 md:p-8">
            <div className="grid grid-cols-3 text-[15px]">
              <span className="py-3.5 text-[13px] text-muted">Per plate (approx.)</span>
              <span className="py-3.5 text-[13px] text-muted">Typical party plate</span>
              <span className="py-3.5 text-[13px] font-bold text-yellow">Chop Lean plate</span>
              {COMPARE.map(([k, a, b]) => (
                <div key={k} className="contents"><span className="border-t border-line py-4">{k}</span><span className="border-t border-line py-4 text-muted">{a}</span><span className="border-t border-line py-4 font-bold text-leaf">{b}</span></div>
              ))}
            </div>
            <div className="mt-[18px] text-xs text-muted">Estimates for illustration. Final figures come from the kitchen&apos;s weighed recipes.</div>
          </Reveal>
        </div>
      </section>

      {/* KITCHEN TO GATE */}
      <section className="container-x py-16 md:py-28">
        <SectionTitle eyebrow="Behind the scenes" sub="Cooked fresh in Yaba every delivery morning, packed and labelled per person, and on a bike by 7am.">From our kitchen <span className="serif-accent">to your gate</span></SectionTitle>
        <div className="grid gap-4 md:grid-cols-12 md:gap-5">
          {[
            { src: "kitchen.jpg", alt: "Chef cooking in the Chop Lean kitchen", t: "1 · Cooked fresh", d: "Measured oil, weighed portions, no leftovers.", span: "md:col-span-4" },
            { src: "meal-box.jpg", alt: "Stacked meal prep containers", t: "2 · Packed and labelled", d: "Name, day and calories on every lid.", span: "md:col-span-3" },
            { src: "rider.jpg", alt: "Delivery rider handing a meal bag to a customer at her gate", t: "3 · Delivered chilled", d: "Mon, Wed and Fri across Lagos. Heat for 3 minutes and eat.", span: "md:col-span-5" },
          ].map((f) => (
            <Reveal key={f.src} className={f.span}>
              <figure className="cl-zoom relative h-[320px] overflow-hidden rounded-[26px] border border-line md:h-[480px]">
                <Image src={`/images/${f.src}`} alt={f.alt} fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas/90 via-transparent to-transparent" />
                <figcaption className="glass absolute inset-x-4 bottom-4 rounded-2xl px-4 py-3.5"><b className="block font-display text-[17px] text-fg">{f.t}</b><span className="text-[13px] text-body">{f.d}</span></figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center"><Link href="/about" className="text-sm font-bold uppercase tracking-[0.14em] text-yellow underline-offset-8 hover:underline">Read about our kitchen</Link></div>
      </section>

      {/* STATS */}
      <section className="border-y border-line bg-surface">
        <dl className="container-x grid grid-cols-2 gap-y-8 py-12 text-center md:grid-cols-4 md:py-16">
          {[[String(mealCount), "dishes on the menu"], [String(planCount), "weekly plans"], ["3", "delivery days a week"], ["6pm", "order cut-off, day before"]].map(([v, l]) => (
            <div key={l}><dd className="font-display text-[44px] font-extrabold leading-none text-yellow md:text-[60px]">{v}</dd><dt className="mt-2 text-sm text-muted">{l}</dt></div>
          ))}
        </dl>
      </section>

      {/* REVIEWS (real reviews only) */}
      <section id="results" className="container-x py-16 md:py-28">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col justify-between gap-5 overflow-hidden rounded-[26px] bg-green pb-9 text-white">
            <Image src="/images/woman-cafe.jpg" alt="Woman enjoying a meal at a table" width={600} height={190} className="h-[190px] w-full object-cover" />
            <span className="px-9 pt-1.5 font-serif text-[44px] leading-[1.05]">Real people.<br /><span className="italic text-yellow">Real plates.</span></span>
            <span className="px-9 text-[15px] leading-relaxed text-mint">Reviews from verified orders only. Customers can add their weekly weigh-ins to their review.</span>
            <Link href="/results" className="mx-9 text-sm font-bold text-yellow underline">See all results →</Link>
          </div>
          {[0, 1].map((i) => {
            const r = reviews[i];
            return (
              <div key={i} className="flex flex-col gap-[18px] rounded-[26px] border border-line bg-surface p-[34px]">
                <span className="text-xl tracking-[2px] text-yellow" aria-label={r ? `${r.rating} out of 5 stars` : "No rating yet"}>{r ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "★★★★★"}</span>
                <span className="font-serif text-2xl leading-snug">{r ? `“${r.body}”` : "“[Customer review goes here, pulled from a verified order.]”"}</span>
                <span className="mt-auto flex items-center gap-3"><span className={`size-11 rounded-full ${i ? "bg-tint-blue" : "bg-tint-red"}`} /><span className="flex flex-col"><b>{r ? r.name : "[Customer name]"}</b><span className="text-[13px] text-muted">{r ? r.product : "[Plan] · [weeks on plan]"}</span></span></span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
