// CSV export (docs/SPEC.md §8): workouts, sets, habits and body weight as separate files.
import { asc, eq } from 'drizzle-orm';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db/client';
import { bodyWeight, exercises, habitLogs, habits, sets, workoutItems, workouts } from '@/db/schema';
import { toCsv } from '@/domain/csv';

const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());

function buildFiles() {
  const workoutRows = db.select().from(workouts).orderBy(asc(workouts.scheduledDate)).all();
  const setRows = db
    .select({
      workoutId: workouts.id,
      date: workouts.scheduledDate,
      exercise: exercises.name,
      supersetGroup: workoutItems.supersetGroup,
      setIndex: sets.setIndex,
      weightKg: sets.weightKg,
      reps: sets.reps,
      startedAt: sets.startedAt,
      durationSec: sets.durationSec,
      restPlannedSec: sets.restPlannedSec,
      restActualSec: sets.restActualSec,
    })
    .from(sets)
    .innerJoin(workoutItems, eq(sets.workoutItemId, workoutItems.id))
    .innerJoin(workouts, eq(workoutItems.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .orderBy(asc(sets.startedAt))
    .all();
  const habitRows = db
    .select({ date: habitLogs.date, habit: habits.name, category: habits.category, done: habitLogs.done })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .orderBy(asc(habitLogs.date))
    .all();
  const weightRows = db.select().from(bodyWeight).orderBy(asc(bodyWeight.date)).all();

  return {
    'workouts.csv': toCsv(
      ['id', 'date', 'name', 'status', 'started_at', 'finished_at', 'notes'],
      workoutRows.map((w) => ({
        id: w.id,
        date: w.scheduledDate,
        name: w.name,
        status: w.status,
        started_at: iso(w.startedAt),
        finished_at: iso(w.finishedAt),
        notes: w.notes,
      })),
    ),
    'sets.csv': toCsv(
      ['workout_id', 'date', 'exercise', 'superset', 'set', 'weight_kg', 'reps', 'started_at', 'duration_sec', 'rest_planned_sec', 'rest_actual_sec'],
      setRows.map((s) => ({
        workout_id: s.workoutId,
        date: s.date,
        exercise: s.exercise,
        superset: s.supersetGroup,
        set: s.setIndex + 1,
        weight_kg: s.weightKg,
        reps: s.reps,
        started_at: iso(s.startedAt),
        duration_sec: s.durationSec,
        rest_planned_sec: s.restPlannedSec,
        rest_actual_sec: s.restActualSec,
      })),
    ),
    'habits.csv': toCsv(['date', 'habit', 'category', 'done'], habitRows),
    'body_weight.csv': toCsv(
      ['date', 'weight_kg'],
      weightRows.map((w) => ({ date: w.date, weight_kg: w.weightKg })),
    ),
  };
}

/** Writes the four CSV files to the cache and opens the share sheet for each in turn. */
export async function exportCsv() {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Поділитися файлами на цьому пристрої неможливо');
  for (const [name, content] of Object.entries(buildFiles())) {
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.create();
    file.write(content);
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: name, UTI: 'public.comma-separated-values-text' });
  }
}
