import { describe, expect, it } from '@jest/globals';

import {
  categoryStreak,
  dayStreak,
  habitStreak,
  perfectDayStreak,
  workoutStreak,
  type HabitEntry,
  type HabitLogEntry,
} from '../streaks';

const today = '2026-10-21';

describe('dayStreak', () => {
  it('counts consecutive complete days up to today', () => {
    const days = [
      { date: '2026-10-18', result: 'incomplete' as const },
      { date: '2026-10-19', result: 'complete' as const },
      { date: '2026-10-20', result: 'complete' as const },
      { date: '2026-10-21', result: 'complete' as const },
    ];
    expect(dayStreak(days, today)).toEqual({ current: 3, best: 3 });
  });

  it('does not break on an incomplete today', () => {
    const days = [
      { date: '2026-10-20', result: 'complete' as const },
      { date: '2026-10-21', result: 'incomplete' as const },
    ];
    expect(dayStreak(days, today)).toEqual({ current: 1, best: 1 });
  });

  it('skips days without anything to do and keeps the best run', () => {
    const days = [
      { date: '2026-10-16', result: 'complete' as const },
      { date: '2026-10-17', result: 'complete' as const },
      { date: '2026-10-18', result: 'complete' as const },
      { date: '2026-10-19', result: 'incomplete' as const },
      { date: '2026-10-20', result: 'skip' as const },
      { date: '2026-10-21', result: 'complete' as const },
    ];
    expect(dayStreak(days, today)).toEqual({ current: 1, best: 3 });
  });
});

describe('workoutStreak', () => {
  it('counts completed workouts back to the first missed one', () => {
    const workouts = [
      { date: '2026-10-01', status: 'completed' as const },
      { date: '2026-10-03', status: 'missed' as const },
      { date: '2026-10-06', status: 'completed' as const },
      { date: '2026-10-08', status: 'completed' as const },
      { date: '2026-10-21', status: 'planned' as const },
      { date: '2026-10-23', status: 'planned' as const },
    ];
    expect(workoutStreak(workouts, today)).toEqual({ current: 2, best: 2 });
  });

  it('is zero after a missed workout', () => {
    const workouts = [
      { date: '2026-10-06', status: 'completed' as const },
      { date: '2026-10-08', status: 'missed' as const },
    ];
    expect(workoutStreak(workouts, today)).toEqual({ current: 0, best: 1 });
  });
});

const habits: HabitEntry[] = [
  { id: 1, category: 'habit', createdDate: '2026-10-18' },
  { id: 2, category: 'habit', createdDate: '2026-10-20' },
  { id: 3, category: 'food', createdDate: '2026-10-18' },
];

function logs(entries: [number, string][]): HabitLogEntry[] {
  return entries.map(([habitId, date]) => ({ habitId, date, done: true }));
}

describe('categoryStreak', () => {
  it('requires every habit that existed that day', () => {
    const done = logs([
      [1, '2026-10-18'],
      [1, '2026-10-19'],
      [1, '2026-10-20'],
      [2, '2026-10-20'],
      [1, '2026-10-21'],
    ]);
    // Habit 2 is not done today, which does not break the streak yet.
    expect(categoryStreak('habit', habits, done, '2026-10-18', today)).toEqual({ current: 3, best: 3 });
  });

  it('breaks on a past day with an unchecked item', () => {
    const done = logs([
      [1, '2026-10-18'],
      [1, '2026-10-20'],
      [2, '2026-10-20'],
    ]);
    expect(categoryStreak('habit', habits, done, '2026-10-18', today)).toEqual({ current: 1, best: 1 });
  });
});

describe('habitStreak', () => {
  it('counts days with done = 1 since the habit was created', () => {
    const done = logs([
      [3, '2026-10-19'],
      [3, '2026-10-20'],
      [3, '2026-10-21'],
    ]);
    expect(habitStreak(habits[2], done, today)).toEqual({ current: 3, best: 3 });
  });
});

describe('perfectDayStreak', () => {
  const allDone = logs([
    [1, '2026-10-18'],
    [3, '2026-10-18'],
    [1, '2026-10-19'],
    [3, '2026-10-19'],
    [1, '2026-10-20'],
    [2, '2026-10-20'],
    [3, '2026-10-20'],
  ]);

  it('needs the scheduled workout to be completed', () => {
    const workouts = [{ date: '2026-10-19', status: 'missed' as const }];
    expect(perfectDayStreak(habits, allDone, workouts, '2026-10-18', today)).toEqual({ current: 1, best: 1 });
  });

  it('counts days without a workout when all habits are done', () => {
    const workouts = [{ date: '2026-10-19', status: 'completed' as const }];
    expect(perfectDayStreak(habits, allDone, workouts, '2026-10-18', today)).toEqual({ current: 3, best: 3 });
  });
});
