// Active workout flow from docs/SPEC.md §3: sets, supersets, rest and warm-up.

export type FlowItem = {
  id: number;
  supersetGroup: string | null;
  targetSets: number;
  restSec: number;
};

/** Index range [start, end] of the block (single exercise or superset) that contains `index`. */
export function blockRange(items: { supersetGroup: string | null }[], index: number) {
  const group = items[index]?.supersetGroup;
  let start = index;
  let end = index;
  if (group) {
    while (start > 0 && items[start - 1].supersetGroup === group) start--;
    while (end < items.length - 1 && items[end + 1].supersetGroup === group) end++;
  }
  return { start, end };
}

export type NextStep =
  | { kind: 'set'; itemIndex: number; restSec: number }
  | { kind: 'finished' };

/**
 * Where to go after a set of `items[index]` is logged; `setsDone` already includes it.
 * Inside a superset the next member follows with no rest; rest comes after the whole round.
 */
export function stepAfterSet(items: FlowItem[], index: number, setsDone: (itemId: number) => number): NextStep {
  const { start, end } = blockRange(items, index);
  const item = items[index];
  if (index < end) return { kind: 'set', itemIndex: index + 1, restSec: 0 };

  const rounds = setsDone(item.id);
  const target = Math.max(...items.slice(start, end + 1).map((i) => i.targetSets));
  if (rounds < target) return { kind: 'set', itemIndex: start, restSec: item.restSec };
  if (end + 1 < items.length) return { kind: 'set', itemIndex: end + 1, restSec: item.restSec };
  return { kind: 'finished' };
}

/** "Finish exercise": skip the rest of the current block. */
export function stepAfterExercise(items: FlowItem[], index: number): NextStep {
  const { end } = blockRange(items, index);
  return end + 1 < items.length ? { kind: 'set', itemIndex: end + 1, restSec: 0 } : { kind: 'finished' };
}

/** Whether the set about to be logged ends the whole workout (last round of the last block). */
export function isFinalSet(items: FlowItem[], index: number, setsDoneBefore: (itemId: number) => number) {
  const next = stepAfterSet(items, index, (id) => setsDoneBefore(id) + (id === items[index].id ? 1 : 0));
  return next.kind === 'finished';
}

/** Superset label, e.g. "A1"; plain position number for a single exercise. */
export function itemLabel(items: { supersetGroup: string | null }[], index: number) {
  const { start } = blockRange(items, index);
  const group = items[index].supersetGroup;
  return group ? `${group}${index - start + 1}` : String(index + 1);
}

export type Interval = { startedAt: number; endedAt: number | null };

/** Milliseconds of the intervals (open ones run until `now`) that fall inside [from, to]. */
export function overlapMs(intervals: Interval[], from: number, to: number, now = to) {
  let total = 0;
  for (const i of intervals) {
    const start = Math.max(i.startedAt, from);
    const end = Math.min(i.endedAt ?? now, to);
    if (end > start) total += end - start;
  }
  return total;
}

/** Seconds between `from` and `to`, excluding warm-up time. */
export function secondsExcludingWarmup(warmups: Interval[], from: number, to: number) {
  return Math.max(0, Math.round((to - from - overlapMs(warmups, from, to)) / 1000));
}

/** Remaining rest in whole seconds, derived from the end timestamp (SPEC §7). */
export function restRemainingSec(restEndsAt: number, now: number) {
  return Math.max(0, Math.ceil((restEndsAt - now) / 1000));
}

export const WEIGHT_STEP_KG = 2.5;
export const REST_STEP_SEC = 15;

export function stepWeight(kg: number, direction: 1 | -1) {
  return Math.max(0, Math.round((kg + direction * WEIGHT_STEP_KG) / WEIGHT_STEP_KG) * WEIGHT_STEP_KG);
}
