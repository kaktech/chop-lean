"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { formatNaira, formatNairaFull } from "@/lib/money";
import { planUnitPrice, type PlanPricingInput } from "@/lib/pricing";
import { badgeStyle } from "@/lib/product-ui";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { usePlan } from "./PlanContext";
import { imgSrc } from "@/lib/img";

export type Shot = { src: string; title: string; day: string };
type Props = {
  product: { id: string; slug: string; name: string; image: string | null; badge: string | null; description: string | null; kcal: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null; compareAtKobo: number | null; priceKobo: number; goal: string | null; mealsPerDay: number | null; daysPerWeek: number | null };
  pricing: PlanPricingInput;
  shots: Shot[];
  dates: { iso: string; label: string }[];
  soldOut: boolean;
  rating: { count: number; avg: number };
};

const GOAL_LABEL: Record<string, string> = { lose: "Weight-loss plan", keep: "Maintenance plan", gain: "Muscle plan" };

export function PlanPurchase({ product: p, pricing, shots, dates, soldOut, rating }: Props) {
  const addToCart = useAddToCart();
  const { swaps } = usePlan();
  const calorieOptions = pricing.calorieOptions.map((c) => c.kcal);
  const [kcal, setKcal] = useState<number | undefined>(p.kcal ?? undefined);
  const [meals, setMeals] = useState(p.mealsPerDay ?? 3);
  const [days, setDays] = useState(p.daysPerWeek ?? 5);
  const [first, setFirst] = useState(dates[0]?.iso ?? "");
  const [excl, setExcl] = useState("");
  const [weeks, setWeeks] = useState(1);
  const [shot, setShot] = useState(0);

  const unit = useMemo(() => planUnitPrice(pricing, { kcal, mealsPerDay: meals, daysPerWeek: days }), [pricing, kcal, meals, days]);
  const subUnit = useMemo(() => planUnitPrice(pricing, { kcal, mealsPerDay: meals, daysPerWeek: days, subscribe: true }), [pricing, kcal, meals, days]);
  const base = pricing.basePriceKobo;
  const was = p.compareAtKobo ? Math.round((p.compareAtKobo * unit) / base / 10_000) * 10_000 : null;
  const ratio = kcal && p.kcal ? kcal / p.kcal : 1;
  const mealOptions = Array.from({ length: p.mealsPerDay ?? 1 }, (_, i) => i + 1).filter((n) => (p.mealsPerDay ?? 1) <= 1 ? n === 1 : n >= 2);
  const current = shots[shot];

  const add = (subscribe: boolean) => {
    if (soldOut) return;
    const clean = Object.keys(swaps).length ? swaps : undefined;
    addToCart(
      { id: p.id, slug: p.slug, type: "plan", name: p.name, image: p.image, priceKobo: base },
      { unitKobo: subscribe ? subUnit : unit, qty: weeks, openDrawer: true, options: { kcal, mealsPerDay: meals, daysPerWeek: days, firstDelivery: first, exclusions: excl.trim() || undefined, subscribe: subscribe || undefined, swaps: clean } },
    );
  };

  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => setShareUrl(window.location.href), []);
  const shareText = `${p.name} from Chop Lean`;
  const sel = "min-h-11 w-full rounded-xl border border-input-line bg-white px-3.5 text-[15px]";
  const lab = "label-sm mb-2 block text-[11px] text-muted";

  return (
    <section className="container-x grid gap-8 pb-28 pt-5 md:grid-cols-2 md:gap-12 md:pb-20 md:pt-8">
      {/* Gallery */}
      <div>
        <div className="relative overflow-hidden rounded-[28px] bg-green md:p-8">
          <div aria-hidden className="watermark absolute left-6 top-4 hidden text-[160px] !text-white !opacity-10 md:block">{kcal}</div>
          {p.badge && <span className={`absolute right-4 top-4 z-10 rounded-md px-3 py-1.5 text-[11px] font-bold md:right-8 md:top-8 ${p.badge.startsWith("-") ? "bg-red text-white" : badgeStyle(p.badge)}`}>{p.badge.startsWith("-") ? `SAVE ${p.badge.slice(1)}` : p.badge}</span>}
          <div className="relative aspect-[4/4.2] overflow-hidden md:rounded-[24px] md:border-[10px] md:border-white md:shadow-chip">
            {shots.map((s, i) => (
              <Image key={s.src} src={imgSrc(s.src)} alt={s.title} fill priority={i === 0} sizes="(min-width:768px) 45vw, 100vw"
                className={`object-cover transition-opacity duration-300 ${i === shot ? "opacity-100" : "opacity-0"}`} />
            ))}
          </div>
          {current && (
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white px-4 py-2.5 shadow-soft md:bottom-12 md:left-12">
              <b className="block text-sm">{current.day}</b><span className="text-xs text-muted">{current.title}</span>
            </div>
          )}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden" aria-hidden>
            {shots.map((_, i) => <span key={i} className={`h-1.5 rounded-full bg-white ${i === shot ? "w-6" : "w-1.5 opacity-60"}`} />)}
          </div>
        </div>
        {shots.length > 1 && (
          <ul className="mt-4 hidden grid-cols-4 gap-3 md:grid">
            {shots.map((s, i) => (
              <li key={s.src}>
                <button type="button" onClick={() => setShot(i)} aria-label={`Show ${s.title}`} aria-pressed={i === shot}
                  className={`relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 ${i === shot ? "border-green" : "border-line"}`}>
                  <Image src={imgSrc(s.src)} alt="" fill sizes="12vw" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Details */}
      <div>
        <div className="flex items-center gap-2.5 text-[13px] font-medium">
          <span className="hidden h-[3px] w-6 rounded-sm bg-yellow md:block" />
          <span className="text-red md:text-ink">{GOAL_LABEL[p.goal ?? "lose"]} <span className="text-red">· Weekly subscription</span></span>
        </div>
        <h1 className="mt-2 text-[34px] uppercase leading-none tracking-[-0.04em] md:mt-3 md:text-[56px]">{p.name}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          <span aria-hidden className="tracking-widest text-input-line">★★★★★</span>
          {rating.count > 0 ? <span>{rating.avg.toFixed(1)} ({rating.count}) · <a href="#reviews" className="text-green underline">Read reviews</a></span> : <span>No reviews yet · <a href="#reviews" className="text-green underline">Be the first</a></span>}
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <span className="font-display text-[26px] font-bold text-price-red md:text-4xl"><span className="md:hidden">{formatNaira(unit * weeks)}</span><span className="hidden md:inline">{formatNairaFull(unit * weeks)}</span></span>
          {was && <span className="text-sm text-muted line-through">{formatNairaFull(was * weeks)}</span>}
          <span className="text-sm text-muted">{weeks > 1 ? `for ${weeks} weeks` : "per week"}</span>
        </div>
        <p className="mt-4 hidden max-w-[560px] text-base leading-relaxed text-body md:block">{p.description} Built for steady loss without giving up swallow, stew or pepper.</p>

        <dl className="mt-5 grid grid-cols-4 gap-2.5">
          {[[(kcal ?? 0).toLocaleString("en-NG"), "kcal / day"], [`${Math.round((p.proteinG ?? 0) * ratio)}g`, "protein"], [`${Math.round((p.carbsG ?? 0) * ratio)}g`, "carbs"], [`${Math.round((p.fatG ?? 0) * ratio)}g`, "fat"]].map(([v, l]) => (
            <div key={l} className="rounded-2xl border border-line bg-white px-2 py-3 text-center md:px-4 md:py-3.5 md:text-left"><dt className="sr-only">{l}</dt><dd className="font-display text-lg font-bold leading-tight md:text-xl">{v}<span className="block text-[11px] font-normal text-muted md:text-xs">{l}</span></dd></div>
          ))}
        </dl>

        {calorieOptions.length > 1 && (
          <fieldset className="mt-6"><legend className={lab}>Calories per day</legend>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {calorieOptions.map((k) => (
                <button key={k} type="button" onClick={() => setKcal(k)} aria-pressed={kcal === k}
                  className={`tap shrink-0 rounded-full border px-5 text-sm ${kcal === k ? "border-ink bg-ink font-bold text-white" : "border-input-line bg-white"}`}>{k.toLocaleString("en-NG")} kcal</button>
              ))}
            </div></fieldset>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3.5 md:grid-cols-3">
          <div><label htmlFor="pp-meals" className={lab}>Meals per day</label>
            <select id="pp-meals" value={meals} onChange={(e) => setMeals(+e.target.value)} className={sel}>{mealOptions.map((n) => <option key={n} value={n}>{n} meal{n > 1 ? "s" : ""}</option>)}</select></div>
          <div className="hidden md:block"><label htmlFor="pp-days" className={lab}>Days per week</label>
            <select id="pp-days" value={days} onChange={(e) => setDays(+e.target.value)} className={sel}><option value={3}>3 days (Mon/Wed/Fri)</option><option value={5}>5 days (Mon–Fri)</option></select></div>
          <div><label htmlFor="pp-first" className={lab}>First delivery</label>
            <select id="pp-first" value={first} onChange={(e) => setFirst(e.target.value)} className={sel}>{dates.map((d) => <option key={d.iso} value={d.iso}>{d.label}</option>)}</select></div>
        </div>
        <div className="mt-4 md:hidden"><label htmlFor="pp-days-m" className={lab}>Days per week</label>
          <select id="pp-days-m" value={days} onChange={(e) => setDays(+e.target.value)} className={sel}><option value={3}>3 days (Mon/Wed/Fri)</option><option value={5}>5 days (Mon–Fri)</option></select></div>
        <div className="mt-4"><label htmlFor="pp-excl" className={lab}>Allergies or ingredients to leave out (optional)</label>
          <input id="pp-excl" value={excl} onChange={(e) => setExcl(e.target.value.slice(0, 200))} placeholder="e.g. no crayfish, no groundnut" className={sel} /></div>

        {soldOut && <p role="status" className="mt-5 rounded-2xl bg-butter px-4 py-3 text-sm font-medium">This plan is sold out for the week. Check back Sunday for new slots.</p>}

        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:z-auto md:mt-5 md:border-0 md:bg-transparent md:p-0">
          <div className="flex items-center rounded-full border border-input-line bg-white">
            <button type="button" aria-label="Fewer weeks" onClick={() => setWeeks((w) => Math.max(1, w - 1))} className="tap flex items-center justify-center"><Minus size={16} aria-hidden /></button>
            <span className="min-w-12 text-center text-sm font-bold" aria-live="polite">{weeks}<span className="hidden md:inline"> wk</span></span>
            <button type="button" aria-label="More weeks" onClick={() => setWeeks((w) => Math.min(12, w + 1))} className="tap flex items-center justify-center"><Plus size={16} aria-hidden /></button>
          </div>
          <button type="button" disabled={soldOut} onClick={() => add(false)} className="cl-btn min-h-12 flex-1 rounded-full bg-green px-4 font-bold text-white disabled:opacity-50">
            Add to Cart<span className="md:hidden"> · {formatNaira(unit * weeks)}</span>
          </button>
        </div>
        <button type="button" disabled={soldOut} onClick={() => add(true)} className="cl-btn mt-3 hidden min-h-12 w-full rounded-full bg-yellow font-bold text-ink disabled:opacity-50 md:block">Subscribe and save 10% every week ({formatNaira(subUnit)} / wk)</button>

        <div className="mt-4 flex items-center gap-4 text-[13px] text-muted">
          Share
          <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer" className="font-bold text-green underline">WhatsApp</a>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="font-bold text-green underline">X</a>
          <button type="button" className="font-bold text-green underline" onClick={() => navigator.clipboard?.writeText(shareUrl).then(() => toast.success("Link copied"))}>Copy link</button>
        </div>
      </div>
    </section>
  );
}
