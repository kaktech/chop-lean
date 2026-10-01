"use client";
import { startTransition, useActionState } from "react";
import { submitContact, submitGiftCard, type ContactState } from "@/app/actions/contact";

const input = "min-h-[52px] w-full rounded-[14px] border border-input-line bg-surface px-4 text-base";

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (<div className="flex flex-col gap-1.5"><label htmlFor={id} className="text-[13px] font-bold">{label}</label>{children}{error && <p role="alert" className="text-[13px] text-price-red">{error}</p>}</div>);
}

function useForm(action: (s: ContactState | null, fd: FormData) => Promise<ContactState>) {
  const [state, run, pending] = useActionState(action, null);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => { run(fd); });
  };
  return { state, pending, onSubmit };
}

export function ContactForm() {
  const { state, pending, onSubmit } = useForm(submitContact);
  if (state?.ok) return <div role="status" className="rounded-[24px] border border-line bg-tint-green p-8 text-center"><p className="font-serif text-3xl">Message sent</p><p className="mt-2 text-body">{state.message}</p></div>;
  const e = state?.errors;
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" id="c-name" error={e?.name}><input id="c-name" name="name" autoComplete="name" required className={input} /></Field>
        <Field label="Email" id="c-email" error={e?.email}><input id="c-email" name="email" type="email" autoComplete="email" required className={input} /></Field>
      </div>
      <Field label="Phone / WhatsApp (optional)" id="c-phone" error={e?.phone}><input id="c-phone" name="phone" type="tel" autoComplete="tel" placeholder="0803 000 0000" className={input} /></Field>
      <Field label="How can we help?" id="c-msg" error={e?.message}><textarea id="c-msg" name="message" rows={5} required placeholder="Include your order number if it's about an order." className={`${input} py-3`} /></Field>
      {state && !state.ok && !e && <p role="alert" className="text-sm text-price-red">{state.message}</p>}
      <button disabled={pending} className="btn-primary cl-btn w-full disabled:opacity-60 sm:w-auto">{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}

export function GiftCardForm() {
  const { state, pending, onSubmit } = useForm(submitGiftCard);
  if (state?.ok) return <div role="status" className="rounded-[24px] border border-line bg-tint-green p-8 text-center"><p className="font-serif text-3xl">Request received</p><p className="mt-2 text-body">{state.message}</p></div>;
  const e = state?.errors;
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="hidden" aria-hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <Field label="Amount (₦)" id="g-amount" error={e?.amount}>
        <select id="g-amount" name="amount" defaultValue="50000" className={input}>{[10000, 25000, 50000, 100000, 200000].map((a) => <option key={a} value={a}>₦{a.toLocaleString("en-NG")}</option>)}</select>
      </Field>
      <Field label="Who is it for?" id="g-rec" error={e?.recipient}><input id="g-rec" name="recipient" placeholder="Their name" required className={input} /></Field>
      <Field label="A note for them (optional)" id="g-note"><textarea id="g-note" name="note" rows={3} maxLength={500} className={`${input} py-3`} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" id="g-name" error={e?.name}><input id="g-name" name="name" autoComplete="name" required className={input} /></Field>
        <Field label="Your email" id="g-email" error={e?.email}><input id="g-email" name="email" type="email" autoComplete="email" required className={input} /></Field>
      </div>
      {state && !state.ok && !e && <p role="alert" className="text-sm text-price-red">{state.message}</p>}
      <button disabled={pending} className="btn-primary cl-btn w-full disabled:opacity-60 sm:w-auto">{pending ? "Sending…" : "Request gift card"}</button>
    </form>
  );
}
