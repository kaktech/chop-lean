export function badgeStyle(badge: string | null): string {
  if (!badge) return "";
  if (badge.startsWith("-")) return "bg-red text-white";
  if (badge === "START HERE" || badge === "LOW-GI") return "bg-green text-white";
  if (badge === "GENTLE") return "bg-[#4B55B0] text-white";
  return "bg-ink text-white";
}

export const kcalLabel = (kcal: number | null, perDay = true) =>
  kcal ? `${kcal.toLocaleString("en-NG")} kcal${perDay ? "/day" : ""}` : "";

export const planMeta = (mealsPerDay: number | null, daysPerWeek: number | null) =>
  `${mealsPerDay ?? 3} meal${mealsPerDay === 1 ? "" : "s"} · ${daysPerWeek ?? 5} days`;

export const productHref = (type: string, slug: string) => `/${type === "plan" ? "plans" : "meals"}/${slug}`;
