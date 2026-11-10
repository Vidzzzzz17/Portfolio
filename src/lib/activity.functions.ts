import { createServerFn } from "@tanstack/react-start";
import { getAcceptanceRate } from "@/lib/activity-utils";

export type Day = { date: string; count: number; level: number };
export type Achievement = { name: string; icon: string; date?: string };
export type Activity = {
  github: { total: number; days: Day[]; badges: Achievement[] } | null;
  leetcode: {
    ranking: number;
    solved: Record<string, number>;
    questionCounts: Record<string, number>;
    acceptanceRate: number;
    activeDays: number;
    streak: number;
    submissions: number;
    days: Day[];
    badges: Achievement[];
  } | null;
};

const USER = "Vidzzzzz17";

function level(c: number) {
  return c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 10 ? 3 : 4;
}

async function github() {
  const [activityResponse, profileResponse] = await Promise.all([
    fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`),
    fetch(`https://github.com/${USER}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ViditPortfolio/1.0)" } }),
  ]);
  if (!activityResponse.ok) throw new Error(`GitHub activity ${activityResponse.status}`);
  const activity = (await activityResponse.json()) as { total: { lastYear: number }; contributions: Day[] };
  const badges: Achievement[] = [];
  if (profileResponse.ok) {
    const html = await profileResponse.text();
    const badgePattern = /<img\b[^>]*?alt="Achievement: ([^"]+)"[^>]*?src="([^"]+)"/g;
    for (const match of html.matchAll(badgePattern)) {
      const name = match[1];
      const icon = match[2];
      if (name && icon && !badges.some((badge) => badge.name === name)) {
        badges.push({ name, icon: icon.startsWith("http") ? icon : `https://github.com${icon}` });
      }
    }
  }
  return { total: activity.total.lastYear, days: activity.contributions, badges };
}

async function leetcode() {
  const r = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
      "User-Agent": "Mozilla/5.0 (compatible; ViditPortfolio/1.0)",
    },
    body: JSON.stringify({
      query: `{allQuestionsCount{difficulty count} matchedUser(username:"${USER}"){profile{ranking} submitStatsGlobal{acSubmissionNum{difficulty count submissions} totalSubmissionNum{difficulty count submissions}} userCalendar{totalActiveDays streak submissionCalendar} badges{displayName icon creationDate}}}`,
    }),
  });
  if (!r.ok) throw new Error(`LeetCode ${r.status}`);
  const payload = (await r.json()) as {
    data?: {
      allQuestionsCount?: { difficulty: string; count: number }[];
      matchedUser?: {
        profile: { ranking: number };
        submitStatsGlobal: { acSubmissionNum: { difficulty: string; count: number }[] };
        userCalendar: { totalActiveDays: number; streak: number; submissionCalendar: string };
          badges: { displayName: string; icon: string; creationDate?: string }[];
      } | null;
    };
    errors?: { message: string }[];
  };
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join("; "));
  const u = payload.data?.matchedUser;
  const allQuestionsCount = payload.data?.allQuestionsCount;
  if (!u || !allQuestionsCount) throw new Error("LeetCode profile data is incomplete");
  const cal: Record<string, number> = JSON.parse(u.userCalendar.submissionCalendar);
  const byDate = new Map<string, number>();
  for (const [ts, c] of Object.entries(cal)) byDate.set(new Date(+ts * 1000).toISOString().slice(0, 10), c);
  const days: Day[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const start = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
  let submissions = 0;
  for (const d = start; d <= now; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    const c = byDate.get(k) ?? 0;
    submissions += c;
    days.push({ date: k, count: c, level: level(c) });
  }
  const solved: Record<string, number> = {};
  let acceptedSubmissions = 0;
  for (const s of u.submitStatsGlobal.acSubmissionNum) {
    solved[s.difficulty] = s.count;
    acceptedSubmissions += s.submissions ?? 0;
  }
  let totalSubmissions = 0;
  for (const s of u.submitStatsGlobal.totalSubmissionNum) totalSubmissions += s.submissions ?? 0;
  return {
    ranking: u.profile.ranking,
    solved,
    questionCounts: Object.fromEntries(allQuestionsCount.map((item) => [item.difficulty, item.count])),
    acceptanceRate: getAcceptanceRate(acceptedSubmissions, totalSubmissions),
    activeDays: u.userCalendar.totalActiveDays,
    streak: u.userCalendar.streak,
    submissions,
    days,
    badges: u.badges.map((badge) => ({
      name: badge.displayName,
      icon: badge.icon.startsWith("http") ? badge.icon : `https://leetcode.com${badge.icon}`,
      date: badge.creationDate,
    })),
  };
}

export const getActivity = createServerFn({ method: "GET" }).handler(async (): Promise<Activity> => {
  const [g, l] = await Promise.allSettled([github(), leetcode()]);
  if (g.status === "rejected") console.error(g.reason);
  if (l.status === "rejected") console.error(l.reason);
  return {
    github: g.status === "fulfilled" ? g.value : null,
    leetcode: l.status === "fulfilled" ? l.value : null,
  };
});
