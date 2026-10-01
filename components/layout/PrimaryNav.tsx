"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { imgSrc } from "@/lib/img";

export type NavPlan = { slug: string; name: string; image: string | null; kcal: number | null; priceLabel: string; badge: string | null };
export type NavCollection = { slug: string; title: string; blurb: string; image: string; count: number };

const trigger = (active: boolean) =>
  `relative flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.14em] no-underline transition-colors after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:bg-yellow after:transition-transform ${active ? "text-yellow after:scale-x-100" : "text-fg after:scale-x-0 hover:text-yellow hover:after:scale-x-100"}`;

/** Left side of the desktop header: plain links plus two hover/click mega-menus (Menu and Meal Plans). */
export function PrimaryNav({ plans, collections }: { plans: NavPlan[]; collections: NavCollection[] }) {
  const path = usePathname();
  const [open, setOpenRaw] = useState<"menu" | "plans" | null>(null);
  const [pinned, setPinned] = useState(false);
  const setOpen = (v: "menu" | "plans" | null) => { setOpenRaw(v); if (!v) setPinned(false); };
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const root = useRef<HTMLUListElement>(null);

  useEffect(() => { setOpenRaw(null); setPinned(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  const enter = (k: "menu" | "plans") => { clearTimeout(timer.current); setOpen(k); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => { if (!pinned) setOpen(null); }, 140); };
  const click = (k: "menu" | "plans") => { if (open === k && pinned) setOpen(null); else { setOpenRaw(k); setPinned(true); } };
  const is = (p: string) => (p === "/" ? path === "/" : path === p || path.startsWith(p + "/"));

  return (
    <ul ref={root} className="flex items-center gap-7">
      <li className="hidden xl:block"><Link href="/" className={trigger(path === "/")}>Home</Link></li>

      <li onMouseEnter={() => enter("menu")} onMouseLeave={leave}>
        <div className="flex items-center">
          <Link href="/menu" className={trigger(is("/menu") || is("/collections"))}>Menu</Link>
          <button type="button" aria-label="Show menu categories" aria-expanded={open === "menu"} aria-controls="mega-menu" onClick={() => click("menu")} className="tap flex items-center justify-center text-fg hover:text-yellow">
            <ChevronDown size={15} className={`transition-transform ${open === "menu" ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
        {open === "menu" && (
          <div id="mega-menu" className="cl-fade absolute inset-x-0 top-full border-b border-line bg-canvas shadow-chip backdrop-blur-xl" onMouseEnter={() => enter("menu")} onMouseLeave={leave}>
            <div className="container-x grid gap-8 py-8 lg:grid-cols-[1fr_260px]">
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {collections.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/collections/${c.slug}`} className="group flex items-center gap-4 rounded-2xl border border-transparent p-2.5 no-underline transition-colors hover:border-line hover:bg-surface">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl"><Image src={`/images/${c.image}`} alt="" fill sizes="56px" className="object-cover transition-transform duration-500 group-hover:scale-110" /></span>
                      <span><b className="block font-display text-[15px] text-fg group-hover:text-yellow">{c.title}</b><span className="text-xs text-muted">{c.count} item{c.count === 1 ? "" : "s"}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5">
                <div><div className="eyebrow !text-[11px]">Everything</div><p className="mt-2 font-display text-lg">See every dish with calories and prices.</p></div>
                <Link href="/menu" className="btn-primary cl-btn mt-4 !min-h-11 !px-5 text-sm">Full menu</Link>
              </div>
            </div>
          </div>
        )}
      </li>

      <li onMouseEnter={() => enter("plans")} onMouseLeave={leave}>
        <div className="flex items-center">
          <Link href="/shop?tab=plans" className={trigger(is("/plans") || (is("/shop") && true))}>Meal Plans</Link>
          <button type="button" aria-label="Show meal plans" aria-expanded={open === "plans"} aria-controls="mega-plans" onClick={() => click("plans")} className="tap flex items-center justify-center text-fg hover:text-yellow">
            <ChevronDown size={15} className={`transition-transform ${open === "plans" ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
        {open === "plans" && (
          <div id="mega-plans" className="cl-fade absolute inset-x-0 top-full border-b border-line bg-canvas shadow-chip backdrop-blur-xl" onMouseEnter={() => enter("plans")} onMouseLeave={leave}>
            <div className="container-x grid gap-8 py-8 lg:grid-cols-[1fr_260px]">
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {plans.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/plans/${p.slug}`} className="group flex items-center gap-4 rounded-2xl border border-transparent p-2.5 no-underline transition-colors hover:border-line hover:bg-surface">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl"><Image src={imgSrc(p.image)} alt="" fill sizes="56px" className="object-cover transition-transform duration-500 group-hover:scale-110" /></span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate font-display text-[15px] text-fg group-hover:text-yellow">{p.name}</b>
                        <span className="text-xs text-muted">{p.kcal?.toLocaleString("en-NG")} kcal · <span className="text-price-red">{p.priceLabel}</span>/wk</span>
                      </span>
                      {p.badge && <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-fg">{p.badge}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5">
                <div><div className="eyebrow !text-[11px]">Not sure?</div><p className="mt-2 font-display text-lg">Take the 2-minute quiz and we&apos;ll pick for you.</p></div>
                <div className="mt-4 flex flex-col gap-2"><Link href="/quiz" className="btn-primary cl-btn !min-h-11 !px-5 text-sm">Find my plan</Link><Link href="/shop?tab=plans" className="btn-outline cl-btn !min-h-11 !px-5 text-sm">Compare all plans</Link></div>
              </div>
            </div>
          </div>
        )}
      </li>

      <li className="hidden xl:block"><Link href="/collections/drinks" className={trigger(is("/collections/drinks"))}>Drinks</Link></li>
    </ul>
  );
}
