"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { useUI } from "@/lib/store";
import { CartBadge } from "./CartButton";
import { Wordmark } from "./Logo";

const ITEMS = [
  { href: "/shop?tab=plans", t: "Meal Plans", d: "Weekly, 1,200–1,800 kcal" },
  { href: "/shop?tab=meals", t: "Single Meals", d: "Order one plate at a time" },
  { href: "/shop?tab=drinks", t: "Snacks and Drinks", d: "Zero-sugar zobo, tiger nut and more" },
  { href: "/account#weight", t: "Weight Tracker", d: "Log your weekly weigh-in" },
  { href: "/#results", t: "Results", d: "Reviews from verified orders" },
];

export function MenuButton() {
  const setMenuOpen = useUI((s) => s.setMenuOpen);
  return (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      aria-label="Open menu"
      className="flex size-11 items-center justify-center rounded-full border border-line"
    >
      <Menu size={20} strokeWidth={2} aria-hidden />
    </button>
  );
}

export function MenuDrawer() {
  const open = useUI((s) => s.menuOpen);
  const setOpen = useUI((s) => s.setMenuOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="cl-fade fixed inset-0 z-50 overflow-y-auto bg-cream md:hidden">
      <div aria-hidden className="pointer-events-none absolute -right-6 bottom-10 w-24 select-none font-serif text-[150px] leading-[0.8] text-ink/5 [writing-mode:vertical-rl]">LEAN</div>
      <div className="relative flex items-center gap-2.5 border-b-2 border-ink px-4 py-2.5">
        <button type="button" onClick={close} aria-label="Close menu" className="flex size-11 items-center justify-center rounded-full border border-line bg-white">
          <X size={20} aria-hidden />
        </button>
        <Link href="/" onClick={close} className="flex-1 text-center text-ink no-underline"><Wordmark className="text-[23px]" /></Link>
        <Link href="/cart" onClick={close} aria-label="Cart" className="relative flex size-11 items-center justify-center rounded-full bg-yellow font-display font-bold">
          <CartBadge className="static !m-0 size-auto bg-transparent text-[15px] text-ink" />
        </Link>
      </div>
      <nav aria-label="Menu" className="relative px-6">
        {ITEMS.map((i) => (
          <Link key={i.t} href={i.href} onClick={close} className="flex items-center border-b border-line py-5 text-ink no-underline">
            <span className="flex-1">
              <span className="block font-display text-[23px] font-bold leading-tight">{i.t}</span>
              <span className="text-[13px] text-muted">{i.d}</span>
            </span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        ))}
        <Link href="/quiz" onClick={close} className="mt-6 block rounded-3xl bg-green px-5 py-6 text-white no-underline">
          <span className="block font-serif text-2xl">Not sure where to start?</span>
          <span className="mt-1.5 block text-sm">Take the 2-minute plan quiz →</span>
        </Link>
        <div className="mt-14 flex flex-col gap-3.5 pb-10 text-[15px]">
          <Link href="/account" onClick={close} className="font-bold text-ink underline">Sign in / My account</Link>
          <Link href="/shop" onClick={close} className="text-ink underline">Gift a week of meals</Link>
          <a href="https://wa.me/2340000000000" className="text-ink underline">Chat on WhatsApp</a>
          <span className="text-muted">Nigeria (NGN ₦)</span>
        </div>
      </nav>
    </div>
  );
}
