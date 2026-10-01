import type { Metadata } from "next";
import { Gift, Mail, UtensilsCrossed } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { GiftCardForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = { title: "Gift cards", description: "Gift a week of calorie-counted Nigerian meals. Request a Chop Lean gift card for someone you care about." };

export default function GiftCardsPage() {
  const steps = [[Gift, "Choose an amount", "From ₦10,000 to ₦200,000, for a plan or a few plates."], [Mail, "We send a payment link", "We email you within one working day with a secure payment link."], [UtensilsCrossed, "They choose their meals", "We send them a code to use at checkout on any plan or dish."]] as const;
  return (
    <>
      <PageHero image="meal-box.jpg" eyebrow="Gift cards" title="Gift a week of" accent="good food" blurb="Chop Lean gift cards are arranged by request so we can make sure they get to the right person." crumbs={[{ label: "Home", href: "/" }, { label: "Gift cards" }]} size="sm" />
      <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_460px]">
        <div>
          <h2 className="display-xl text-[26px] md:text-[34px]">How it <span className="serif-accent">works</span></h2>
          <ol className="mt-8 flex flex-col gap-6">{steps.map(([Icon, t, d], i) => (
            <li key={t} className="flex gap-5"><span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-yellow/40 bg-yellow/10 text-yellow"><Icon size={24} strokeWidth={1.6} aria-hidden /></span><div><h3 className="font-display text-xl">{i + 1}. {t}</h3><p className="mt-1 text-muted">{d}</p></div></li>
          ))}</ol>
        </div>
        <div className="rounded-[28px] border border-line bg-surface p-6 md:p-8"><h2 className="mb-5 text-2xl">Request a gift card</h2><GiftCardForm /></div>
      </div>
    </>
  );
}
