// Personal records from docs/SPEC.md §6.
import { epley1RM } from './stats';

export type SessionSet = {
  exerciseId: number;
  exerciseName: string;
  workoutId: number;
  date: string;
  weightKg: number;
  reps: number;
  endedAt: number;
};

export type RecordKind = 'maxWeight' | 'oneRepMax' | 'reps' | 'volume';

export type RecordEvent = {
  exerciseId: number;
  exerciseName: string;
  workoutId: number;
  date: string;
  kind: RecordKind;
  /** kg for weight, 1RM and volume. */
  value: number;
  /** Reps of the record set (maxWeight, reps). */
  reps: number;
  /** Weight of the record set (maxWeight, reps). */
  weightKg: number;
  previous: number;
};

/** Order used to pick the most notable record of a session. */
const kindPriority: Record<RecordKind, number> = { maxWeight: 0, oneRepMax: 1, reps: 2, volume: 3 };

type Best = { maxWeight: number; oneRepMax: number; volume: number; repsAtWeight: Map<number, number> };

/**
 * Every time an exercise beat its own best: max weight, estimated 1RM, most reps at a given weight,
 * volume per session. The first session of an exercise sets the baseline and is not a record.
 */
export function recordEvents(sets: SessionSet[]): RecordEvent[] {
  const sessions = new Map<string, SessionSet[]>();
  for (const s of [...sets].sort((a, b) => a.endedAt - b.endedAt)) {
    const key = `${s.exerciseId}|${s.workoutId}`;
    sessions.set(key, [...(sessions.get(key) ?? []), s]);
  }

  const best = new Map<number, Best>();
  const events: RecordEvent[] = [];

  for (const session of sessions.values()) {
    const { exerciseId, exerciseName, workoutId, date } = session[0];
    const heaviest = session.reduce((a, b) => (b.weightKg > a.weightKg ? b : a));
    const strongest = session.reduce((a, b) => (epley1RM(b.weightKg, b.reps) > epley1RM(a.weightKg, a.reps) ? b : a));
    const oneRepMax = epley1RM(strongest.weightKg, strongest.reps);
    const sessionVolume = session.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

    const prev = best.get(exerciseId);
    const base = { exerciseId, exerciseName, workoutId, date };
    if (prev) {
      if (heaviest.weightKg > prev.maxWeight) {
        events.push({ ...base, kind: 'maxWeight', value: heaviest.weightKg, reps: heaviest.reps, weightKg: heaviest.weightKg, previous: prev.maxWeight });
      }
      if (oneRepMax > prev.oneRepMax) {
        events.push({ ...base, kind: 'oneRepMax', value: oneRepMax, reps: strongest.reps, weightKg: strongest.weightKg, previous: prev.oneRepMax });
      }
      const repsRecord = session
        .filter((s) => prev.repsAtWeight.has(s.weightKg) && s.reps > prev.repsAtWeight.get(s.weightKg)!)
        .sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];
      if (repsRecord) {
        events.push({
          ...base,
          kind: 'reps',
          value: repsRecord.reps,
          reps: repsRecord.reps,
          weightKg: repsRecord.weightKg,
          previous: prev.repsAtWeight.get(repsRecord.weightKg)!,
        });
      }
      if (sessionVolume > prev.volume) {
        events.push({ ...base, kind: 'volume', value: sessionVolume, reps: 0, weightKg: 0, previous: prev.volume });
      }
    }

    const next: Best = prev ?? { maxWeight: 0, oneRepMax: 0, volume: 0, repsAtWeight: new Map() };
    next.maxWeight = Math.max(next.maxWeight, heaviest.weightKg);
    next.oneRepMax = Math.max(next.oneRepMax, oneRepMax);
    next.volume = Math.max(next.volume, sessionVolume);
    for (const s of session) next.repsAtWeight.set(s.weightKg, Math.max(next.repsAtWeight.get(s.weightKg) ?? 0, s.reps));
    best.set(exerciseId, next);
  }
  return events;
}

/** One record per exercise and workout (the most notable kind). */
export function topRecordPerSession(events: RecordEvent[]) {
  const picked = new Map<string, RecordEvent>();
  for (const e of events) {
    const key = `${e.exerciseId}|${e.workoutId}`;
    const current = picked.get(key);
    if (!current || kindPriority[e.kind] < kindPriority[current.kind]) picked.set(key, e);
  }
  return [...picked.values()];
}

/** Latest records, newest first, at most one per exercise. */
export function recordFeed(events: RecordEvent[], limit: number) {
  const seen = new Set<number>();
  return topRecordPerSession(events)
    .sort((a, b) => b.date.localeCompare(a.date) || b.workoutId - a.workoutId)
    .filter((e) => !seen.has(e.exerciseId) && seen.add(e.exerciseId))
    .slice(0, limit);
}
