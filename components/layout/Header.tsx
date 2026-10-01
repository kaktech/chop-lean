import Link from "next/link";
import { Scale } from "lucide-react";
import { auth } from "@/auth";
import { Logo, LogoMark, Wordmark } from "./Logo";
import { CartButton } from "./CartButton";
import { MenuButton } from "./MenuDrawer";
import { NavLinks } from "./NavLinks";
import { SearchButton } from "./SearchOverlay";
import { FavLink } from "./FavLink";
import { PrimaryNav } from "./PrimaryNav";
import { getPlans } from "@/lib/queries";
import { COLLECTIONS, getCollectionCounts } from "@/lib/collections";
import { formatNaira } from "@/lib/money";
import { whatsappUrl } from "@/lib/site";

const RIGHT = [
  { href: "/about", label: "Our Kitchen" },
  { href: "/delivery", label: "Delivery" },
  { href: "/results", label: "Results", xl: true },
  { href: "/contact", label: "Contact", xl: true },
];

export async function Header() {
  const [session, plans, counts] = await Promise.all([auth().catch(() => null), getPlans().catch(() => []), getCollectionCounts().catch(() => ({} as Record<string, number>))]);
  const user = session?.user;
  const navPlans = plans.map((p) => ({ slug: p.slug, name: p.name, image: p.image, kcal: p.kcal, priceLabel: formatNaira(p.priceKobo), badge: p.badge && !p.badge.startsWith("-") ? p.badge : null }));
  const navCollections = COLLECTIONS.map((c) => ({ slug: c.slug, title: `${c.title} ${c.accent}`, blurb: c.blurb, image: c.image, count: counts[c.slug] ?? 0 }));
  const initial = (user?.name ?? user?.email ?? "A").charAt(0).toUpperCase();

  return (
    <div className="sticky top-0 z-40">
      <div className="bg-green-dark px-3 py-2 text-center text-xs text-[#F3F1E8] md:px-6 md:text-[13px]">
        <div className="container-x hidden items-center justify-between gap-6 tracking-[0.02em] md:flex">
          <span>Cooked fresh daily in Lagos</span>
          <span className="text-yellow">Deliveries Mon · Wed · Fri · Order by 6pm for next-day delivery</span>
          <a href={whatsappUrl()} className="text-[#F3F1E8] underline-offset-4 hover:underline">Chat on WhatsApp</a>
        </div>
        <span className="md:hidden">Order by 6pm for next-day delivery · <span className="text-yellow">Mon · Wed · Fri</span></span>
      </div>

      {/* Desktop */}
      <header className="relative hidden border-b border-line bg-canvas/85 backdrop-blur-xl lg:block">
        <div className="container-x grid grid-cols-[1fr_auto_1fr] items-center gap-6 py-2">
          <nav aria-label="Main"><PrimaryNav plans={navPlans} collections={navCollections} /></nav>
          <Logo />
          <div className="flex items-center justify-end gap-5">
            <nav aria-label="Company"><NavLinks links={RIGHT} /></nav>
            <div className="flex items-center gap-1.5">
              <SearchButton className="border border-line text-fg hover:border-yellow" />
              <FavLink />
              <Link href="/account#weight" aria-label="Weight tracker" className="flex size-11 items-center justify-center rounded-full border border-line text-fg hover:border-yellow"><Scale size={19} strokeWidth={1.8} aria-hidden /></Link>
              <CartButton />
              {user ? (
                <Link href="/account" aria-label="My account" title="My account" className="flex size-11 items-center justify-center rounded-full bg-yellow font-display text-sm font-bold text-canvas no-underline">{initial}</Link>
              ) : (
                <>
                  <Link href="/signin" className="cl-btn ml-1 flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-bold text-fg no-underline hover:border-yellow">Sign in</Link>
                  <Link href="/signin?mode=signup" className="cl-btn flex min-h-11 items-center rounded-full bg-yellow px-4 text-sm font-bold text-canvas no-underline">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile and tablet */}
      <header className="flex items-center gap-2.5 border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <MenuButton />
        <Link href="/" className="flex flex-1 items-center justify-center gap-2 text-fg no-underline" aria-label="Chop Lean home"><LogoMark size={30} /><Wordmark className="text-[22px]" /></Link>
        <SearchButton />
        <CartButton variant="yellow" />
      </header>
    </div>
  );
}
