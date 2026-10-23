// Calendar dates are local 'YYYY-MM-DD' keys (SPEC §4). Keys compare correctly as strings.

export function toDateKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Parses 'YYYY-MM-DD' as a local date. */
export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(key: string, n: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + n);
  return toDateKey(date);
}

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string) {
  const days: string[] = [];
  for (let key = from; key <= to; key = addDays(key, 1)) days.push(key);
  return days;
}

export function monthKey(year: number, month: number, day = 1) {
  return toDateKey(new Date(year, month, day));
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Month grid starting on Monday: date keys, with null for leading and trailing blanks. */
export function monthGrid(year: number, month: number) {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth(year, month); day++) cells.push(monthKey(year, month, day));
  while (cells.length % 7) cells.push(null);
  return cells;
}
