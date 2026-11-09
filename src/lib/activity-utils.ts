import type { Day } from "@/lib/activity.functions";

export type MonthlyTotal = { month: string; label: string; count: number };

export function getAcceptanceRate(acceptedSubmissions: number, totalSubmissions: number) {
  if (totalSubmissions <= 0) return 0;
  return Math.round((acceptedSubmissions / totalSubmissions) * 1000) / 10;
}

export function getMonthlyTotals(days: Day[]): MonthlyTotal[] {
  const counts = new Map<string, number>();
  for (const day of days) {
    const month = day.date.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + day.count);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => {
    const date = new Date(`${month}-01T00:00:00Z`);
    return {
      month,
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
      count,
    };
  });
}