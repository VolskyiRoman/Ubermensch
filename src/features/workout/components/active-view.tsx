import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  ChevronDownIcon,
  HistoryIcon,
  NoteIcon,
  OutlineIconButton,
  SegmentProgress,
  ThermometerIcon,
} from '@/components/ui';
import { secondsExcludingWarmup, type Interval } from '@/domain/workout-flow';
import { formatClock, formatDecimal, formatDuration, formatSetList } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

import type { ActiveItem, ActiveWorkoutData, WeightReps } from '../load-active';
import { plannedSet, previousSet } from '../load-active';
import { toggleWarmup } from '../session';
import { LogSetSheet } from './log-set-sheet';
import { NoteSheet } from './note-sheet';
import { PlanDelta } from './plan-delta';

type ActiveViewProps = {
  workout: ActiveWorkoutData;
  item: ActiveItem;
  itemIndex: number;
  setStartedAt: number;
  warmups: Interval[];
  logSheet: { durationSec: number; restSec: number | null; saveLabel: string } | null;
  onFinishSet: () => void;
  onCloseSheet: () => void;
  onSaveSet: (values: WeightReps & { restSec: number }) => void;
  onFinishExercise: () => void;
  onSaveNote: (text: string) => void;
};

/** mm:ss with a leading zero, as on the set timer: "00:42". */
function formatTimer(sec: number) {
  return formatClock(sec).padStart(5, '0');
}

export function ActiveView(props: ActiveViewProps) {
  const { workout, item, itemIndex, setStartedAt, warmups, logSheet } = props;
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [noteOpen, setNoteOpen] = useState(false);

  const openWarmup = warmups.find((w) => w.endedAt === null);
  const setSec = secondsExcludingWarmup(warmups, setStartedAt, now);
  const setNumber = item.sets.length + 1;
  const plan = plannedSet(item, item.sets.length);
  const previous = previousSet(item);
  const exerciseLabel = `ВПРАВА ${itemIndex + 1} З ${workout.items.length}${item.supersetGroup ? ` · ${item.label}` : ''}`;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <OutlineIconButton accessibilityLabel="Згорнути тренування" onPress={() => router.back()}>
            <ChevronDownIcon />
          </OutlineIconButton>
          <View style={styles.headerCenter}>
            <Text style={styles.workoutName} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text style={styles.elapsed}>загалом {formatDuration((now - (workout.startedAt ?? now)) / 1000)}</Text>
          </View>
          <OutlineIconButton accessibilityLabel="Нотатка" label="Нотатка" onPress={() => setNoteOpen(true)}>
            <NoteIcon />
          </OutlineIconButton>
        </View>

        <SegmentProgress total={workout.items.length} done={itemIndex + 1} />

        <View style={styles.titleBlock}>
          <Text style={styles.exerciseLabel}>{exerciseLabel}</Text>
          <Text style={styles.exerciseName} accessibilityRole="header">
            {item.name}
          </Text>
        </View>

        {item.lastTime.length > 0 && (
          <View style={styles.lastTime}>
            <HistoryIcon color={colors.textMuted} />
            <Text style={styles.lastTimeLabel}>Минулого разу:</Text>
            <Text style={styles.lastTimeValue}>{formatSetList(item.lastTime)}</Text>
          </View>
        )}

        <View
          style={styles.timer}
          accessible
          accessibilityRole="timer"
          accessibilityLabel={`Підхід ${setNumber} з ${item.targetSets}, ${formatClock(setSec)}`}
        >
          <View style={styles.timerLabelRow}>
            <View style={styles.liveDot} />
            <Text style={styles.timerLabel}>
              {openWarmup ? 'Розминка триває' : `Підхід ${setNumber} з ${item.targetSets} триває`}
            </Text>
          </View>
          <Text style={styles.timerValue}>{formatTimer(setSec)}</Text>
          <Text style={styles.timerCaption}>
            {[
              plan ? `план: ${formatDecimal(plan.weightKg)} кг × ${plan.reps}` : null,
              item.restSec > 0 ? `відпочинок ${formatClock(item.restSec)}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        <View style={styles.sets}>
          {item.sets.map((set) => {
            const setPlan = plannedSet(item, set.setIndex);
            return (
              <View key={set.id} style={[styles.setRow, styles.divider]}>
                <Text style={[styles.setNo, { color: colors.text }]}>{set.setIndex + 1}</Text>
                <View style={styles.setMainCol}>
                  <Text style={styles.setValue}>
                    {formatDecimal(set.weightKg)} кг × {set.reps}
                  </Text>
                  {setPlan && <PlanDelta planned={setPlan} actual={set} />}
                </View>
                <Text style={styles.setTime}>{formatClock(set.durationSec)}</Text>
                <Text style={styles.setDone} accessibilityLabel="виконано">
                  ✓
                </Text>
              </View>
            );
          })}
          <View style={styles.setRow}>
            <Text style={[styles.setNo, { color: colors.accent }]}>{setNumber}</Text>
            <Text style={styles.setMain}>…</Text>
            <Text style={styles.setTime}>{formatClock(setSec)}</Text>
            <Text style={[styles.setDone, { color: colors.accent }]}>зараз</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, space.md) + space.xs }]}>
        <Button title="Завершити підхід" onPress={props.onFinishSet} />
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !!openWarmup }}
            accessibilityLabel={openWarmup ? `Розминка ${formatClock((now - openWarmup.startedAt) / 1000)}, зупинити` : 'Розминка'}
            onPress={toggleWarmup}
            style={({ pressed }) => [styles.warmup, openWarmup && styles.warmupOn, pressed && styles.pressed]}
          >
            <ThermometerIcon color={openWarmup ? colors.onAccent : colors.text} />
            <Text style={[styles.warmupLabel, openWarmup && styles.warmupLabelOn]}>
              {openWarmup ? `Розминка ${formatClock((now - openWarmup.startedAt) / 1000)}` : 'Розминка'}
            </Text>
          </Pressable>
          <Button title="Завершити вправу" variant="secondary" onPress={props.onFinishExercise} style={styles.half} />
        </View>
      </View>

      <LogSetSheet
        visible={logSheet !== null}
        setNumber={setNumber}
        durationSec={logSheet?.durationSec ?? 0}
        initial={plan ?? previous ?? { weightKg: 0, reps: 8 }}
        planned={plan}
        previous={previous}
        restSec={logSheet?.restSec ?? null}
        saveLabel={logSheet?.saveLabel ?? ''}
        onSave={props.onSaveSet}
        onClose={props.onCloseSheet}
      />
      <NoteSheet visible={noteOpen} initial={workout.notes ?? ''} onSave={props.onSaveNote} onClose={() => setNoteOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  headerCenter: { flex: 1, alignItems: 'center' },
  workoutName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  elapsed: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  titleBlock: { gap: space.xs, paddingTop: space.xs },
  exerciseLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
  exerciseName: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 31, letterSpacing: -0.5, color: colors.text },
  lastTime: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingVertical: space.sm2,
    paddingHorizontal: space.md,
  },
  lastTimeLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  lastTimeValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.text, flexShrink: 1 },
  timer: {
    backgroundColor: colors.text,
    borderRadius: radius.hero,
    padding: space.xl,
    alignItems: 'center',
    gap: space.xs2,
  },
  timerLabelRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs2 },
  liveDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.live },
  timerLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.accentOnDark },
  timerValue: { fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 68, letterSpacing: 1, color: colors.onAccent },
  timerCaption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textOnDarkMuted },
  sets: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.panel,
    paddingVertical: space.xs2,
    paddingHorizontal: space.md2,
  },
  setRow: { flexDirection: 'row', alignItems: 'center', minHeight: 42, paddingVertical: space.xs },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  setNo: { width: 44, fontFamily: fonts.extrabold, fontSize: 14 },
  setMainCol: { flex: 1, gap: space.xxs },
  setValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  setMain: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  setTime: { width: 70, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  setDone: { width: 50, textAlign: 'right', fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  actions: { paddingTop: space.md, paddingHorizontal: screenPadding, gap: space.sm, backgroundColor: colors.bg },
  actionRow: { flexDirection: 'row', gap: space.sm },
  half: { flex: 1 },
  warmup: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs2,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    paddingVertical: space.md2,
    paddingHorizontal: space.sm,
  },
  warmupOn: { backgroundColor: colors.text },
  pressed: { opacity: 0.8 },
  warmupLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  warmupLabelOn: { color: colors.onAccent },
});
