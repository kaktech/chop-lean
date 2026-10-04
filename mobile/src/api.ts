// The app talks to the same server as the website, so accounts, carts and orders are shared.
export const API = "https://chop-lean.vercel.app";

export type User = { id: string; email: string | null; name: string | null; image: string | null };
export type Product = {
  id: string; slug: string; type: "plan" | "meal" | "drink"; name: string; description: string | null; image: string;
  kcal: number | null; proteinG: number | null; priceKobo: number; compareAtKobo: number | null; badge: string | null;
  mealsPerDay: number | null; daysPerWeek: number | null; slot: string | null;
};
export type CartLine = { productId: string; slug: string; type: string; name: string; image: string; unitKobo: number; qty: number; options: Record<string, unknown> };
export type Order = { id: string; number: string; status: string; paymentStatus: string; totalKobo: number; createdAt: string; deliveryDate: string; items: string[] };
export type WeightLog = { kg: number; loggedOn: string };
export type Review = { id: string; rating: number; body: string; name: string; verified: boolean; createdAt?: string; product?: string; weightChange?: string | null };
export type ProductDetail = Product & { gallery: string[]; carbsG: number | null; fatG: number | null; tags: string[] };
export type QuizInput = { goal: "lose" | "keep" | "gain"; sex: "female" | "male"; age: number; heightCm: number; weightKg: number; goalWeightKg?: number; activity: "light" | "moderate" | "active"; exclusions: string[]; pepper: number };
export type QuizResult = { dailyKcal: number; protein: number; saved: boolean; pace: string; match: { id: string; slug: string; name: string; kcal: number | null; priceKobo: number; image: string } | null };

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}/api/mobile${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach Chop Lean. Check your internet connection.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized();
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Something went wrong.", res.status);
  return data as T;
}

export const api = {
  login: (email: string, password: string) => call<{ token: string; user: User }>("/login", { body: { email, password } }),
  sendCode: (email: string) => call<{ sent: boolean }>("/code", { body: { email } }),
  verifyCode: (email: string, code: string) => call<{ token: string; user: User }>("/verify", { body: { email, code } }),
  logout: () => call<{ ok: boolean }>("/logout", { method: "POST", body: {} }),
  me: () => call<{ user: User; profile: { dailyKcalTarget: number | null; goalWeightKg: number | null; startWeightKg: number | null; exclusions: string[] | null; pepperLevel: number | null } | null; latestWeightKg: number | null }>("/me"),
  products: () => call<{ products: Product[] }>("/products"),
  cart: () => call<{ lines: CartLine[] }>("/cart"),
  cartOp: (op: Record<string, unknown>) => call<{ lines: CartLine[] }>("/cart", { body: op }),
  weight: () => call<{ logs: WeightLog[] }>("/weight"),
  logWeight: (kg: number) => call<{ logs: WeightLog[] }>("/weight", { body: { kg } }),
  orders: () => call<{ orders: Order[] }>("/orders"),
  home: () => call<{ reviews: Review[]; ratings: Record<string, { count: number; avg: number }> }>("/home"),
  product: (slug: string) => call<{ product: ProductDetail; reviews: Review[]; stats: { count: number; avg: number } }>(`/product?slug=${encodeURIComponent(slug)}`),
  postReview: (r: { productId: string; rating: number; body: string }) => call<{ ok: boolean; verified: boolean }>("/reviews", { body: r }),
  quiz: (q: QuizInput) => call<QuizResult>("/quiz", { body: q }),
  handoff: () => call<{ url: string }>("/handoff", { method: "POST", body: {} }),
};
