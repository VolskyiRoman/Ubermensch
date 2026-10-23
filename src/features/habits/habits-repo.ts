import { asc, eq, max } from 'drizzle-orm';

import { db } from '@/db/client';
import { habitLogs, habits, type HabitCategory } from '@/db/schema';
import { weekStart } from '@/domain/progress';
import { categoryStreak, habitStreak, type HabitEntry } from '@/domain/streaks';
import { addDays, eachDay, toDateKey } from '@/lib/dates';

export const categoryOrder: HabitCategory[] = ['habit', 'food', 'sleep'];

export type HabitRow = {
  id: number;
  name: string;
  description: string | null;
  done: boolean;
  streak: number;
};

export type HabitSection = {
  category: HabitCategory;
  items: HabitRow[];
  streak: number;
};

export type WeekDay = { date: string; done: number; total: number };

export type HabitsData = {
  week: WeekDay[];
  sections: HabitSection[];
  isEmpty: boolean;
};

export function loadHabits(today: string, selected: string): HabitsData {
  const rows = db.select().from(habits).where(eq(habits.archived, false)).orderBy(asc(habits.position)).all();
  const logs = db.select().from(habitLogs).where(eq(habitLogs.done, true)).all();
  const entries: HabitEntry[] = rows.map((h) => ({
    id: h.id,
    category: h.category,
    createdDate: toDateKey(new Date(h.createdAt)),
  }));
  const from = [...entries.map((e) => e.createdDate), today].sort()[0];
  const done = new Set(logs.map((l) => `${l.habitId}|${l.date}`));

  const monday = weekStart(today);
  const week = eachDay(monday, addDays(monday, 6)).map((date) => {
    const active = entries.filter((e) => e.createdDate <= date);
    return { date, total: active.length, done: active.filter((e) => done.has(`${e.id}|${date}`)).length };
  });

  const sections = categoryOrder
    .map((category) => {
      const items = rows
        .filter((h, i) => h.category === category && entries[i].createdDate <= selected)
        .map((h) => {
          const entry = entries.find((e) => e.id === h.id)!;
          return {
            id: h.id,
            name: h.name,
            description: h.description,
            done: done.has(`${h.id}|${selected}`),
            streak: habitStreak(entry, logs, today).current,
          };
        });
      return { category, items, streak: categoryStreak(category, entries, logs, from, today).current };
    })
    .filter((s) => s.items.length > 0);

  return { week, sections, isEmpty: rows.length === 0 };
}

export function setHabitDone(habitId: number, date: string, done: boolean) {
  db.insert(habitLogs)
    .values({ habitId, date, done })
    .onConflictDoUpdate({ target: [habitLogs.habitId, habitLogs.date], set: { done } })
    .run();
}

export type HabitInput = { name: string; category: HabitCategory; description: string | null };

export function loadHabit(id: number) {
  return db.select().from(habits).where(eq(habits.id, id)).get() ?? null;
}

export function saveHabit(id: number | null, input: HabitInput) {
  if (id !== null) {
    db.update(habits).set(input).where(eq(habits.id, id)).run();
    return;
  }
  const [{ last }] = db.select({ last: max(habits.position) }).from(habits).all();
  db.insert(habits)
    .values({ ...input, position: (last ?? -1) + 1 })
    .run();
}

/** Archived habits keep their history but no longer count towards streaks. */
export function archiveHabit(id: number) {
  db.update(habits).set({ archived: true }).where(eq(habits.id, id)).run();
}
