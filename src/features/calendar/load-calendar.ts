import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, sets, templates, workoutItems, workouts, type WorkoutStatus } from '@/db/schema';
import { durationMin, estimateWorkoutMin } from '@/domain/stats';
import { daysInMonth, monthKey } from '@/lib/dates';

export type CalendarWorkout = {
  id: number;
  name: string;
  date: string;
  status: WorkoutStatus;
  templateName: string | null;
  exercises: { name: string; supersetGroup: string | null }[];
  estimatedMin: number;
  durationMin: number | null;
  volumeKg: number;
};

/** Workouts scheduled in the given month (month is 0-based), with their exercises and totals. */
export function loadCalendarMonth(year: number, month: number): CalendarWorkout[] {
  const from = monthKey(year, month, 1);
  const to = monthKey(year, month, daysInMonth(year, month));

  const rows = db
    .select({
      id: workouts.id,
      name: workouts.name,
      date: workouts.scheduledDate,
      status: workouts.status,
      startedAt: workouts.startedAt,
      finishedAt: workouts.finishedAt,
      templateName: templates.name,
    })
    .from(workouts)
    .leftJoin(templates, eq(workouts.templateId, templates.id))
    .where(and(gte(workouts.scheduledDate, from), lte(workouts.scheduledDate, to)))
    .orderBy(asc(workouts.scheduledDate), asc(workouts.id))
    .all();
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const items = db
    .select({
      workoutId: workoutItems.workoutId,
      name: exercises.name,
      supersetGroup: workoutItems.supersetGroup,
      targetSets: workoutItems.targetSets,
      restSec: workoutItems.restSec,
    })
    .from(workoutItems)
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .where(inArray(workoutItems.workoutId, ids))
    .orderBy(asc(workoutItems.workoutId), asc(workoutItems.position))
    .all();

  const setRows = db
    .select({ workoutId: workoutItems.workoutId, weightKg: sets.weightKg, reps: sets.reps })
    .from(sets)
    .innerJoin(workoutItems, eq(sets.workoutItemId, workoutItems.id))
    .where(inArray(workoutItems.workoutId, ids))
    .all();

  return rows.map((row) => {
    const own = items.filter((i) => i.workoutId === row.id);
    return {
      id: row.id,
      name: row.name,
      date: row.date,
      status: row.status,
      templateName: row.templateName,
      exercises: own.map(({ name, supersetGroup }) => ({ name, supersetGroup })),
      estimatedMin: estimateWorkoutMin(own),
      durationMin: row.startedAt !== null && row.finishedAt !== null ? durationMin(row.startedAt, row.finishedAt) : null,
      volumeKg: setRows.filter((s) => s.workoutId === row.id).reduce((sum, s) => sum + s.weightKg * s.reps, 0),
    };
  });
}
