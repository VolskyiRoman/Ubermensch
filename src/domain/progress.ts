// Progress screen aggregates from docs/SPEC.md §6.
import { addDays, fromDateKey } from '@/lib/dates';

/** Monday of the week that contains `date`. */
export function weekStart(date: string) {
  return addDays(date, -((fromDateKey(date).getDay() + 6) % 7));
}

/** Heatmap level 0–3 of a day relative to the busiest day. */
export function heatLevel(volumeKg: number, maxKg: number) {
  if (volumeKg <= 0 || maxKg <= 0) return 0;
  const share = volumeKg / maxKg;
  return share <= 1 / 3 ? 1 : share <= 2 / 3 ? 2 : 3;
}

/**
 * Heatmap of `weeks` weeks ending with the current one: rows are weekdays (Mon..Sun), columns are weeks.
 * Row-major levels; days after today are null.
 */
export function activityHeatmap(volumeByDate: Map<string, number>, today: string, weeks: number) {
  const first = addDays(weekStart(today), -(weeks - 1) * 7);
  const max = Math.max(0, ...volumeByDate.values());
  const levels: (number | null)[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < weeks; col++) {
      const date = addDays(first, col * 7 + row);
      levels.push(date > today ? null : heatLevel(volumeByDate.get(date) ?? 0, max));
    }
  }
  return { levels, firstDate: first };
}

export type WorkoutDay = { date: string; status: 'planned' | 'in_progress' | 'completed' | 'missed' };

/** Completed vs planned over the last `days` days; today's unfinished workout is not counted yet. */
export function planCompletion(workouts: WorkoutDay[], today: string, days: number) {
  const from = addDays(today, -(days - 1));
  const inRange = workouts.filter((w) => w.date >= from && w.date <= today);
  const completed = inRange.filter((w) => w.status === 'completed').length;
  const planned = inRange.filter((w) => w.status === 'completed' || w.status === 'missed').length;
  return { completed, planned, percent: planned > 0 ? Math.round((completed / planned) * 100) : null };
}

export type WeekBucket = { weekStart: string; workouts: number; volumeKg: number };

/** Completed workouts and volume per week for the last `weeks` weeks, oldest first. */
export function weeklyBuckets(sessions: { date: string; volumeKg: number }[], today: string, weeks: number) {
  const current = weekStart(today);
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(current, -(weeks - 1 - i) * 7),
    workouts: 0,
    volumeKg: 0,
  }));
  const byStart = new Map(buckets.map((b) => [b.weekStart, b]));
  for (const s of sessions) {
    const bucket = byStart.get(weekStart(s.date));
    if (!bucket) continue;
    bucket.workouts++;
    bucket.volumeKg += s.volumeKg;
  }
  return buckets;
}

/** Average of the last `n` values and the change against the `n` before them (null without history). */
export function recentAverage(values: number[], n: number) {
  const recent = values.slice(-n);
  const before = values.slice(-2 * n, -n);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const current = avg(recent);
  const previous = avg(before);
  return { average: current, delta: current !== null && previous !== null ? current - previous : null, recent };
}
