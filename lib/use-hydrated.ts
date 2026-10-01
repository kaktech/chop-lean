"use client";
import { useEffect, useState } from "react";

/** True after first client render, so persisted-store values never cause a hydration mismatch. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
