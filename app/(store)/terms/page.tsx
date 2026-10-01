import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <>
      <PageHero image="meal-box.jpg" eyebrow="Legal" title="Terms of" accent="service" crumbs={[{ label: "Home", href: "/" }, { label: "Terms" }]} size="sm" />
      <article className="container-x prose-cl max-w-[820px] py-14 md:py-20">
        <p className="text-sm text-muted">Last updated: 1 October 2026</p>
        <h2 className="!mt-6">1. Who we are</h2>
        <p>Chop Lean (&quot;we&quot;, &quot;us&quot;) prepares and delivers calorie-counted Nigerian meals from our kitchen in Yaba, Lagos. By placing an order you agree to these terms.</p>
        <h2>2. Orders, cut-off and delivery</h2>
        <ul>
          <li>We deliver in Lagos on Monday, Wednesday and Friday, within the zones listed on our <Link href="/delivery">delivery page</Link>.</li>
          <li>Orders for a delivery day close at 6pm (Lagos time) on the day before.</li>
          <li>Please be available in your chosen delivery window. If we can&apos;t reach you we may leave the order with a neighbour or security, or reschedule it.</li>
          <li>Meals are delivered chilled. Keep them refrigerated and eat within 3 days.</li>
        </ul>
        <h2>3. Plans, pausing and skipping</h2>
        <p>Plans are weekly. You can change, pause or skip a week from your account before <strong>Thursday 6pm</strong> (Lagos time) of the week before. After that, the week is prepared and charged.</p>
        <h2>4. Prices and payment</h2>
        <p>Prices are in Naira and include the items shown; delivery fees are added at checkout. You can pay by card (processed by Paystack), by bank transfer, or by cash or transfer on delivery for a first order (a ₦500 fee applies). For bank transfers we hold your slot for 30 minutes; an order is confirmed when we receive payment. Promo codes are single use and may have conditions, for example CHOPLEAN20 applies to the first week of a plan on a first order.</p>
        <h2>5. Health and allergies</h2>
        <p>Our plans support weight management and are <strong>not medical treatment</strong>. Speak to your doctor before starting if you have a health condition, are pregnant or breastfeeding, or are under 18. Our kitchen handles fish, shellfish, egg, groundnut, wheat and other allergens, so we cannot guarantee that any dish is free from traces. Calorie and nutrition figures are estimates.</p>
        <h2>6. Problems with your order</h2>
        <p>If something is missing, wrong or not as it should be, contact us through <Link href="/contact">the contact form</Link> or WhatsApp with your order number as soon as you can, ideally within 24 hours of delivery, and we will put it right with a replacement, credit or refund as appropriate.</p>
        <h2>7. Your account</h2>
        <p>Keep your sign-in details secure. You are responsible for activity on your account. You can delete your account by contacting us.</p>
        <h2>8. Liability</h2>
        <p>To the extent the law allows, we are not liable for indirect losses. Nothing in these terms limits liability that cannot be limited by law.</p>
        <h2>9. Changes and contact</h2>
        <p>We may update these terms and will change the date above when we do. Questions? <Link href="/contact">Contact us</Link>.</p>
      </article>
    </>
  );
}
