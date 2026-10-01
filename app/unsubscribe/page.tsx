import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };
export const dynamic = "force-dynamic";

async function unsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (token.length > 10) await db.update(newsletterSubscribers).set({ unsubscribedAt: new Date() }).where(eq(newsletterSubscribers.token, token));
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token = "" } = await searchParams;
  const [sub] = token ? await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.token, token)).limit(1) : [];
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-[460px] rounded-[26px] border border-line bg-surface p-8 text-center">
        {!sub ? <><h1 className="text-3xl">Link not valid</h1><p className="mt-3 text-muted">That unsubscribe link isn&apos;t valid or has expired.</p></>
          : sub.unsubscribedAt ? <><h1 className="text-3xl">You&apos;re unsubscribed</h1><p className="mt-3 text-muted">{sub.email} won&apos;t get the weekly menu any more. You&apos;ll still get emails about orders you place.</p></>
          : <><h1 className="text-3xl">Unsubscribe?</h1><p className="mt-3 text-muted">Stop sending the weekly menu to <b className="text-fg">{sub.email}</b>.</p>
              <form action={unsubscribe} className="mt-6"><input type="hidden" name="token" value={token} /><button className="btn-primary cl-btn w-full">Yes, unsubscribe</button></form></>}
        <Link href="/" className="mt-6 inline-block text-sm text-yellow underline">Back to Chop Lean</Link>
      </div>
    </div>
  );
}
