"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { confirmTransfer, rejectTransfer, updateOrderStatus } from "@/app/actions/admin";

export const STATUS_STYLE: Record<string, [string, string, string]> = {
  pending_payment: ["Pending payment", "#FCEBC9", "#6B4A00"],
  cooking: ["Cooking", "#DDE0F6", "#2B3480"],
  out_for_delivery: ["Out for delivery", "#F9DCDC", "#8E1F14"],
  delivered: ["Delivered", "#DCEFD2", "#24421A"],
  cancelled: ["Cancelled", "#E6E4DC", "#3A4540"],
};

export function StatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [pending, start] = useTransition();
  const [, bg, fg] = STATUS_STYLE[status] ?? STATUS_STYLE.pending_payment;
  return (
    <select aria-label="Order status" defaultValue={status} disabled={pending} style={{ background: bg, color: fg }}
      onChange={(e) => start(async () => { const r = await updateOrderStatus(orderId, e.target.value); r.ok ? toast.success(r.message) : toast.error(r.message); })}
      className="min-h-11 rounded-lg border-0 px-3 py-2 text-[13px] font-bold disabled:opacity-60">
      {Object.entries(STATUS_STYLE).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}

export function TransferActions({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const run = (fn: (id: string) => Promise<{ ok: boolean; message: string }>) => start(async () => { const r = await fn(orderId); r.ok ? toast.success(r.message) : toast.error(r.message); });
  return (
    <span className="flex gap-2">
      <button disabled={pending} onClick={() => run(confirmTransfer)} className="tap rounded-lg bg-green px-4 text-[13px] font-bold text-white disabled:opacity-60">Confirm paid</button>
      <button disabled={pending} onClick={() => run(rejectTransfer)} className="tap rounded-lg border border-line bg-white px-4 text-[13px] font-bold text-price-red disabled:opacity-60">Not received</button>
    </span>
  );
}

export function PrintButton({ children }: { children: React.ReactNode }) {
  return <button type="button" onClick={() => window.print()} className="tap rounded-xl bg-[#F2F1EC] px-4 text-[13px] font-bold print:hidden">{children}</button>;
}
