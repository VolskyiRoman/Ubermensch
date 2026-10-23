import { describe, expect, it } from '@jest/globals';

import { recordEvents, recordFeed, topRecordPerSession, type SessionSet } from '../records';

let clock = 0;
function set(workoutId: number, date: string, weightKg: number, reps: number, exerciseId = 1): SessionSet {
  return { exerciseId, exerciseName: `E${exerciseId}`, workoutId, date, weightKg, reps, endedAt: ++clock };
}

describe('recordEvents', () => {
  it('does not treat the first session as a record', () => {
    expect(recordEvents([set(1, '2026-10-01', 100, 5)])).toEqual([]);
  });

  it('detects max weight, 1RM and volume records', () => {
    const events = recordEvents([set(1, '2026-10-01', 100, 5), set(2, '2026-10-03', 105, 5)]);
    expect(events.map((e) => e.kind)).toEqual(['maxWeight', 'oneRepMax', 'volume']);
    expect(events[0]).toMatchObject({ value: 105, previous: 100, reps: 5 });
  });

  it('detects more reps at a weight already lifted', () => {
    const events = recordEvents([set(1, '2026-10-01', 100, 5), set(2, '2026-10-03', 100, 6)]);
    expect(events.find((e) => e.kind === 'reps')).toMatchObject({ value: 6, previous: 5, weightKg: 100 });
  });
});

describe('topRecordPerSession', () => {
  it('keeps the most notable kind', () => {
    const events = recordEvents([set(1, '2026-10-01', 100, 5), set(2, '2026-10-03', 105, 5)]);
    expect(topRecordPerSession(events).map((e) => e.kind)).toEqual(['maxWeight']);
  });
});

describe('recordFeed', () => {
  it('lists the newest record per exercise', () => {
    const events = recordEvents([
      set(1, '2026-10-01', 100, 5),
      set(2, '2026-10-03', 105, 5),
      set(3, '2026-10-05', 110, 5),
      set(1, '2026-10-01', 50, 10, 2),
      set(4, '2026-10-04', 50, 12, 2),
    ]);
    expect(recordFeed(events, 5).map((e) => [e.exerciseId, e.date])).toEqual([
      [1, '2026-10-05'],
      [2, '2026-10-04'],
    ]);
  });
});
