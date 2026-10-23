// Streak rules from docs/SPEC.md §5.
import { eachDay } from '@/lib/dates';

export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'missed';
export type HabitCategory = 'habit' | 'food' | 'sleep';

export type Streak = { current: number; best: number };

/** complete adds to the streak, incomplete breaks it (except today), skip neither adds nor breaks. */
export type DayResult = 'complete' | 'incomplete' | 'skip';

export type WorkoutEntry = { date: string; status: WorkoutStatus };

export type HabitEntry = {
  id: number;
  category: HabitCategory;
  /** Date the habit was created; it is not expected before that. */
  createdDate: string;
};

export type HabitLogEntry = { habitId: number; date: string; done: boolean };

/** Streak over consecutive days, oldest first, ending today. An incomplete today does not break it. */
export function dayStreak(days: { date: string; result: DayResult }[], today: string): Streak {
  let run = 0;
  let best = 0;
  for (const day of days) {
    if (day.date > today) break;
    if (day.result === 'complete') {
      run++;
      best = Math.max(best, run);
    } else if (day.result === 'incomplete' && day.date !== today) {
      run = 0;
    }
  }
  return { current: run, best };
}

/**
 * Consecutive completed scheduled workouts going back from the most recent one.
 * Days without a workout do not break it; a planned workout for today or later is ignored.
 */
export function workoutStreak(workouts: WorkoutEntry[], today: string): Streak {
  const past = workouts.filter((w) => w.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  let run = 0;
  let best = 0;
  for (const workout of past) {
    if (workout.status === 'completed') {
      run++;
      best = Math.max(best, run);
    } else if (workout.status === 'missed') {
      run = 0;
    }
  }
  return { current: run, best };
}

function doneKeys(logs: HabitLogEntry[]) {
  return new Set(logs.filter((l) => l.done).map((l) => `${l.habitId}|${l.date}`));
}

/** Per-day result for a set of habits: complete when every habit that existed that day is done. */
export function habitDayResults(
  habits: HabitEntry[],
  logs: HabitLogEntry[],
  from: string,
  to: string,
): { date: string; result: DayResult }[] {
  const done = doneKeys(logs);
  return eachDay(from, to).map((date) => {
    const active = habits.filter((h) => h.createdDate <= date);
    if (active.length === 0) return { date, result: 'skip' };
    const complete = active.every((h) => done.has(`${h.id}|${date}`));
    return { date, result: complete ? 'complete' : 'incomplete' };
  });
}

/** Streak of a category (habits / food / sleep). */
export function categoryStreak(
  category: HabitCategory,
  habits: HabitEntry[],
  logs: HabitLogEntry[],
  from: string,
  today: string,
): Streak {
  const inCategory = habits.filter((h) => h.category === category);
  return dayStreak(habitDayResults(inCategory, logs, from, today), today);
}

/** Streak of a single habit: consecutive days with done = 1. */
export function habitStreak(habit: HabitEntry, logs: HabitLogEntry[], today: string): Streak {
  return dayStreak(habitDayResults([habit], logs, habit.createdDate, today), today);
}

/** Perfect day: every habit, food and sleep item done, and the day's scheduled workout (if any) completed. */
export function perfectDayStreak(
  habits: HabitEntry[],
  logs: HabitLogEntry[],
  workouts: WorkoutEntry[],
  from: string,
  today: string,
): Streak {
  const habitResults = habitDayResults(habits, logs, from, today);
  const days = habitResults.map(({ date, result }) => {
    const scheduled = workouts.filter((w) => w.date === date);
    if (result === 'skip' && scheduled.length === 0) return { date, result: 'skip' as const };
    const workoutsDone = scheduled.every((w) => w.status === 'completed');
    const habitsDone = result !== 'incomplete';
    return { date, result: habitsDone && workoutsDone ? ('complete' as const) : ('incomplete' as const) };
  });
  return dayStreak(days, today);
}
