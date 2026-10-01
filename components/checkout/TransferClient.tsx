"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { markTransferSent, uploadReceipt } from "@/app/actions/checkout";
import { formatNaira, formatNairaFull } from "@/lib/money";
import { whatsappUrl } from "@/lib/site";

type Props = {
  orderId: string; number: string; totalKobo: number; heldUntil: string; awaiting: boolean; receiptUploaded: boolean;
  bank: { bankName: string; accountNumber: string; accountName: string; configured: boolean };
  summary: { title: string; subtotal: number; discount: number; delivery: number; promo: string | null; deliveryLine: string; fmt: string };
};

const pad = (n: number) => String(n).padStart(2, "0");

export function TransferClient({ orderId, number, totalKobo, heldUntil, awaiting, receiptUploaded, bank, summary }: Props) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const [receipt, setReceipt] = useState(receiptUploaded);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [heldUntil]);

  const copy = (label: string, value: string) => navigator.clipboard?.writeText(value).then(() => toast.success(`${label} copied`));
  const rows: [string, string, string | null][] = [
    ["Bank", bank.bankName, null],
    ["Account number", bank.accountNumber, bank.accountNumber],
    ["Account name", bank.accountName, bank.accountName],
    ["Amount", formatNairaFull(totalKobo), String(totalKobo / 100)],
    ["Reference", number, number],
  ];

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("receipt", file);
    setError(null);
    start(async () => {
      const r = await uploadReceipt(orderId, fd);
      if (r.ok) { setReceipt(true); toast.success("Receipt uploaded"); } else setError(r.message);
    });
  };

  const sent = () => start(async () => {
    const r = await markTransferSent(orderId);
    if (r.ok) { toast.success("Thanks! We'll confirm your payment shortly."); router.refresh(); } else setError(r.message);
  });

  return (
    <div className="container-x grid gap-8 pb-10 pt-8 lg:grid-cols-[1fr_510px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-tint-amber px-3.5 py-1.5 text-[13px] font-bold text-[#F6D58A]">{awaiting ? "Payment being confirmed" : "Awaiting your transfer"}</span>
          {left !== null && (
            <span className="text-sm text-muted" aria-live="off">
              {left > 0 ? <>Slot held for <b className="font-display text-lg text-fg">{pad(Math.floor(left / 60))}:{pad(left % 60)}</b></> : "Hold expired. You can still pay, and we'll confirm manually."}
            </span>
          )}
        </div>
        <h1 className="mt-5 text-[34px] leading-[1.05] tracking-[-0.03em] md:text-[56px]">
          {awaiting ? <>Thanks! We&apos;re <span className="text-leaf">checking</span> your transfer.</> : <>Transfer exactly <span className="text-leaf">{formatNaira(totalKobo)}</span> to hold your delivery.</>}
        </h1>
        <p className="mt-4 max-w-[560px] text-body">Use your bank app. Put the order reference in the narration so we can match your payment quickly.</p>

        <dl className="mt-6 overflow-hidden rounded-[24px] border border-line bg-surface">
          {rows.map(([label, value, copyVal]) => (
            <div key={label} className="flex items-center gap-4 border-b border-line px-6 py-4 last:border-b-0">
              <dt className="label-sm w-[130px] shrink-0 text-[11px] text-muted md:w-[170px]">{label}</dt>
              <dd className="min-w-0 flex-1 break-words font-display text-lg font-bold md:text-[22px]">{value}</dd>
              {copyVal && <button type="button" onClick={() => copy(label, copyVal)} className="tap rounded-full bg-surface-2 px-4 text-[13px] font-bold">Copy</button>}
            </div>
          ))}
          {!bank.configured && <div className="bg-canvas px-6 py-3 text-[13px] text-muted">Account details shown are placeholders. Replace them with the business account in Admin › Store settings.</div>}
        </dl>

        {!awaiting && (
          <section className="mt-6 rounded-[24px] border border-line bg-surface p-6">
            <h2 className="text-lg">Upload your receipt (optional, but faster)</h2>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" id="receipt" onChange={(e) => onFile(e.target.files?.[0])} />
            <label htmlFor="receipt" className="mt-4 flex min-h-[130px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-input-line p-6 text-center">
              <Upload size={22} className="text-leaf" aria-hidden />
              <b>{receipt ? "Receipt uploaded. Tap to replace" : "Tap to upload a screenshot or PDF"}</b>
              <span className="text-xs text-muted">JPG, PNG or PDF, up to 5MB</span>
            </label>
            {error && <p role="alert" className="mt-3 text-sm text-price-red">{error}</p>}
          </section>
        )}

        {!awaiting && (
          <button type="button" onClick={sent} disabled={pending} className="cl-btn mt-6 min-h-14 rounded-full bg-yellow px-8 font-bold text-canvas disabled:opacity-60">{pending ? "One moment…" : "I've sent the money"}</button>
        )}
        {awaiting && <p className="mt-6 text-body">We&apos;ll email you the moment your payment is confirmed. Questions? <a className="font-bold text-leaf underline" href={whatsappUrl()}>Chat on WhatsApp</a>.</p>}
      </div>

      <aside className="relative h-fit overflow-hidden rounded-[26px] bg-green p-7 text-white" aria-label="Your order">
        <div className="label-sm text-[11px] text-yellow">Your order</div>
        <h2 className="mt-3 text-[26px]">{summary.title}</h2>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNaira(summary.subtotal)}</dd></div>
          {summary.discount > 0 && <div className="flex justify-between"><dt>{summary.promo}</dt><dd>- {formatNaira(summary.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{summary.delivery ? formatNaira(summary.delivery) : "Free"}</dd></div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-white/25 pt-4"><b className="font-display text-xl">Total</b><b className="font-display text-xl">{summary.fmt}</b></div>
        <p className="mt-5 text-[13px] text-mint">{summary.deliveryLine}</p>
        <p className="mt-3 text-[13px]">Questions? <a href={whatsappUrl()} className="font-bold text-yellow underline">Chat on WhatsApp</a></p>
      </aside>
    </div>
  );
}
