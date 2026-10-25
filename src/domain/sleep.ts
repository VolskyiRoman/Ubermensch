// Sleep tracking: a night is a bedtime and a wake-up time, stored as minutes after local midnight.
export const MINUTES_PER_DAY = 24 * 60;
export const SLEEP_STEP_MIN = 15;

export type SleepWindow = { bedMin: number; wakeMin: number };

/** Wraps any minute count into 0..1439. */
export function wrapTimeOfDay(min: number) {
  return ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** Minutes asleep; a bedtime after the wake-up time means the night crossed midnight. */
export function sleepDurationMin({ bedMin, wakeMin }: SleepWindow) {
  return wrapTimeOfDay(wakeMin - bedMin);
}

/** Actual minus planned duration, in minutes. */
export function sleepDeltaMin(actual: SleepWindow, planned: SleepWindow) {
  return sleepDurationMin(actual) - sleepDurationMin(planned);
}

/**
 * Typed time on a number pad: "7" → 07:00, "23" → 23:00, "730" → 07:30, "2330" → 23:30.
 * Separators are ignored; null for anything that is not a valid time.
 */
export function parseTimeOfDay(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 4) return null;
  const split = digits.length <= 2 ? digits.length : digits.length - 2;
  const h = Number(digits.slice(0, split));
  const m = Number(digits.slice(split) || '0');
  return h < 24 && m < 60 ? h * 60 + m : null;
}
