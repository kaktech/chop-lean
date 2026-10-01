"use client";
import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cartCount, useCart, useUI } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";

export function useCartCount() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  return hydrated ? cartCount(lines) : 0;
}

/** Badge that pops whenever the count changes. */
export function CartBadge({ className = "" }: { className?: string }) {
  const count = useCartCount();
  const [popKey, setPopKey] = useState(0);
  const prev = useRef(count);
  useEffect(() => {
    if (prev.current !== count) setPopKey((k) => k + 1);
    prev.current = count;
  }, [count]);
  if (count === 0) return null;
  return (
    <span
      key={popKey}
      className={`${popKey ? "cl-pop" : ""} absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red px-1 text-[11px] font-bold text-white ${className}`}
    >
      {count}
    </span>
  );
}

export function CartButton({ variant = "outline" }: { variant?: "outline" | "yellow" }) {
  const count = useCartCount();
  const setCartOpen = useUI((s) => s.setCartOpen);
  return (
    <button
      type="button"
      onClick={() => setCartOpen(true)}
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className={`relative flex size-11 items-center justify-center rounded-full ${
        variant === "yellow" ? "bg-yellow text-canvas" : "border border-line bg-transparent text-fg hover:border-yellow"
      }`}
    >
      <ShoppingBag size={20} strokeWidth={1.8} aria-hidden />
      <CartBadge />
    </button>
  );
}
