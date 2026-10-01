"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useUI } from "@/lib/store";
import { CartBadge } from "./CartButton";

export function MobileTabBar() {
  const path = usePathname();
  const setCartOpen = useUI((s) => s.setCartOpen);
  if (path.startsWith("/admin") || path.startsWith("/checkout")) return null;

  const tab = (active: boolean) =>
    `relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium no-underline ${active ? "text-green" : "text-muted"}`;

  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <Link href="/" className={tab(path === "/")}><Home size={21} aria-hidden />Home</Link>
      <Link href="/shop" className={tab(path.startsWith("/shop") || path.startsWith("/plans") || path.startsWith("/meals"))}><LayoutGrid size={21} aria-hidden />Plans</Link>
      <Link href="/quiz" className={tab(path === "/quiz")}><Clock size={21} aria-hidden />Quiz</Link>
      <button type="button" onClick={() => setCartOpen(true)} className={tab(path === "/cart")}>
        <span className="relative"><ShoppingBag size={21} aria-hidden /><CartBadge className="-right-2 -top-1.5" /></span>Cart
      </button>
      <Link href="/account" className={tab(path.startsWith("/account") || path.startsWith("/signin"))}><User size={21} aria-hidden />Me</Link>
    </nav>
  );
}
