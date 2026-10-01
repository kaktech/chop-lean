"use client";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useCart, useUI, type CartOptions } from "@/lib/store";

export type AddableProduct = {
  id: string;
  slug: string;
  type: "plan" | "meal" | "drink";
  name: string;
  image: string | null;
  priceKobo: number;
};

export function useAddToCart() {
  const add = useCart((s) => s.add);
  const setCartOpen = useUI((s) => s.setCartOpen);

  return (p: AddableProduct, opts: { options?: CartOptions; qty?: number; unitKobo?: number; openDrawer?: boolean } = {}) => {
    add({
      productId: p.id,
      slug: p.slug,
      type: p.type,
      name: p.name,
      image: p.image ?? "meal-box.jpg",
      unitKobo: opts.unitKobo ?? p.priceKobo,
      options: opts.options ?? {},
      qty: opts.qty,
    });
    toast.custom(
      () => (
        <div role="status" className="cl-toast flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-chip">
          <span className="flex size-8 items-center justify-center rounded-full bg-yellow text-ink"><Check size={18} strokeWidth={3} aria-hidden /></span>
          <span className="text-sm"><b className="block font-display">Item added to cart</b><span className="text-[#B9BDB4]">{p.name}</span></span>
        </div>
      ),
      { duration: 3000 },
    );
    if (opts.openDrawer) setCartOpen(true);
  };
}
