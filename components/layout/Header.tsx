import Link from "next/link";
import { Scale, User } from "lucide-react";
import { auth } from "@/auth";
import { Logo, Wordmark } from "./Logo";
import { CartButton } from "./CartButton";
import { MenuButton } from "./MenuDrawer";
import { NavLinks } from "./NavLinks";
import { SearchButton } from "./SearchOverlay";

const LEFT = [
  { href: "/", label: "Home", xl: true },
  { href: "/menu", label: "Menu" },
  { href: "/shop?tab=plans", label: "Meal Plans" },
  { href: "/collections/drinks", label: "Drinks", xl: true },
];
const RIGHT = [
  { href: "/about", label: "Our Kitchen" },
  { href: "/delivery", label: "Delivery" },
  { href: "/results", label: "Results", xl: true },
  { href: "/contact", label: "Contact", xl: true },
];

export async function Header() {
  const session = await auth().catch(() => null);
  const user = session?.user;
  const initial = (user?.name ?? user?.email ?? "A").charAt(0).toUpperCase();

  return (
    <div className="sticky top-0 z-40">
      <div className="bg-green-dark px-3 py-2 text-center text-xs text-[#F3F1E8] md:px-6 md:text-[13px]">
        <div className="container-x hidden items-center justify-between gap-6 tracking-[0.02em] md:flex">
          <span>Cooked fresh daily in Lagos</span>
          <span className="text-yellow">Deliveries Mon · Wed · Fri · Order by 6pm for next-day delivery</span>
          <a href="https://wa.me/2340000000000" className="text-[#F3F1E8] underline-offset-4 hover:underline">Chat on WhatsApp</a>
        </div>
        <span className="md:hidden">Order by 6pm for next-day delivery · <span className="text-yellow">Mon · Wed · Fri</span></span>
      </div>

      {/* Desktop */}
      <header className="hidden border-b border-line bg-canvas/85 backdrop-blur-xl lg:block">
        <div className="container-x grid grid-cols-[1fr_auto_1fr] items-center gap-6 py-2">
          <nav aria-label="Main"><NavLinks links={LEFT} /></nav>
          <Logo />
          <div className="flex items-center justify-end gap-5">
            <nav aria-label="Company"><NavLinks links={RIGHT} /></nav>
            <div className="flex items-center gap-1.5">
              <SearchButton className="border border-line text-fg hover:border-yellow" />
              <Link href="/account#weight" aria-label="Weight tracker" className="flex size-11 items-center justify-center rounded-full border border-line text-fg hover:border-yellow"><Scale size={19} strokeWidth={1.8} aria-hidden /></Link>
              <CartButton />
              <Link href={user ? "/account" : "/signin"} aria-label={user ? "My account" : "Sign in"} title={user ? "My account" : "Sign in"} className="flex size-11 items-center justify-center rounded-full bg-yellow font-display text-sm font-bold text-canvas no-underline">
                {user ? initial : <User size={19} aria-hidden />}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile and tablet */}
      <header className="flex items-center gap-2.5 border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <MenuButton />
        <Link href="/" className="flex-1 text-center text-fg no-underline" aria-label="Chop Lean home"><Wordmark className="text-[23px]" /></Link>
        <SearchButton />
        <CartButton variant="yellow" />
      </header>
    </div>
  );
}
