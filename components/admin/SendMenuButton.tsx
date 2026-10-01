"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { sendMenuToSubscribers } from "@/app/actions/admin";

export function SendMenuButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending || count === 0} onClick={() => { if (confirm(`Email this week's menu to ${count} subscriber${count === 1 ? "" : "s"}?`)) start(async () => { const r = await sendMenuToSubscribers(); r.ok ? toast.success(r.message) : toast.error(r.message); }); }}
      className="cl-btn tap rounded-xl bg-yellow px-6 font-bold text-canvas disabled:opacity-50">{pending ? "Sending…" : "Send menu to subscribers"}</button>
  );
}
