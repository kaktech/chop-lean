"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { imgSrc } from "@/lib/img";

export type ChipMeal = { slug: string; name: string; image: string | null; kcal: number | null; proteinG: number | null };

/** Hero chip that cycles through real dishes. Stays on the first dish for reduced-motion users. */
export function RotatingDishChip({ meals }: { meals: ChipMeal[] }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    if (meals.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => { setI((n) => (n + 1) % meals.length); setShow(true); }, 300);
    }, 3500);
    return () => clearInterval(id);
  }, [meals.length]);
  const m = meals[i];
  if (!m) return null;
  return (
    <Link href={`/meals/${m.slug}`} className="glass absolute bottom-4 left-4 flex items-center gap-3 rounded-2xl py-2.5 pl-2.5 pr-4 text-fg no-underline" aria-label={`${m.name}, ${m.kcal} kcal`}>
      <span className={`flex items-center gap-3 transition-all duration-300 ${show ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
        <Image src={imgSrc(m.image)} alt="" width={44} height={44} className="size-11 rounded-xl object-cover" />
        <span className="leading-snug"><b className="block text-sm">{m.name}</b><span className="text-xs text-muted">{m.kcal} kcal{m.proteinG ? ` · ${m.proteinG}g protein` : ""}</span></span>
      </span>
    </Link>
  );
}
