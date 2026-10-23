// CSV export (docs/SPEC.md §8).

export type CsvValue = string | number | boolean | null | undefined;

function escape(value: CsvValue) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180 CSV with a header row and CRLF line endings. */
export function toCsv<T extends Record<string, CsvValue>>(columns: (keyof T & string)[], rows: T[]) {
  return [columns.map(escape).join(','), ...rows.map((row) => columns.map((c) => escape(row[c])).join(','))].join('\r\n');
}
