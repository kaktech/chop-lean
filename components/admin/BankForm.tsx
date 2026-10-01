"use client";
import { useActionState } from "react";
import { saveBankDetails } from "@/app/actions/admin";

export function BankForm({ bankName, accountNumber, accountName }: { bankName: string; accountNumber: string; accountName: string }) {
  const [state, action, pending] = useActionState(saveBankDetails, null);
  const input = "min-h-12 w-full rounded-xl border border-input-line bg-white px-4";
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="bn" className="mb-1.5 block text-[13px] font-bold">Bank name</label><input id="bn" name="bankName" defaultValue={bankName} required className={input} /></div>
      <div><label htmlFor="an" className="mb-1.5 block text-[13px] font-bold">Account number</label><input id="an" name="accountNumber" inputMode="numeric" maxLength={10} defaultValue={accountNumber} required className={input} /></div>
      <div className="sm:col-span-2"><label htmlFor="anm" className="mb-1.5 block text-[13px] font-bold">Account name</label><input id="anm" name="accountName" defaultValue={accountName} required className={input} /></div>
      <div className="flex items-center gap-4 sm:col-span-2"><button disabled={pending} className="cl-btn min-h-12 rounded-xl bg-ink px-6 font-bold text-white disabled:opacity-60">{pending ? "Saving…" : "Save bank details"}</button>
        <p role="status" className={`text-sm ${state && !state.ok ? "text-price-red" : "text-green"}`}>{state?.message}</p></div>
    </form>
  );
}
