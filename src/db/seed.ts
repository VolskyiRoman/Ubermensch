import { and, count, eq, lt } from 'drizzle-orm';

import { db } from './client';
import { exerciseLibrary } from './exercise-library';
import { exercises, settings, workouts } from './schema';

export const defaultSettings = {
  default_rest_sec: '180',
  notif_rest: '1',
  notif_workout_day: '1',
};

/** Exercise library and default settings; safe to run on every launch. */
export function seedDefaults() {
  db.transaction((tx) => {
    const [{ total }] = tx.select({ total: count() }).from(exercises).all();
    if (total === 0) tx.insert(exercises).values(exerciseLibrary).run();

    tx.insert(settings)
      .values(Object.entries(defaultSettings).map(([key, value]) => ({ key, value })))
      .onConflictDoNothing()
      .run();
  });
}

/** SPEC §5: planned workouts from past days become missed. */
export function markMissedWorkouts(today: string) {
  db.update(workouts)
    .set({ status: 'missed' })
    .where(and(eq(workouts.status, 'planned'), lt(workouts.scheduledDate, today)))
    .run();
}
