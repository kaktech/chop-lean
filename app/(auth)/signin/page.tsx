import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { emailReady } from "@/lib/features";
import { GoogleButton } from "@/components/checkout/GoogleButton";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await auth().catch(() => null);
  const dest = sp.callbackUrl?.startsWith("/") && !sp.callbackUrl.startsWith("//") ? sp.callbackUrl : "/account";
  if (session?.user) redirect(dest);
  const googleReady = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-green p-14 text-white md:flex">
        <div aria-hidden className="absolute -bottom-14 -left-5 font-serif text-[300px] leading-none text-white/[0.07]">Chop</div>
        <Link href="/" className="relative font-display text-[30px] font-bold text-white no-underline">Chop<span className="text-yellow">Lean</span></Link>
        <div className="relative flex max-w-[520px] flex-col gap-[18px]">
          <span className="font-serif text-[56px] leading-[1.05]">Your plan, your weigh-ins, <span className="italic text-yellow">your progress.</span></span>
          <span className="text-base leading-[1.7] text-mint">Sign in to swap meals, pause a week, reorder in one tap and see your weight chart.</span>
        </div>
        <div className="relative h-[380px] overflow-hidden rounded-[26px] border-[6px] border-white/90">
          <Image src="/images/signin.jpg" alt="Woman smiling as she opens a Chop Lean jollof meal at home" fill priority sizes="50vw" className="object-cover [object-position:30%_center]" />
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-14 md:p-14">
        <div className="flex w-full max-w-[420px] flex-col gap-[22px]">
          <Link href="/" className="font-display text-2xl font-bold text-fg no-underline md:hidden">Chop<span className="text-leaf">Lean</span></Link>
          <h1 className="text-[36px] tracking-[-0.03em] md:text-[44px]">Welcome back</h1>
          <p className="text-muted">{googleReady ? "Sign in with Google, or with your email and password." : "Sign in with your email and password, or create an account in a few seconds."}</p>
          {sp.error && <p role="alert" className="rounded-xl bg-tint-red px-4 py-3 text-sm text-price-red">We couldn&apos;t sign you in. Please try again.</p>}
          {googleReady && <><GoogleButton redirectTo={dest} className="!rounded-[14px] !border-input-line !py-[17px] text-base shadow-[0_6px_16px_rgba(21,32,26,0.06)]">Continue with Google</GoogleButton>
          <div className="flex items-center gap-3 text-[13px] text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div></>}
          <AuthPanel callbackUrl={dest} emailReady={emailReady()} />
          <span className="text-[13px] leading-relaxed text-muted">By continuing you agree to our <Link href="/" className="text-leaf underline">Terms</Link> and <Link href="/" className="text-leaf underline">Privacy Policy</Link>. We only use your name and email (and your Google profile photo if you use Google).</span>
          <Link href="/checkout" className="text-sm font-bold text-leaf">Continue as guest →</Link>
        </div>
      </div>
    </div>
  );
}
