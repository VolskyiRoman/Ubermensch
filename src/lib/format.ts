// Ukrainian formatting helpers. Hermes Intl support for `uk` is partial, so names are spelled out here.

const WEEKDAYS = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'];
const WEEKDAYS_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_GENITIVE = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];
const MONTHS_NOMINATIVE = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];
const MONTHS_SHORT = ['січ', 'лют', 'бер', 'квіт', 'трав', 'черв', 'лип', 'серп', 'вер', 'жовт', 'лист', 'груд'];

/** "Середа, 21 жовтня" */
export function formatLongDate(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

/** "Сьогодні, середа, 21 жовтня" for today, "Четвер, 22 жовтня" otherwise. */
export function formatDayTitle(date: Date, isToday: boolean) {
  const long = formatLongDate(date);
  return isToday ? `Сьогодні, ${long.charAt(0).toLocaleLowerCase('uk')}${long.slice(1)}` : long;
}

/** "Жовтень 2026" */
export function formatMonthYear(year: number, month: number) {
  return `${MONTHS_NOMINATIVE[month]} ${year}`;
}

/** Minutes as "1:08". */
export function formatHoursMinutes(totalMin: number) {
  return `${Math.floor(totalMin / 60)}:${String(totalMin % 60).padStart(2, '0')}`;
}

/** "19 жовт" */
export function formatShortDate(date: Date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "Ср" */
export function formatWeekdayShort(date: Date) {
  return WEEKDAYS_SHORT[date.getDay()];
}

/** Picks the Ukrainian plural form: [1 день, 2 дні, 5 днів]. */
export function pluralUk(n: number, forms: [one: string, few: string, many: string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function formatDays(n: number) {
  return `${n} ${pluralUk(n, ['день', 'дні', 'днів'])}`;
}

/** Decimal comma: 2.5 → "2,5". */
export function formatDecimal(n: number) {
  return String(n).replace('.', ',');
}

/** "100 кг × 8, 8, 7", or "100 × 8, 102,5 × 6" when the weight changed. */
export function formatSetList(sets: { weightKg: number; reps: number }[]) {
  if (sets.length === 0) return '—';
  const sameWeight = sets.every((s) => s.weightKg === sets[0].weightKg);
  return sameWeight
    ? `${formatDecimal(sets[0].weightKg)} кг × ${sets.map((s) => s.reps).join(', ')}`
    : sets.map((s) => `${formatDecimal(s.weightKg)} × ${s.reps}`).join(', ');
}

/** Typed number with either decimal separator: "82,5" → 82.5. Null for empty, negative or invalid input. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Kilograms to tonnes: 12400 → "12,4 т", 412000 → "412 т". */
export function formatTonnes(kg: number) {
  const t = kg / 1000;
  const rounded = t >= 100 ? Math.round(t) : Math.round(t * 10) / 10;
  return `${formatDecimal(rounded)} т`;
}

/** Signed percentage: 8 → "+8%", -4 → "−4%". */
export function formatDeltaPercent(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n)}%`;
}

/** "a, b і c" */
export function joinUk(items: string[]) {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} і ${items[items.length - 1]}`;
}

/** Seconds as "3:00". */
export function formatClock(totalSec: number) {
  const sec = Math.max(0, Math.round(totalSec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/** Seconds as "1:12:30", or "24:15" under an hour. */
export function formatDuration(totalSec: number) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const rest = formatClock(sec % 3600);
  return h > 0 ? `${h}:${rest.padStart(5, '0')}` : rest;
}

/** "21 жовтня" */
export function formatDayMonth(date: Date) {
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

/** "Ср, 21 жовт" */
export function formatWeekdayShortDate(date: Date) {
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${formatShortDate(date)}`;
}

/** "середа, 21 жовтня" */
export function formatLongDateLower(date: Date) {
  return `${WEEKDAYS[date.getDay()].toLocaleLowerCase('uk')}, ${formatDayMonth(date)}`;
}

/** Short month name: "жовт". */
export function formatMonthShort(month: number) {
  return MONTHS_SHORT[month];
}

/** Month in lower case: "жовтень". */
export function formatMonthName(month: number) {
  return MONTHS_NOMINATIVE[month].toLocaleLowerCase('uk');
}

/** Thousands separated by a space: 8420 → "8 420". */
export function formatThousands(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatExerciseCount(n: number) {
  return `${n} ${pluralUk(n, ['вправа', 'вправи', 'вправ'])}`;
}

export function formatSetCount(n: number) {
  return `${n} ${pluralUk(n, ['підхід', 'підходи', 'підходів'])}`;
}

export function formatRoundCount(n: number) {
  return `${n} ${pluralUk(n, ['коло', 'кола', 'кіл'])}`;
}
