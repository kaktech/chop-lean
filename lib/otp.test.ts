import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.AUTH_SECRET = "test-secret";

describe("sign-in codes", () => {
  it("generates 6-digit codes", async () => {
    const { generateCode } = await import("./otp");
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
  it("matches only the right code for the same email", async () => {
    const { hashCode, codesMatch } = await import("./otp");
    const h = hashCode("123456", "a@b.com");
    expect(codesMatch("123456", "a@b.com", h)).toBe(true);
    expect(codesMatch("123456", "A@B.com", h)).toBe(true); // email is case-insensitive
    expect(codesMatch("654321", "a@b.com", h)).toBe(false);
    expect(codesMatch("123456", "other@b.com", h)).toBe(false);
  });
});
