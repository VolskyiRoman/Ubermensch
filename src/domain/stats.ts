// Workout statistics from docs/SPEC.md §6.

export type SetVolume = { weightKg: number; reps: number };

export function volume(sets: SetVolume[]) {
  return sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
}

/** Estimated one-rep max (Epley). */
export function epley1RM(weightKg: number, reps: number) {
  return reps <= 1 ? weightKg : weightKg * (1 + reps / 30);
}

export function durationMin(startedAt: number, finishedAt: number) {
  return Math.round((finishedAt - startedAt) / 60000);
}

/** Rounded percentage change; null when there is nothing to compare with. */
export function percentChange(current: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Assumed working time of one set when estimating a workout. */
const SET_DURATION_SEC = 45;

/** Rough workout length in minutes, rounded to 5: every planned set plus its rest. */
export function estimateWorkoutMin(items: { targetSets: number; restSec: number }[]) {
  const sec = items.reduce((sum, item) => sum + item.targetSets * (SET_DURATION_SEC + item.restSec), 0);
  return Math.round(sec / 60 / 5) * 5;
}

export function countSupersets(items: { supersetGroup: string | null }[]) {
  return new Set(items.map((i) => i.supersetGroup).filter(Boolean)).size;
}

function lowerFirst(s: string) {
  return s.charAt(0).toLocaleLowerCase('uk') + s.slice(1);
}

/** "Присідання · Жим ногами · Суперсет: випади + підйоми на носки" (items in position order). */
export function describeExercises(items: { name: string; supersetGroup: string | null }[]) {
  const parts: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const group = items[i].supersetGroup;
    if (!group) {
      parts.push(items[i].name);
      continue;
    }
    const members: string[] = [];
    while (i < items.length && items[i].supersetGroup === group) members.push(lowerFirst(items[i++].name));
    i--;
    parts.push(`Суперсет: ${members.join(' + ')}`);
  }
  return parts.join(' · ');
}

export type LoggedSet = {
  exerciseId: number;
  exerciseName: string;
  date: string;
  weightKg: number;
  reps: number;
  endedAt: number;
};

/** The most recent set that beat the previous max weight for its exercise. The first set ever is not a record. */
export function latestWeightPr(sets: LoggedSet[]): LoggedSet | null {
  const best = new Map<number, number>();
  let latest: LoggedSet | null = null;
  for (const set of [...sets].sort((a, b) => a.endedAt - b.endedAt)) {
    const previous = best.get(set.exerciseId);
    if (previous !== undefined && set.weightKg > previous) latest = set;
    if (previous === undefined || set.weightKg > previous) best.set(set.exerciseId, set.weightKg);
  }
  return latest;
}
