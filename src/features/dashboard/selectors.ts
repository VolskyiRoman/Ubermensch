import type { DailyCategory, DailyItem, DayVolume } from './types';

export function categoryProgress(items: DailyItem[], category: DailyCategory) {
  const inCategory = items.filter((item) => item.category === category);
  return { done: inCategory.filter((item) => item.done).length, total: inCategory.length };
}

export function remainingItems(items: DailyItem[]) {
  return items.filter((item) => !item.done);
}

/** Everything planned for today is done (a day with nothing planned is not perfect). */
export function isPerfectDay(items: DailyItem[]) {
  return items.length > 0 && remainingItems(items).length === 0;
}

export function totalVolume(days: DayVolume[]) {
  return days.reduce((sum, day) => sum + day.volumeKg, 0);
}
