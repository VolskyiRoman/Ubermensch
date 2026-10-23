import { asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { markMissedWorkouts } from '@/db/seed';
import { loadSettings } from '@/db/settings';
import { exercises, templateItems, templates, workoutItems, workouts } from '@/db/schema';
import { relabelSupersets } from '@/domain/plan';
import { todayKey } from '@/lib/dates';
import { syncWorkoutReminders } from '@/lib/notifications';

export type DraftItem = {
  /** Stable key for list rendering. */
  key: string;
  exerciseId: number;
  name: string;
  supersetGroup: string | null;
  targetSets: number;
  restSec: number;
  targetReps: number | null;
  targetWeightKg: number | null;
};

let keySeq = 0;
export function newKey() {
  return `item-${Date.now()}-${keySeq++}`;
}

export type ExerciseOption = { id: number; name: string; muscleGroup: string; equipment: string; isCustom: boolean };

export function loadExercises(): ExerciseOption[] {
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      equipment: exercises.equipment,
      isCustom: exercises.isCustom,
    })
    .from(exercises)
    .orderBy(asc(exercises.name))
    .all();
}

export function createCustomExercise(name: string, muscleGroup = 'Інше', equipment = 'Інше') {
  const [row] = db.insert(exercises).values({ name: name.trim(), muscleGroup, equipment, isCustom: true }).returning().all();
  return row;
}

export function loadTemplateList() {
  return db.select({ id: templates.id, name: templates.name }).from(templates).orderBy(desc(templates.lastUsedAt), asc(templates.name)).all();
}

export function loadTemplateItems(templateId: number): DraftItem[] {
  return db
    .select({
      exerciseId: templateItems.exerciseId,
      name: exercises.name,
      supersetGroup: templateItems.supersetGroup,
      targetSets: templateItems.targetSets,
      restSec: templateItems.restSec,
      targetReps: templateItems.targetReps,
      targetWeightKg: templateItems.targetWeightKg,
    })
    .from(templateItems)
    .innerJoin(exercises, eq(templateItems.exerciseId, exercises.id))
    .where(eq(templateItems.templateId, templateId))
    .orderBy(asc(templateItems.position))
    .all()
    .map((item) => ({ ...item, key: newKey() }));
}

export function loadTemplateDraft(id: number) {
  const template = db.select().from(templates).where(eq(templates.id, id)).get();
  return template ? { name: template.name, items: loadTemplateItems(id) } : null;
}

export function loadWorkoutDraft(id: number) {
  const workout = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!workout) return null;
  const targets = workout.templateId ? loadTemplateItems(workout.templateId) : [];
  const items = db
    .select({
      exerciseId: workoutItems.exerciseId,
      name: exercises.name,
      supersetGroup: workoutItems.supersetGroup,
      targetSets: workoutItems.targetSets,
      restSec: workoutItems.restSec,
    })
    .from(workoutItems)
    .innerJoin(exercises, eq(workoutItems.exerciseId, exercises.id))
    .where(eq(workoutItems.workoutId, id))
    .orderBy(asc(workoutItems.position))
    .all()
    .map((item) => {
      const target = targets.find((t) => t.exerciseId === item.exerciseId);
      return { ...item, key: newKey(), targetReps: target?.targetReps ?? null, targetWeightKg: target?.targetWeightKg ?? null };
    });
  return { name: workout.name, date: workout.scheduledDate, templateId: workout.templateId, status: workout.status, items };
}

function templateRows(templateId: number, items: DraftItem[]) {
  return relabelSupersets(items).map((item, position) => ({
    templateId,
    exerciseId: item.exerciseId,
    position,
    supersetGroup: item.supersetGroup,
    targetSets: item.targetSets,
    targetReps: item.targetReps,
    targetWeightKg: item.targetWeightKg,
    restSec: item.restSec,
  }));
}

/** Creates or replaces a template; returns its id. */
export function saveTemplate(id: number | null, name: string, items: DraftItem[]) {
  return db.transaction((tx) => {
    let templateId = id;
    if (templateId === null) {
      [{ id: templateId }] = tx.insert(templates).values({ name }).returning({ id: templates.id }).all();
    } else {
      tx.update(templates).set({ name }).where(eq(templates.id, templateId)).run();
      tx.delete(templateItems).where(eq(templateItems.templateId, templateId)).run();
    }
    if (items.length) tx.insert(templateItems).values(templateRows(templateId, items)).run();
    return templateId;
  });
}

export function deleteTemplate(id: number) {
  db.delete(templates).where(eq(templates.id, id)).run();
}

export type WorkoutInput = {
  name: string;
  date: string;
  templateId: number | null;
  items: DraftItem[];
  saveAsTemplate: boolean;
};

/** Creates or updates a planned workout. */
export function saveWorkout(id: number | null, input: WorkoutInput) {
  const today = todayKey();
  db.transaction((tx) => {
    let templateId = input.templateId;
    if (input.saveAsTemplate) {
      [{ id: templateId }] = tx.insert(templates).values({ name: input.name }).returning({ id: templates.id }).all();
      if (input.items.length) tx.insert(templateItems).values(templateRows(templateId, input.items)).run();
    }
    if (templateId !== null) tx.update(templates).set({ lastUsedAt: Date.now() }).where(eq(templates.id, templateId)).run();

    const values = { name: input.name, scheduledDate: input.date, templateId, status: 'planned' as const };
    let workoutId = id;
    if (workoutId === null) {
      [{ id: workoutId }] = tx.insert(workouts).values(values).returning({ id: workouts.id }).all();
    } else {
      tx.update(workouts).set(values).where(eq(workouts.id, workoutId)).run();
      tx.delete(workoutItems).where(eq(workoutItems.workoutId, workoutId)).run();
    }
    if (input.items.length) {
      tx.insert(workoutItems)
        .values(
          relabelSupersets(input.items).map((item, position) => ({
            workoutId: workoutId!,
            exerciseId: item.exerciseId,
            position,
            supersetGroup: item.supersetGroup,
            targetSets: item.targetSets,
            restSec: item.restSec,
          })),
        )
        .run();
    }
  });
  markMissedWorkouts(today);
  void refreshWorkoutReminders();
}

export function deleteWorkout(id: number) {
  db.delete(workouts).where(eq(workouts.id, id)).run();
  void refreshWorkoutReminders();
}

export async function refreshWorkoutReminders() {
  const today = todayKey();
  const planned = db
    .select({ date: workouts.scheduledDate, name: workouts.name })
    .from(workouts)
    .where(eq(workouts.status, 'planned'))
    .orderBy(asc(workouts.scheduledDate))
    .all();
  await syncWorkoutReminders(loadSettings().notifWorkoutDay, planned, today);
}
