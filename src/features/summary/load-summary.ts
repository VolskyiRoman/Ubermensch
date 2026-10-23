import { and, asc, eq, inArray, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, sets, templateItems, templates, warmups, workoutItems, workouts } from '@/db/schema';
import { compareWithPlan, type PlanComparison, type WeightReps } from '@/domain/plan-vs-actual';
import { recordEvents, topRecordPerSession, type RecordEvent } from '@/domain/records';
import { workoutStreak } from '@/domain/streaks';
import {
  compareWorkouts,
  previousWorkout,
  sameExercises,
  workoutStats,
  type WorkoutComparison,
  type WorkoutStats,
} from '@/domain/workout-summary';

import { loadActiveWorkout, plannedSet } from '../workout/load-active';

function statsFor(workout: typeof workouts.$inferSelect): WorkoutStats {
  const items = db.select().from(workoutItems).where(eq(workoutItems.workoutId, workout.id)).all();
  const setRows = items.length
    ? db.select().from(sets).where(inArray(sets.workoutItemId, items.map((i) => i.id))).all()
    : [];
  const warmupRows = db.select().from(warmups).where(eq(warmups.workoutId, workout.id)).all();
  return workoutStats(workout.startedAt ?? 0, workout.finishedAt ?? workout.startedAt ?? 0, setRows, warmupRows, items);
}

export type SummaryData = {
  id: number;
  name: string;
  date: string;
  notes: string | null;
  streak: { current: number; best: number };
  stats: WorkoutStats;
  comparison: { date: string; previous: WorkoutStats; change: WorkoutComparison } | null;
  records: RecordEvent[];
  /** Exercises that had a plan (template target or an earlier workout), in workout order. */
  plan: PlanRow[];
  /** No template has the same set of exercises yet. */
  offerTemplate: boolean;
};

export type PlanRow = {
  id: number;
  name: string;
  planned: WeightReps[];
  actual: WeightReps[];
  totals: PlanComparison;
};

function planRows(workoutId: number): PlanRow[] {
  const data = loadActiveWorkout(workoutId);
  if (!data) return [];
  return data.items.flatMap((item) => {
    const planned = Array.from({ length: item.targetSets }, (_, i) => plannedSet(item, i)).filter(
      (p): p is WeightReps => p !== null,
    );
    if (planned.length === 0) return [];
    const actual = item.sets.map(({ weightKg, reps }) => ({ weightKg, reps }));
    return [{ id: item.id, name: item.name, planned, actual, totals: compareWithPlan(planned, actual) }];
  });
}

export function loadSummary(workoutId: number, today: string): SummaryData | null {
  const workout = db.select().from(workouts).where(eq(workouts.id, workoutId)).get();
  if (!workout || workout.status !== 'completed') return null;

  const stats = statsFor(workout);
  const allWorkouts = db.select().from(workouts).all();
  const streak = workoutStreak(
    allWorkouts.map((w) => ({ date: w.scheduledDate, status: w.status })),
    today,
  );

  const previous = previousWorkout(
    { templateId: workout.templateId, name: workout.name, startedAt: workout.startedAt ?? 0 },
    allWorkouts.filter((w) => w.status === 'completed' && w.id !== workout.id),
  );
  const previousStats = previous ? statsFor(previous) : null;

  // Records: every completed set up to this workout.
  const history = db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      workoutId: workouts.id,
      date: workouts.scheduledDate,
      weightKg: sets.weightKg,
      reps: sets.reps,
      endedAt: sets.endedAt,
    })
    .from(sets)
    .innerJoin(workoutItems, eq(sets.workoutItemId, workoutItems.id))
    .innerJoin(workouts, eq(workoutItems.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .where(and(eq(workouts.status, 'completed'), lte(sets.endedAt, workout.finishedAt ?? Date.now())))
    .all();
  const records = topRecordPerSession(recordEvents(history).filter((e) => e.workoutId === workout.id));

  const exerciseIds = db
    .select({ exerciseId: workoutItems.exerciseId })
    .from(workoutItems)
    .where(eq(workoutItems.workoutId, workout.id))
    .all()
    .map((r) => r.exerciseId);
  const templateExercises = new Map<number, number[]>();
  for (const row of db.select().from(templateItems).all()) {
    templateExercises.set(row.templateId, [...(templateExercises.get(row.templateId) ?? []), row.exerciseId]);
  }
  const hasTemplate = [...templateExercises.values()].some((ids) => sameExercises(ids, exerciseIds));

  return {
    id: workout.id,
    name: workout.name,
    date: workout.scheduledDate,
    notes: workout.notes,
    streak,
    stats,
    comparison:
      previous && previousStats
        ? { date: previous.scheduledDate, previous: previousStats, change: compareWorkouts(stats, previousStats) }
        : null,
    records,
    plan: planRows(workout.id),
    offerTemplate: exerciseIds.length > 0 && !hasTemplate,
  };
}

/** Saves the workout as a template; targets come from the first logged set of each exercise. */
export function createTemplateFromWorkout(workoutId: number) {
  const workout = db.select().from(workouts).where(eq(workouts.id, workoutId)).get();
  if (!workout) return;
  const items = db
    .select()
    .from(workoutItems)
    .where(eq(workoutItems.workoutId, workoutId))
    .orderBy(asc(workoutItems.position))
    .all();
  const firstSets = items.length
    ? db
        .select()
        .from(sets)
        .where(and(inArray(sets.workoutItemId, items.map((i) => i.id)), eq(sets.setIndex, 0)))
        .all()
    : [];

  db.transaction((tx) => {
    const [{ id }] = tx
      .insert(templates)
      .values({ name: workout.name, lastUsedAt: Date.now() })
      .returning({ id: templates.id })
      .all();
    if (items.length) {
      tx.insert(templateItems)
        .values(
          items.map((item) => {
            const first = firstSets.find((s) => s.workoutItemId === item.id);
            return {
              templateId: id,
              exerciseId: item.exerciseId,
              position: item.position,
              supersetGroup: item.supersetGroup,
              targetSets: item.targetSets,
              targetReps: first?.reps ?? null,
              targetWeightKg: first?.weightKg ?? null,
              restSec: item.restSec,
            };
          }),
        )
        .run();
    }
    tx.update(workouts).set({ templateId: id }).where(eq(workouts.id, workoutId)).run();
  });
}
