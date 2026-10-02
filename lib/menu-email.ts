import "server-only";
import { createElement } from "react";
import { getPlans, getWeeklyMenu } from "@/lib/queries";
import { sendEmail } from "@/lib/email";
import WeeklyMenu, { type MenuEmailData } from "@/emails/WeeklyMenu";

export async function loadMenuEmailData(): Promise<MenuEmailData | null> {
  const [menu, plans] = await Promise.all([getWeeklyMenu(), getPlans()]);
  if (!menu) return null;
  return {
    weekOf: menu.weekOf,
    days: menu.days.map((d) => ({ day: d.day, meals: d.meals.map((m) => ({ name: m.name, kcal: m.kcal, slot: m.menuSlot })) })),
    plans: plans.map((p) => ({ name: p.name, kcal: p.kcal, priceKobo: p.priceKobo, slug: p.slug })),
  };
}

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function sendMenuTo(email: string, token: string, welcome = false, data?: MenuEmailData | null) {
  const menu = data ?? (await loadMenuEmailData());
  if (!menu) return false;
  return sendEmail({
    to: email,
    subject: welcome ? "Welcome to Chop Lean: this week's menu inside" : "This week's Chop Lean menu",
    react: createElement(WeeklyMenu, { menu, welcome, unsubscribeUrl: `${site()}/unsubscribe?token=${token}` }),
    as: "menu",
  });
}
