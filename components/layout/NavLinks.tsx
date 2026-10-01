"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links, className = "" }: { links: { href: string; label: string; xl?: boolean; wide?: boolean }[]; className?: string }) {
  const path = usePathname();
  return (
    <ul className={`flex items-center gap-7 ${className}`}>
      {links.map((l) => {
        const base = l.href.split("?")[0];
        const active = base === "/" ? path === "/" : path === base || path.startsWith(base + "/");
        return (
          <li key={l.href} className={l.wide ? "hidden 2xl:block" : l.xl ? "hidden xl:block" : ""}>
            <Link href={l.href} aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 items-center whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.14em] no-underline transition-colors after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:bg-yellow after:transition-transform ${active ? "text-yellow after:scale-x-100" : "text-fg after:scale-x-0 hover:text-yellow hover:after:scale-x-100"}`}>
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
