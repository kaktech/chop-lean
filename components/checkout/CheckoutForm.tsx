"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { applyPromo, createOrder, getQuote } from "@/app/actions/checkout";
import { ADDRESS_MESSAGE, DELIVERY_WINDOWS, NG_PHONE, isDetailedAddress, normalizePhone } from "@/lib/checkout-schema";
import { useCart } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatNaira, formatNairaFull } from "@/lib/money";
import { describeOptions } from "@/components/layout/CartDrawer";
import { GoogleButton } from "./GoogleButton";
import Link from "next/link";
import { imgSrc } from "@/lib/img";

type Zone = { id: string; name: string; areas: string; feeKobo: number };
type DateOpt = { iso: string; dow: string; day: number; month: string };

const formSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  firstName: z.string().trim().min(1, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
  phone: z.string().refine((v) => NG_PHONE.test(normalizePhone(v)), "Enter a valid Nigerian phone number, e.g. 0803 000 0000"),
  zoneId: z.string().min(1, "Choose a delivery zone"),
  deliveryDate: z.string().min(1, "Choose a delivery date"),
  deliveryWindow: z.enum(DELIVERY_WINDOWS),
  address: z.string(),
  notes: z.string().max(300).optional(),
});
type FormValues = z.infer<typeof formSchema>;

type Quote = NonNullable<Awaited<ReturnType<typeof getQuote>>>;

const input = "min-h-[50px] w-full rounded-[14px] border border-input-line bg-surface px-4 text-base placeholder:text-muted/70";
const bad = "!border-price-red";

export function CheckoutForm({ zones, dates, user, googleReady = false }: { googleReady?: boolean; zones: Zone[]; dates: DateOpt[]; user: { email: string; firstName: string; lastName: string; phone: string } | null }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { lines, promo, setPromo } = useCart();
  const [pending, start] = useTransition();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [code, setCode] = useState(promo ?? "");
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const preferred = lines.find((l) => l.type === "plan" && l.options.firstDelivery)?.options.firstDelivery;
  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      email: user?.email ?? "", firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "",
      zoneId: zones.find((z) => z.id === "island")?.id ?? zones[0]?.id ?? "",
      deliveryDate: dates[0]?.iso ?? "", deliveryWindow: DELIVERY_WINDOWS[0], address: "", notes: "",
    },
  });
  const zoneId = watch("zoneId");
  const deliveryDate = watch("deliveryDate");
  const email = watch("email");
  const zone = zones.find((z) => z.id === zoneId);
  const pickup = zoneId === "pickup";

  useEffect(() => {
    if (preferred && dates.some((d) => d.iso === preferred)) setValue("deliveryDate", preferred);
  }, [preferred, dates, setValue]);

  const items = hydrated ? lines : [];
  const linesKey = JSON.stringify(items.map((l) => [l.productId, l.qty, l.options]));
  useEffect(() => {
    if (!items.length) { setQuote(null); return; }
    let live = true;
    getQuote({ lines: items.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options })), zoneId, promo: promo ?? undefined, email }).then((q) => { if (live) setQuote(q); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, zoneId, promo, email]);

  const apply = async () => {
    if (!code.trim()) return;
    const r = await applyPromo({ code, lines: items.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options })), zoneId, email });
    if (r.ok) { setPromo(r.code); setPromoMsg({ ok: true, text: r.message }); } else { setPromo(null); setPromoMsg({ ok: false, text: r.message }); }
  };

  const onSubmit = handleSubmit((v) => {
    setServerError(null);
    if (!items.length) { setServerError("Your cart is empty."); return; }
    if (!pickup && !isDetailedAddress(v.address, zone?.areas ?? "")) { setError("address", { message: ADDRESS_MESSAGE }); return; }
    start(async () => {
      const r = await createOrder({ ...v, promo: promo ?? undefined, lines: items.map((l) => ({ productId: l.productId, qty: l.qty, options: l.options })) });
      if (r.ok) { router.push(`/checkout/pay?o=${r.orderId}`); return; }
      if (r.errors) for (const [k, m] of Object.entries(r.errors)) if (k in v) setError(k as keyof FormValues, { message: m });
      setServerError(r.message);
    });
  });

  const t = quote?.totals;
  const dateLabel = useMemo(() => dates.find((d) => d.iso === deliveryDate), [dates, deliveryDate]);

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="container-x grid gap-8 pb-32 pt-8 lg:grid-cols-[1fr_510px] lg:pb-16">
      <div className="min-w-0">
        {!user && (
          <>
            {googleReady && <GoogleButton redirectTo="/checkout">Continue with Google to fill this in</GoogleButton>}
            <div className="my-7 flex items-center gap-3 text-[13px] text-muted"><span className="h-px flex-1 bg-line" />or check out as a guest<span className="h-px flex-1 bg-line" /></div>
            <p className="-mt-3 mb-6 text-center text-[13px] text-muted">Have an account? <Link href="/signin?callbackUrl=/checkout" className="font-bold text-leaf underline">Sign in</Link></p>
          </>
        )}

        <h2 className="mb-4 text-[26px]">Contact</h2>
        <div className="grid gap-4">
          <Field label="Email" id="email" error={errors.email?.message}><input id="email" type="email" autoComplete="email" placeholder="you@email.com" aria-invalid={!!errors.email} className={`${input} ${errors.email ? bad : ""}`} {...register("email")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" id="firstName" error={errors.firstName?.message}><input id="firstName" autoComplete="given-name" className={`${input} ${errors.firstName ? bad : ""}`} {...register("firstName")} /></Field>
            <Field label="Last name" id="lastName" error={errors.lastName?.message}><input id="lastName" autoComplete="family-name" className={`${input} ${errors.lastName ? bad : ""}`} {...register("lastName")} /></Field>
          </div>
          <Field label="Phone number (WhatsApp)" id="phone" error={errors.phone?.message}><input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" className={`${input} ${errors.phone ? bad : ""}`} {...register("phone")} /></Field>
        </div>

        <h2 className="mb-4 mt-10 text-[26px]">Delivery zone</h2>
        <fieldset className="flex flex-col gap-2.5">
          <legend className="sr-only">Delivery zone</legend>
          {zones.map((z) => (
            <label key={z.id} className={`flex min-h-[76px] cursor-pointer items-center gap-4 rounded-[18px] border bg-surface px-5 py-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-green ${zoneId === z.id ? "border-2 border-green bg-tint-green" : "border-line"}`}>
              <input type="radio" value={z.id} className="sr-only" {...register("zoneId")} />
              <span aria-hidden className={`size-6 shrink-0 rounded-full border-2 ${zoneId === z.id ? "border-[7px] border-green" : "border-input-line"}`} />
              <span className="flex-1"><b className="block font-display text-[17px]">{z.name}</b><span className="text-[13px] text-muted">{z.areas}</span></span>
              <b className="font-display">{z.feeKobo ? formatNaira(z.feeKobo) : "Free"}</b>
            </label>
          ))}
        </fieldset>

        <h2 className="mb-4 mt-10 text-[26px]">First delivery</h2>
        {dates.length === 0 ? <p className="text-muted">No delivery days are open right now.</p> : (
          <fieldset className="grid grid-cols-3 gap-2.5">
            <legend className="sr-only">Delivery date</legend>
            {dates.map((d) => (
              <label key={d.iso} className={`flex min-h-[76px] cursor-pointer flex-col items-center justify-center rounded-[18px] border has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-green ${deliveryDate === d.iso ? "border-fg bg-ink text-white" : "border-line bg-surface"}`}>
                <input type="radio" value={d.iso} className="sr-only" {...register("deliveryDate")} />
                <b className="font-display text-lg">{d.dow} {d.day}</b><span className="text-xs">{d.month}</span>
              </label>
            ))}
          </fieldset>
        )}
        <p className="mt-2 text-xs text-muted">Orders close at 6pm the day before. Deliveries are Mon, Wed and Fri.</p>

        <div className="mt-5 grid gap-4">
          <Field label="Delivery window" id="window"><select id="window" className={`${input} appearance-auto`} {...register("deliveryWindow")}>{DELIVERY_WINDOWS.map((w) => <option key={w}>{w}</option>)}</select></Field>
          {!pickup && (
            <Field label="Delivery address" id="address" error={errors.address?.message}>
              <textarea id="address" rows={3} aria-invalid={!!errors.address} aria-describedby={errors.address ? "address-err" : undefined} className={`${input} py-3 ${errors.address ? "!border-2 !border-red" : ""}`} {...register("address")} />
            </Field>
          )}
          <Field label="Notes for the kitchen (optional)" id="notes"><input id="notes" placeholder="Allergies, gate code, call before arriving…" className={input} {...register("notes")} /></Field>
        </div>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-[26px] border border-line bg-surface p-6 md:p-7 lg:sticky lg:top-6" aria-label="Order summary">
        <h2 className="text-2xl">Order Summary</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {items.map((l) => (
            <li key={l.id} className="flex items-center gap-4">
              <Image src={imgSrc(l.image)} alt="" width={64} height={64} className="size-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1"><b className="block font-display leading-snug">{l.name}{l.type !== "plan" && l.qty > 1 ? ` ×${l.qty}` : ""}</b><span className="text-[13px] text-muted">{l.type === "plan" ? `${describeOptions(l.options, "plan").split(" · ").slice(1).join(" · ")} · ×${l.qty} week${l.qty > 1 ? "s" : ""}` : "Single item"}</span></div>
              <b className="font-display">{formatNaira(l.unitKobo * l.qty)}</b>
            </li>
          ))}
          {items.length === 0 && hydrated && <li className="text-muted">Your cart is empty. <Link href="/shop" className="font-bold text-leaf underline">Browse plans</Link></li>}
        </ul>
        <div className="mt-5 flex gap-2 border-t border-line pt-5">
          <label htmlFor="promo" className="sr-only">Promo code</label>
          <input id="promo" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} placeholder="Promo code" className="min-h-12 min-w-0 flex-1 rounded-xl border border-input-line px-4 uppercase tracking-wide" />
          <button type="button" onClick={apply} className="cl-btn tap rounded-xl bg-ink px-6 text-xs font-bold uppercase tracking-[0.12em] text-white">Apply</button>
        </div>
        <p role="status" className={`mt-2 min-h-5 text-[13px] ${promoMsg && !promoMsg.ok ? "text-price-red" : "font-bold text-leaf"}`}>{promoMsg ? (promoMsg.ok ? `✓ ${promoMsg.text}` : promoMsg.text) : quote?.promo ? `✓ ${quote.promo.code} applied` : quote?.promoError ?? ""}</p>
        <dl className="mt-3 flex flex-col gap-2.5 text-[15px] text-muted">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="text-body">{t ? formatNairaFull(t.subtotalKobo) : "–"}</dd></div>
          {t && t.discountKobo > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="text-leaf">- {formatNairaFull(t.discountKobo)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery ({zone?.name.replace("Lagos ", "Lagos ") ?? ""})</dt><dd className="text-body">{t ? (t.deliveryKobo ? formatNairaFull(t.deliveryKobo) : "Free") : "–"}</dd></div>
        </dl>
        <div className="mt-5 border-t border-line pt-5">
          <div className="label-sm text-[11px] text-muted">Total to pay</div>
          <div className="font-display text-[40px] font-bold leading-tight tracking-tight">{t ? formatNairaFull(t.totalKobo) : "–"}</div>
        </div>
        {serverError && <p role="alert" className="mt-3 rounded-xl bg-tint-red px-4 py-3 text-sm text-price-red">{serverError}</p>}
        <button disabled={pending || !items.length || !dates.length} className="cl-btn mt-5 hidden w-full rounded-xl bg-ink py-[18px] text-sm font-bold uppercase tracking-[0.16em] text-white disabled:opacity-60 lg:block">{pending ? "Checking…" : "Review order"}</button>
        <p className="mt-4 hidden text-center text-xs text-muted lg:block">Next: choose card, bank transfer or pay on delivery.</p>
      </aside>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div><div className="label-sm text-[10px] text-muted">Total</div><div className="font-display text-xl font-bold">{t ? formatNairaFull(t.totalKobo) : "–"}</div></div>
        <button disabled={pending || !items.length} className="cl-btn min-h-12 flex-1 rounded-xl bg-ink text-sm font-bold uppercase tracking-[0.14em] text-white disabled:opacity-60">{pending ? "Checking…" : "Review order"}</button>
      </div>
      <span className="sr-only" aria-live="polite">{dateLabel ? `Delivery ${dateLabel.dow} ${dateLabel.day} ${dateLabel.month}` : ""}</span>
    </form>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-bold">{label}</label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="text-[13px] text-price-red">{error}</p>}
    </div>
  );
}
