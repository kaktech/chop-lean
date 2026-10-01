"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { useUI } from "@/lib/store";
import { CartBadge } from "./CartButton";
import { LogoMark, Wordmark } from "./Logo";
import { whatsappUrl } from "@/lib/site";

const ITEMS = [
  { href: "/menu", t: "Full Menu", d: "Every dish, with calories and prices" },
  { href: "/shop?tab=plans", t: "Meal Plans", d: "Weekly, 1,200–1,800 kcal" },
  { href: "/collections/drinks", t: "Snacks and Drinks", d: "Zero-sugar zobo, tiger nut and more" },
  { href: "/about", t: "Our Kitchen", d: "How we cook, pack and deliver" },
  { href: "/delivery", t: "Delivery", d: "Zones, days and cut-off times" },
  { href: "/results", t: "Results", d: "Reviews from verified orders" },
  { href: "/account#weight", t: "Weight Tracker", d: "Log your weekly weigh-in" },
];

const MORE = [["Track an order", "/track"], ["Saved dishes", "/favourites"], ["Meet the dietitian", "/dietitian"], ["FAQs", "/faq"], ["Contact", "/contact"], ["Gift cards", "/gift-cards"]];

export function MenuButton() {
  const setMenuOpen = useUI((s) => s.setMenuOpen);
  return (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      aria-label="Open menu"
      className="flex size-11 items-center justify-center rounded-full border border-line text-fg"
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
    <div role="dialog" aria-modal="true" aria-label="Menu" className="cl-fade fixed inset-0 z-50 overflow-y-auto bg-canvas lg:hidden">
      <div aria-hidden className="pointer-events-none absolute -right-6 bottom-10 w-24 select-none font-serif text-[150px] leading-[0.8] text-white/5 [writing-mode:vertical-rl]">LEAN</div>
      <div className="relative flex items-center gap-2.5 border-b-2 border-fg px-4 py-2.5">
        <button type="button" onClick={close} aria-label="Close menu" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface">
          <X size={20} aria-hidden />
        </button>
        <Link href="/" onClick={close} className="flex flex-1 items-center justify-center gap-2 text-fg no-underline"><LogoMark size={28} /><Wordmark className="text-[22px]" /></Link>
        <Link href="/cart" onClick={close} aria-label="Cart" className="relative flex size-11 items-center justify-center rounded-full bg-yellow font-display font-bold">
          <CartBadge className="static !m-0 size-auto bg-transparent text-[15px] text-fg" />
        </Link>
      </div>
      <nav aria-label="Menu" className="relative px-6">
        {ITEMS.map((i) => (
          <Link key={i.t} href={i.href} onClick={close} className="flex items-center border-b border-line py-5 text-fg no-underline">
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
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-1 pb-4 text-[15px]">
          {MORE.map(([l, h]) => <Link key={l} href={h} onClick={close} className="flex min-h-11 items-center text-fg underline-offset-4 hover:underline">{l}</Link>)}
        </div>
        <div className="flex flex-col gap-1 pb-10 text-[15px]">
          <Link href="/account" onClick={close} className="flex min-h-11 items-center font-bold text-yellow underline">Sign in / My account</Link>
          <a href={whatsappUrl()} className="flex min-h-11 items-center text-fg underline">Chat on WhatsApp</a>
          <span className="text-muted">Nigeria (NGN ₦)</span>
        </div>
      </nav>
    </div>
  );
}
