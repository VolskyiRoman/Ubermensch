import { describe, expect, it } from '@jest/globals';

import {
  countSupersets,
  describeExercises,
  epley1RM,
  estimateWorkoutMin,
  latestWeightPr,
  percentChange,
  volume,
  type LoggedSet,
} from '../stats';

describe('volume', () => {
  it('sums weight × reps', () => {
    expect(volume([{ weightKg: 100, reps: 8 }, { weightKg: 102.5, reps: 6 }])).toBe(1415);
  });
});

describe('epley1RM', () => {
  it('uses w × (1 + r/30)', () => {
    expect(epley1RM(100, 8)).toBeCloseTo(126.67, 2);
  });

  it('returns the weight for a single rep', () => {
    expect(epley1RM(140, 1)).toBe(140);
  });
});

describe('percentChange', () => {
  it('rounds the change', () => {
    expect(percentChange(12400, 11480)).toBe(8);
  });

  it('is null without a baseline', () => {
    expect(percentChange(100, 0)).toBeNull();
  });
});

describe('estimateWorkoutMin', () => {
  it('adds set time and rest, rounded to 5 minutes', () => {
    expect(estimateWorkoutMin([{ targetSets: 4, restSec: 180 }, { targetSets: 3, restSec: 90 }])).toBe(20);
  });
});

describe('countSupersets', () => {
  it('counts distinct groups', () => {
    expect(countSupersets([{ supersetGroup: null }, { supersetGroup: 'A' }, { supersetGroup: 'A' }])).toBe(1);
  });
});

describe('describeExercises', () => {
  it('joins exercises and groups supersets', () => {
    expect(
      describeExercises([
        { name: 'Присідання', supersetGroup: null },
        { name: 'Випади', supersetGroup: 'A' },
        { name: 'Підйоми на носки', supersetGroup: 'A' },
        { name: 'Згинання ніг', supersetGroup: null },
      ]),
    ).toBe('Присідання · Суперсет: випади + підйоми на носки · Згинання ніг');
  });
});

describe('latestWeightPr', () => {
  const set = (exerciseId: number, weightKg: number, endedAt: number): LoggedSet => ({
    exerciseId,
    exerciseName: `E${exerciseId}`,
    date: '2026-10-01',
    weightKg,
    reps: 5,
    endedAt,
  });

  it('returns the latest set that beat the previous max', () => {
    const sets = [set(1, 100, 1), set(2, 60, 2), set(1, 105, 3), set(2, 65, 4), set(1, 100, 5)];
    expect(latestWeightPr(sets)?.endedAt).toBe(4);
  });

  it('ignores the first set of an exercise', () => {
    expect(latestWeightPr([set(1, 100, 1)])).toBeNull();
  });
});
