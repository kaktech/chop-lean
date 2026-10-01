import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { TrackForm } from "@/components/forms/TrackForm";

export const metadata: Metadata = { title: "Track an order", robots: { index: false } };

export default function TrackPage() {
  return (
    <>
      <PageHero image="rider.jpg" eyebrow="Orders" title="Track your" accent="order" blurb="Enter your order number and the email you ordered with to see its status." crumbs={[{ label: "Home", href: "/" }, { label: "Track an order" }]} size="sm" position="center 40%" />
      <div className="container-x py-14 md:py-20"><div className="mx-auto max-w-[520px] rounded-[28px] border border-line bg-surface p-7 md:p-9"><TrackForm /><p className="mt-5 text-sm text-muted">Your order number is in your confirmation email, for example <b className="text-fg">CL-10482</b>. Signed in? Your orders are under Account.</p></div></div>
    </>
  );
}
