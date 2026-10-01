"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartOptions = {
  kcal?: number;
  mealsPerDay?: number;
  daysPerWeek?: number;
  firstDelivery?: string; // ISO date
  exclusions?: string;
  subscribe?: boolean;
  size?: string;
  /** "Mon-lunch" -> meal id the customer swapped in */
  swaps?: Record<string, string>;
};

export type CartLine = {
  id: string;
  productId: string;
  slug: string;
  type: "plan" | "meal" | "drink";
  name: string;
  image: string;
  /** Display price only. The server always re-prices from productId + options. */
  unitKobo: number;
  qty: number;
  options: CartOptions;
};

type CartState = {
  lines: CartLine[];
  promo: string | null;
  add: (line: Omit<CartLine, "id" | "qty"> & { qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setPromo: (code: string | null) => void;
  replace: (lines: CartLine[]) => void;
};

const lineId = (productId: string, options: CartOptions) =>
  `${productId}:${options.kcal ?? ""}:${options.mealsPerDay ?? ""}:${options.daysPerWeek ?? ""}:${options.firstDelivery ?? ""}:${options.exclusions ?? ""}:${options.subscribe ? "s" : ""}:${options.swaps ? JSON.stringify(options.swaps) : ""}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      promo: null,
      add: (line) =>
        set((s) => {
          const id = lineId(line.productId, line.options);
          const qty = line.qty ?? 1;
          const existing = s.lines.find((l) => l.id === id);
          if (existing) {
            return { lines: s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, 20) } : l)) };
          }
          return { lines: [...s.lines, { ...line, id, qty }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.id !== id) : s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 20) } : l)),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [], promo: null }),
      setPromo: (promo) => set({ promo }),
      replace: (lines) => set({ lines }),
    }),
    { name: "chop-lean-cart", partialize: (s) => ({ lines: s.lines, promo: s.promo }) },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty * l.unitKobo, 0);

type UIState = {
  cartOpen: boolean;
  menuOpen: boolean;
  setCartOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
};
export const useUI = create<UIState>()((set) => ({
  cartOpen: false,
  menuOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}));

type FavState = { ids: string[]; toggle: (id: string) => void };
export const useFavs = create<FavState>()(
  persist(
    (set) => ({ ids: [], toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })) }),
    { name: "chop-lean-favs" },
  ),
);
