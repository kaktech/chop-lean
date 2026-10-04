import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken, setUnauthorizedHandler, type User } from "./api";

const KEY = "chop-lean-session";
type Ctx = { user: User | null; ready: boolean; signIn: (token: string, user: User) => Promise<void>; signOut: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ user: null, ready: false, signIn: async () => {}, signOut: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { clear(); });
    (async () => {
      const saved = await SecureStore.getItemAsync(KEY).catch(() => null);
      if (saved) {
        setToken(saved);
        try { setUser((await api.me()).user); } catch { /* expired or offline: the unauthorized handler signs out if needed */ }
      }
      setReady(true);
    })();
  }, [clear]);

  const value = useMemo<Ctx>(() => ({
    user, ready,
    signIn: async (token, u) => { setToken(token); await SecureStore.setItemAsync(KEY, token); setUser(u); },
    signOut: async () => { await api.logout().catch(() => {}); await clear(); },
  }), [user, ready, clear]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
