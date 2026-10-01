"use client";
import { startTransition, useActionState } from "react";
import { trackOrder, type TrackState } from "@/app/actions/track";

const input = "min-h-[52px] w-full rounded-[14px] border border-input-line bg-surface px-4 text-base";

export function TrackForm() {
  const [state, run, pending] = useActionState<TrackState | null, FormData>(trackOrder, null);
  return (
    <form method="post" noValidate className="grid gap-4" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => run(fd)); }}>
      <div className="flex flex-col gap-1.5"><label htmlFor="t-num" className="text-[13px] font-bold">Order number</label><input id="t-num" name="number" placeholder="CL-10482" autoComplete="off" required className={input} /></div>
      <div className="flex flex-col gap-1.5"><label htmlFor="t-email" className="text-[13px] font-bold">Email</label><input id="t-email" name="email" type="email" autoComplete="email" required className={input} /></div>
      {state?.error && <p role="alert" className="text-sm text-price-red">{state.error}</p>}
      <button disabled={pending} className="btn-primary cl-btn w-full disabled:opacity-60">{pending ? "Looking…" : "Find my order"}</button>
    </form>
  );
}
