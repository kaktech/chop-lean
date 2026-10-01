"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const POPULAR = ["efo riro", "jollof", "pepper soup", "1400 kcal", "low carb", "zobo"];

export function SearchButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search meals and plans" className={`flex size-11 items-center justify-center rounded-full ${className}`}>
        <Search size={20} strokeWidth={1.8} aria-hidden />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[60]">
          <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="cl-fade absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="cl-up relative mx-auto mt-16 w-[calc(100%-32px)] max-w-[720px] rounded-[28px] border border-line bg-surface p-5 shadow-chip md:mt-28 md:p-7">
            <form action="/shop" role="search" className="flex items-center gap-3 rounded-full bg-surface-2 py-1.5 pl-5 pr-1.5">
              <Search size={20} className="text-muted" aria-hidden />
              <label htmlFor="site-search" className="sr-only">Search meals and plans</label>
              <input ref={ref} id="site-search" name="q" type="search" placeholder="Search efo riro, jollof, 1400 kcal plan…" className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted" />
              <button className="cl-btn tap rounded-full bg-yellow px-6 font-bold text-canvas">Search</button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="label-sm mr-1 text-[11px] text-muted">Popular</span>
              {POPULAR.map((p) => <a key={p} href={`/shop?q=${encodeURIComponent(p)}`} className="tap flex items-center rounded-full border border-line px-4 text-sm text-fg no-underline hover:border-yellow hover:text-yellow">{p}</a>)}
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-muted hover:text-fg"><X size={20} aria-hidden /></button>
          </div>
        </div>
      )}
    </>
  );
}
