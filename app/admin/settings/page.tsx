import type { Metadata } from "next";
import { getSettings } from "@/lib/admin";
import { adminEmails } from "@/auth";
import { paystackConfigured } from "@/lib/paystack";
import { BankForm } from "@/components/admin/BankForm";

export const metadata: Metadata = { title: "Store settings" };

export default async function AdminSettings() {
  const st = await getSettings();
  const checks: [string, boolean, string][] = [
    ["Database (Neon/Supabase)", !!process.env.DATABASE_URL, "DATABASE_URL"],
    ["Google sign-in", !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET, "AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET"],
    ["Mailgun emails", !!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN, "MAILGUN_API_KEY, MAILGUN_DOMAIN"],
    ["Paystack cards", paystackConfigured(), "PAYSTACK_SECRET_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"],
    ["Photo and receipt uploads", !!process.env.BLOB_READ_WRITE_TOKEN, "BLOB_READ_WRITE_TOKEN"],
    ["Admin alert emails", adminEmails().length > 0, "ADMIN_EMAILS"],
  ];
  return (
    <div className="flex max-w-[760px] flex-col gap-5">
      <h1 className="text-[34px] md:text-[40px]">Store settings</h1>
      <section className="rounded-[24px] border border-line bg-surface p-6"><h2 className="text-xl">Bank transfer details</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Shown to customers who pay by transfer and included in their confirmation email.</p>
        <BankForm bankName={st.bankName ?? ""} accountNumber={st.accountNumber ?? ""} accountName={st.accountName ?? ""} /></section>
      <section className="rounded-[24px] border border-line bg-surface p-6"><h2 className="text-xl">Integrations</h2>
        <ul className="mt-3 divide-y divide-line">{checks.map(([l, ok, env]) => <li key={l} className="flex items-center justify-between gap-4 py-3 text-sm"><span><b>{l}</b><br /><span className="text-xs text-muted">{env}</span></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${ok ? "bg-tint-green text-leaf-soft" : "bg-tint-amber text-[#F6D58A]"}`}>{ok ? "Connected" : "Not set"}</span></li>)}</ul></section>
    </div>
  );
}
