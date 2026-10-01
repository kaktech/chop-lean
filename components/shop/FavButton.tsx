"use client";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavs } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";

/** Heart toggle. Saved dishes live in this browser and are listed at /favourites. */
export function FavButton({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  const hydrated = useHydrated();
  const on = useFavs((s) => s.ids.includes(id));
  const toggle = useFavs((s) => s.toggle);
  const active = hydrated && on;
  return (
    <button type="button" aria-pressed={active} aria-label={active ? `Remove ${name} from saved` : `Save ${name}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); toast(active ? "Removed from saved" : "Saved to your favourites", { duration: 1800 }); }}
      className={`flex size-11 items-center justify-center rounded-full bg-canvas/80 text-fg backdrop-blur transition-colors hover:text-yellow ${className}`}>
      <Heart size={17} className={active ? "fill-yellow text-yellow" : ""} aria-hidden />
    </button>
  );
}
