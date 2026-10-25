import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArrowDownIcon, ArrowUpIcon, Button, Card, CheckIcon, Stepper } from '@/components/ui';
import { canMoveItem } from '@/domain/plan';
import { blockRange, itemLabel, REST_STEP_SEC } from '@/domain/workout-flow';
import { formatClock, formatRoundCount, formatSetCount } from '@/lib/format';
import { colors, fonts, radius, sizes, space } from '@/theme/theme';

import type { DraftItem } from '../plan-repo';

type PlanItemsProps = {
  items: DraftItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onSets: (index: number, sets: number) => void;
  onRest: (index: number, restSec: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onSplit: (index: number) => void;
};

/** Exercise list of a plan: single exercises and superset blocks, with an editor under the selected item. */
export function PlanItems({ items, selected, ...actions }: PlanItemsProps) {
  const editing = selected.size === 1 ? items.findIndex((i) => selected.has(i.key)) : -1;
  const blocks: { start: number; end: number }[] = [];
  for (let i = 0; i < items.length; i = blocks[blocks.length - 1].end + 1) blocks.push(blockRange(items, i));
  const moveProps = (index: number) => ({
    canMoveUp: canMoveItem(items, index, -1),
    canMoveDown: canMoveItem(items, index, 1),
    onMove: (direction: -1 | 1) => actions.onMove(index, direction),
  });

  return (
    <>
      {blocks.map(({ start, end }) => {
        const members = items.slice(start, end + 1);
        const editor =
          editing >= start && editing <= end ? <ItemEditor items={items} index={editing} {...actions} /> : null;

        if (!items[start].supersetGroup) {
          const item = items[start];
          return (
            <Fragment key={item.key}>
              <ItemCard
                badge={itemLabel(items, start)}
                title={item.name}
                subtitle={`${formatSetCount(item.targetSets)} · відпочинок ${formatClock(item.restSec)}`}
                selected={selected.has(item.key)}
                onPress={() => actions.onToggle(item.key)}
                {...moveProps(start)}
              />
              {editor}
            </Fragment>
          );
        }

        const last = members[members.length - 1];
        return (
          <Fragment key={items[start].key}>
            <View style={styles.superset}>
              <View style={styles.supersetHeader}>
                <Text style={styles.supersetTitle}>
                  СУПЕРСЕТ {items[start].supersetGroup} · {formatRoundCount(items[start].targetSets)}
                </Text>
                <Text style={styles.supersetRest}>відпочинок після кола {formatClock(last.restSec)}</Text>
              </View>
              {members.map((item, n) => (
                <ItemCard
                  key={item.key}
                  inSuperset
                  badge={itemLabel(items, start + n)}
                  title={item.name}
                  subtitle={
                    n < members.length - 1 ? `без відпочинку → ${itemLabel(items, start + n + 1)}` : 'потім відпочинок'
                  }
                  selected={selected.has(item.key)}
                  onPress={() => actions.onToggle(item.key)}
                  {...moveProps(start + n)}
                />
              ))}
            </View>
            {editor}
          </Fragment>
        );
      })}
    </>
  );
}

type ItemCardProps = {
  badge: string;
  title: string;
  subtitle: string;
  selected: boolean;
  inSuperset?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPress: () => void;
  onMove: (direction: -1 | 1) => void;
};

function ItemCard({ badge, title, subtitle, selected, inSuperset = false, canMoveUp, canMoveDown, onPress, onMove }: ItemCardProps) {
  // Screen readers reach the arrows through custom actions, since the card is one accessible element.
  const actions = [
    ...(canMoveUp ? [{ name: 'moveUp', label: 'Перемістити вище' }] : []),
    ...(canMoveDown ? [{ name: 'moveDown', label: 'Перемістити нижче' }] : []),
  ];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${badge}. ${title}, ${subtitle}`}
      accessibilityHint="Вибрати, щоб змінити або об’єднати в суперсет"
      accessibilityActions={actions}
      onAccessibilityAction={(e) => onMove(e.nativeEvent.actionName === 'moveUp' ? -1 : 1)}
      onPress={onPress}
      style={[inSuperset ? styles.member : styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.badge, inSuperset && styles.badgeSuperset]}>
        <Text style={[styles.badgeLabel, inSuperset && styles.badgeLabelSuperset]}>{badge}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <MoveButton direction={-1} enabled={canMoveUp} onMove={onMove} />
      <MoveButton direction={1} enabled={canMoveDown} onMove={onMove} />
      <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>{selected && <CheckIcon size={11} />}</View>
    </Pressable>
  );
}

// 36 px button + 4 px slop on each side = 44 px touch target.
const MOVE_HIT_SLOP = 4;

function MoveButton({ direction, enabled, onMove }: { direction: -1 | 1; enabled: boolean; onMove: (direction: -1 | 1) => void }) {
  const Icon = direction === -1 ? ArrowUpIcon : ArrowDownIcon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === -1 ? 'Перемістити вище' : 'Перемістити нижче'}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={() => onMove(direction)}
      hitSlop={MOVE_HIT_SLOP}
      style={({ pressed }) => [styles.move, !enabled && styles.moveDisabled, pressed && styles.movePressed]}
    >
      <Icon color={enabled ? colors.text : colors.inactive} />
    </Pressable>
  );
}

type ItemEditorProps = Omit<PlanItemsProps, 'items' | 'selected' | 'onToggle'> & { items: DraftItem[]; index: number };

function ItemEditor({ items, index, onSets, onRest, onRemove, onSplit }: ItemEditorProps) {
  const item = items[index];
  const { end } = blockRange(items, index);
  const inSuperset = !!item.supersetGroup;
  const restSec = items[inSuperset ? end : index].restSec;

  return (
    <Card style={styles.editor}>
      <View style={styles.editorRow}>
        <Text style={styles.editorLabel}>{inSuperset ? 'Кола' : 'Підходи'}</Text>
        <Stepper
          accessibilityLabel={inSuperset ? 'Кола' : 'Підходи'}
          value={String(item.targetSets)}
          onDecrement={() => onSets(index, item.targetSets - 1)}
          onIncrement={() => onSets(index, item.targetSets + 1)}
        />
      </View>
      <View style={[styles.editorRow, styles.divider]}>
        <Text style={styles.editorLabel}>{inSuperset ? 'Відпочинок після кола' : 'Відпочинок'}</Text>
        <Stepper
          accessibilityLabel="Відпочинок"
          value={formatClock(restSec)}
          onDecrement={() => onRest(index, restSec - REST_STEP_SEC)}
          onIncrement={() => onRest(index, restSec + REST_STEP_SEC)}
        />
      </View>
      <View style={[styles.editorActions, styles.divider]}>
        <View style={styles.spacer} />
        {inSuperset && <Button title="Роз’єднати" variant="text" onPress={() => onSplit(index)} />}
        <Button title="Прибрати" variant="text" onPress={() => onRemove(index)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardSmall,
    paddingVertical: space.md,
    paddingHorizontal: space.md2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  member: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radius.input,
    paddingVertical: space.sm2,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  cardSelected: { borderColor: colors.text },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radius.tag,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuperset: { backgroundColor: colors.accent },
  badgeLabel: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.text },
  badgeLabelSuperset: { fontSize: 12, color: colors.onAccent },
  text: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  move: {
    width: sizes.touch - 2 * MOVE_HIT_SLOP,
    height: sizes.touch - 2 * MOVE_HIT_SLOP,
    borderRadius: radius.tag,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveDisabled: { opacity: 0.5 },
  movePressed: { backgroundColor: colors.divider },
  check: { width: 20, height: 20, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.text },
  checkOff: { borderWidth: 1.5, borderColor: colors.inactive },
  superset: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    borderRadius: radius.cardSmall,
    paddingVertical: space.sm2,
    paddingHorizontal: space.md,
    gap: space.sm,
  },
  supersetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  supersetTitle: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.accentPressed },
  supersetRest: { fontFamily: fonts.semibold, fontSize: 12, color: colors.accentPressed },
  editor: { paddingVertical: space.xs, paddingHorizontal: space.lg },
  editorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  editorLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  editorActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 56 },
  spacer: { flex: 1 },
});
