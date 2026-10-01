"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { toQuery, type Filters, type Group } from "@/lib/shop-filters";

function Panel({ f, groups, counts, onNavigate }: { f: Filters; groups: Group[]; counts: Record<string, number>; onNavigate?: () => void }) {
  const router = useRouter();
  const toggle = (field: Group["field"], key: string) => {
    const cur = f[field] as string[];
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    router.push(toQuery(f, { [field]: next, page: 1 }), { scroll: false });
    onNavigate?.();
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg">Filter</h2>
        <Link href={toQuery({ tab: f.tab, q: f.q })} scroll={false} className="text-[13px] font-medium text-green underline" onClick={onNavigate}>Clear all</Link>
      </div>
      {groups.map((g) => (
        <fieldset key={g.field} className="mt-6">
          <legend className="label-sm mb-3 w-full border-b border-line pb-2 text-[11px] text-muted">{g.title}</legend>
          <ul className="flex flex-col">
            {g.options.map((o) => {
              const checked = (f[g.field] as string[]).includes(o.key);
              const id = `f-${g.field}-${o.key}`;
              return (
                <li key={o.key}>
                  <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
                    <input id={id} type="checkbox" checked={checked} onChange={() => toggle(g.field, o.key)} className="size-[18px] accent-green" />
                    <span className="flex-1">{o.label}</span>
                    <span className="text-xs text-muted">{counts[`${g.field}:${o.key}`] ?? 0}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
      <div className="mt-8 rounded-[20px] bg-butter p-5">
        <div className="font-serif text-xl">Not sure which plan?</div>
        <p className="mt-1.5 text-sm text-body">Answer 6 questions and we&apos;ll give you a calorie target.</p>
        <Link href="/quiz" className="cl-btn mt-3 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white no-underline">Take the quiz</Link>
      </div>
    </div>
  );
}

export function FilterSidebar(props: { f: Filters; groups: Group[]; counts: Record<string, number> }) {
  if (!props.groups.length) return null;
  return <aside className="hidden w-[256px] shrink-0 md:block" aria-label="Filters"><Panel {...props} /></aside>;
}

export function MobileFilterButton(props: { f: Filters; groups: Group[]; counts: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  if (!props.groups.length) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="tap flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white md:hidden">
        <SlidersHorizontal size={16} aria-hidden />Filter
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="cl-fade absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="cl-sheet absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-cream p-6 pb-10">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full border border-line bg-white"><X size={18} aria-hidden /></button>
            <Panel {...props} />
            <button type="button" onClick={() => setOpen(false)} className="cl-btn mt-6 w-full rounded-full bg-green py-3.5 font-bold text-white">Show results</button>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({ f }: { f: Filters }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <span>Sort</span>
      <select
        value={f.sort}
        onChange={(e) => router.push(toQuery(f, { sort: e.target.value, page: 1 }), { scroll: false })}
        className="min-h-11 rounded-xl border border-input-line bg-white px-3 text-sm"
      >
        <option value="featured">Featured</option>
        <option value="kcal-asc">Lowest calories</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="newest">Newest</option>
      </select>
    </label>
  );
}
