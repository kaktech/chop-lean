import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";
import { Wordmark } from "./Logo";

const COLS = [
  { h: "Shop", links: [["Meal plans", "/shop?tab=plans"], ["Single meals", "/shop?tab=meals"], ["Snacks and drinks", "/shop?tab=drinks"], ["Find my plan", "/quiz"], ["Gift cards", "/shop"]] },
  { h: "Help", links: [["Delivery zones", "/checkout"], ["Pause or skip a week", "/account"], ["FAQs", "/"], ["Contact", "/"]] },
  { h: "Company", links: [["Our kitchen", "/"], ["Meet the dietitian", "/"], ["Terms", "/"], ["Privacy", "/"]] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink pb-20 text-[#EDEBE3] md:pb-0">
      <div aria-hidden className="pointer-events-none absolute -bottom-[70px] -right-5 hidden select-none whitespace-nowrap font-serif text-[260px] leading-none text-white/[0.04] md:block">Chop Lean</div>
      <div className="container-x relative pt-10 md:pt-14">
        <div className="flex flex-col items-start gap-6 rounded-[28px] bg-green p-6 md:flex-row md:items-center md:gap-8 md:px-11 md:py-9">
          <div className="flex-1">
            <div className="font-display text-2xl font-bold tracking-tight text-white md:text-[34px]">Get the weekly menu before it sells out</div>
            <div className="mt-1.5 text-[15px] text-mint">New dishes every Sunday, plus a free 7-day portion guide.</div>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid gap-8 py-10 md:grid-cols-5 md:py-14">
          <div className="flex flex-col gap-3.5 md:col-span-2">
            <Wordmark dark className="text-[28px] text-white" />
            <p className="max-w-[360px] text-sm leading-relaxed text-[#B9BDB4]">Calorie-counted Nigerian meals, cooked in Lagos and delivered to your door. Real food, weighed portions, pepper intact.</p>
            <p className="max-w-[360px] text-xs text-[#9AA096]">Our plans support weight management. They are not medical treatment, so speak to your doctor first if you have a health condition.</p>
          </div>
          {COLS.map((c) => (
            <div key={c.h} className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm md:flex md:flex-col">
              <div className="col-span-2 mb-1 font-bold text-white">{c.h}</div>
              {c.links.map(([label, href]) => (
                <Link key={label} href={href} className="py-0.5 text-[#B9BDB4] no-underline hover:text-white">{label}</Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pb-7 pt-5 text-[13px] text-[#9AA096]">
          <span>© 2026 Chop Lean, Lagos</span>
          <span>Nigeria (NGN ₦)</span>
        </div>
      </div>
    </footer>
  );
}
