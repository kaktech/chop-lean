import type { Metadata } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Chop Lean Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[292px_1fr]">
      <aside className="border-b border-line bg-white p-4 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
        <Link href="/admin" className="flex items-baseline gap-1.5 px-3 py-2 text-ink no-underline">
          <span className="font-display text-[28px] font-bold">Chop<span className="text-green">Lean</span></span><span className="text-xs text-muted">Admin</span>
        </Link>
        <AdminNav />
      </aside>
      <main id="main" className="min-w-0 p-4 md:p-8">{children}</main>
      <Toaster position="bottom-left" />
    </div>
  );
}
