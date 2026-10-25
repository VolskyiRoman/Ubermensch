import { asc, desc } from 'drizzle-orm';

import { db } from '@/db/client';
import { sleepLogs } from '@/db/schema';
import { loadSettings, saveSetting } from '@/db/settings';
import type { SleepWindow } from '@/domain/sleep';

export type SleepNight = SleepWindow & { date: string };

export type SleepData = {
  schedule: SleepWindow;
  /** Most recent logged night (by wake-up date). */
  last: SleepNight | null;
};

export function loadSleepSchedule(): SleepWindow {
  const { sleepBedMin, sleepWakeMin } = loadSettings();
  return { bedMin: sleepBedMin, wakeMin: sleepWakeMin };
}

export function loadSleep(): SleepData {
  return {
    schedule: loadSleepSchedule(),
    last: db.select().from(sleepLogs).orderBy(desc(sleepLogs.date)).get() ?? null,
  };
}

/** Wake-up dates of every logged night, oldest first. */
export function loadSleepDates() {
  return db
    .select({ date: sleepLogs.date })
    .from(sleepLogs)
    .orderBy(asc(sleepLogs.date))
    .all()
    .map((r) => r.date);
}

/** One night per wake-up date: logging again replaces it. */
export function logSleep(date: string, { bedMin, wakeMin }: SleepWindow) {
  db.insert(sleepLogs)
    .values({ date, bedMin, wakeMin })
    .onConflictDoUpdate({ target: sleepLogs.date, set: { bedMin, wakeMin } })
    .run();
}

export function saveSleepSchedule({ bedMin, wakeMin }: SleepWindow) {
  saveSetting('sleep_bed_min', bedMin);
  saveSetting('sleep_wake_min', wakeMin);
}
