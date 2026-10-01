import type { Product } from "@/lib/queries";

export type Tab = "plans" | "meals" | "drinks";
export const TABS: { key: Tab; label: string; type: Product["type"] }[] = [
  { key: "plans", label: "Plans", type: "plan" },
  { key: "meals", label: "Single Meals", type: "meal" },
  { key: "drinks", label: "Snacks and Drinks", type: "drink" },
];

export const PAGE_SIZE = 6;

export type SortKey = "featured" | "kcal-asc" | "price-asc" | "price-desc" | "newest";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "kcal-asc", label: "Lowest calories" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "newest", label: "Newest" },
];

export const KCAL_BUCKETS = [
  { key: "1200-1300", label: "1,200–1,300", min: 1200, max: 1300 },
  { key: "1400-1500", label: "1,400–1,500", min: 1400, max: 1500 },
  { key: "1600-1800", label: "1,600–1,800", min: 1600, max: 1800 },
];
export const MEAL_KCAL_BUCKETS = [
  { key: "0-350", label: "Under 350", min: 0, max: 349 },
  { key: "350-450", label: "350–450", min: 350, max: 450 },
  { key: "451-900", label: "Over 450", min: 451, max: 900 },
];
export const GOALS = [
  { key: "lose", label: "Lose weight" },
  { key: "keep", label: "Maintain" },
  { key: "gain", label: "Build muscle" },
];
export const SLOTS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];
export const MEALS_PER_DAY = [
  { key: "1", label: "1 (lunch only)" },
  { key: "2", label: "2 meals" },
  { key: "3", label: "3 meals" },
  { key: "4", label: "4 meals" },
];

export type Filters = {
  tab: Tab;
  q: string;
  kcal: string[];
  goal: string[];
  diet: string[]; // tags, plus the virtual "no-pork"
  meals: string[]; // meals per day (plans) 
  slot: string[]; // breakfast/lunch/dinner (meals)
  sort: SortKey;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;
const csv = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(p: Params): Filters {
  const tab = (["plans", "meals", "drinks"] as const).find((t) => t === one(p.tab)) ?? "plans";
  const sort = SORTS.find((s) => s.key === one(p.sort))?.key ?? "featured";
  const tagParam = csv(p.tag);
  return {
    tab,
    q: one(p.q).trim().slice(0, 80),
    kcal: csv(p.kcal),
    goal: csv(p.goal),
    diet: [...csv(p.diet), ...tagParam],
    meals: csv(p.meals),
    slot: csv(p.slot),
    sort,
    page: Math.max(1, parseInt(one(p.page), 10) || 1),
  };
}

export const buckets = (tab: Tab) => (tab === "plans" ? KCAL_BUCKETS : MEAL_KCAL_BUCKETS);

const inBuckets = (kcal: number | null, keys: string[], tab: Tab) => {
  if (!keys.length) return true;
  if (kcal == null) return false;
  return buckets(tab).some((b) => keys.includes(b.key) && kcal >= b.min && kcal <= b.max);
};

function matches(p: Product, f: Filters, skip?: keyof Filters): boolean {
  const q = f.q.toLowerCase();
  if (skip !== "q" && q) {
    const hay = `${p.name} ${p.tags.join(" ")} ${p.kcal ?? ""} ${p.description ?? ""}`.toLowerCase();
    const num = q.match(/\d{3,4}/)?.[0];
    if (!q.split(/\s+/).every((w) => hay.includes(w)) && !(num && hay.includes(num))) return false;
  }
  if (skip !== "kcal" && !inBuckets(p.kcal, f.kcal, f.tab)) return false;
  if (skip !== "goal" && f.goal.length && !(p.goal && f.goal.includes(p.goal))) return false;
  if (skip !== "diet" && f.diet.length) {
    for (const d of f.diet) {
      if (d === "no-pork") {
        if (p.tags.includes("pork")) return false;
      } else if (!p.tags.includes(d)) return false;
    }
  }
  if (skip !== "meals" && f.meals.length && !(p.mealsPerDay != null && f.meals.includes(String(p.mealsPerDay)))) return false;
  if (skip !== "slot" && f.slot.length && !(p.slot && f.slot.includes(p.slot))) return false;
  return true;
}

export function applyFilters(all: Product[], f: Filters) {
  const list = all.filter((p) => matches(p, f));
  const sorted = [...list].sort((a, b) => {
    switch (f.sort) {
      case "kcal-asc": return (a.kcal ?? 0) - (b.kcal ?? 0);
      case "price-asc": return a.priceKobo - b.priceKobo;
      case "price-desc": return b.priceKobo - a.priceKobo;
      case "newest": return +b.createdAt - +a.createdAt;
      default: return +a.createdAt - +b.createdAt;
    }
  });
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  return { total: sorted.length, pages, page, items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}

/** Count of products that would match if this one option were ticked (other filters kept). */
export function facetCounts(all: Product[], f: Filters) {
  const count = (field: keyof Filters, key: string) =>
    all.filter((p) => matches(p, { ...f, [field]: [...(f[field] as string[]).filter((k) => k !== key), key] } as Filters, undefined)).length;
  const tagSet = new Map<string, number>();
  for (const p of all) for (const t of p.tags) tagSet.set(t, (tagSet.get(t) ?? 0) + 1);
  return { count, tags: [...tagSet.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t) };
}

export const tagLabel = (t: string) => (t === "no-pork" ? "No pork" : t.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()));

export function toQuery(f: Partial<Filters>, overrides: Partial<Record<keyof Filters, string | string[] | number | null>> = {}) {
  const merged: Record<string, unknown> = { ...f, ...overrides };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (k === "tab" && v === "plans") continue;
    if (k === "sort" && v === "featured") continue;
    if (k === "page" && v === 1) continue;
    sp.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = sp.toString();
  return `/shop${s ? `?${s}` : ""}`;
}

export type Group = { field: "kcal" | "goal" | "diet" | "meals" | "slot"; title: string; options: { key: string; label: string }[] };

export function groupsFor(f: Filters, tags: string[]): Group[] {
  if (f.tab === "plans") {
    return [
      { field: "kcal", title: "Calories per day", options: buckets("plans").map((b) => ({ key: b.key, label: b.label })) },
      { field: "goal", title: "Goal", options: GOALS },
      { field: "diet", title: "Diet", options: [...tags.map((t) => ({ key: t, label: tagLabel(t) })), { key: "no-pork", label: "No pork" }] },
      { field: "meals", title: "Meals per day", options: MEALS_PER_DAY.filter((m) => m.key !== "4") },
    ];
  }
  if (f.tab === "meals") {
    return [
      { field: "slot", title: "Meal type", options: SLOTS },
      { field: "kcal", title: "Calories per meal", options: buckets("meals").map((b) => ({ key: b.key, label: b.label })) },
    ];
  }
  return [];
}

