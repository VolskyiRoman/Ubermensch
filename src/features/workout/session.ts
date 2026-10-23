// Active workout actions: each one writes to SQLite and moves the session store.
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { loadSettings } from '@/db/settings';
import { sets, warmups, workouts } from '@/db/schema';
import {
  secondsExcludingWarmup,
  stepAfterExercise,
  stepAfterSet,
  type FlowItem,
  type NextStep,
} from '@/domain/workout-flow';
import { cancelNotification, ensureNotificationPermission, scheduleRestEnd } from '@/lib/notifications';
import { formatDecimal } from '@/lib/format';

import { resetActiveWorkout, useActiveWorkout } from './active-workout-store';
import type { ActiveItem } from './load-active';

const state = () => useActiveWorkout.getState();
const update = (patch: Partial<ReturnType<typeof state>>) => useActiveWorkout.setState(patch);

/** Starts a planned workout or resumes the one already in progress. */
export function startWorkout(workoutId: number) {
  const now = Date.now();
  if (state().workoutId === workoutId) return;

  const workout = db.select().from(workouts).where(eq(workouts.id, workoutId)).get();
  if (!workout) return;
  if (workout.status !== 'in_progress') {
    db.update(workouts).set({ status: 'in_progress', startedAt: now }).where(eq(workouts.id, workoutId)).run();
  }
  resetActiveWorkout();
  update({ workoutId, itemIndex: 0, phase: 'set', setStartedAt: now });
  if (loadSettings().notifRest) void ensureNotificationPermission();
}

/** Drops a session whose workout no longer exists or is no longer in progress. */
export function discardStaleSession(status: string | null) {
  if (status !== 'in_progress') {
    cancelNotification(state().notificationId);
    resetActiveWorkout();
  }
}

function setsDone(items: ActiveItem[], extra?: number) {
  return (itemId: number) => (items.find((i) => i.id === itemId)?.sets.length ?? 0) + (itemId === extra ? 1 : 0);
}

/** Where the session goes after logging a set of the current item (used to preview the rest in the sheet). */
export function previewStepAfterSet(items: ActiveItem[], index: number): NextStep {
  return stepAfterSet(items as FlowItem[], index, setsDone(items, items[index].id));
}

function beginSet(itemIndex: number, now: number) {
  const { lastSet, warmups: intervals } = state();
  if (lastSet) {
    db.update(sets)
      .set({ restActualSec: secondsExcludingWarmup(intervals, lastSet.endedAt, now) })
      .where(and(eq(sets.id, lastSet.id), isNull(sets.restActualSec)))
      .run();
  }
  update({ phase: 'set', itemIndex, setStartedAt: now, restEndsAt: null, restTotalSec: 0, notificationId: null });
}

async function scheduleRestNotification(restEndsAt: number, nextItem: ActiveItem) {
  if (restEndsAt <= Date.now() || !loadSettings().notifRest) return;
  const id = await scheduleRestEnd(restEndsAt, `Далі: ${nextItem.name}`);
  // The rest may have been skipped or changed while scheduling.
  if (state().phase === 'rest' && state().restEndsAt === restEndsAt) update({ notificationId: id });
  else cancelNotification(id);
}

export type LoggedResult = 'set' | 'rest' | 'finished';

/** Saves the finished set and moves on: next superset member, rest, or the end of the workout. */
export function logSet(
  items: ActiveItem[],
  input: { weightKg: number; reps: number; restSec: number; endedAt: number },
): LoggedResult {
  const { itemIndex, setStartedAt, warmups: intervals, workoutId } = state();
  const item = items[itemIndex];
  const now = Date.now();
  const [row] = db
    .insert(sets)
    .values({
      workoutItemId: item.id,
      setIndex: item.sets.length,
      weightKg: input.weightKg,
      reps: input.reps,
      startedAt: setStartedAt,
      endedAt: input.endedAt,
      durationSec: secondsExcludingWarmup(intervals, setStartedAt, input.endedAt),
      restPlannedSec: input.restSec,
    })
    .returning()
    .all();

  // Actual rest is counted from the moment the set ended, not from saving the form.
  update({
    lastSet: { id: row.id, endedAt: input.endedAt, weightKg: input.weightKg, reps: input.reps, setNumber: item.sets.length + 1 },
  });

  const step = previewStepAfterSet(items, itemIndex);
  if (step.kind === 'finished') {
    finishWorkout(workoutId!);
    return 'finished';
  }
  if (input.restSec <= 0) {
    beginSet(step.itemIndex, now);
    return 'set';
  }
  // Rest runs from the end of the set, so time spent in the log sheet already counts.
  const restEndsAt = input.endedAt + input.restSec * 1000;
  update({ itemIndex: step.itemIndex, phase: 'rest', restEndsAt, restTotalSec: input.restSec, notificationId: null });
  void scheduleRestNotification(restEndsAt, items[step.itemIndex]);
  return 'rest';
}

/** Ends the rest (skip, "Почати" or timer done) and starts the next set. */
export function startNextSet() {
  cancelNotification(state().notificationId);
  beginSet(state().itemIndex, Date.now());
}

export function adjustRest(deltaSec: number, nextItem: ActiveItem) {
  const { restEndsAt, restTotalSec, notificationId } = state();
  if (restEndsAt === null) return;
  const endsAt = Math.max(Date.now(), restEndsAt + deltaSec * 1000);
  cancelNotification(notificationId);
  update({ restEndsAt: endsAt, restTotalSec: Math.max(0, restTotalSec + deltaSec), notificationId: null });
  void scheduleRestNotification(endsAt, nextItem);
}

export function nextTip(count: number) {
  update({ tipIndex: (state().tipIndex + 1) % count });
}

/** "Завершити вправу": skip the remaining sets of the current exercise (or superset). */
export function finishExercise(items: ActiveItem[]): 'set' | 'finished' {
  const step = stepAfterExercise(items as FlowItem[], state().itemIndex);
  if (step.kind === 'finished') {
    finishWorkout(state().workoutId!);
    return 'finished';
  }
  beginSet(step.itemIndex, Date.now());
  return 'set';
}

/** Warm-up is a separate timer: it counts neither as rest nor as set time (SPEC §3.7). */
export function toggleWarmup() {
  const { workoutId, warmups: intervals } = state();
  if (workoutId === null) return;
  const now = Date.now();
  const open = intervals.find((w) => w.endedAt === null);
  if (open) {
    db.update(warmups).set({ endedAt: now }).where(eq(warmups.id, open.id)).run();
    update({ warmups: intervals.map((w) => (w.id === open.id ? { ...w, endedAt: now } : w)) });
  } else {
    const [row] = db.insert(warmups).values({ workoutId, startedAt: now }).returning().all();
    update({ warmups: [...intervals, { id: row.id, startedAt: now, endedAt: null }] });
  }
}

export function finishWorkout(workoutId: number) {
  const now = Date.now();
  const { notificationId } = state();
  db.transaction((tx) => {
    tx.update(warmups).set({ endedAt: now }).where(and(eq(warmups.workoutId, workoutId), isNull(warmups.endedAt))).run();
    tx.update(workouts).set({ status: 'completed', finishedAt: now }).where(eq(workouts.id, workoutId)).run();
  });
  cancelNotification(notificationId);
  resetActiveWorkout();
}

export function saveWorkoutNote(workoutId: number, notes: string) {
  db.update(workouts)
    .set({ notes: notes.trim() || null })
    .where(eq(workouts.id, workoutId))
    .run();
}

/** "100 кг × 8" */
export function formatSet(set: { weightKg: number; reps: number }) {
  return `${formatDecimal(set.weightKg)} кг × ${set.reps}`;
}
