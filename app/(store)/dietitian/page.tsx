import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = { title: "Meet the dietitian", description: "How Chop Lean sets calorie targets, who our plans are for, and who should speak to a doctor first." };

export default function DietitianPage() {
  return (
    <>
      <PageHero image="grilled-fish.jpg" eyebrow="Nutrition" title="Meet the" accent="dietitian" blurb="Our plans are designed with a registered dietitian. Here's exactly how your calorie target is worked out." crumbs={[{ label: "Home", href: "/" }, { label: "Meet the dietitian" }]} />
      <div className="container-x grid gap-12 py-14 md:py-24 lg:grid-cols-[1fr_340px]">
        <article className="prose-cl max-w-[760px]">
          <h2 className="!mt-0">How your calories are set</h2>
          <p>The quiz estimates how much energy your body uses in a day with the <strong>Mifflin-St Jeor equation</strong>, which uses your sex, age, height and weight. We multiply that by an activity factor (desk job, on your feet all day, or training three or more times a week).</p>
          <ul>
            <li><strong>Lose weight:</strong> we subtract 500 kcal a day, which is roughly 0.5 kg a week.</li>
            <li><strong>Maintain:</strong> no adjustment.</li>
            <li><strong>Build muscle:</strong> we add a small surplus and raise protein.</li>
            <li><strong>Floor:</strong> we never go below 1,200 kcal a day.</li>
          </ul>
          <p>The result is rounded to the nearest plan: 1,200, 1,400, 1,600 or 1,800 kcal a day.</p>

          <h2>Protein and portions</h2>
          <p>We aim for about 1.3 g of protein per kg of body weight on a weight-loss plan and 1.6 g when building muscle. Rice, swallow and protein are weighed per portion, and oil is measured, so the calories printed on each lid are the calories in the box.</p>

          <h2>Who should speak to a doctor first</h2>
          <p>Our plans support weight management. They are <strong>not medical treatment</strong>. Please check with your doctor before starting a calorie-reduced plan if you:</p>
          <ul>
            <li>are pregnant or breastfeeding</li>
            <li>are under 18 (the quiz requires you to be 18 or over)</li>
            <li>manage diabetes, kidney disease or another long-term condition</li>
            <li>have, or have had, an eating disorder</li>
            <li>take medication that affects appetite, blood sugar or blood pressure</li>
          </ul>

          <h2>Allergies and exclusions</h2>
          <p>Tell us what you don&apos;t eat in the quiz, and add specific allergies or ingredients to leave out on each plan page or at checkout. Our kitchen handles fish, shellfish, egg, groundnut and wheat, so we can&apos;t guarantee a dish is free of traces. If you have a severe allergy, contact us before ordering.</p>
          <p className="text-sm text-muted">Calorie and macro figures on the site are estimates from the kitchen&apos;s recipes and should be verified by the dietitian before launch.</p>
        </article>

        <aside className="h-fit rounded-[26px] border border-line bg-surface p-7 lg:sticky lg:top-40">
          <div className="label-sm text-[11px] text-yellow">Our dietitian</div>
          <p className="mt-3 font-serif text-2xl">[Dietitian name and credentials go here]</p>
          <p className="mt-2 text-sm text-muted">Add the registered dietitian&apos;s name, registration number and short bio before launch. We don&apos;t show placeholder credentials as if they were real.</p>
          <Link href="/quiz" className="btn-primary cl-btn mt-6 w-full">Find my plan</Link>
          <Link href="/contact" className="btn-outline cl-btn mt-3 w-full">Ask a question</Link>
        </aside>
      </div>
    </>
  );
}
