"use server";
import { headers } from "next/headers";
import { createElement } from "react";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { adminEmails } from "@/auth";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { NG_PHONE, normalizePhone } from "@/lib/checkout-schema";
import ContactMessage from "@/emails/ContactMessage";

export type ContactState = { ok: boolean; message: string; errors?: Record<string, string> };

const base = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
  phone: z.string().trim().max(20).optional().transform((v) => (v ? normalizePhone(v) : undefined)).refine((v) => !v || NG_PHONE.test(v), "Enter a valid Nigerian phone number"),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
});

async function save(kind: "contact" | "gift", input: z.infer<typeof base>) {
  await db.insert(contactMessages).values({ kind, name: input.name, email: input.email, phone: input.phone ?? null, message: input.message });
  const admins = adminEmails();
  if (admins.length) await sendEmail({ to: admins, subject: `New ${kind === "gift" ? "gift card request" : "message"} from ${input.name}`, react: createElement(ContactMessage, { kind, toAdmin: true, ...input }) });
  await sendEmail({ to: input.email, subject: "We got your message", react: createElement(ContactMessage, { kind, toAdmin: false, ...input }) });
}

const errorsOf = (e: z.ZodError) => { const o: Record<string, string> = {}; for (const i of e.issues) o[String(i.path[0])] ??= i.message; return o; };

export async function submitContact(_prev: ContactState | null, fd: FormData): Promise<ContactState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thanks!" }; // honeypot
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`contact:${ip}`, 4, 10 * 60_000)) return { ok: false, message: "Too many messages. Please try again in a few minutes." };
  const p = base.safeParse({ name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") || undefined, message: fd.get("message") });
  if (!p.success) { const errors = errorsOf(p.error); return { ok: false, message: Object.values(errors)[0], errors }; }
  await save("contact", p.data);
  return { ok: true, message: "Thanks! We'll reply within one working day." };
}

const giftSchema = base.omit({ message: true }).extend({ amount: z.coerce.number().int().min(5000, "Minimum gift card is ₦5,000").max(500000, "Maximum is ₦500,000"), recipient: z.string().trim().min(2, "Enter who it's for").max(80), note: z.string().trim().max(500).optional() });

export async function submitGiftCard(_prev: ContactState | null, fd: FormData): Promise<ContactState> {
  if (String(fd.get("website") ?? "")) return { ok: true, message: "Thanks!" };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`gift:${ip}`, 4, 10 * 60_000)) return { ok: false, message: "Too many requests. Please try again in a few minutes." };
  const p = giftSchema.safeParse({ name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone") || undefined, amount: fd.get("amount"), recipient: fd.get("recipient"), note: fd.get("note") || undefined });
  if (!p.success) { const errors = errorsOf(p.error); return { ok: false, message: Object.values(errors)[0], errors }; }
  const d = p.data;
  await save("gift", { name: d.name, email: d.email, phone: d.phone, message: `Gift card request: ₦${d.amount.toLocaleString("en-NG")} for ${d.recipient}.${d.note ? `\nNote: ${d.note}` : ""}` });
  return { ok: true, message: "Request received! We'll email you a payment link within one working day." };
}
