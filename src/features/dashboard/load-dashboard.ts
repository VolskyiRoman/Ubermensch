import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, habitLogs, habits, sets, workoutItems, workouts } from '@/db/schema';
import { categoryStreak, perfectDayStreak, sleepStreak, workoutStreak, type HabitEntry } from '@/domain/streaks';
import { countSupersets, durationMin, estimateWorkoutMin, latestWeightPr, volume } from '@/domain/stats';
import { addDays, eachDay, toDateKey } from '@/lib/dates';

import { loadSleepDates } from '../sleep/sleep-repo';
import type { DailyItem, DashboardData } from './types';

const WEEK_DAYS = 7;
const categoryOrder = { habit: 0, food: 1, sleep: 2 } as const;

function lowerFirst(s: string) {
  return s.charAt(0).toLocaleLowerCase('uk') + s.slice(1);
}

export function loadDashboard(today: string): DashboardData {
  const workoutRows = db.select().from(workouts).orderBy(asc(workouts.scheduledDate), asc(workouts.id)).all();
  const habitRows = db.select().from(habits).where(eq(habits.archived, false)).all();
  const logRows = db.select().from(habitLogs).where(eq(habitLogs.done, true)).all();
  const sleepDates = loadSleepDates();
  const setRows = db
    .select({
      weightKg: sets.weightKg,
      reps: sets.reps,
      endedAt: sets.endedAt,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      date: workouts.scheduledDate,
    })
    .from(sets)
    .innerJoin(workoutItems, eq(sets.workoutItemId, workoutItems.id))
    .innerJoin(workouts, eq(workoutItems.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .where(eq(workouts.status, 'completed'))
    .all();

  // Streaks.
  const habitEntries: HabitEntry[] = habitRows.map((h) => ({
    id: h.id,
    category: h.category,
    createdDate: toDateKey(new Date(h.createdAt)),
  }));
  const workoutEntries = workoutRows.map((w) => ({ date: w.scheduledDate, status: w.status }));
  const from = [...habitEntries.map((h) => h.createdDate), ...workoutEntries.map((w) => w.date), ...sleepDates, today].sort()[0];

  const perfect = perfectDayStreak(habitEntries, logRows, workoutEntries, from, today, sleepDates);

  // Today.
  // A workout in progress (possibly started on another day) takes the place of today's card.
  const todayWorkout =
    workoutRows.find((w) => w.status === 'in_progress') ?? workoutRows.find((w) => w.scheduledDate === today) ?? null;
  const todayItems = todayWorkout
    ? db
        .select({ targetSets: workoutItems.targetSets, restSec: workoutItems.restSec, supersetGroup: workoutItems.supersetGroup })
        .from(workoutItems)
        .where(eq(workoutItems.workoutId, todayWorkout.id))
        .all()
    : [];

  const doneToday = new Set(logRows.filter((l) => l.date === today).map((l) => l.habitId));
  const dailyItems: DailyItem[] = [
    ...(todayWorkout && todayWorkout.scheduledDate === today
      ? [{ id: 'workout', title: 'тренування', category: 'workout' as const, done: todayWorkout.status === 'completed' }]
      : []),
    ...habitRows
      .filter((h) => toDateKey(new Date(h.createdAt)) <= today)
      .sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category] || a.position - b.position)
      .map((h) => ({ id: `habit-${h.id}`, title: lowerFirst(h.name), category: h.category, done: doneToday.has(h.id) })),
    // Sleep is expected every day once the first night has been logged.
    ...(sleepDates.length > 0 ? [{ id: 'sleep', title: 'сон', category: 'sleep' as const, done: sleepDates.includes(today) }] : []),
  ];

  // Volume.
  const volumeByDate = new Map<string, number>();
  for (const s of setRows) volumeByDate.set(s.date, (volumeByDate.get(s.date) ?? 0) + s.weightKg * s.reps);
  const weekVolume = eachDay(addDays(today, -(WEEK_DAYS - 1)), today).map((date) => ({
    date,
    volumeKg: volumeByDate.get(date) ?? 0,
  }));
  const previousWeekVolumeKg = eachDay(addDays(today, -(2 * WEEK_DAYS - 1)), addDays(today, -WEEK_DAYS)).reduce(
    (sum, date) => sum + (volumeByDate.get(date) ?? 0),
    0,
  );

  // Totals.
  const completed = workoutRows.filter((w) => w.status === 'completed');
  const durations = completed
    .filter((w) => w.startedAt !== null && w.finishedAt !== null)
    .map((w) => durationMin(w.startedAt!, w.finishedAt!));
  const avgDurationMin = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const pr = latestWeightPr(setRows);

  return {
    today,
    perfectDayStreak: perfect.current,
    perfectDayBest: perfect.best,
    dailyItems,
    categoryStreaks: {
      workout: workoutStreak(workoutEntries, today).current,
      habit: categoryStreak('habit', habitEntries, logRows, from, today).current,
      food: categoryStreak('food', habitEntries, logRows, from, today).current,
      sleep: sleepStreak(sleepDates, today).current,
    },
    todayWorkout: todayWorkout && {
      id: todayWorkout.id,
      name: todayWorkout.name,
      exerciseCount: todayItems.length,
      supersetCount: countSupersets(todayItems),
      estimatedMin: estimateWorkoutMin(todayItems),
      done: todayWorkout.status === 'completed',
      inProgress: todayWorkout.status === 'in_progress',
    },
    weekVolume,
    previousWeekVolumeKg,
    latestPr: pr && { date: pr.date, exercise: pr.exerciseName, weightKg: pr.weightKg, reps: pr.reps },
    totals: { workouts: completed.length, avgDurationMin, volumeKg: volume(setRows) },
  };
}
