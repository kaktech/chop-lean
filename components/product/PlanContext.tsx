"use client";
import { createContext, useContext, useState } from "react";

type Ctx = { swaps: Record<string, string>; setSwap: (key: string, mealId: string | null) => void };
const PlanCtx = createContext<Ctx>({ swaps: {}, setSwap: () => {} });

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const setSwap = (key: string, mealId: string | null) =>
    setSwaps((s) => {
      const n = { ...s };
      if (mealId) n[key] = mealId; else delete n[key];
      return n;
    });
  return <PlanCtx.Provider value={{ swaps, setSwap }}>{children}</PlanCtx.Provider>;
}
export const usePlan = () => useContext(PlanCtx);
