"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { MenuMeal, WeeklyMenuData } from "@/lib/queries";
import { usePlan } from "./PlanContext";
import { Reveal } from "@/components/ui/Reveal";
import { imgSrc } from "@/lib/img";

const SLOT_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
const fmtWeek = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-NG", { day: "numeric", month: "long", timeZone: "UTC" });

export function WeeklyMenu({ menu }: { menu: WeeklyMenuData }) {
  const { swaps, setSwap } = usePlan();
  const [day, setDay] = useState(menu.days[0].day);
  const [swapFor, setSwapFor] = useState<{ key: string; slot: string; current: MenuMeal } | null>(null);

  const mealAt = (d: string, slot: string, original: MenuMeal) => {
    const id = swaps[`${d}-${slot}`];
    return (id && menu.alternatives.find((a) => a.id === id)) || original;
  };
  const dayTotals = useMemo(
    () => menu.days.map((d) => ({ day: d.day, total: d.meals.reduce((n, m) => n + (mealAt(d.day, m.menuSlot, m).kcal ?? 0), 0) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menu, swaps],
  );
  const avg = Math.round(dayTotals.reduce((n, d) => n + d.total, 0) / dayTotals.length);

  useEffect(() => {
    if (!swapFor) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSwapFor(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [swapFor]);

  const options = swapFor
    ? menu.alternatives.filter((a) => a.id !== swapFor.current.id && a.slot === swapFor.current.slot && Math.abs((a.kcal ?? 0) - (swapFor.current.kcal ?? 0)) <= 100)
    : [];

  return (
    <section id="menu" className="relative overflow-hidden border-t border-line bg-white/40 py-12 md:py-20">
      <div aria-hidden className="watermark absolute -top-4 right-0 hidden text-[200px] md:block">Menu</div>
      <div className="container-x relative">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[26px] md:text-[34px]">This Week&apos;s Menu</h2>
            <p className="mt-1.5 text-sm text-muted">Week of {fmtWeek(menu.weekOf)} · tap any dish to swap it for another with similar calories</p>
          </div>
          <span className="rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-green-dark">Avg {avg.toLocaleString("en-NG")} kcal / day</span>
        </div>

        {/* mobile day tabs */}
        <div className="mt-5 flex gap-2 overflow-x-auto md:hidden" role="tablist" aria-label="Day">
          {menu.days.map((d) => (
            <button key={d.day} type="button" role="tab" aria-selected={day === d.day} onClick={() => setDay(d.day)}
              className={`tap shrink-0 rounded-full border px-5 text-sm font-medium ${day === d.day ? "border-green bg-green font-bold text-white" : "border-input-line bg-white"}`}>{d.day}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-5 md:gap-3.5">
          {menu.days.map((d) => (
            <Reveal key={d.day} className={`rounded-[22px] md:bg-[#F2F1EC] md:p-3.5 ${day === d.day ? "" : "hidden md:block"}`}>
              <div className="mb-3 hidden items-baseline justify-between px-1 md:flex"><b className="font-display text-base">{d.day}</b><span className="text-xs text-muted">{dayTotals.find((t) => t.day === d.day)?.total.toLocaleString("en-NG")} kcal</span></div>
              <ul className="flex flex-col gap-3">
                {d.meals.map((orig) => {
                  const m = mealAt(d.day, orig.menuSlot, orig);
                  const swapped = m.id !== orig.id;
                  const key = `${d.day}-${orig.menuSlot}`;
                  return (
                    <li key={key} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5 md:block md:p-2">
                      <div className="relative size-[76px] shrink-0 overflow-hidden rounded-xl md:h-[84px] md:w-full">
                        <Image src={imgSrc(m.image)} alt="" fill sizes="(min-width:768px) 20vw, 80px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 md:mt-2 md:px-1 md:pb-1">
                        <div className="label-sm text-[10px] text-green">{SLOT_LABEL[orig.menuSlot]}{swapped && " · swapped"}</div>
                        <div className="text-sm font-bold leading-snug">{m.name}</div>
                        <div className="text-xs text-muted">{m.kcal} kcal</div>
                      </div>
                      <button type="button" onClick={() => setSwapFor({ key, slot: orig.slot ?? orig.menuSlot, current: swapped ? orig : orig })}
                        aria-label={`Swap ${m.name}`} className="tap rounded-full bg-mint px-3 text-xs font-bold text-green-dark md:mt-1 md:w-full md:bg-transparent md:text-left md:font-medium md:underline">Swap</button>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>

      {swapFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label="Swap dish">
          <button type="button" aria-label="Close" className="cl-fade absolute inset-0 bg-ink/55" onClick={() => setSwapFor(null)} />
          <div className="cl-sheet relative max-h-[85dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[28px] bg-white p-6 md:rounded-[28px]">
            <div className="flex items-center justify-between"><h3 className="text-xl">Swap {swapFor.current.name}</h3>
              <button type="button" onClick={() => setSwapFor(null)} aria-label="Close" className="flex size-11 items-center justify-center rounded-full border border-line"><X size={18} aria-hidden /></button></div>
            <p className="mt-1 text-sm text-muted">Similar-calorie {swapFor.slot} options ({swapFor.current.kcal} kcal ± 100)</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {swaps[swapFor.key] && (
                <li><button type="button" onClick={() => { setSwap(swapFor.key, null); setSwapFor(null); }} className="tap w-full rounded-2xl border border-dashed border-input-line px-4 py-3 text-left text-sm font-medium">Keep the original: {swapFor.current.name}</button></li>
              )}
              {options.length === 0 && <li className="text-sm text-muted">No similar dishes available for this slot yet.</li>}
              {options.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => { setSwap(swapFor.key, o.id); setSwapFor(null); }} className="flex w-full items-center gap-3 rounded-2xl border border-line p-2.5 text-left hover:border-green">
                    <Image src={imgSrc(o.image)} alt="" width={56} height={56} className="size-14 rounded-xl object-cover" />
                    <span className="flex-1"><b className="block text-sm">{o.name}</b><span className="text-xs text-muted">{o.kcal} kcal</span></span>
                    <span className="text-sm font-bold text-green">Choose</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
