import { and, asc, desc, eq, inArray, lt, ne } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, sets, templateItems, workoutItems, workouts } from '@/db/schema';
import { itemLabel } from '@/domain/workout-flow';

export type WeightReps = { weightKg: number; reps: number };

export type LoggedSet = WeightReps & { id: number; setIndex: number; durationSec: number };

export type ActiveItem = {
  id: number;
  exerciseId: number;
  name: string;
  supersetGroup: string | null;
  targetSets: number;
  restSec: number;
  /** "1" or "A1". */
  label: string;
  /** Sets from the latest earlier completed workout with this exercise. */
  lastTime: WeightReps[];
  /** Template target for this exercise, if the workout came from a template. */
  target: WeightReps | null;
  sets: LoggedSet[];
};

export type ActiveWorkoutData = {
  id: number;
  name: string;
  status: (typeof workouts.$inferSelect)['status'];
  startedAt: number | null;
  notes: string | null;
  items: ActiveItem[];
};

export function loadActiveWorkout(workoutId: number): ActiveWorkoutData | null {
  const workout = db.select().from(workouts).where(eq(workouts.id, workoutId)).get();
  if (!workout) return null;

  const items = db
    .select({
      id: workoutItems.id,
      exerciseId: workoutItems.exerciseId,
      name: exercises.name,
      supersetGroup: workoutItems.supersetGroup,
      targetSets: workoutItems.targetSets,
      restSec: workoutItems.restSec,
    })
    .from(workoutItems)
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .where(eq(workoutItems.workoutId, workoutId))
    .orderBy(asc(workoutItems.position))
    .all();

  const logged = items.length
    ? db
        .select()
        .from(sets)
        .where(inArray(sets.workoutItemId, items.map((i) => i.id)))
        .orderBy(asc(sets.setIndex))
        .all()
    : [];

  const targets = workout.templateId
    ? db.select().from(templateItems).where(eq(templateItems.templateId, workout.templateId)).all()
    : [];

  const exerciseIds = [...new Set(items.map((i) => i.exerciseId))];
  const history = exerciseIds.length
    ? db
        .select({
          exerciseId: workoutItems.exerciseId,
          workoutId: workouts.id,
          weightKg: sets.weightKg,
          reps: sets.reps,
        })
        .from(sets)
        .innerJoin(workoutItems, eq(sets.workoutItemId, workoutItems.id))
        .innerJoin(workouts, eq(workoutItems.workoutId, workouts.id))
        .where(
          and(
            eq(workouts.status, 'completed'),
            ne(workouts.id, workoutId),
            // Only workouts finished before this one, so a past workout keeps its own "last time".
            lt(workouts.finishedAt, workout.startedAt ?? Date.now()),
            inArray(workoutItems.exerciseId, exerciseIds),
          ),
        )
        .orderBy(desc(workouts.finishedAt), asc(sets.setIndex))
        .all()
    : [];

  return {
    id: workout.id,
    name: workout.name,
    status: workout.status,
    startedAt: workout.startedAt,
    notes: workout.notes,
    items: items.map((item, index) => {
      const own = history.filter((h) => h.exerciseId === item.exerciseId);
      const lastWorkoutId = own[0]?.workoutId;
      const target = targets.find((t) => t.exerciseId === item.exerciseId);
      return {
        ...item,
        label: itemLabel(items, index),
        lastTime: own.filter((h) => h.workoutId === lastWorkoutId).map(({ weightKg, reps }) => ({ weightKg, reps })),
        target:
          target && target.targetWeightKg !== null && target.targetReps !== null
            ? { weightKg: target.targetWeightKg, reps: target.targetReps }
            : null,
        sets: logged
          .filter((s) => s.workoutItemId === item.id)
          .map(({ id, setIndex, weightKg, reps, durationSec }) => ({ id, setIndex, weightKg, reps, durationSec })),
      };
    }),
  };
}

/** Planned weight × reps for the n-th set (0-based): template target, else the same set last time. */
export function plannedSet(item: ActiveItem, setIndex: number): WeightReps | null {
  return item.target ?? item.lastTime[setIndex] ?? item.lastTime[item.lastTime.length - 1] ?? null;
}

/** "Як минулий": the previous set of this session, else the same set last time. */
export function previousSet(item: ActiveItem): WeightReps | null {
  const last = item.sets[item.sets.length - 1];
  if (last) return { weightKg: last.weightKg, reps: last.reps };
  return item.lastTime[item.sets.length] ?? item.lastTime[item.lastTime.length - 1] ?? null;
}

/** Previous set of this session, else the plan. */
export function suggestedSet(item: ActiveItem): WeightReps {
  return item.sets[item.sets.length - 1] ?? plannedSet(item, item.sets.length) ?? { weightKg: 0, reps: 8 };
}
