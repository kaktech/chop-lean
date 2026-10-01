import Image from "next/image";
import Link from "next/link";
import { Truck } from "lucide-react";
import { getCategories, getPlans, getProductsBySlugs, getRecentReviews } from "@/lib/queries";
import { PlanCard, MealCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { imgSrc } from "@/lib/img";

export const dynamic = "force-dynamic";

const TICKER = [
  ["Efo riro", "efo-riro-prawns-swallow", "efo-riro.jpg"],
  ["Jollof and chicken", "cauli-jollof-chicken", "jollof.jpg"],
  ["Ofada and ayamase", "ofada-ayamase", "ofada.jpg"],
  ["Catfish pepper soup", "catfish-pepper-soup", "pepper-soup.jpg"],
  ["Moi moi", "moi-moi-egg-fish", "moi-moi.jpg"],
  ["Okra and prawns", "okra-prawns", "okra-soup.jpg"],
] as const;

const NEW_MEALS = ["efo-riro-prawns-swallow", "ofada-ayamase", "cauli-jollof-chicken", "catfish-pepper-soup", "moi-moi-egg-fish", "chicken-suya-salad"];

const STEPS = [
  ["01", "Take the 2-min quiz", "Your height, weight, goal and what you will not eat. We work out a daily calorie target."],
  ["02", "Get your plan", "We match you to a 1,200–1,800 kcal plan. You can swap any meal on the week’s menu."],
  ["03", "We cook and deliver", "Chilled, labelled meals arrive Mon, Wed and Fri. Microwave for 3 minutes and eat."],
  ["04", "Weigh in weekly", "Log your weight in your account. Your plan adjusts as you go."],
];

const CAT_STYLE: Record<string, { bg: string; href: string }> = {
  "calorie-counted": { bg: "#DCEFD2", href: "/shop?tab=plans" },
  "swallow-smart": { bg: "#F9DCDC", href: "/shop?tab=plans&tag=swallow" },
  "low-carb": { bg: "#FCEBC9", href: "/shop?tab=plans&tag=low-carb" },
  "high-protein": { bg: "#DDE0F6", href: "/shop?tab=plans&tag=high-protein" },
  "office-lunch": { bg: "#E4F1EE", href: "/shop?tab=plans&tag=lunch" },
};

const COMPARE = [
  ["Rice", "2 full scoops", "1 scoop + cauli rice"],
  ["Oil", "Free pour", "1 tbsp, measured"],
  ["Protein", "Fried chicken", "Grilled, skin off"],
  ["Calories", "≈ 900 kcal", "≈ 450 kcal"],
];

export default async function HomePage() {
  const [plans, cats, newMeals, tickerMeals, reviews] = await Promise.all([
    getPlans(4),
    getCategories(),
    getProductsBySlugs(NEW_MEALS),
    getProductsBySlugs(TICKER.map((t) => t[1])),
    getRecentReviews(2),
  ]);
  const kcalOf = (slug: string) => tickerMeals.find((m) => m.slug === slug)?.kcal;
  const ticker = [...TICKER, ...TICKER];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden md:min-h-[780px]">
        <div aria-hidden className="absolute right-0 top-0 hidden h-full w-[60%] bg-green [clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)] md:block" />
        <div className="cl-wipe absolute right-0 top-0 hidden h-full w-[58%] overflow-hidden [clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)] md:block">
          <Image src="/images/hero-wide.jpg" alt="A smiling couple eating Chop Lean meals from containers at their dining table" fill priority sizes="60vw" className="object-cover [object-position:78%_center]" />
        </div>
        <div aria-hidden className="absolute right-1.5 top-6 hidden rotate-180 font-serif text-[150px] leading-none tracking-[0.04em] text-white/20 [writing-mode:vertical-rl] md:block">NAIJA</div>
        <div aria-hidden className="absolute right-0 top-[250px] h-[520px] w-[70%] bg-green [clip-path:polygon(22%_0,100%_0,100%_100%,0_92%)] md:hidden" />

        <div className="container-x relative grid gap-8 pb-9 pt-[26px] md:grid-cols-12 md:pb-[72px] md:pt-24">
          <div className="flex flex-col gap-3.5 md:col-span-6 md:gap-[26px] md:pt-2.5">
            <div className="cl-up cl-d1 flex items-center gap-2.5 text-[13px] font-medium md:text-[15px]">
              <span className="h-[3px] w-6 rounded-sm bg-yellow md:w-7" />
              Dietitian-planned · <span className="font-bold text-red">Lagos Meal Delivery</span>
            </div>
            <h1 className="cl-up cl-d2 max-w-[540px] text-[42px] leading-[1.02] tracking-[-0.035em] md:text-[72px] md:leading-none">
              Lose Weight Eating the Food You <span className="font-serif font-normal italic tracking-[-0.01em] text-green">Grew Up On</span>
            </h1>
            <p className="cl-up cl-d3 max-w-[480px] text-base leading-relaxed text-body md:text-lg">
              <span className="md:hidden">Calorie-counted jollof, efo riro and pepper soup, cooked in Lagos and delivered chilled.</span>
              <span className="hidden md:inline">Efo riro, ofada, jollof, pepper soup, cooked the Naija way with weighed portions and counted calories. Tell us your goal; we deliver a week that fits it.</span>
            </p>
            <div className="cl-up cl-d4 flex flex-col gap-2.5 md:flex-row md:items-center md:gap-3.5">
              <Link href="/quiz" className="cl-btn rounded-full bg-yellow px-[30px] py-4 text-center text-base font-bold text-ink no-underline md:py-[17px]">Find My Plan in 2 Minutes</Link>
              <Link href="/shop?tab=plans" className="cl-btn rounded-full border-[1.5px] border-ink bg-white px-[26px] py-[15px] text-center text-base font-bold text-ink no-underline md:bg-cream md:py-4">Browse Plans</Link>
            </div>
            <div className="cl-up cl-d5 mt-[22px] hidden items-center gap-4 self-start rounded-full bg-white py-2.5 pl-2.5 pr-[22px] shadow-soft md:flex">
              <div className="flex">
                {["efo-riro.jpg", "ofada.jpg", "pepper-soup.jpg"].map((f, i) => (
                  <Image key={f} src={imgSrc(f)} alt="" width={42} height={42} className={`size-[42px] rounded-full border-2 border-white object-cover ${i ? "-ml-3" : ""}`} />
                ))}
              </div>
              <div className="text-sm leading-snug">24 dishes a week, portions <b className="text-green">weighed</b>,<br />calories <b className="text-green">counted</b>, pepper left in</div>
            </div>
          </div>

          {/* mobile photo */}
          <div className="relative mt-7 md:hidden">
            <div className="cl-up cl-d5 relative h-[470px] overflow-hidden rounded-[28px] border-[6px] border-white shadow-[0_24px_50px_rgba(0,0,0,0.25)]">
              <Image src="/images/hero-tall.jpg" alt="Smiling woman holding a Chop Lean jollof meal box" fill priority sizes="390px" className="object-cover [object-position:center_30%]" />
            </div>
            <div className="cl-float absolute -left-1.5 bottom-[26px] flex items-center gap-2.5 rounded-2xl bg-white py-2.5 pl-2.5 pr-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.2)]">
              <Image src="/images/jollof.jpg" alt="" width={44} height={44} className="size-11 rounded-[10px] object-cover" />
              <span className="leading-snug"><b className="block text-sm">Jollof and chicken</b><span className="text-xs text-muted">450 kcal · 38g protein</span></span>
            </div>
            <div className="cl-float2 absolute -right-1 top-5 rounded-full bg-yellow px-3.5 py-2 text-[13px] font-bold shadow-[0_8px_18px_rgba(0,0,0,0.2)]">Next-day delivery</div>
            <SpinBadge className="absolute -left-2.5 -top-[26px] size-[86px]" size={80} />
          </div>

          {/* desktop floating elements */}
          <div className="relative hidden min-h-[560px] md:col-span-6 md:block">
            <div className="cl-float absolute bottom-10 left-[4%] flex items-center gap-3.5 rounded-[20px] bg-white py-3 pl-3 pr-[18px] shadow-chip">
              <Image src="/images/jollof.jpg" alt="" width={56} height={56} className="size-14 rounded-[14px] object-cover" />
              <div className="leading-snug"><div className="text-[15px] font-bold">Jollof, chicken and plantain</div><div className="text-[13px] text-muted">450 kcal · 38g protein</div></div>
            </div>
            <div className="cl-float2 absolute right-[2%] top-[30px] flex items-center gap-2 rounded-full bg-yellow px-[18px] py-[11px] text-sm font-bold shadow-[0_10px_24px_rgba(0,0,0,0.2)]"><Truck size={16} strokeWidth={2.2} aria-hidden />Next-day delivery · Lagos</div>
            <SpinBadge className="absolute -left-[46px] top-[120px] size-[132px]" size={120} big />
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="overflow-hidden border-t border-green-dark bg-ink text-[#F3F1E8]" aria-label="Popular dishes">
        <div className="cl-marquee flex w-max py-3 md:py-4">
          {ticker.map(([name, slug, img], i) => (
            <span key={i} className="flex items-center gap-2.5 whitespace-nowrap px-[18px] font-display text-base font-semibold md:gap-3.5 md:px-7 md:text-xl" aria-hidden={i >= TICKER.length}>
              <Image src={imgSrc(img)} alt="" width={40} height={40} className="size-8 rounded-full object-cover md:size-10" />
              {name}
              {kcalOf(slug) && <span className="text-xs font-bold text-yellow md:text-sm">{kcalOf(slug)} kcal</span>}
              <span className="hidden text-[22px] text-green md:inline">✱</span>
            </span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="container-x pb-10 pt-10 md:pb-20 md:pt-6">
        <div className="mb-[18px] md:hidden"><SectionTitle watermark="Easy" align="left">How it works</SectionTitle></div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1.5 md:mx-0 md:grid md:grid-cols-4 md:gap-0 md:overflow-visible md:rounded-3xl md:border md:border-line md:bg-white md:px-0 [&::-webkit-scrollbar]:hidden">
          {STEPS.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.06} className="flex min-w-[236px] snap-start flex-col gap-2 rounded-[20px] border border-line bg-white p-[18px] md:min-w-0 md:gap-2.5 md:rounded-none md:border-0 md:border-r md:p-7 md:last:border-r-0">
              <span className="font-serif text-[32px] leading-none text-green md:text-[40px]">{n}</span>
              <span className="font-display text-[17px] font-bold md:text-xl">{t}</span>
              <span className="text-[13px] leading-normal text-muted md:text-sm">{d}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SHOP BY GOAL */}
      <section className="relative pb-6 pt-6 md:pb-[110px] md:pt-10">
        <div aria-hidden className="absolute left-0 top-[150px] hidden h-[420px] w-[34%] bg-green [clip-path:polygon(0_0,100%_0,84%_100%,0_100%)] md:block" />
        <div aria-hidden className="absolute left-5 top-[170px] hidden rotate-180 font-serif text-[120px] leading-none text-white/10 [writing-mode:vertical-rl] md:block">LEAN</div>
        <div className="container-x relative">
          <div className="mb-[18px] md:mb-10"><SectionTitle watermark="Goals" align="left">Shop by Goal</SectionTitle></div>
          <div className="-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1.5 md:mx-0 md:grid md:grid-cols-5 md:gap-5 md:overflow-visible md:pl-[180px] md:pr-0 [&::-webkit-scrollbar]:hidden">
            {cats.map((c) => {
              const st = CAT_STYLE[c.slug] ?? { bg: "#DCEFD2", href: "/shop" };
              return (
                <Reveal key={c.id} className="shrink-0 md:shrink">
                  <Link href={st.href} className="cl-lift flex flex-col items-center gap-3 text-ink no-underline md:gap-[18px] md:rounded-[22px] md:bg-white md:px-[22px] md:pb-7 md:pt-6 md:shadow-[0_12px_30px_rgba(21,32,26,0.06)]">
                    <span className="order-2 flex size-[84px] items-center justify-center rounded-full p-1.5 md:order-none md:size-[140px] md:p-2" style={{ background: st.bg }}>
                      <Image src={imgSrc(c.image)} alt="" width={140} height={140} className="size-full rounded-full object-cover" />
                    </span>
                    <span className="order-3 text-xs font-medium md:order-none md:hidden">{c.name.split(" ")[0]} {c.name.split(" ")[1]}</span>
                    <span className="hidden min-h-[46px] font-display text-[19px] font-bold leading-tight md:order-first md:block">{c.name}</span>
                    <span className="hidden text-[13px] text-muted md:block">{c.blurb}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* THIS WEEK'S PLANS */}
      <section className="container-x pb-12 pt-6 md:pb-[100px] md:pt-0">
        <SectionTitle watermark="Plans" sub="Weekly subscriptions. Pause, skip or swap meals any time before Thursday 6pm.">This Week&apos;s Plans</SectionTitle>
        <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-1.5 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {plans.map((p) => (
            <div key={p.id} className="w-[270px] shrink-0 snap-start md:w-auto"><PlanCard p={p} /></div>
          ))}
        </div>
      </section>

      {/* OFFERS */}
      <section className="container-x relative pb-14 md:pb-[110px]">
        <div aria-hidden className="watermark absolute left-5 top-[-60px] hidden text-[170px] md:block">Offers</div>
        <h2 className="relative mb-6 hidden text-[40px] tracking-[-0.03em] md:mb-8 md:block">Offers This Week</h2>
        <div className="relative grid gap-4 md:h-[470px] md:grid-cols-5 md:grid-rows-2 md:gap-5">
          <Reveal className="relative flex min-h-[420px] flex-col gap-3 overflow-hidden rounded-[26px] bg-mint p-7 md:col-span-3 md:row-span-2 md:p-11">
            <span className="flex items-center gap-2 text-base"><span className="h-0.5 w-[22px] bg-ink" />First week <b className="text-green">20% off</b></span>
            <span className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] md:text-[60px]">Start Lighter</span>
            <span className="max-w-[300px] text-base text-body">Any plan, first 7 days. Use code <b className="text-green-dark">CHOPLEAN20</b> at checkout.</span>
            <Link href="/shop?tab=plans" className="cl-btn mt-2.5 self-start rounded-full bg-green px-[22px] py-3 text-sm font-bold text-white no-underline">Shop Plans</Link>
            <Image src="/images/fried-rice.jpg" alt="Fried rice with chicken" width={360} height={360} className="absolute -bottom-14 -right-10 size-[300px] rounded-full border-[10px] border-white object-cover shadow-[0_20px_40px_rgba(0,0,0,0.15)] md:size-[360px]" />
          </Reveal>
          <Reveal className="cl-lift relative hidden overflow-hidden rounded-[26px] bg-pink p-[30px] md:col-span-2 md:block">
            <div className="font-display text-[30px] font-bold tracking-tight">Swallow Smart</div>
            <div className="mt-1 max-w-[220px] text-sm">Oat, wheat and plantain swallows in 150g balls</div>
            <Link href="/shop?tab=plans&tag=swallow" className="mt-3.5 inline-block rounded-full bg-price-red px-4 py-2.5 text-[13px] font-bold text-white no-underline">Shop Now</Link>
            <Image src="/images/egusi.jpg" alt="Egusi soup" width={190} height={190} className="absolute -bottom-10 -right-5 size-[190px] rounded-full border-[6px] border-white object-cover" />
          </Reveal>
          <Reveal className="cl-lift relative hidden overflow-hidden rounded-[26px] bg-lavender p-[30px] md:col-span-2 md:block">
            <div className="font-serif text-[32px]">Zero-Sugar Drinks</div>
            <div className="mt-1.5 text-[13px]">Up to</div>
            <div className="font-display text-[30px] font-extrabold leading-none">25%<span className="text-sm font-medium"> off</span></div>
            <Link href="/shop?tab=drinks" className="mt-3 inline-block rounded-full bg-[#4B55B0] px-4 py-2.5 text-[13px] font-bold text-white no-underline">Shop Now</Link>
            <Image src="/images/zobo.jpg" alt="Zobo drink bottles" width={150} height={200} className="absolute bottom-[22px] right-[22px] top-[22px] h-[calc(100%-44px)] w-[150px] rounded-[18px] object-cover" />
          </Reveal>
        </div>
      </section>

      {/* METHOD */}
      <section className="relative overflow-hidden bg-ink text-[#F3F1E8]">
        <div aria-hidden className="absolute -right-10 top-2.5 font-serif text-[110px] italic leading-none text-white/[0.04] md:text-[220px]">Jollof</div>
        <div className="container-x relative grid items-center gap-10 py-14 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="flex flex-col gap-5">
            <span className="label-sm tracking-[0.16em] text-yellow">The Chop Lean method</span>
            <h2 className="font-serif text-[34px] font-normal leading-[1.05] tracking-normal md:text-[58px]">
              Same jollof. <span className="italic text-[#A9D18E]">Half the oil.</span><span className="hidden md:inline"> A plate you can finish without guilt.</span>
            </h2>
            <p className="hidden max-w-[500px] text-[17px] leading-[1.7] text-[#B9BDB4] md:block">We don&apos;t take Nigerian food away from you. We weigh every scoop, swap in some cauliflower rice, grill instead of fry and measure the oil. You get the taste you know and a calorie count you can plan around.</p>
          </div>
          <Reveal className="rounded-[26px] border border-white/[0.08] bg-dark-card p-6 md:p-8">
            <div className="grid grid-cols-3 text-[15px]">
              <span className="py-3.5 text-[13px] text-[#9AA096]">Per plate (approx.)</span>
              <span className="py-3.5 text-[13px] text-[#9AA096]">Typical party plate</span>
              <span className="py-3.5 text-[13px] font-bold text-yellow">Chop Lean plate</span>
              {COMPARE.map(([k, a, b]) => (
                <div key={k} className="contents">
                  <span className="border-t border-white/[0.08] py-4">{k}</span>
                  <span className="border-t border-white/[0.08] py-4 text-[#B9BDB4]">{a}</span>
                  <span className="border-t border-white/[0.08] py-4 font-bold text-[#A9D18E]">{b}</span>
                </div>
              ))}
            </div>
            <div className="mt-[18px] text-xs text-[#9AA096]">Estimates for illustration. Final figures come from the kitchen&apos;s weighed recipes.</div>
          </Reveal>
        </div>
      </section>

      {/* NEW ON THE MENU */}
      <section className="container-x pb-16 pt-16 md:pb-[90px] md:pt-[110px]">
        <SectionTitle watermark="Menu">New on the Menu</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {newMeals.map((m) => <MealCard key={m.id} p={m} />)}
        </div>
      </section>

      {/* KITCHEN TO GATE */}
      <section className="container-x relative pb-16 md:pb-[110px]">
        <div aria-hidden className="watermark absolute left-5 top-[-70px] hidden text-[170px] md:block">Kitchen</div>
        <div className="relative mb-6 flex flex-col justify-between gap-4 md:mb-9 md:flex-row md:items-end md:gap-6">
          <h2 className="text-[30px] tracking-[-0.03em] md:text-5xl">From Our Kitchen <span className="text-green">to Your Gate</span></h2>
          <p className="hidden max-w-[380px] text-[15px] leading-relaxed text-muted md:block">Cooked fresh in Yaba every delivery morning, packed and labelled per person, and on a bike by 7am.</p>
        </div>
        <div className="relative grid gap-4 md:grid-cols-12 md:gap-5">
          {[
            { src: "kitchen.jpg", alt: "Chef cooking in the Chop Lean kitchen", t: "1 · Cooked fresh", d: "Measured oil, weighed portions, no leftovers.", span: "md:col-span-4", bg: "bg-white", dc: "text-muted" },
            { src: "meal-box.jpg", alt: "Stacked meal prep containers", t: "2 · Packed and labelled", d: "Name, day and calories on every lid.", span: "md:col-span-3", bg: "bg-white", dc: "text-muted" },
            { src: "rider.jpg", alt: "Delivery rider handing a meal bag to a customer at her gate", t: "3 · Delivered chilled", d: "Mon, Wed and Fri across Lagos. Heat for 3 minutes and eat.", span: "md:col-span-5", bg: "bg-yellow", dc: "text-[#3A3000]" },
          ].map((f) => (
            <Reveal key={f.src} className={f.span}>
              <figure className="cl-zoom relative h-[300px] overflow-hidden rounded-[26px] md:h-[480px]">
                <Image src={imgSrc(f.src)} alt={f.alt} fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover" />
                <figcaption className={`absolute inset-x-4 bottom-4 rounded-2xl px-4 py-3.5 ${f.bg}`}>
                  <b className="block font-display text-[17px]">{f.t}</b>
                  <span className={`text-[13px] ${f.dc}`}>{f.d}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* REVIEWS (real reviews only) */}
      <section id="results" className="container-x pb-16 md:pb-[110px]">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col justify-between gap-5 overflow-hidden rounded-[26px] bg-green pb-9 text-white">
            <Image src="/images/woman-cafe.jpg" alt="Woman enjoying a meal at a table" width={600} height={190} className="h-[190px] w-full object-cover" />
            <span className="px-9 pt-1.5 font-serif text-[44px] leading-[1.05]">Real people.<br /><span className="italic text-yellow">Real plates.</span></span>
            <span className="px-9 text-[15px] leading-relaxed text-mint">Reviews from verified orders only. Customers can add their weekly weigh-ins to their review.</span>
          </div>
          {[0, 1].map((i) => {
            const r = reviews[i];
            return (
              <div key={i} className="flex flex-col gap-[18px] rounded-[26px] border border-line bg-white p-[34px]">
                <span className="text-xl tracking-[2px] text-yellow" aria-label={r ? `${r.rating} out of 5 stars` : "No rating yet"}>
                  {r ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "★★★★★"}
                </span>
                <span className="font-serif text-2xl leading-snug">{r ? `“${r.body}”` : "“[Customer review goes here, pulled from a verified order.]”"}</span>
                <span className="mt-auto flex items-center gap-3">
                  <span className={`size-11 rounded-full ${i ? "bg-lavender" : "bg-pink"}`} />
                  <span className="flex flex-col"><b>{r ? r.name : "[Customer name]"}</b><span className="text-[13px] text-muted">{r ? r.product : "[Plan] · [weeks on plan]"}</span></span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function SpinBadge({ className, size, big }: { className: string; size: number; big?: boolean }) {
  return (
    <div aria-hidden className={`${className} flex items-center justify-center rounded-full bg-ink shadow-[0_14px_30px_rgba(0,0,0,0.25)]`}>
      <svg className="cl-spin" viewBox="0 0 120 120" width={size} height={size}>
        <defs><path id={big ? "clCirc" : "clCircM"} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
        <text style={{ fontFamily: "var(--font-dm-sans)", fontSize: big ? 10.5 : 11, fontWeight: 700, letterSpacing: big ? 2.6 : 2.4, fill: "#F6B81A" }}>
          <textPath href={`#${big ? "clCirc" : "clCircM"}`}>CALORIE COUNTED • NAIJA MADE • </textPath>
        </text>
      </svg>
      <span className="absolute font-serif text-white" style={{ fontSize: big ? 30 : 18 }}>-0.5<span style={{ fontSize: big ? 14 : 10 }}>kg</span></span>
    </div>
  );
}
