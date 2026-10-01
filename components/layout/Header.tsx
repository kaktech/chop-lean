import Link from "next/link";
import { Scale, Search } from "lucide-react";
import { auth } from "@/auth";
import { Logo, Wordmark } from "./Logo";
import { CartButton } from "./CartButton";
import { MenuButton } from "./MenuDrawer";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop?tab=plans", label: "Meal Plans" },
  { href: "/shop?tab=meals", label: "Single Meals" },
  { href: "/shop?tab=drinks", label: "Snacks and Drinks" },
  { href: "/quiz", label: "Find My Plan" },
  { href: "/#results", label: "Results" },
];

export async function Header() {
  const session = await auth().catch(() => null);
  const user = session?.user;
  const initial = (user?.name ?? user?.email ?? "A").charAt(0).toUpperCase();

  return (
    <>
      <div className="bg-green-dark px-3 py-2 text-center text-xs text-[#F3F1E8] md:px-6 md:py-2.5 md:text-[13px]">
        <div className="hidden justify-center gap-7 tracking-[0.02em] md:flex">
          <span>Cooked fresh daily in Lagos</span>
          <span className="text-yellow">Deliveries Mon · Wed · Fri</span>
          <span>Order by 6pm for next-day delivery</span>
        </div>
        <span className="md:hidden">
          Order by 6pm for next-day delivery · <span className="text-yellow">Mon · Wed · Fri</span>
        </span>
      </div>

      {/* Desktop header */}
      <header className="hidden border-b border-line bg-white md:block">
        <div className="container-x flex items-center gap-8 py-[18px]">
          <Logo />
          <form action="/shop" role="search" className="flex max-w-[520px] flex-1 items-center rounded-full bg-[#F2F1EC] py-1 pl-[18px] pr-1">
            <Search size={18} strokeWidth={2} className="text-muted" aria-hidden />
            <label htmlFor="hdr-search" className="sr-only">Search meals and plans</label>
            <input
              id="hdr-search"
              name="q"
              type="search"
              placeholder="Search efo riro, jollof, 1400 kcal plan…"
              className="min-h-11 flex-1 border-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted"
            />
            <button className="cl-btn tap rounded-full bg-green px-[22px] text-sm font-bold text-white">Search</button>
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/account#weight" aria-label="Weight tracker" className="flex size-11 items-center justify-center rounded-full border border-line">
              <Scale size={20} strokeWidth={1.8} aria-hidden />
            </Link>
            <CartButton />
            <Link href={user ? "/account" : "/signin"} className="flex items-center gap-2.5 pl-2 text-ink no-underline">
              <span className="flex size-10 items-center justify-center rounded-full bg-mint font-display font-bold text-green-dark">{initial}</span>
              <span className="flex flex-col leading-tight">
                <span className="text-xs text-muted">{user ? "Hi," : "Welcome!"}</span>
                <span className="text-sm font-bold">{user ? (user.name?.split(" ")[0] ?? "Account") : "Sign in"}</span>
              </span>
            </Link>
          </div>
        </div>
        <nav aria-label="Main" className="container-x flex items-center gap-[34px] pb-3.5 text-[15px] font-medium">
          <Link href="/shop" className="rounded-full bg-mint px-4 py-2 font-bold text-green-dark no-underline">All Plans ▾</Link>
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="py-2 text-ink no-underline hover:text-green">{n.label}</Link>
          ))}
          <span className="ml-auto text-[13px] text-muted">
            Need help?{" "}
            <a href="https://wa.me/2340000000000" className="font-bold text-green underline">Chat on WhatsApp</a>
          </span>
        </nav>
      </header>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-line bg-white px-4 py-2.5 md:hidden">
        <MenuButton />
        <Link href="/" className="flex-1 text-center text-ink no-underline" aria-label="Chop Lean home">
          <Wordmark className="text-[23px]" />
        </Link>
        <Link href="/shop" aria-label="Search" className="flex size-11 items-center justify-center rounded-full">
          <Search size={20} strokeWidth={2} aria-hidden />
        </Link>
        <CartButton variant="yellow" />
      </header>
    </>
  );
}


