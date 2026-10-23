import { describe, expect, it } from '@jest/globals';

import { compareWorkouts, previousWorkout, sameExercises, workoutStats } from '../workout-summary';

const MIN = 60_000;

describe('workoutStats', () => {
  const stats = workoutStats(
    0,
    60 * MIN,
    [
      { weightKg: 100, reps: 8, durationSec: 60, restPlannedSec: 180, restActualSec: 200 },
      { weightKg: 100, reps: 6, durationSec: 60, restPlannedSec: 180, restActualSec: null },
    ],
    [{ startedAt: 0, endedAt: 10 * MIN }],
    [{ supersetGroup: null }, { supersetGroup: 'A' }, { supersetGroup: 'A' }],
  );

  it('splits the duration into active time, warm-up and rest', () => {
    expect(stats).toMatchObject({ durationSec: 3600, activeSec: 120, warmupSec: 600, restSec: 2880 });
  });

  it('sums volume, sets and reps', () => {
    expect(stats).toMatchObject({ volumeKg: 1400, sets: 2, reps: 14, exercises: 3, supersetExercises: 2 });
  });

  it('computes density without warm-up', () => {
    expect(stats.densityKgPerMin).toBe(28);
  });

  it('averages only measured rests', () => {
    expect(stats).toMatchObject({ restActualAvgSec: 200, restPlannedAvgSec: 180 });
  });
});

describe('compareWorkouts', () => {
  it('reports volume %, duration and reps changes', () => {
    const base = workoutStats(0, 76 * MIN, [{ weightKg: 7940, reps: 1, durationSec: 0, restPlannedSec: 0, restActualSec: null }], [], []);
    const now = workoutStats(0, 72 * MIN, [{ weightKg: 8420, reps: 1, durationSec: 0, restPlannedSec: 0, restActualSec: null }], [], []);
    expect(compareWorkouts(now, base)).toEqual({ volumePercent: 6, durationDeltaMin: -4, repsDelta: 0 });
  });
});

describe('sameExercises', () => {
  it('ignores order', () => {
    expect(sameExercises([1, 2, 3], [3, 1, 2])).toBe(true);
    expect(sameExercises([1, 2], [1, 2, 2])).toBe(false);
  });
});

describe('previousWorkout', () => {
  const candidates = [
    { id: 1, templateId: 5, name: 'Ноги', finishedAt: 100 },
    { id: 2, templateId: null, name: 'Ноги', finishedAt: 200 },
    { id: 3, templateId: 5, name: 'Ноги А', finishedAt: 300 },
    { id: 4, templateId: 5, name: 'Ноги', finishedAt: 900 },
  ];

  it('prefers the latest earlier workout with the same template', () => {
    expect(previousWorkout({ templateId: 5, name: 'Ноги', startedAt: 500 }, candidates)?.id).toBe(3);
  });

  it('falls back to the same name', () => {
    expect(previousWorkout({ templateId: null, name: 'Ноги', startedAt: 500 }, candidates)?.id).toBe(2);
  });
});
