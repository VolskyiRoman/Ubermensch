// Per-workout statistics from docs/SPEC.md §6.
import { overlapMs, type Interval } from './workout-flow';

export type SummarySet = {
  weightKg: number;
  reps: number;
  durationSec: number;
  restPlannedSec: number;
  restActualSec: number | null;
};

export type WorkoutStats = {
  durationSec: number;
  activeSec: number;
  warmupSec: number;
  restSec: number;
  volumeKg: number;
  sets: number;
  reps: number;
  exercises: number;
  supersetExercises: number;
  /** kg per minute of the workout without warm-up. */
  densityKgPerMin: number;
  /** Averages over sets with a measured rest; null when there are none. */
  restActualAvgSec: number | null;
  restPlannedAvgSec: number | null;
};

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

export function workoutStats(
  startedAt: number,
  finishedAt: number,
  sets: SummarySet[],
  warmups: Interval[],
  items: { supersetGroup: string | null }[],
): WorkoutStats {
  const durationSec = Math.max(0, Math.round((finishedAt - startedAt) / 1000));
  const warmupSec = Math.round(overlapMs(warmups, startedAt, finishedAt) / 1000);
  const activeSec = sets.reduce((sum, s) => sum + s.durationSec, 0);
  const volumeKg = sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const reps = sets.reduce((sum, s) => sum + s.reps, 0);
  const minutesWithoutWarmup = (durationSec - warmupSec) / 60;
  const rested = sets.filter((s) => s.restActualSec !== null && s.restPlannedSec > 0);

  return {
    durationSec,
    activeSec,
    warmupSec,
    restSec: Math.max(0, durationSec - activeSec - warmupSec),
    volumeKg,
    sets: sets.length,
    reps,
    exercises: items.length,
    supersetExercises: items.filter((i) => i.supersetGroup).length,
    densityKgPerMin: minutesWithoutWarmup > 0 ? Math.round(volumeKg / minutesWithoutWarmup) : 0,
    restActualAvgSec: average(rested.map((s) => s.restActualSec!)),
    restPlannedAvgSec: average(rested.map((s) => s.restPlannedSec)),
  };
}

export type WorkoutComparison = {
  volumePercent: number | null;
  durationDeltaMin: number;
  repsDelta: number;
};

export function compareWorkouts(current: WorkoutStats, previous: WorkoutStats): WorkoutComparison {
  return {
    volumePercent:
      previous.volumeKg > 0 ? Math.round(((current.volumeKg - previous.volumeKg) / previous.volumeKg) * 100) : null,
    durationDeltaMin: Math.round((current.durationSec - previous.durationSec) / 60),
    repsDelta: current.reps - previous.reps,
  };
}

/** Same exercises regardless of order (each exercise counted as many times as it appears). */
export function sameExercises(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const x = [...a].sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  return x.every((id, i) => id === y[i]);
}

/**
 * The previous completed workout to compare with: same template, otherwise same name (SPEC §6).
 * `candidates` are completed workouts other than the current one.
 */
export function previousWorkout<T extends { id: number; templateId: number | null; name: string; finishedAt: number | null }>(
  current: { templateId: number | null; name: string; startedAt: number },
  candidates: T[],
): T | null {
  const earlier = candidates
    .filter((w) => w.finishedAt !== null && w.finishedAt <= current.startedAt)
    .sort((a, b) => b.finishedAt! - a.finishedAt!);
  return (
    (current.templateId !== null ? earlier.find((w) => w.templateId === current.templateId) : undefined) ??
    earlier.find((w) => w.name === current.name) ??
    null
  );
}
