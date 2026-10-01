"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { requestLoginCode, verifyLoginCode, type OtpState } from "@/app/actions/otp";

const input = "min-h-[54px] w-full rounded-[14px] border border-input-line bg-white px-4 text-base";

export function EmailSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [reqState, requestAction, requesting] = useActionState<OtpState | null, FormData>(requestLoginCode, null);
  const [verState, verifyAction, verifying] = useActionState<OtpState | null, FormData>(verifyLoginCode, null);
  const [cooldown, setCooldown] = useState(0);
  const [editing, setEditing] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const state = verState ?? reqState;
  const step = !editing && (verState?.step === "code" || reqState?.step === "code") ? "code" : "email";
  const email = verState?.email ?? reqState?.email ?? "";

  useEffect(() => {
    if (reqState?.sentAt) { setEditing(false); setCooldown(30); }
  }, [reqState]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);

  if (step === "email") {
    return (
      <form action={(fd) => { setEditing(false); requestAction(fd); }} className="flex flex-col gap-3" noValidate>
        <label htmlFor="otp-email" className="text-[13px] font-bold">Or use just your email</label>
        <input id="otp-email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@email.com" defaultValue={email} className={input} aria-invalid={!!reqState?.error} />
        {reqState?.error && <p role="alert" className="text-sm text-price-red">{reqState.error}</p>}
        <button disabled={requesting} className="cl-btn min-h-[54px] rounded-[14px] bg-ink font-bold text-white disabled:opacity-60">{requesting ? "Sending code…" : "Email me a code"}</button>
        <p className="text-[13px] text-muted">No password and no account set-up. We&apos;ll email a 6-digit code and you&apos;re in.</p>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={verifyAction} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <p role="status" className="rounded-xl bg-mint px-4 py-3 text-sm text-green-dark">{reqState?.message ?? `Enter the 6-digit code we emailed to ${email}.`}</p>
        <label htmlFor="otp-code" className="text-[13px] font-bold">6-digit code</label>
        <input ref={codeRef} id="otp-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={7} required placeholder="000000"
          className={`${input} text-center font-mono text-[28px] tracking-[0.4em]`} aria-invalid={!!verState?.error} />
        {(verState?.error || (reqState?.error && !verState)) && <p role="alert" className="text-sm text-price-red">{verState?.error ?? reqState?.error}</p>}
        <button disabled={verifying} className="cl-btn min-h-[54px] rounded-[14px] bg-yellow font-bold text-ink disabled:opacity-60">{verifying ? "Checking…" : "Sign in"}</button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <form action={requestAction}>
          <input type="hidden" name="email" value={email} />
          <button disabled={requesting || cooldown > 0} className="min-h-11 font-bold text-green underline disabled:text-muted disabled:no-underline">{cooldown > 0 ? `Send a new code in ${cooldown}s` : requesting ? "Sending…" : "Send a new code"}</button>
        </form>
        <button type="button" onClick={() => setEditing(true)} className="min-h-11 text-muted underline">Use a different email</button>
      </div>
      <p className="text-xs text-muted">Can&apos;t find it? Check your spam folder. The code works once and expires in 10 minutes.</p>
      <span className="sr-only" aria-live="polite">{state?.error ?? ""}</span>
    </div>
  );
}
