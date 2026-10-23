import { describe, expect, it } from '@jest/globals';

import { toCsv } from '../csv';

describe('toCsv', () => {
  it('writes a header and escapes special characters', () => {
    const csv = toCsv(['name', 'note', 'done', 'kg'], [{ name: 'Жим, лежачи', note: 'сказав "ок"', done: true, kg: null }]);
    expect(csv).toBe('name,note,done,kg\r\n"Жим, лежачи","сказав ""ок""",1,');
  });
});
