import { describe, expect, it } from "vitest";
import { canOrderFor, isPastPauseCutoff, nextDeliveryDates, orderCutoffFor, toISODate } from "./lagos-time";

// Lagos = UTC+1. 2026-10-01 is a Thursday.
const at = (iso: string) => new Date(iso);

describe("nextDeliveryDates", () => {
  it("Thursday 11am Lagos keeps Friday (cutoff is Thu 6pm)", () => {
    const dates = nextDeliveryDates(at("2026-10-01T10:00:00Z"), 3).map(toISODate);
    expect(dates).toEqual(["2026-10-02", "2026-10-05", "2026-10-07"]);
  });
  it("Thursday 6pm Lagos closes Friday", () => {
    const dates = nextDeliveryDates(at("2026-10-01T17:00:00Z"), 3).map(toISODate);
    expect(dates).toEqual(["2026-10-05", "2026-10-07", "2026-10-09"]);
  });
  it("Thursday 5:59pm Lagos keeps Friday", () => {
    expect(toISODate(nextDeliveryDates(at("2026-10-01T16:59:00Z"), 1)[0])).toBe("2026-10-02");
  });
  it("only returns Mon/Wed/Fri", () => {
    for (const d of nextDeliveryDates(at("2026-10-03T08:00:00Z"), 6)) {
      expect([1, 3, 5]).toContain(new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay());
    }
  });
});

describe("cutoffs", () => {
  it("order cutoff is 6pm Lagos the day before", () => {
    expect(orderCutoffFor({ y: 2026, m: 10, d: 5 }).toISOString()).toBe("2026-10-04T17:00:00.000Z");
  });
  it("canOrderFor respects cutoff and delivery days", () => {
    expect(canOrderFor({ y: 2026, m: 10, d: 5 }, at("2026-10-04T16:00:00Z"))).toBe(true);
    expect(canOrderFor({ y: 2026, m: 10, d: 5 }, at("2026-10-04T17:00:00Z"))).toBe(false);
    expect(canOrderFor({ y: 2026, m: 10, d: 6 }, at("2026-10-01T10:00:00Z"))).toBe(false);
  });
  it("pause cutoff is Thursday 6pm Lagos", () => {
    expect(isPastPauseCutoff(at("2026-10-01T16:59:00Z"))).toBe(false);
    expect(isPastPauseCutoff(at("2026-10-01T17:00:00Z"))).toBe(true);
    expect(isPastPauseCutoff(at("2026-09-30T12:00:00Z"))).toBe(false);
  });
});
