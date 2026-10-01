"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="text-[36px] tracking-[-0.03em] md:text-[52px]">Something burnt in the <span className="font-serif font-normal italic text-green">kitchen.</span></h1>
      <p className="mt-3 max-w-md text-muted">That wasn&apos;t supposed to happen. Try again, and if it keeps happening message us on WhatsApp.{error.digest ? ` (ref ${error.digest})` : ""}</p>
      <div className="mt-7 flex gap-3">
        <button onClick={reset} className="cl-btn tap rounded-full bg-yellow px-7 font-bold text-ink">Try again</button>
        <Link href="/" className="cl-btn tap flex items-center rounded-full border-[1.5px] border-ink px-7 font-bold text-ink no-underline">Go home</Link>
      </div>
    </div>
  );
}
