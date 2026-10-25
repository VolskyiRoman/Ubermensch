import { describe, expect, it } from '@jest/globals';

import { parseTimeOfDay, sleepDeltaMin, sleepDurationMin, wrapTimeOfDay } from '../sleep';

describe('sleepDurationMin', () => {
  it('handles a night across midnight', () => {
    expect(sleepDurationMin({ bedMin: 23 * 60, wakeMin: 7 * 60 })).toBe(8 * 60);
  });

  it('handles a bedtime after midnight', () => {
    expect(sleepDurationMin({ bedMin: 60, wakeMin: 8 * 60 + 30 })).toBe(7 * 60 + 30);
  });

  it('is zero for equal times', () => {
    expect(sleepDurationMin({ bedMin: 600, wakeMin: 600 })).toBe(0);
  });
});

describe('wrapTimeOfDay', () => {
  it('wraps both ways', () => {
    expect(wrapTimeOfDay(-15)).toBe(1425);
    expect(wrapTimeOfDay(1440 + 30)).toBe(30);
  });
});

describe('sleepDeltaMin', () => {
  it('is actual minus planned', () => {
    const planned = { bedMin: 23 * 60, wakeMin: 7 * 60 };
    expect(sleepDeltaMin({ bedMin: 23 * 60 + 45, wakeMin: 7 * 60 }, planned)).toBe(-45);
    expect(sleepDeltaMin({ bedMin: 22 * 60 + 30, wakeMin: 7 * 60 }, planned)).toBe(30);
  });
});

describe('parseTimeOfDay', () => {
  it('reads hours and hours with minutes', () => {
    expect(parseTimeOfDay('7')).toBe(7 * 60);
    expect(parseTimeOfDay('23')).toBe(23 * 60);
    expect(parseTimeOfDay('730')).toBe(7 * 60 + 30);
    expect(parseTimeOfDay('2330')).toBe(23 * 60 + 30);
    expect(parseTimeOfDay('23:30')).toBe(23 * 60 + 30);
  });

  it('rejects invalid times', () => {
    expect(parseTimeOfDay('')).toBeNull();
    expect(parseTimeOfDay('24')).toBeNull();
    expect(parseTimeOfDay('2360')).toBeNull();
    expect(parseTimeOfDay('12345')).toBeNull();
  });
});
