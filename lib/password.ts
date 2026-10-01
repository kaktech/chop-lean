import "server-only";
import crypto from "node:crypto";

const N = 16384, R = 8, P = 1, KEYLEN = 64;

const scrypt = (pw: string, salt: Buffer, n = N) =>
  new Promise<Buffer>((res, rej) => crypto.scrypt(pw, salt, KEYLEN, { N: n, r: R, p: P, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${N}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  // Always do the same work so response time doesn't reveal whether an account has a password.
  const [scheme, n, saltB64, keyB64] = (stored ?? "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$AAAA").split("$");
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(keyB64, "base64");
  const key = await scrypt(password, salt, Number(n) || N);
  const ok = scheme === "scrypt" && expected.length === key.length && crypto.timingSafeEqual(expected, key);
  return !!stored && ok;
}

/** Returns an error message, or null when the password is acceptable. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (pw.length > 128) return "That password is too long (max 128 characters).";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number.";
  if (/^(.)\1+$/.test(pw) || /^(password|12345678|qwertyui)/i.test(pw)) return "That password is too easy to guess.";
  return null;
}
