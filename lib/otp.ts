import "server-only";
import crypto from "node:crypto";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

export const generateCode = () => String(crypto.randomInt(100000, 1000000));

/** Codes are stored hashed (bound to the email) so a database leak doesn't expose live codes. */
export function hashCode(code: string, email: string) {
  return crypto.createHash("sha256").update(`${code}:${email.toLowerCase()}:${process.env.AUTH_SECRET ?? ""}`).digest("hex");
}

export function codesMatch(code: string, email: string, storedHash: string) {
  const a = Buffer.from(hashCode(code, email));
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const newSessionToken = () => crypto.randomBytes(32).toString("hex");
