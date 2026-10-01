"use client";
import { useEffect, useRef } from "react";
import { mergeCart, saveCart } from "@/app/actions/cart";
import { useCart, type CartLine } from "@/lib/store";

/** For signed-in users: merge the guest cart on arrival, then keep the saved cart in step (debounced). */
export function CartSync({ signedIn }: { signedIn: boolean }) {
  const ready = useRef(false);

  useEffect(() => {
    if (!signedIn) { ready.current = false; return; }
    const lines = useCart.getState().lines;
    mergeCart(lines.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options, unitKobo: l.unitKobo }))).then((merged) => {
      if (!merged) return;
      useCart.getState().replace(merged.map((m) => ({ id: `${m.productId}:${JSON.stringify(m.options)}`, ...m, options: m.options as CartLine["options"] })));
      ready.current = true;
    });
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    let t: ReturnType<typeof setTimeout>;
    const unsub = useCart.subscribe((s, prev) => {
      if (!ready.current || s.lines === prev.lines) return;
      clearTimeout(t);
      t = setTimeout(() => saveCart(s.lines.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options, unitKobo: l.unitKobo }))), 800);
    });
    return () => { unsub(); clearTimeout(t); };
  }, [signedIn]);

  return null;
}
