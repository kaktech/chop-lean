"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: [string, [string, string][]][] = [
  ["Main", [["Dashboard", "/admin"]]],
  ["Sales and menu", [["Products and plans", "/admin/products"], ["Weekly menu", "/admin/menu"], ["Orders and delivery", "/admin/orders"], ["Payments", "/admin/payments"]]],
  ["Settings", [["Store settings", "/admin/settings"], ["View store", "/"]]],
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:mt-6 lg:flex-col lg:overflow-visible">
      {GROUPS.map(([g, links]) => (
        <div key={g} className="flex gap-1 lg:flex-col lg:gap-1">
          <div className="label-sm hidden px-3 pb-2 pt-5 text-[11px] text-muted lg:block">{g}</div>
          {links.map(([label, href]) => {
            const active = href === "/admin" ? path === "/admin" : path.startsWith(href) && href !== "/";
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-xl px-3 text-[15px] no-underline ${active ? "bg-green font-bold text-white" : "text-ink hover:bg-cream"}`}>{label}</Link>;
          })}
        </div>
      ))}
    </nav>
  );
}
