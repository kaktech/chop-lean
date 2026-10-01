"use client";
import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterResult } from "@/app/actions/newsletter";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState<NewsletterResult | null, FormData>(subscribeNewsletter, null);
  return (
    <div className={compact ? "w-full" : "w-full md:w-auto md:min-w-[380px]"}>
      <form action={action} className="flex gap-2 rounded-full bg-surface p-1.5">
        <label htmlFor={compact ? "nl-email-m" : "nl-email"} className="sr-only">Email address</label>
        <input
          id={compact ? "nl-email-m" : "nl-email"}
          name="email"
          type="email"
          required
          placeholder={compact ? "Get the weekly menu" : "Enter your email"}
          className="min-h-11 min-w-0 flex-1 rounded-full border-0 bg-transparent px-4 text-fg outline-none placeholder:text-muted"
        />
        <button
          disabled={pending}
          className="cl-btn tap rounded-full bg-yellow px-5 font-bold text-canvas disabled:opacity-60"
        >
          {pending ? "…" : compact ? "Join" : "Subscribe"}
        </button>
      </form>
      <p role="status" aria-live="polite" className={`mt-2 min-h-5 pl-4 text-sm ${state?.ok ? "text-leaf-soft" : "text-price-red"}`}>
        {state?.message}
      </p>
    </div>
  );
}
