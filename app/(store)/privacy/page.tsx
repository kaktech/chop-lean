import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero image="kitchen.jpg" eyebrow="Legal" title="Privacy" accent="policy" crumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]} size="sm" />
      <article className="container-x prose-cl max-w-[820px] py-14 md:py-20">
        <p className="text-sm text-muted">Last updated: 1 October 2026</p>
        <h2 className="!mt-6">What we collect</h2>
        <ul>
          <li><strong>Account and orders:</strong> name, email, phone number, delivery address, order history and notes you give the kitchen.</li>
          <li><strong>Health-related details you choose to share:</strong> your quiz answers (age, sex, height, weight, activity, foods you avoid) and weight logs. These are used only to set your calorie target and show your progress.</li>
          <li><strong>Sign-in:</strong> if you use Google, your name, email and profile photo. If you use a password, we store only a salted hash of it, never the password itself.</li>
          <li><strong>Reviews, messages and newsletter:</strong> what you submit through those forms.</li>
          <li><strong>Payments:</strong> card details are entered with Paystack and never reach our servers. We keep the payment reference, amount and status.</li>
        </ul>
        <h2>How we use it</h2>
        <p>To prepare and deliver your orders, take payment, send confirmation and sign-in emails, answer your questions, show your progress, prevent fraud and improve the service. We send marketing emails only if you subscribe to the weekly menu, and you can unsubscribe at any time.</p>
        <h2>Who we share it with</h2>
        <p>Only the services we need to run the store: Neon (database), Vercel (hosting and file storage), Mailgun (email), Paystack (card payments) and Google (sign-in, if you choose it). Delivery riders see your name, phone number and address for your delivery. We do not sell your data.</p>
        <h2>Cookies and storage</h2>
        <p>We use a strictly necessary session cookie to keep you signed in, and your browser&apos;s local storage to remember your cart and quiz answers. We don&apos;t use advertising cookies.</p>
        <h2>How long we keep it</h2>
        <p>We keep order records as long as needed for accounting and legal reasons. Account data, weight logs and quiz answers are kept until you ask us to delete them.</p>
        <h2>Your rights</h2>
        <p>Under the Nigeria Data Protection Act 2023 you can ask to access, correct or delete your personal data, or object to how we use it. <Link href="/contact">Contact us</Link> and we&apos;ll respond within a reasonable time.</p>
      </article>
    </>
  );
}
