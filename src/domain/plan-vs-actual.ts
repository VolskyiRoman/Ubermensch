// Logged sets against the plan (template target, else the same set last time).

export type WeightReps = { weightKg: number; reps: number };

/** Actual minus planned; weight rounded to 0.01 kg to hide float noise. */
export function setDelta(planned: WeightReps, actual: WeightReps): WeightReps {
  return { weightKg: Math.round((actual.weightKg - planned.weightKg) * 100) / 100, reps: actual.reps - planned.reps };
}

export type PlanComparison = {
  plannedSets: number;
  actualSets: number;
  plannedReps: number;
  actualReps: number;
  plannedVolumeKg: number;
  actualVolumeKg: number;
};

const volume = (sets: WeightReps[]) => sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
const reps = (sets: WeightReps[]) => sets.reduce((sum, s) => sum + s.reps, 0);

/** Totals of one exercise: every planned set against every logged one (missing sets count as zero). */
export function compareWithPlan(planned: WeightReps[], actual: WeightReps[]): PlanComparison {
  return {
    plannedSets: planned.length,
    actualSets: actual.length,
    plannedReps: reps(planned),
    actualReps: reps(actual),
    plannedVolumeKg: volume(planned),
    actualVolumeKg: volume(actual),
  };
}
