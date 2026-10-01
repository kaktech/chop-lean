"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/store";

/** Empties the cart once an order has been placed. */
export function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => clear(), [clear]);
  return null;
}
