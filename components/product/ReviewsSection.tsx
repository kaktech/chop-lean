"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { submitReview, type ReviewResult } from "@/app/actions/review";

export type ReviewRow = {
  id: string; rating: number; body: string; name: string; verified: boolean;
  fullness: number | null; pepper: number | null; weightChange: string | null; createdAt: string;
};

const Stars = ({ n, size = "text-base" }: { n: number; size?: string }) => (
  <span className={`${size} tracking-[2px] text-yellow`} role="img" aria-label={`${n} out of 5 stars`}>
    {"★".repeat(Math.round(n))}<span className="text-input-line">{"★".repeat(5 - Math.round(n))}</span>
  </span>
);

const avg = (xs: (number | null)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

function Scale({ label, left, right, value }: { label: string; left: string; right: string; value: number | null }) {
  return (
    <div className="mt-4">
      <div className="text-[13px] font-bold">{label}</div>
      <div className="relative mt-3 h-1 rounded-full bg-line" role="img" aria-label={value == null ? `${label}: no data yet` : `${label}: ${value.toFixed(1)} out of 5`}>
        {value != null && <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green" style={{ left: `${((value - 1) / 4) * 100}%` }} />}
        {value == null && <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-input-line" />}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

export function ReviewsSection({ productId, productName, reviews }: { productId: string; productName: string; reviews: ReviewRow[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("highest");

  const average = useMemo(() => avg(reviews.map((r) => r.rating)), [reviews]);
  const shown = useMemo(() => {
    const list = reviews.filter((r) => filter === "all" || r.rating === Number(filter));
    return [...list].sort((a, b) => (sort === "highest" ? b.rating - a.rating : sort === "lowest" ? a.rating - b.rating : +new Date(b.createdAt) - +new Date(a.createdAt)));
  }, [reviews, filter, sort]);

  const fullness = avg(reviews.map((r) => r.fullness));
  const pepper = avg(reviews.map((r) => r.pepper));
  const summary =
    reviews.length >= 5
      ? `Reviewers rate ${productName} ${average!.toFixed(1)} out of 5 across ${reviews.length} reviews.${fullness ? ` Most say it keeps them ${fullness >= 3.5 ? "very full" : fullness >= 2.5 ? "comfortably full" : "only a little full"}.` : ""}${pepper ? ` The pepper level is mostly ${pepper >= 3.5 ? "on the hot side" : pepper >= 2.5 ? "just right" : "on the mild side"}.` : ""}`
      : "Once there are at least 5 reviews, a short summary of what customers mention most (taste, fullness, portion size, delivery) will show here.";

  return (
    <section id="reviews" className="container-x grid gap-8 pb-16 md:grid-cols-[320px_1fr] md:gap-10 md:pb-20">
      <div>
        <div className="flex items-end justify-between md:block">
          <h2 className="text-[26px] uppercase md:text-[34px]">Reviews <span className="text-muted">{average ? average.toFixed(1) : "0.0"}</span></h2>
          <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-sm font-bold text-leaf underline md:hidden">+ Add a review</button>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted"><Stars n={average ?? 0} size="text-sm" /> ({reviews.length})</div>
        <button type="button" onClick={() => setOpen(true)} className="cl-btn mt-5 hidden w-full rounded-full bg-ink py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] text-white md:block">+ Add a review</button>
        <div className="mt-6 hidden rounded-[18px] border border-line bg-surface p-5 md:block">
          <div className="label-sm text-[11px]">How people rate it</div>
          <Scale label="Fullness" left="Still hungry" right="Very full" value={fullness} />
          <Scale label="Pepper level" left="Too mild" right="Too hot" value={pepper} />
        </div>
      </div>

      <div>
        <div className="rounded-[18px] bg-tint-green px-6 py-5 text-sm text-leaf-soft">
          <div className="label-sm mb-1.5 text-[11px]">What customers are saying</div>
          {summary}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <span className="label-sm text-[11px] text-muted">Showing {shown.length} of {reviews.length} reviews</span>
          <span className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2"><span className="label-sm text-[11px]">Filter</span>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="min-h-11 rounded-lg border border-input-line bg-surface px-2">
                <option value="all">All ratings</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
              </select></label>
            <label className="flex items-center gap-2"><span className="label-sm text-[11px]">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-11 rounded-lg border border-input-line bg-surface px-2">
                <option value="highest">Highest rated</option><option value="lowest">Lowest rated</option><option value="newest">Newest</option>
              </select></label>
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-5 rounded-[22px] border-2 border-dashed border-input-line px-6 py-14 text-center">
            <p className="font-serif text-[28px]">No reviews yet.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Finished a week on this plan? Tell others how it tasted, whether it kept you full and how your weigh-in went.</p>
            <button type="button" onClick={() => setOpen(true)} className="cl-btn mt-5 rounded-full bg-yellow px-6 py-3 text-sm font-bold text-canvas">Write the first review</button>
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-4">
            {shown.map((r) => (
              <li key={r.id} className="rounded-[22px] border border-line bg-surface p-6">
                <div className="flex items-center justify-between gap-3"><Stars n={r.rating} />{r.verified && <span className="rounded-full bg-tint-green px-2.5 py-1 text-[11px] font-bold text-leaf-soft">Verified order</span>}</div>
                <p className="mt-3 text-[15px] leading-relaxed">{r.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 text-[13px] text-muted"><b className="text-fg">{r.name}</b>{r.weightChange && <span>· {r.weightChange}</span>}<span>· {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span></div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open && <ReviewModal productId={productId} productName={productName} onClose={() => setOpen(false)} />}
    </section>
  );
}

function ReviewModal({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const [state, action, pending] = useActionState<ReviewResult | null, FormData>(submitReview, null);
  const [rating, setRating] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  const err = (k: string) => state?.errors?.[k];
  const field = "min-h-11 w-full rounded-xl border border-line bg-canvas px-4 text-[15px]";
  const lab = "label-sm mb-2 block text-[11px]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="rv-title">
      <button type="button" aria-label="Close" onClick={onClose} className="cl-fade absolute inset-0 bg-black/60" />
      <div className="cl-sheet relative max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[28px] bg-surface p-6 md:rounded-[28px] md:p-8">
        <div className="flex items-center justify-between"><h2 id="rv-title" className="text-2xl uppercase">Write a review</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-full border border-line"><X size={18} aria-hidden /></button></div>
        <p className="mt-1 text-sm text-muted">{productName}</p>
        {state?.ok ? (
          <div className="py-10 text-center"><p className="font-serif text-3xl">Thank you!</p><p className="mt-2 text-muted">{state.message}</p>
            <button type="button" onClick={onClose} className="cl-btn mt-6 rounded-full bg-yellow px-6 py-3 font-bold">Done</button></div>
        ) : (
          <form action={action} className="mt-5 flex flex-col gap-5">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="rating" value={rating || ""} />
            <fieldset><legend className={lab}>Rating</legend>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}
                    className={`tap text-[34px] leading-none ${n <= rating ? "text-yellow" : "text-input-line"}`}>★</button>
                ))}
              </div>{err("rating") && <p className="mt-1 text-sm text-price-red">{err("rating")}</p>}</fieldset>
            <div><label htmlFor="rv-body" className={lab}>Review</label>
              <textarea id="rv-body" name="body" rows={4} placeholder="How did it taste? Did it keep you full?" className={`${field} py-3`} />{err("body") && <p className="mt-1 text-sm text-price-red">{err("body")}</p>}</div>
            <div className="grid grid-cols-2 gap-4">
              <div><label htmlFor="rv-full" className={lab}>Fullness</label><select id="rv-full" name="fullness" defaultValue="3" className={field}><option value="1">Still hungry</option><option value="3">Just right</option><option value="5">Very full</option></select></div>
              <div><label htmlFor="rv-pep" className={lab}>Pepper level</label><select id="rv-pep" name="pepper" defaultValue="3" className={field}><option value="1">Too mild</option><option value="3">Just right</option><option value="5">Too hot</option></select></div>
            </div>
            <div><label htmlFor="rv-wc" className={lab}>Weight change so far (optional)</label><input id="rv-wc" name="weightChange" placeholder="e.g. -2.5 kg in 4 weeks" className={field} /></div>
            <div><label htmlFor="rv-name" className={lab}>Name</label><input id="rv-name" name="name" autoComplete="name" placeholder="Your name" className={field} />{err("name") && <p className="mt-1 text-sm text-price-red">{err("name")}</p>}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label htmlFor="rv-order" className={lab}>Order ID (optional)</label><input id="rv-order" name="orderNumber" placeholder="e.g. CL-10482" className={field} /></div>
              <div><label htmlFor="rv-email" className={lab}>Email (optional)</label><input id="rv-email" name="email" type="email" autoComplete="email" placeholder="Your email" className={field} />{err("email") && <p className="mt-1 text-sm text-price-red">{err("email")}</p>}</div>
            </div>
            <p className="text-xs text-muted">Reviews with a matching order ID and email get a “Verified order” badge.</p>
            {state && !state.ok && !state.errors && <p role="alert" className="text-sm text-price-red">{state.message}</p>}
            <button disabled={pending} className="cl-btn rounded-xl bg-ink py-4 text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60">{pending ? "Posting…" : "Post review"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
