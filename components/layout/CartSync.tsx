"use client";
import { useEffect, useRef } from "react";
import { getSavedCart, mergeCart, saveCart } from "@/app/actions/cart";
import type { ServerCartLine } from "@/lib/cart-server";
import { useCart, type CartLine } from "@/lib/store";

const OWNER_KEY = "chop-lean-cart-owner";
const POLL_MS = 5_000;

const toWire = (lines: CartLine[]) => lines.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options, unitKobo: l.unitKobo }));
const toLines = (rows: ServerCartLine[]) => rows.map((m) => ({ id: "", ...m, options: m.options as CartLine["options"] })) as CartLine[];
const sig = (rows: { productId: string; qty: number; options: unknown }[]) => JSON.stringify(rows.map((r) => `${r.productId}|${r.qty}|${JSON.stringify(r.options)}`).sort());

/**
 * Keeps a signed-in person's cart identical on every device.
 * - First time on this browser after signing in: the guest cart is merged into the saved one.
 * - After that the saved (server) cart wins, so removing something on one device can't be undone by another.
 * - Local changes are saved after a short pause; other devices pick them up when you return to the tab or within seconds.
 */
export function CartSync({ userId }: { userId: string | null }) {
  const ready = useRef(false);
  const applying = useRef(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!userId) {
      ready.current = false;
      try {
        // Signed out: empty the on-device cart so the next person on this browser never inherits it.
        if (localStorage.getItem(OWNER_KEY)) useCart.getState().replace([]);
        localStorage.removeItem(OWNER_KEY);
      } catch { /* private mode */ }
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const apply = (rows: ServerCartLine[]) => {
      applying.current = true;
      useCart.getState().replace(toLines(rows));
      applying.current = false;
    };

    const pull = async () => {
      if (!ready.current || pending.current || document.visibilityState === "hidden") return;
      const rows = await getSavedCart().catch(() => null);
      if (cancelled || !rows || pending.current) return;
      if (sig(rows) !== sig(toWire(useCart.getState().lines))) apply(rows);
    };

    const start = async () => {
      let owner: string | null = null;
      try { owner = localStorage.getItem(OWNER_KEY); } catch { /* ignore */ }
      // A cart left on this browser by another account is never merged. Only a true guest cart (no owner) is.
      const rows = owner ? await getSavedCart().catch(() => null) : await mergeCart(toWire(useCart.getState().lines)).catch(() => null);
      if (cancelled || !rows) return;
      apply(rows);
      try { localStorage.setItem(OWNER_KEY, userId); } catch { /* ignore */ }
      ready.current = true;
    };
    start();

    const unsub = useCart.subscribe((s, prev) => {
      if (!ready.current || applying.current || s.lines === prev.lines) return;
      pending.current = true;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await saveCart(toWire(useCart.getState().lines)).catch(() => {});
        pending.current = false;
      }, 600);
    });

    const onVisible = () => { if (document.visibilityState === "visible") pull(); };
    const poll = setInterval(pull, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", pull);
    return () => {
      cancelled = true;
      unsub();
      clearTimeout(timer);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", pull);
    };
  }, [userId]);

  return null;
}
