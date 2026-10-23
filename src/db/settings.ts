import { db } from './client';
import { defaultSettings } from './seed';
import { settings } from './schema';

export type Settings = {
  defaultRestSec: number;
  notifRest: boolean;
  notifWorkoutDay: boolean;
};

type SettingKey = keyof typeof defaultSettings;

export function loadSettings(): Settings {
  const values: Record<string, string> = { ...defaultSettings };
  for (const row of db.select().from(settings).all()) values[row.key] = row.value;
  return {
    defaultRestSec: Number(values.default_rest_sec),
    notifRest: values.notif_rest === '1',
    notifWorkoutDay: values.notif_workout_day === '1',
  };
}

export function saveSetting(key: SettingKey, value: string | number | boolean) {
  const text = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  db.insert(settings).values({ key, value: text }).onConflictDoUpdate({ target: settings.key, set: { value: text } }).run();
}
