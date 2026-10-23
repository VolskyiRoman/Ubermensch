import { describe, expect, it } from '@jest/globals';

import { activityHeatmap, heatLevel, planCompletion, recentAverage, weekStart, weeklyBuckets } from '../progress';

// 2026-10-21 is a Wednesday.
const today = '2026-10-21';

describe('weekStart', () => {
  it('returns Monday', () => {
    expect(weekStart(today)).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19');
  });
});

describe('heatLevel', () => {
  it('maps a share of the busiest day to levels 0–3', () => {
    expect([0, 100, 500, 1000].map((v) => heatLevel(v, 1000))).toEqual([0, 1, 2, 3]);
  });
});

describe('activityHeatmap', () => {
  it('lays out weekdays as rows and leaves future days empty', () => {
    const { levels, firstDate } = activityHeatmap(new Map([['2026-10-19', 500]]), today, 2);
    expect(firstDate).toBe('2026-10-12');
    // Row 0 (Mon): 12th, 19th.
    expect(levels.slice(0, 2)).toEqual([0, 3]);
    // Row 3 (Thu): 15th, 22nd (future).
    expect(levels.slice(6, 8)).toEqual([0, null]);
  });
});

describe('planCompletion', () => {
  it('ignores planned workouts that can still be done', () => {
    const workouts = [
      { date: '2026-10-01', status: 'completed' as const },
      { date: '2026-10-05', status: 'missed' as const },
      { date: '2026-10-21', status: 'planned' as const },
      { date: '2026-09-01', status: 'completed' as const },
    ];
    expect(planCompletion(workouts, today, 30)).toEqual({ completed: 1, planned: 2, percent: 50 });
  });
});

describe('weeklyBuckets', () => {
  it('groups sessions by week', () => {
    const buckets = weeklyBuckets(
      [
        { date: '2026-10-13', volumeKg: 100 },
        { date: '2026-10-20', volumeKg: 200 },
        { date: '2026-10-21', volumeKg: 50 },
      ],
      today,
      2,
    );
    expect(buckets).toEqual([
      { weekStart: '2026-10-12', workouts: 1, volumeKg: 100 },
      { weekStart: '2026-10-19', workouts: 2, volumeKg: 250 },
    ]);
  });
});

describe('recentAverage', () => {
  it('compares the last n values with the n before', () => {
    expect(recentAverage([70, 70, 60, 64], 2)).toMatchObject({ average: 62, delta: -8 });
    expect(recentAverage([60], 2)).toMatchObject({ average: 60, delta: null });
  });
});
