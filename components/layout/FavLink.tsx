"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavs } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";

export function FavLink() {
  const hydrated = useHydrated();
  const n = useFavs((s) => s.ids.length);
  return (
    <Link href="/favourites" aria-label={`Saved dishes${hydrated && n ? `, ${n}` : ""}`} className="relative flex size-11 items-center justify-center rounded-full border border-line text-fg hover:border-yellow">
      <Heart size={19} strokeWidth={1.8} aria-hidden />
      {hydrated && n > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-yellow px-1 text-[11px] font-bold text-canvas">{n}</span>}
    </Link>
  );
}
