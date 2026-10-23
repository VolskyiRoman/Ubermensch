import { asc, count, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  bodyWeight,
  exercises,
  habitLogs,
  habits,
  sets,
  settings,
  templateItems,
  templates,
  warmups,
  workoutItems,
  workouts,
} from '@/db/schema';
import { seedDefaults } from '@/db/seed';
import { loadSettings, type Settings } from '@/db/settings';
import { addDays } from '@/lib/dates';

const CHART_DAYS = 90;

export type ProfileData = {
  weights: { date: string; weightKg: number }[];
  latest: number | null;
  /** Change over the chart window; null with fewer than two entries. */
  delta: number | null;
  templateCount: number;
  exerciseCount: number;
  settings: Settings;
};

export function loadProfile(today: string): ProfileData {
  const from = addDays(today, -CHART_DAYS);
  const all = db.select({ date: bodyWeight.date, weightKg: bodyWeight.weightKg }).from(bodyWeight).orderBy(asc(bodyWeight.date), asc(bodyWeight.id)).all();
  const weights = all.filter((w) => w.date >= from);
  const latest = all.length ? all[all.length - 1].weightKg : null;
  const [{ templateCount }] = db.select({ templateCount: count() }).from(templates).all();
  const [{ exerciseCount }] = db.select({ exerciseCount: count() }).from(exercises).all();

  return {
    weights,
    latest,
    delta: weights.length > 1 ? Math.round((weights[weights.length - 1].weightKg - weights[0].weightKg) * 10) / 10 : null,
    templateCount,
    exerciseCount,
    settings: loadSettings(),
  };
}

export function lastBodyWeight() {
  return db.select().from(bodyWeight).orderBy(desc(bodyWeight.date), desc(bodyWeight.id)).get()?.weightKg ?? null;
}

/** One entry per day: logging again on the same day replaces it. */
export function logBodyWeight(date: string, weightKg: number) {
  db.transaction((tx) => {
    tx.delete(bodyWeight).where(eq(bodyWeight.date, date)).run();
    tx.insert(bodyWeight).values({ date, weightKg }).run();
  });
}

/** Deletes everything the user entered, then restores the exercise library and default settings. */
export function resetAllData() {
  db.transaction((tx) => {
    // Children first, so foreign keys never point at a deleted row.
    for (const table of [sets, warmups, workoutItems, workouts, templateItems, templates, habitLogs, habits, bodyWeight, settings, exercises]) {
      tx.delete(table).run();
    }
  });
  seedDefaults();
}
