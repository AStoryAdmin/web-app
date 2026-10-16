/**
 * Free-tier limits, counted in this browser as the app counts them on the
 * phone (phone-app/src/lib/usage.js; the app's copy reads AsyncStorage, so
 * it is rewritten here rather than copied). Same numbers, same cadence,
 * same keys, so a person who writes three questions in the app and opens
 * the web the same day is told the same thing. (The counters are per device
 * on both; only the numbers are shared.)
 *
 * There is no trial. Free is metered in exactly two places: guided
 * questions a day and photos a week. Writing in your own words is never
 * metered; the faith chapter is never metered.
 */
export const FREE_DAILY_PROMPTS = 3;
export const FREE_WEEKLY_PHOTOS = 5;
export const FREE_IMPORT_TOTAL = 50;

export const hasUnlimitedWriting = (plan: string) => plan !== "free";

const weekStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toDateString();
};
const dayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
};

type Counter = { period: string; count: number };

const keyFor = (kind: string, email: string) => `astory-${kind}-${email || "anon"}`;

function read(kind: string, email: string, period: string): Counter {
  try {
    const raw = localStorage.getItem(keyFor(kind, email));
    const data = raw ? (JSON.parse(raw) as Counter) : null;
    if (!data || data.period !== period) return { period, count: 0 };
    return data;
  } catch {
    return { period, count: 0 };
  }
}

function bump(kind: string, email: string, period: string, by = 1): Counter {
  const data = read(kind, email, period);
  data.count += by;
  try {
    localStorage.setItem(keyFor(kind, email), JSON.stringify(data));
  } catch {
    /* storage blocked: the limit is advisory, never a lost memory */
  }
  return data;
}

export const dailyPromptsLeft = (email: string) => Math.max(0, FREE_DAILY_PROMPTS - read("prompts", email, dayStart()).count);
export const incrementDailyPrompts = (email: string) => bump("prompts", email, dayStart());

export const weeklyPhotosLeft = (email: string) => Math.max(0, FREE_WEEKLY_PHOTOS - read("photos", email, weekStart()).count);
export const incrementWeeklyPhotos = (email: string, count = 1) => bump("photos", email, weekStart(), count);
