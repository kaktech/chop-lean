import Image from "next/image";
import Link from "next/link";
import { Check, Info } from "lucide-react";
import type { Product } from "@/lib/queries";
import type { PlanContent } from "@/lib/plan-content";
import { Reveal } from "@/components/ui/Reveal";
import { formatNaira } from "@/lib/money";
import { imgSrc } from "@/lib/img";

export function PlanHighlights({ plan, content }: { plan: Product; content: PlanContent }) {
  return (
    <section className="container-x pb-4 pt-2 md:pb-10">
      <div className="grid gap-5 md:grid-cols-3">
        {content.highlights.map((h, i) => (
          <Reveal key={h.t} delay={i * 0.06} className="rounded-[24px] border border-line bg-surface p-7">
            <span className="font-serif text-3xl" style={{ color: "var(--color-yellow)" }}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-display text-xl">{h.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{h.d}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-[24px] border border-line bg-tint-green p-7">
          <div className="eyebrow">Great if you want</div>
          <ul className="mt-4 flex flex-col gap-2.5">{content.goodFor.map((g) => <li key={g} className="flex gap-3 text-[15px] text-body"><Check size={18} className="mt-0.5 shrink-0 text-leaf" aria-hidden />{g}</li>)}</ul>
        </div>
        <div className="rounded-[24px] border border-line bg-surface p-7">
          <div className="label-sm text-[11px] text-muted">Might suit you less</div>
          <p className="mt-4 text-[15px] leading-relaxed text-body">{content.lessSuited}</p>
          {content.note && <p className="mt-4 flex gap-2.5 text-sm text-muted"><Info size={16} className="mt-0.5 shrink-0 text-yellow" aria-hidden />{content.note}</p>}
          <p className="mt-4 text-sm text-muted">{plan.mealsPerDay} meal{plan.mealsPerDay === 1 ? "" : "s"} a day · {plan.daysPerWeek} days a week · {plan.kcal?.toLocaleString("en-NG")} kcal</p>
        </div>
      </div>
    </section>
  );
}

export function ComparePlans({ plans, currentSlug }: { plans: Product[]; currentSlug: string }) {
  return (
    <section className="container-x py-12 md:py-20">
      <div className="mb-8"><div className="eyebrow">Compare</div><h2 className="display-xl mt-3 text-[28px] md:text-[42px]">Find the plan that <span className="serif-accent">fits</span></h2></div>
      <div className="overflow-x-auto rounded-[24px] border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr className="label-sm border-b border-line text-[11px] text-muted"><th className="px-5 py-4">Plan</th><th>Calories</th><th>Meals</th><th>Protein</th><th>Carbs</th><th>Price / week</th><th /></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className={`border-b border-line last:border-0 ${p.slug === currentSlug ? "bg-tint-green" : ""}`}>
                <td className="px-5 py-3.5"><Link href={`/plans/${p.slug}`} className="flex items-center gap-3 text-fg no-underline"><Image src={imgSrc(p.image)} alt="" width={44} height={44} className="size-11 rounded-lg object-cover" /><b className="font-display">{p.name}</b></Link></td>
                <td>{p.kcal?.toLocaleString("en-NG")} kcal</td><td>{p.mealsPerDay}/day</td><td>{p.proteinG}g</td><td>{p.carbsG}g</td>
                <td className="font-display font-bold text-price-red">{formatNaira(p.priceKobo)}</td>
                <td className="pr-5 text-right">{p.slug === currentSlug ? <span className="rounded-full bg-yellow px-3 py-1 text-xs font-bold text-canvas">You&apos;re here</span> : <Link href={`/plans/${p.slug}`} className="font-bold text-yellow underline">View</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
