import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, sets, workoutItems, workouts } from '@/db/schema';
import { activityHeatmap, planCompletion, recentAverage, weeklyBuckets, type WeekBucket } from '@/domain/progress';
import { recordEvents, recordFeed, type RecordEvent } from '@/domain/records';
import { epley1RM } from '@/domain/stats';
import { workoutStreak } from '@/domain/streaks';

export const HEATMAP_WEEKS = 26;
export const BAR_WEEKS = 12;
const PLAN_DAYS = 30;
const EXERCISE_POINTS = 10;
const DURATION_BARS = 8;

export type ExercisePoint = { date: string; oneRepMax: number; maxWeight: number; volume: number };

export type ProgressData = {
  totals: { workouts: number; hours: number; volumeKg: number };
  plan: { completed: number; planned: number; percent: number | null };
  streak: { current: number; best: number };
  heatmap: { levels: (number | null)[]; firstDate: string };
  weeks: WeekBucket[];
  exercises: { id: number; name: string }[];
  /** Sessions of each exercise, oldest first (last 10). */
  series: Map<number, ExercisePoint[]>;
  records: RecordEvent[];
  duration: { average: number | null; delta: number | null; recent: number[] };
};

export function loadProgress(today: string): ProgressData {
  const allWorkouts = db.select().from(workouts).orderBy(asc(workouts.scheduledDate)).all();
  const completed = allWorkouts.filter((w) => w.status === 'completed');
  const setRows = db
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
    .where(eq(workouts.status, 'completed'))
    .all();

  const volumeByWorkout = new Map<number, number>();
  const volumeByDate = new Map<string, number>();
  for (const s of setRows) {
    volumeByWorkout.set(s.workoutId, (volumeByWorkout.get(s.workoutId) ?? 0) + s.weightKg * s.reps);
    volumeByDate.set(s.date, (volumeByDate.get(s.date) ?? 0) + s.weightKg * s.reps);
  }

  const durationsMin = completed
    .filter((w) => w.startedAt !== null && w.finishedAt !== null)
    .sort((a, b) => a.finishedAt! - b.finishedAt!)
    .map((w) => Math.round((w.finishedAt! - w.startedAt!) / 60000));

  // Per-exercise sessions.
  const sessions = new Map<string, ExercisePoint & { exerciseId: number }>();
  for (const s of [...setRows].sort((a, b) => a.endedAt - b.endedAt)) {
    const key = `${s.exerciseId}|${s.workoutId}`;
    const point = sessions.get(key) ?? { exerciseId: s.exerciseId, date: s.date, oneRepMax: 0, maxWeight: 0, volume: 0 };
    point.oneRepMax = Math.max(point.oneRepMax, epley1RM(s.weightKg, s.reps));
    point.maxWeight = Math.max(point.maxWeight, s.weightKg);
    point.volume += s.weightKg * s.reps;
    sessions.set(key, point);
  }
  const series = new Map<number, ExercisePoint[]>();
  for (const { exerciseId, ...point } of sessions.values()) series.set(exerciseId, [...(series.get(exerciseId) ?? []), point]);
  for (const [id, points] of series) series.set(id, points.slice(-EXERCISE_POINTS));

  // Exercises with at least two sessions first (they have a trend), most trained first.
  const names = new Map(setRows.map((s) => [s.exerciseId, s.exerciseName]));
  const exerciseList = [...series.keys()]
    .sort((a, b) => series.get(b)!.length - series.get(a)!.length)
    .map((id) => ({ id, name: names.get(id)! }));

  return {
    totals: {
      workouts: completed.length,
      hours: Math.round(durationsMin.reduce((a, b) => a + b, 0) / 60),
      volumeKg: [...volumeByWorkout.values()].reduce((a, b) => a + b, 0),
    },
    plan: planCompletion(allWorkouts.map((w) => ({ date: w.scheduledDate, status: w.status })), today, PLAN_DAYS),
    streak: workoutStreak(allWorkouts.map((w) => ({ date: w.scheduledDate, status: w.status })), today),
    heatmap: activityHeatmap(volumeByDate, today, HEATMAP_WEEKS),
    weeks: weeklyBuckets(
      completed.map((w) => ({ date: w.scheduledDate, volumeKg: volumeByWorkout.get(w.id) ?? 0 })),
      today,
      BAR_WEEKS,
    ),
    exercises: exerciseList,
    series,
    records: recordFeed(recordEvents(setRows), 4),
    duration: recentAverage(durationsMin, DURATION_BARS),
  };
}
