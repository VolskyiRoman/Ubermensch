import { describe, expect, it } from '@jest/globals';

import {
  blockRange,
  isFinalSet,
  itemLabel,
  overlapMs,
  restRemainingSec,
  secondsExcludingWarmup,
  stepAfterExercise,
  stepAfterSet,
  stepWeight,
  type FlowItem,
} from '../workout-flow';

// 1 squat · A1 lunges + A2 calf raises · 4 leg curls
const items: FlowItem[] = [
  { id: 1, supersetGroup: null, targetSets: 2, restSec: 180 },
  { id: 2, supersetGroup: 'A', targetSets: 2, restSec: 0 },
  { id: 3, supersetGroup: 'A', targetSets: 2, restSec: 120 },
  { id: 4, supersetGroup: null, targetSets: 1, restSec: 90 },
];

const done = (counts: Record<number, number>) => (id: number) => counts[id] ?? 0;

describe('blockRange', () => {
  it('spans the whole superset', () => {
    expect(blockRange(items, 2)).toEqual({ start: 1, end: 2 });
    expect(blockRange(items, 0)).toEqual({ start: 0, end: 0 });
  });
});

describe('stepAfterSet', () => {
  it('repeats a single exercise with its rest until the target is reached', () => {
    expect(stepAfterSet(items, 0, done({ 1: 1 }))).toEqual({ kind: 'set', itemIndex: 0, restSec: 180 });
  });

  it('moves to the next exercise after the last set', () => {
    expect(stepAfterSet(items, 0, done({ 1: 2 }))).toEqual({ kind: 'set', itemIndex: 1, restSec: 180 });
  });

  it('goes straight to the next superset member without rest', () => {
    expect(stepAfterSet(items, 1, done({ 1: 2, 2: 1 }))).toEqual({ kind: 'set', itemIndex: 2, restSec: 0 });
  });

  it('rests after the round and starts the next one from the first member', () => {
    expect(stepAfterSet(items, 2, done({ 1: 2, 2: 1, 3: 1 }))).toEqual({ kind: 'set', itemIndex: 1, restSec: 120 });
  });

  it('finishes after the last set of the last exercise', () => {
    expect(stepAfterSet(items, 3, done({ 4: 1 }))).toEqual({ kind: 'finished' });
  });
});

describe('stepAfterExercise', () => {
  it('skips the remaining superset members', () => {
    expect(stepAfterExercise(items, 1)).toEqual({ kind: 'set', itemIndex: 3, restSec: 0 });
    expect(stepAfterExercise(items, 3)).toEqual({ kind: 'finished' });
  });
});

describe('isFinalSet', () => {
  it('detects the last set of the workout', () => {
    expect(isFinalSet(items, 3, done({}))).toBe(true);
    expect(isFinalSet(items, 0, done({}))).toBe(false);
  });
});

describe('itemLabel', () => {
  it('labels superset members by group', () => {
    expect([0, 1, 2, 3].map((i) => itemLabel(items, i))).toEqual(['1', 'A1', 'A2', '4']);
  });
});

describe('warm-up overlap', () => {
  const warmups = [
    { startedAt: 0, endedAt: 60_000 },
    { startedAt: 100_000, endedAt: null },
  ];

  it('clips intervals and runs open ones until now', () => {
    expect(overlapMs(warmups, 30_000, 130_000)).toBe(60_000);
  });

  it('excludes warm-up from a duration', () => {
    expect(secondsExcludingWarmup(warmups, 30_000, 130_000)).toBe(40);
  });
});

describe('restRemainingSec', () => {
  it('derives the countdown from the end timestamp', () => {
    expect(restRemainingSec(10_000, 8_500)).toBe(2);
    expect(restRemainingSec(10_000, 12_000)).toBe(0);
  });
});

describe('stepWeight', () => {
  it('moves in 2.5 kg steps and never below zero', () => {
    expect(stepWeight(100, 1)).toBe(102.5);
    expect(stepWeight(1, -1)).toBe(0);
  });
});
