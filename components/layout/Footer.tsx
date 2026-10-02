import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { NewsletterForm } from "./NewsletterForm";
import { Wordmark, LogoMark } from "./Logo";
import { whatsappUrl } from "@/lib/site";

const COLS = [
  { h: "Eat", links: [["Full menu", "/menu"], ["Meal plans", "/shop?tab=plans"], ["Single meals", "/shop?tab=meals"], ["Breakfast", "/collections/breakfast"], ["Lunch", "/collections/lunch"], ["Dinner", "/collections/dinner"], ["Drinks", "/collections/drinks"]] },
  { h: "Collections", links: [["Swallow and soups", "/collections/swallow-and-soups"], ["Low-carb", "/collections/low-carb"], ["High-protein", "/collections/high-protein"], ["Office lunch", "/collections/office-lunch"], ["Find my plan", "/quiz"], ["Gift cards", "/gift-cards"]] },
  { h: "Help", links: [["Delivery zones", "/delivery"], ["FAQs", "/faq"], ["Contact us", "/contact"], ["Track an order", "/track"], ["Pause or skip a week", "/account"]] },
  { h: "Company", links: [["Our kitchen", "/about"], ["Meet the dietitian", "/dietitian"], ["Results", "/results"], ["Terms", "/terms"], ["Privacy", "/privacy"]] },
];

export function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-line bg-surface pb-[calc(8.5rem+env(safe-area-inset-bottom))] text-body lg:pb-0">
      <div aria-hidden className="pointer-events-none absolute -bottom-[70px] -right-5 hidden select-none whitespace-nowrap font-serif text-[260px] leading-none text-white/[0.03] md:block">Chop Lean</div>

      <div className="container-x relative pt-12 md:pt-16">
        <div className="relative isolate overflow-hidden rounded-[28px] border border-line p-7 md:p-12">
          <Image src="/images/meal-box.jpg" alt="" fill sizes="1200px" className="-z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas via-canvas/85 to-canvas/40" />
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="eyebrow">Weekly menu</div>
              <div className="display-xl mt-3 text-[28px] md:text-[42px]">Get the menu <span className="serif-accent">before it sells out</span></div>
              <p className="mt-3 max-w-[480px] text-[15px] text-body">New dishes every Sunday, plus a free 7-day portion guide.</p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(4,1fr)] md:py-16">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="Chop Lean home"><LogoMark /><Wordmark dark className="text-[28px] text-fg" /></Link>
            <p className="max-w-[320px] text-sm leading-relaxed text-muted">Calorie-counted Nigerian meals, cooked in Lagos and delivered to your door. Real food, weighed portions, pepper intact.</p>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2.5"><MapPin size={16} className="text-yellow" aria-hidden />Kitchen in Yaba, Lagos</li>
              <li className="flex items-center gap-2.5"><Clock size={16} className="text-yellow" aria-hidden />Deliveries Mon · Wed · Fri</li>
              <li className="flex items-center gap-2.5"><MessageCircle size={16} className="text-yellow" aria-hidden /><a href={whatsappUrl()} className="text-body hover:text-yellow">WhatsApp us</a></li>
              <li className="flex items-center gap-2.5"><Mail size={16} className="text-yellow" aria-hidden /><Link href="/contact" className="text-body hover:text-yellow">Send a message</Link></li>
            </ul>
          </div>
          {COLS.map((c) => (
            <div key={c.h}>
              <div className="label-sm mb-4 text-[11px] text-yellow">{c.h}</div>
              <ul className="flex flex-col gap-1 text-sm">
                {c.links.map(([label, href]) => (
                  <li key={label}><Link href={href} className="flex min-h-9 items-center text-muted no-underline transition-colors hover:text-fg">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="max-w-[760px] border-t border-line pt-6 text-xs leading-relaxed text-muted">Our plans support weight management. They are not medical treatment, so speak to your doctor first if you have a health condition, are pregnant or breastfeeding, or are under 18.</p>
        <div className="flex flex-wrap justify-between gap-3 pb-8 pt-4 text-[13px] text-muted">
          <span>© 2026 Chop Lean, Lagos</span>
          <span>Nigeria (NGN ₦)</span>
        </div>
      </div>
    </footer>
  );
}
