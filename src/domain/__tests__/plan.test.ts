import { describe, expect, it } from '@jest/globals';

import { mergeSuperset, moveItem, relabelSupersets, removeItem, setRest, setTargetSets, splitSuperset } from '../plan';

type Item = { name: string; supersetGroup: string | null; targetSets: number; restSec: number };

const item = (name: string, supersetGroup: string | null = null, targetSets = 3, restSec = 120): Item => ({
  name,
  supersetGroup,
  targetSets,
  restSec,
});

const names = (items: Item[]) => items.map((i) => `${i.name}${i.supersetGroup ? `:${i.supersetGroup}` : ''}`);

describe('relabelSupersets', () => {
  it('names groups in order of appearance', () => {
    expect(names(relabelSupersets([item('a', 'x'), item('b', 'x'), item('c', 'y'), item('d', 'y')]))).toEqual([
      'a:A',
      'b:A',
      'c:B',
      'd:B',
    ]);
  });
});

describe('mergeSuperset', () => {
  it('groups selected items at the first position with rounds and rest after the round', () => {
    const merged = mergeSuperset([item('a'), item('b', null, 4, 90), item('c'), item('d', null, 3, 150)], [1, 3]);
    expect(names(merged)).toEqual(['a', 'b:A', 'd:A', 'c']);
    expect(merged.map((i) => [i.targetSets, i.restSec])).toEqual([
      [3, 120],
      [4, 0],
      [4, 150],
      [3, 120],
    ]);
  });

  it('needs at least two items', () => {
    const items = [item('a'), item('b')];
    expect(mergeSuperset(items, [0])).toBe(items);
  });
});

describe('splitSuperset', () => {
  it('gives every member the rest after the round', () => {
    const split = splitSuperset([item('a', 'A', 3, 0), item('b', 'A', 3, 90)], 0);
    expect(split.map((i) => [i.supersetGroup, i.restSec])).toEqual([
      [null, 90],
      [null, 90],
    ]);
  });
});

describe('removeItem', () => {
  it('dissolves a superset left with one member and keeps its rest', () => {
    const items = removeItem([item('a', 'A', 3, 0), item('b', 'A', 3, 90), item('c')], 1);
    expect(names(items)).toEqual(['a', 'c']);
    expect(items[0].restSec).toBe(90);
  });
});

describe('moveItem', () => {
  it('jumps a single exercise over a whole superset', () => {
    const items = [item('a'), item('b', 'A'), item('c', 'A'), item('d')];
    expect(names(moveItem(items, 0, 1))).toEqual(['b:A', 'c:A', 'a', 'd']);
    expect(names(moveItem(items, 3, -1))).toEqual(['a', 'd', 'b:A', 'c:A']);
  });

  it('moves a member within its superset and keeps the rest at the end of the round', () => {
    const items = [item('b', 'A', 3, 0), item('c', 'A', 3, 90)];
    const moved = moveItem(items, 0, 1);
    expect(names(moved)).toEqual(['c:A', 'b:A']);
    expect(moved.map((i) => i.restSec)).toEqual([0, 90]);
  });
});

describe('setTargetSets / setRest', () => {
  const items = [item('a'), item('b', 'A', 3, 0), item('c', 'A', 3, 90)];

  it('applies rounds to the whole superset', () => {
    expect(setTargetSets(items, 1, 5).map((i) => i.targetSets)).toEqual([3, 5, 5]);
  });

  it('sets the rest after the round on the last member', () => {
    expect(setRest(items, 1, 60).map((i) => i.restSec)).toEqual([120, 0, 60]);
  });
});
