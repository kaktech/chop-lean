import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { api, type CartLine } from "./api";
import { useAuth } from "./auth";

const POLL_MS = 3000;
type Ctx = {
  lines: CartLine[]; count: number; totalKobo: number; syncing: boolean; error: string | null;
  add: (productId: string) => Promise<void>;
  setQty: (l: CartLine, qty: number) => Promise<void>;
  remove: (l: CartLine) => Promise<void>;
  refresh: () => Promise<void>;
};
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => useContext(CartCtx)!;

/**
 * The cart lives on the server and is shared with the website. This keeps the app's copy fresh by re-reading it
 * every few seconds while the app is open, and applies every change on the server first.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!user || busy.current) return;
    try { setLines((await api.cart()).lines); setError(null); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't refresh your cart."); }
  }, [user]);

  useEffect(() => {
    if (!user) { setLines([]); return; }
    refresh();
    const timer = setInterval(() => { if (AppState.currentState === "active") refresh(); }, POLL_MS);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") refresh(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [user, refresh]);

  const run = useCallback(async (op: Record<string, unknown>) => {
    busy.current = true;
    setSyncing(true);
    try { setLines((await api.cartOp(op)).lines); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't update your cart."); throw e; }
    finally { busy.current = false; setSyncing(false); }
  }, []);

  const value = useMemo<Ctx>(() => ({
    lines, syncing, error,
    count: lines.reduce((n, l) => n + l.qty, 0),
    totalKobo: lines.reduce((n, l) => n + l.qty * l.unitKobo, 0),
    add: (productId) => run({ op: "add", productId }),
    setQty: (l, qty) => run({ op: "setQty", productId: l.productId, options: l.options, qty }),
    remove: (l) => run({ op: "remove", productId: l.productId, options: l.options }),
    refresh,
  }), [lines, syncing, error, run, refresh]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
