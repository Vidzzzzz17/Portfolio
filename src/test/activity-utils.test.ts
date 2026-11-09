import { describe, expect, it } from "vitest";
import { getAcceptanceRate, getMonthlyTotals } from "@/lib/activity-utils";

describe("LeetCode activity calculations", () => {
  it("computes a rounded acceptance rate from accepted and total submission counts", () => {
    expect(getAcceptanceRate(351, 444)).toBe(79.1);
    expect(getAcceptanceRate(0, 0)).toBe(0);
  });

  it("groups real daily activity counts into calendar months", () => {
    expect(getMonthlyTotals([
      { date: "2026-11-01", count: 4, level: 2 },
      { date: "2026-11-02", count: 3, level: 1 },
      { date: "2026-12-01", count: 2, level: 1 },
    ])).toEqual([
      { month: "2026-11", label: "Nov", count: 7 },
      { month: "2026-12", label: "Dec", count: 2 },
    ]);
  });
});