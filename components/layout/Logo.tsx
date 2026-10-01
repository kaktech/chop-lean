import Link from "next/link";

export function LogoMark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-xl bg-yellow">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#15201A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h18a9 9 0 0 1-18 0z" />
        <path d="M12 12c0-4 2-7 6-8-1 4-3 6-6 8z" />
      </svg>
    </span>
  );
}

export function Wordmark({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      Chop<span className={dark ? "text-yellow" : "text-green"}>Lean</span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-ink no-underline" aria-label="Chop Lean home">
      <LogoMark />
      <Wordmark className="text-[26px]" />
    </Link>
  );
}
