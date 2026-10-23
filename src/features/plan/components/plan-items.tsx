import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArrowDownIcon, ArrowUpIcon, Button, Card, CheckIcon, OutlineIconButton, Stepper } from '@/components/ui';
import { blockRange, itemLabel, REST_STEP_SEC } from '@/domain/workout-flow';
import { formatClock, formatRoundCount, formatSetCount } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme/theme';

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
  onPress: () => void;
};

function ItemCard({ badge, title, subtitle, selected, inSuperset = false, onPress }: ItemCardProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${badge}. ${title}, ${subtitle}`}
      accessibilityHint="Вибрати, щоб змінити або об’єднати в суперсет"
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
      <View style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>{selected && <CheckIcon size={11} />}</View>
    </Pressable>
  );
}

type ItemEditorProps = Omit<PlanItemsProps, 'items' | 'selected' | 'onToggle'> & { items: DraftItem[]; index: number };

function ItemEditor({ items, index, onSets, onRest, onMove, onRemove, onSplit }: ItemEditorProps) {
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
        <OutlineIconButton accessibilityLabel="Перемістити вище" onPress={() => onMove(index, -1)}>
          <ArrowUpIcon />
        </OutlineIconButton>
        <OutlineIconButton accessibilityLabel="Перемістити нижче" onPress={() => onMove(index, 1)}>
          <ArrowDownIcon />
        </OutlineIconButton>
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
    gap: space.md,
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
    gap: space.md,
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
