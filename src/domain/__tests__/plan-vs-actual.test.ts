import { describe, expect, it } from '@jest/globals';

import { compareWithPlan, setDelta } from '../plan-vs-actual';

describe('setDelta', () => {
  it('is zero when the set matches the plan', () => {
    expect(setDelta({ weightKg: 100, reps: 8 }, { weightKg: 100, reps: 8 })).toEqual({ weightKg: 0, reps: 0 });
  });

  it('is actual minus planned for weight and reps', () => {
    expect(setDelta({ weightKg: 100, reps: 8 }, { weightKg: 102.5, reps: 6 })).toEqual({ weightKg: 2.5, reps: -2 });
  });

  it('hides floating point noise in the weight', () => {
    expect(setDelta({ weightKg: 0.3, reps: 5 }, { weightKg: 0.1, reps: 5 }).weightKg).toBe(-0.2);
  });
});

describe('compareWithPlan', () => {
  const plan = [
    { weightKg: 100, reps: 8 },
    { weightKg: 100, reps: 8 },
    { weightKg: 100, reps: 8 },
  ];

  it('sums sets, reps and volume on both sides', () => {
    expect(
      compareWithPlan(plan, [
        { weightKg: 100, reps: 8 },
        { weightKg: 100, reps: 8 },
        { weightKg: 100, reps: 7 },
      ]),
    ).toEqual({
      plannedSets: 3,
      actualSets: 3,
      plannedReps: 24,
      actualReps: 23,
      plannedVolumeKg: 2400,
      actualVolumeKg: 2300,
    });
  });

  it('counts skipped sets as nothing done', () => {
    const result = compareWithPlan(plan, [{ weightKg: 100, reps: 8 }]);
    expect(result.actualSets).toBe(1);
    expect(result.actualReps).toBe(8);
    expect(result.actualVolumeKg).toBe(800);
  });

  it('counts extra sets above the plan', () => {
    const result = compareWithPlan(plan.slice(0, 1), [
      { weightKg: 100, reps: 8 },
      { weightKg: 105, reps: 5 },
    ]);
    expect(result.actualVolumeKg).toBe(1325);
    expect(result.plannedVolumeKg).toBe(800);
  });
});
