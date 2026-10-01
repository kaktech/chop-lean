import Link from "next/link";

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <circle cx="32" cy="32" r="32" fill="#17785F" /><path d="M32 33C25 29 24 17 38 9c6 9 3 21-6 24z" fill="#FBB826" /><path d="M33 31c0-6 2-11 6-14" stroke="#17785F" strokeWidth="1.6" fill="none" strokeLinecap="round" /><path d="M11 38c0-1.5 9-4 21-4s21 2.5 21 4-9 4-21 4-21-2.5-21-4z" fill="#FBB826" /><path d="M14 41c1 9 8 14 18 14s17-5 18-14c-5 2.5-11 3.5-18 3.5S19 43.5 14 41z" fill="#FBB826" />
    </svg>
  );
}

export function Wordmark({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      Chop<span className={dark ? "text-yellow" : "text-leaf"}>Lean</span>
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-fg no-underline" aria-label="Chop Lean home">
      <LogoMark />
      <Wordmark className="text-[26px]" />
    </Link>
  );
}
