// Editing a workout or template plan: exercise order and supersets (docs/SPEC.md §2, New workout).
import { blockRange } from './workout-flow';

export type PlanItem = {
  supersetGroup: string | null;
  targetSets: number;
  restSec: number;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Renames superset groups to A, B, C… in order of appearance. */
export function relabelSupersets<T extends PlanItem>(items: T[]): T[] {
  const names = new Map<string, string>();
  return items.map((item) => {
    if (!item.supersetGroup) return item;
    if (!names.has(item.supersetGroup)) names.set(item.supersetGroup, LETTERS[names.size % LETTERS.length]);
    return { ...item, supersetGroup: names.get(item.supersetGroup)! };
  });
}

/**
 * Joins the selected items into one superset placed where the first of them was.
 * Rounds = the largest set count; only the last member rests (rest after the round).
 */
export function mergeSuperset<T extends PlanItem>(items: T[], selected: number[]): T[] {
  const picked = [...new Set(selected)].sort((a, b) => a - b).filter((i) => i >= 0 && i < items.length);
  if (picked.length < 2) return items;
  const rounds = Math.max(...picked.map((i) => items[i].targetSets));
  const rest = Math.max(...picked.map((i) => items[i].restSec));
  const group = `new-${Date.now()}`;
  const members = picked.map((i, n) => ({
    ...items[i],
    supersetGroup: group,
    targetSets: rounds,
    restSec: n === picked.length - 1 ? rest : 0,
  }));

  // Items left alone in their old superset become single exercises.
  const remaining = items.filter((_, i) => !picked.includes(i));
  const counts = new Map<string, number>();
  for (const item of remaining) if (item.supersetGroup) counts.set(item.supersetGroup, (counts.get(item.supersetGroup) ?? 0) + 1);
  const cleaned = remaining.map((item) =>
    item.supersetGroup && counts.get(item.supersetGroup) === 1 ? { ...item, supersetGroup: null } : item,
  );

  const insertAt = picked[0] - picked.filter((i) => i < picked[0]).length;
  return relabelSupersets([...cleaned.slice(0, insertAt), ...members, ...cleaned.slice(insertAt)]);
}

/** Turns a superset back into single exercises; each keeps the rest that followed the round. */
export function splitSuperset<T extends PlanItem>(items: T[], index: number): T[] {
  const { start, end } = blockRange(items, index);
  const rest = items[end].restSec;
  return relabelSupersets(
    items.map((item, i) => (i >= start && i <= end ? { ...item, supersetGroup: null, restSec: rest } : item)),
  );
}

/** Removes an item; a superset with a single member left becomes a plain exercise. */
export function removeItem<T extends PlanItem>(items: T[], index: number): T[] {
  const { start, end } = blockRange(items, index);
  const isLastMember = items[index].supersetGroup && index === end && end > start;
  let next = items.filter((_, i) => i !== index);
  // The rest after the round moves to the new last member.
  if (isLastMember) next = next.map((item, i) => (i === end - 1 ? { ...item, restSec: items[index].restSec } : item));
  if (end - start === 1) next = next.map((item, i) => (i === start ? { ...item, supersetGroup: null } : item));
  return relabelSupersets(next);
}

/**
 * Moves an item up or down. A superset member moves within its superset; a single exercise
 * jumps over the whole neighbouring block.
 */
export function moveItem<T extends PlanItem>(items: T[], index: number, direction: -1 | 1): T[] {
  const { start, end } = blockRange(items, index);
  const next = [...items];
  if (items[index].supersetGroup) {
    const target = index + direction;
    if (target < start || target > end) return items;
    // Keep the rest on the last position of the round.
    const rests = next.map((i) => i.restSec);
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((item, i) => (i >= start && i <= end ? { ...item, restSec: rests[i] } : item));
  }
  const neighbour = index + direction;
  if (neighbour < 0 || neighbour >= items.length) return items;
  const block = blockRange(items, neighbour);
  const [moved] = next.splice(index, 1);
  const insertAt = direction === 1 ? block.end : block.start;
  next.splice(insertAt, 0, moved);
  return relabelSupersets(next);
}

/** Changes rounds for a whole superset, or sets for a single exercise. */
export function setTargetSets<T extends PlanItem>(items: T[], index: number, sets: number): T[] {
  const { start, end } = blockRange(items, index);
  const value = Math.max(1, sets);
  return items.map((item, i) => (i >= start && i <= end ? { ...item, targetSets: value } : item));
}

/** Rest of a single exercise, or the rest after the round for a superset. */
export function setRest<T extends PlanItem>(items: T[], index: number, restSec: number): T[] {
  const { end } = blockRange(items, index);
  const target = items[index].supersetGroup ? end : index;
  return items.map((item, i) => (i === target ? { ...item, restSec: Math.max(0, restSec) } : item));
}
