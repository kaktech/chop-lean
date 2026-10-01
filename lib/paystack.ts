import "server-only";
import crypto from "node:crypto";

const BASE = "https://api.paystack.co";
export const paystackConfigured = () => !!process.env.PAYSTACK_SECRET_KEY && !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!res.ok || !json.status) throw new Error(`Paystack: ${json.message ?? res.statusText}`);
  return json.data;
}

export async function initializeTransaction(a: { email: string; amountKobo: number; reference: string; callbackUrl: string; metadata?: Record<string, unknown> }) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: a.email, amount: a.amountKobo, reference: a.reference, callback_url: a.callbackUrl, currency: "NGN", metadata: a.metadata }),
  });
}

export type Verified = { status: string; reference: string; amount: number; currency: string };
export const verifyTransaction = (reference: string) => call<Verified>(`/transaction/verify/${encodeURIComponent(reference)}`);

/** Paystack signs the raw request body with HMAC SHA512 using your secret key. */
export function validSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
