import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us", description: "Message Chop Lean about an order, delivery or plan. We reply within one working day." };

export default function ContactPage() {
  const rows = [
    { icon: MessageCircle, t: "WhatsApp", d: "Fastest for order questions", href: whatsappUrl(), label: "Chat on WhatsApp" },
    { icon: MapPin, t: "Kitchen and pickup", d: "Yaba, Lagos. Pickup from 11am on delivery days." },
    { icon: Clock, t: "Reply time", d: "Within one working day. Orders close 6pm the day before delivery." },
    { icon: Mail, t: "Email", d: "Use the form and we'll reply to your inbox." },
  ];
  return (
    <>
      <PageHero image="woman-cafe.jpg" eyebrow="Get in touch" title="Let's" accent="talk" blurb="Questions about an order, a plan, an allergy or a delivery? We're here." crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]} size="sm" position="center 35%" />
      <div className="container-x grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_380px]">
        <div><h2 className="display-xl mb-6 text-[26px] md:text-[34px]">Send a <span className="serif-accent">message</span></h2><ContactForm /></div>
        <ul className="flex flex-col gap-4">
          {rows.map(({ icon: Icon, t, d, href, label }) => (
            <li key={t} className="flex gap-4 rounded-[22px] border border-line bg-surface p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-yellow/40 bg-yellow/10 text-yellow"><Icon size={20} aria-hidden /></span>
              <div><b className="font-display">{t}</b><p className="text-sm text-muted">{d}</p>{href && <a href={href} className="mt-1 inline-block text-sm font-bold text-yellow underline">{label}</a>}</div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
