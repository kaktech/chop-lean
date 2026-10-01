import Link from "next/link";
import { Wordmark } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-cream px-6 text-center">
      <div aria-hidden className="watermark absolute inset-x-0 top-1/2 -translate-y-1/2 text-[220px] md:text-[420px]">404</div>
      <Link href="/" className="relative text-ink no-underline"><Wordmark className="text-3xl" /></Link>
      <h1 className="relative mt-8 text-[40px] tracking-[-0.03em] md:text-[56px]">This plate is <span className="font-serif font-normal italic text-green">empty.</span></h1>
      <p className="relative mt-3 max-w-md text-muted">We couldn&apos;t find that page. It may have sold out, moved or never existed.</p>
      <div className="relative mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="cl-btn rounded-full bg-yellow px-7 py-3.5 font-bold text-ink no-underline">Browse plans</Link>
        <Link href="/" className="cl-btn rounded-full border-[1.5px] border-ink px-7 py-3 font-bold text-ink no-underline">Go home</Link>
      </div>
    </div>
  );
}
