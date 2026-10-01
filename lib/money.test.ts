import { expect, it } from "vitest";
import { formatNaira, formatNairaFull, nairaToKobo } from "./money";

it("formats kobo as naira", () => {
  expect(formatNaira(5_250_000)).toBe("₦52,500");
  expect(formatNairaFull(5_250_000)).toBe("NGN 52,500.00");
  expect(nairaToKobo(2500)).toBe(250_000);
});
