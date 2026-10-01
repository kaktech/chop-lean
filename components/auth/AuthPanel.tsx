"use client";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { requestLoginCode, requestReset, requestSignup, signInWithPassword, verifyAuthCode, type OtpState, type Purpose } from "@/app/actions/otp";

const input = "min-h-[54px] w-full rounded-[14px] border border-input-line bg-surface px-4 text-base";
const primary = "cl-btn min-h-[54px] rounded-[14px] font-bold disabled:opacity-60";

/** Submit without React resetting the form afterwards, so typed values survive an error. */
const submitWith = (action: (fd: FormData) => void, remember?: (fd: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  remember?.(fd);
  startTransition(() => action(fd));
};

type Mode = "signin" | "signup" | "code" | "forgot";

export function AuthPanel({ callbackUrl }: { callbackUrl: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const tab = mode === "code" ? "code" : "password";

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 gap-1 rounded-full border border-line bg-surface p-1 text-sm font-bold">
        {([["password", "Password"], ["code", "Email me a code"]] as const).map(([k, l]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setMode(k === "code" ? "code" : "signin")}
            className={`min-h-11 rounded-full ${tab === k ? "bg-ink text-white" : "text-muted"}`}>{l}</button>
        ))}
      </div>
      {mode === "signin" && <PasswordSignIn callbackUrl={callbackUrl} onSignup={() => setMode("signup")} onForgot={() => setMode("forgot")} />}
      {mode === "signup" && <Signup callbackUrl={callbackUrl} onBack={() => setMode("signin")} />}
      {mode === "forgot" && <Reset callbackUrl={callbackUrl} onBack={() => setMode("signin")} />}
      {mode === "code" && <EmailCode callbackUrl={callbackUrl} />}
    </div>
  );
}

function Err({ children }: { children?: string }) {
  return children ? <p role="alert" className="text-sm text-price-red">{children}</p> : null;
}

function PasswordSignIn({ callbackUrl, onSignup, onForgot }: { callbackUrl: string; onSignup: () => void; onForgot: () => void }) {
  const [state, action, pending] = useActionState<OtpState | null, FormData>(signInWithPassword, null);
  const [show, setShow] = useState(false);
  return (
    <form onSubmit={submitWith(action)} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label htmlFor="pw-email" className="text-[13px] font-bold">Email</label>
      <input id="pw-email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@email.com" defaultValue={state?.email} className={input} />
      <label htmlFor="pw-pass" className="flex justify-between text-[13px] font-bold">Password
        <button type="button" onClick={onForgot} className="font-normal text-leaf underline">Forgot password?</button></label>
      <div className="relative">
        <input id="pw-pass" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className={`${input} pr-20`} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 px-3 text-sm font-bold text-muted">{show ? "Hide" : "Show"}</button>
      </div>
      <Err>{state?.error}</Err>
      <button disabled={pending} className={`${primary} bg-yellow text-canvas`}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-muted">New here? <button type="button" onClick={onSignup} className="font-bold text-leaf underline">Create an account</button></p>
    </form>
  );
}

/** Shared "enter the code" step used by sign-up, reset and email-code sign-in. */
function CodeStep({ purpose, email, message, callbackUrl, onResend, resending, cooldown, onChangeEmail, children, cta }: {
  purpose: Purpose; email: string; message?: string; callbackUrl: string; onResend: () => void; resending: boolean; cooldown: number; onChangeEmail: () => void; children?: React.ReactNode; cta: string;
}) {
  const [state, action, pending] = useActionState<OtpState | null, FormData>(verifyAuthCode, null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submitWith(action)} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="purpose" value={purpose} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <p role="status" className="rounded-xl bg-tint-green px-4 py-3 text-sm text-leaf-soft">{message ?? `Enter the 6-digit code we emailed to ${email}.`}</p>
        <label htmlFor="otp-code" className="text-[13px] font-bold">6-digit code</label>
        <input ref={ref} id="otp-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={7} required placeholder="000000" className={`${input} text-center font-mono text-[28px] tracking-[0.4em]`} />
        {children}
        <Err>{state?.error}</Err>
        <button disabled={pending} className={`${primary} bg-yellow text-canvas`}>{pending ? "Checking…" : cta}</button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={onResend} disabled={resending || cooldown > 0} className="min-h-11 font-bold text-leaf underline disabled:text-muted disabled:no-underline">{cooldown > 0 ? `Send a new code in ${cooldown}s` : resending ? "Sending…" : "Send a new code"}</button>
        <button type="button" onClick={onChangeEmail} className="min-h-11 text-muted underline">Use a different email</button>
      </div>
      <p className="text-xs text-muted">Can&apos;t find it? Check your spam folder. The code works once and expires in 10 minutes.</p>
    </div>
  );
}

function useCooldown(trigger: unknown) {
  const [c, setC] = useState(0);
  useEffect(() => { if (trigger) setC(30); }, [trigger]);
  useEffect(() => { if (c <= 0) return; const t = setTimeout(() => setC((x) => x - 1), 1000); return () => clearTimeout(t); }, [c]);
  return c;
}

function EmailCode({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState<OtpState | null, FormData>(requestLoginCode, null);
  const [editing, setEditing] = useState(false);
  const cooldown = useCooldown(state?.sentAt);
  useEffect(() => { if (state?.sentAt) setEditing(false); }, [state]);
  const email = state?.email ?? "";
  if (state?.step === "code" && !editing) {
    return <CodeStep purpose="login" email={email} message={state.message} callbackUrl={callbackUrl} cta="Sign in" resending={pending} cooldown={cooldown} onChangeEmail={() => setEditing(true)}
      onResend={() => { const fd = new FormData(); fd.set("email", email); startTransition(() => (action as (f: FormData) => void)(fd)); }} />;
  }
  return (
    <form onSubmit={submitWith(action)} className="flex flex-col gap-3" noValidate>
      <label htmlFor="otp-email" className="text-[13px] font-bold">Email</label>
      <input id="otp-email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@email.com" defaultValue={email} className={input} />
      <Err>{state?.error}</Err>
      <button disabled={pending} className={`${primary} bg-yellow text-canvas`}>{pending ? "Sending code…" : "Email me a code"}</button>
      <p className="text-[13px] text-muted">No password, no set-up. We email a 6-digit code and you&apos;re in. New emails get an account automatically.</p>
    </form>
  );
}

function Signup({ callbackUrl, onBack }: { callbackUrl: string; onBack: () => void }) {
  const [state, action, pending] = useActionState<OtpState | null, FormData>(requestSignup, null);
  const [editing, setEditing] = useState(false);
  const [show, setShow] = useState(false);
  const cooldown = useCooldown(state?.sentAt);
  const last = useRef<FormData | null>(null);
  useEffect(() => { if (state?.sentAt) setEditing(false); }, [state]);
  if (state?.step === "code" && !editing) {
    return <CodeStep purpose="signup" email={state.email ?? ""} message={state.message} callbackUrl={callbackUrl} cta="Verify and create account" resending={pending} cooldown={cooldown} onChangeEmail={() => setEditing(true)}
      onResend={() => last.current && startTransition(() => action(last.current!))} />;
  }
  return (
    <form onSubmit={submitWith(action, (fd) => { last.current = fd; })} className="flex flex-col gap-3" noValidate>
      <label htmlFor="su-name" className="text-[13px] font-bold">Your name</label>
      <input id="su-name" name="name" autoComplete="name" required className={input} />
      <label htmlFor="su-email" className="text-[13px] font-bold">Email</label>
      <input id="su-email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@email.com" defaultValue={state?.email} className={input} />
      <label htmlFor="su-pass" className="text-[13px] font-bold">Password</label>
      <div className="relative">
        <input id="su-pass" name="password" type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} aria-describedby="su-hint" className={`${input} pr-20`} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 px-3 text-sm font-bold text-muted">{show ? "Hide" : "Show"}</button>
      </div>
      <p id="su-hint" className="-mt-1 text-xs text-muted">At least 8 characters with a letter and a number.</p>
      <Err>{state?.error}</Err>
      <button disabled={pending} className={`${primary} bg-yellow text-canvas`}>{pending ? "Sending code…" : "Create account"}</button>
      <p className="text-xs text-muted">We&apos;ll email a code to confirm it&apos;s really your address.</p>
      <p className="text-center text-sm text-muted">Already have an account? <button type="button" onClick={onBack} className="font-bold text-leaf underline">Sign in</button></p>
    </form>
  );
}

function Reset({ callbackUrl, onBack }: { callbackUrl: string; onBack: () => void }) {
  const [state, action, pending] = useActionState<OtpState | null, FormData>(requestReset, null);
  const [editing, setEditing] = useState(false);
  const [show, setShow] = useState(false);
  const cooldown = useCooldown(state?.sentAt);
  useEffect(() => { if (state?.sentAt) setEditing(false); }, [state]);
  const email = state?.email ?? "";
  if (state?.step === "code" && !editing) {
    return (
      <CodeStep purpose="reset" email={email} message={state.message} callbackUrl={callbackUrl} cta="Set new password and sign in" resending={pending} cooldown={cooldown} onChangeEmail={() => setEditing(true)}
        onResend={() => { const fd = new FormData(); fd.set("email", email); startTransition(() => (action as (f: FormData) => void)(fd)); }}>
        <label htmlFor="rs-pass" className="text-[13px] font-bold">New password</label>
        <div className="relative">
          <input id="rs-pass" name="newPassword" type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} className={`${input} pr-20`} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 px-3 text-sm font-bold text-muted">{show ? "Hide" : "Show"}</button>
        </div>
      </CodeStep>
    );
  }
  return (
    <form onSubmit={submitWith(action)} className="flex flex-col gap-3" noValidate>
      <p className="text-sm text-muted">Enter your email and we&apos;ll send a code to set a new password.</p>
      <label htmlFor="rs-email" className="text-[13px] font-bold">Email</label>
      <input id="rs-email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={email} className={input} />
      <Err>{state?.error}</Err>
      <button disabled={pending} className={`${primary} bg-yellow text-canvas`}>{pending ? "Sending code…" : "Email me a reset code"}</button>
      <button type="button" onClick={onBack} className="min-h-11 text-sm font-bold text-leaf underline">Back to sign in</button>
    </form>
  );
}
