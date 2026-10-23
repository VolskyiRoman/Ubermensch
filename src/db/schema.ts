// Data model from docs/SPEC.md §4. Dates are local 'YYYY-MM-DD' strings, timestamps are epoch ms.
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const createdAt = () =>
  integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  equipment: text('equipment').notNull(),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
});

export const templates = sqliteTable('templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: createdAt(),
  lastUsedAt: integer('last_used_at'),
});

export const templateItems = sqliteTable(
  'template_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    templateId: integer('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    supersetGroup: text('superset_group'),
    targetSets: integer('target_sets').notNull(),
    targetReps: integer('target_reps'),
    targetWeightKg: real('target_weight_kg'),
    restSec: integer('rest_sec').notNull(),
  },
  (t) => [index('template_items_template_idx').on(t.templateId)],
);

export const workoutStatuses = ['planned', 'in_progress', 'completed', 'missed'] as const;
export type WorkoutStatus = (typeof workoutStatuses)[number];

export const workouts = sqliteTable(
  'workouts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    scheduledDate: text('scheduled_date').notNull(),
    templateId: integer('template_id').references(() => templates.id, { onDelete: 'set null' }),
    status: text('status', { enum: workoutStatuses }).notNull().default('planned'),
    startedAt: integer('started_at'),
    finishedAt: integer('finished_at'),
    notes: text('notes'),
  },
  (t) => [index('workouts_date_idx').on(t.scheduledDate)],
);

export const workoutItems = sqliteTable(
  'workout_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    supersetGroup: text('superset_group'),
    targetSets: integer('target_sets').notNull(),
    restSec: integer('rest_sec').notNull(),
    notes: text('notes'),
  },
  (t) => [index('workout_items_workout_idx').on(t.workoutId)],
);

export const sets = sqliteTable(
  'sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutItemId: integer('workout_item_id')
      .notNull()
      .references(() => workoutItems.id, { onDelete: 'cascade' }),
    setIndex: integer('set_index').notNull(),
    weightKg: real('weight_kg').notNull(),
    reps: integer('reps').notNull(),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at').notNull(),
    durationSec: integer('duration_sec').notNull(),
    restPlannedSec: integer('rest_planned_sec').notNull(),
    restActualSec: integer('rest_actual_sec'),
  },
  (t) => [index('sets_item_idx').on(t.workoutItemId)],
);

export const warmups = sqliteTable('warmups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
});

export const habitCategories = ['habit', 'food', 'sleep'] as const;
export type HabitCategory = (typeof habitCategories)[number];

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category', { enum: habitCategories }).notNull(),
  description: text('description'),
  position: integer('position').notNull(),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
});

export const habitLogs = sqliteTable(
  'habit_logs',
  {
    habitId: integer('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    done: integer('done', { mode: 'boolean' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.habitId, t.date] })],
);

export const bodyWeight = sqliteTable('body_weight', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  weightKg: real('weight_kg').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
