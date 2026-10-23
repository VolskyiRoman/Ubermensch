// Active workout session (docs/SPEC.md §3, §7). Logged sets live in SQLite; this store keeps only
// where the user is in the workout and is persisted so a restart resumes the same set or rest.
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { Interval } from '@/domain/workout-flow';

export type ActiveWorkoutState = {
  workoutId: number | null;
  /** Index into the workout items ordered by position. */
  itemIndex: number;
  phase: 'set' | 'rest';
  setStartedAt: number;
  /** The last logged set, to fill in its actual rest when the next set starts. */
  lastSet: { id: number; endedAt: number; weightKg: number; reps: number; setNumber: number } | null;
  restEndsAt: number | null;
  restTotalSec: number;
  /** Warm-ups of this session; the open one has endedAt = null. */
  warmups: (Interval & { id: number })[];
  notificationId: string | null;
  tipIndex: number;
};

const idle: ActiveWorkoutState = {
  workoutId: null,
  itemIndex: 0,
  phase: 'set',
  setStartedAt: 0,
  lastSet: null,
  restEndsAt: null,
  restTotalSec: 0,
  warmups: [],
  notificationId: null,
  tipIndex: 0,
};

// Synchronous storage so the session is available on the first render after a restart.
const kvStorage: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => {
    Storage.removeItemSync(key);
  },
};

export const useActiveWorkout = create<ActiveWorkoutState>()(
  persist(() => idle, { name: 'active-workout', storage: createJSONStorage(() => kvStorage) }),
);

export function resetActiveWorkout() {
  useActiveWorkout.setState(idle, true);
}
