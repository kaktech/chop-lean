"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ChevronRight, Menu, ShoppingBag, X } from "lucide-react";
import { useUI } from "@/lib/store";
import { CartBadge } from "./CartButton";
import { LogoMark, Wordmark } from "./Logo";
import { whatsappUrl } from "@/lib/site";
import { signOutAction } from "@/app/actions/auth";

type Row = { t: string; href: string; ext?: boolean };
const SECTIONS: { title: string; rows: Row[] }[] = [
  { title: "Shop", rows: [
    { t: "Full menu", href: "/menu" },
    { t: "Meal plans", href: "/shop?tab=plans" },
    { t: "Snacks and drinks", href: "/collections/drinks" },
    { t: "Plan finder", href: "/quiz" },
    { t: "Saved dishes", href: "/favourites" },
    { t: "Gift cards", href: "/gift-cards" },
  ] },
  { title: "Help", rows: [
    { t: "Track an order", href: "/track" },
    { t: "Delivery zones and times", href: "/delivery" },
    { t: "FAQs", href: "/faq" },
    { t: "Contact us", href: "/contact" },
  ] },
  { title: "About", rows: [
    { t: "Our kitchen", href: "/about" },
    { t: "Meet the dietitian", href: "/dietitian" },
    { t: "Results", href: "/results" },
  ] },
];

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

export function MenuDrawer({ user = null }: { user?: { name: string | null; email: string | null } | null }) {
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
      <div className="relative flex items-center gap-2.5 border-b-2 border-fg px-4 py-2.5">
        <button type="button" onClick={close} aria-label="Close menu" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface">
          <X size={20} aria-hidden />
        </button>
        <Link href="/" onClick={close} className="flex flex-1 items-center justify-center gap-2 text-fg no-underline"><LogoMark size={28} /><Wordmark className="text-[22px]" /></Link>
        <Link href="/cart" onClick={close} aria-label="Cart" className="relative flex size-11 items-center justify-center rounded-full bg-yellow text-canvas">
          <ShoppingBag size={20} strokeWidth={1.8} aria-hidden />
          <CartBadge />
        </Link>
      </div>
      <nav aria-label="Menu" className="relative px-5 pb-12 pt-5">
        {user ? (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Signed in as</div>
            <div className="mt-1 truncate font-display text-lg font-bold">{user.name ?? user.email}</div>
            {user.name && user.email && <div className="truncate text-sm text-muted">{user.email}</div>}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href="/account" onClick={close} className="cl-btn flex min-h-12 items-center justify-center rounded-full border border-line font-bold text-fg no-underline">My account</Link>
              <form action={signOutAction}><button type="submit" className="cl-btn flex min-h-12 w-full items-center justify-center rounded-full bg-yellow font-bold text-canvas">Log out</button></form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/signin" onClick={close} className="cl-btn flex min-h-12 items-center justify-center rounded-full border border-line font-bold text-fg no-underline">Sign in</Link>
            <Link href="/signin?mode=signup" onClick={close} className="cl-btn flex min-h-12 items-center justify-center rounded-full bg-yellow font-bold text-canvas no-underline">Sign up</Link>
          </div>
        )}

        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-7" aria-label={s.title}>
            <h2 className="mb-1 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-yellow">{s.title}</h2>
            <ul className="divide-y divide-line border-y border-line">
              {s.rows.map((r) => (
                <li key={r.t}>
                  <Link href={r.href} onClick={close} className="flex min-h-[52px] items-center justify-between gap-3 px-1 text-[16px] text-fg no-underline active:bg-surface">
                    {r.t}<ChevronRight size={18} aria-hidden className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-7" aria-label="Account">
          <h2 className="mb-1 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-yellow">Account</h2>
          <ul className="divide-y divide-line border-y border-line">
            <li><Link href="/account" onClick={close} className="flex min-h-[52px] items-center justify-between gap-3 px-1 text-[16px] text-fg no-underline active:bg-surface">My account<ChevronRight size={18} aria-hidden className="shrink-0 text-muted" /></Link></li>
            <li><Link href="/account#weight" onClick={close} className="flex min-h-[52px] items-center justify-between gap-3 px-1 text-[16px] text-fg no-underline active:bg-surface">Weight tracker<ChevronRight size={18} aria-hidden className="shrink-0 text-muted" /></Link></li>
            <li><a href={whatsappUrl()} className="flex min-h-[52px] items-center justify-between gap-3 px-1 text-[16px] text-fg no-underline active:bg-surface">Chat on WhatsApp<ChevronRight size={18} aria-hidden className="shrink-0 text-muted" /></a></li>
          </ul>
        </section>

        <p className="mt-8 flex flex-wrap items-center justify-between gap-2 px-1 text-[13px] text-muted">
          <span><Link href="/terms" onClick={close} className="text-muted underline">Terms</Link> · <Link href="/privacy" onClick={close} className="text-muted underline">Privacy</Link></span>
          <span>Nigeria (NGN ₦)</span>
        </p>
      </nav>
    </div>
  );
}
