import Link from "next/link";
import { Lock } from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";

const STEPS = ["Cart", "Details and delivery", "Review and pay"];

export function CheckoutHeader({ step, right }: { step?: 1 | 2 | 3; right?: React.ReactNode }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="container-x flex items-center justify-between gap-4 py-4 md:py-[18px]">
        <Link href="/" className="text-ink no-underline" aria-label="Chop Lean home"><Wordmark className="text-[26px]" /></Link>
        {step && (
          <ol className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Checkout steps">
            {STEPS.map((s, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const done = n < step;
              return <li key={s} aria-current={n === step ? "step" : undefined} className={n === step ? "font-bold text-ink" : ""}>{done ? "✓ " : `${n} · `}{s}</li>;
            })}
          </ol>
        )}
        <span className="flex items-center gap-1.5 text-[13px] text-muted">{right ?? <><Lock size={14} aria-hidden />Secure checkout</>}</span>
      </div>
    </header>
  );
}
