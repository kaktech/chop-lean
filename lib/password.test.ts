import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const { hashPassword, verifyPassword } = await import("./password");
    const h = await hashPassword("Jollof2026");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Jollof2026", h)).toBe(true);
    expect(await verifyPassword("jollof2026", h)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  });
  it("rejects weak passwords", async () => {
    const { passwordProblem } = await import("./password");
    expect(passwordProblem("short1")).toBeTruthy();
    expect(passwordProblem("onlyletters")).toBeTruthy();
    expect(passwordProblem("11111111")).toBeTruthy();
    expect(passwordProblem("Jollof2026")).toBeNull();
  });
});
