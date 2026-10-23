import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RestTip, restTips } from '@/components/illustrations/rest-tip';
import { Button, CheckIcon, RestRing } from '@/components/ui';
import { restRemainingSec } from '@/domain/workout-flow';
import { formatClock, formatDecimal, formatDuration } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { colors, fonts, radius, space } from '@/theme/theme';

import type { ActiveWorkoutState } from '../active-workout-store';
import { plannedSet, suggestedSet, type ActiveItem } from '../load-active';
import { adjustRest, nextTip } from '../session';

type RestViewProps = {
  startedAt: number;
  restEndsAt: number;
  restTotalSec: number;
  lastSet: ActiveWorkoutState['lastSet'];
  nextItem: ActiveItem;
  tipIndex: number;
  onStart: () => void;
};

/** Rest countdown from docs/design/Rest.dc.html; remaining time is derived from restEndsAt. */
export function RestView({ startedAt, restEndsAt, restTotalSec, lastSet, nextItem, tipIndex, onStart }: RestViewProps) {
  const now = useNow(250);
  const remaining = restRemainingSec(restEndsAt, now);
  const nextPlan = plannedSet(nextItem, nextItem.sets.length) ?? suggestedSet(nextItem);
  const sameExercise = lastSet !== null && nextItem.sets.length > 0;

  // In the foreground the end of rest is signalled with haptics (the notification only plays its sound).
  const signalled = useRef(remaining === 0);
  useEffect(() => {
    if (remaining > 0) signalled.current = false;
    else if (!signalled.current) {
      signalled.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [remaining]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.label}>ВІДПОЧИНОК</Text>
        <Text style={styles.elapsed}>загалом {formatDuration((now - startedAt) / 1000)}</Text>
      </View>

      {lastSet && (
        <View style={styles.logged}>
          <View style={styles.loggedCheck}>
            <CheckIcon />
          </View>
          <Text style={styles.loggedText}>Підхід {lastSet.setNumber} записано</Text>
          <Text style={styles.loggedValue}>
            {formatDecimal(lastSet.weightKg)} кг × {lastSet.reps}
          </Text>
        </View>
      )}

      <View style={styles.ring}>
        <RestRing
          size={220}
          strokeWidth={14}
          labelSize={64}
          progress={restTotalSec > 0 ? remaining / restTotalSec : 0}
          label={formatClock(remaining)}
          caption={`з ${formatClock(restTotalSec)}`}
          accessibilityLabel={`Залишилось ${formatClock(remaining)} з ${formatClock(restTotalSec)}`}
        />
      </View>

      <View style={styles.controls}>
        <Button title="−15 с" variant="secondary" style={styles.control} onPress={() => adjustRest(-15, nextItem)} />
        <Button title="+30 с" variant="secondary" style={styles.control} onPress={() => adjustRest(30, nextItem)} />
        <Button title="Пропустити" variant="secondary" style={[styles.control, styles.skip]} onPress={onStart} />
      </View>

      <View style={styles.next}>
        <View style={styles.nextText}>
          <Text style={styles.nextCaption}>
            Далі · {sameExercise ? '' : `${nextItem.name} · `}підхід {nextItem.sets.length + 1} з {nextItem.targetSets}
          </Text>
          <Text style={styles.nextTitle}>
            План: {formatDecimal(nextPlan.weightKg)} кг × {nextPlan.reps}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Почати наступний підхід"
          onPress={onStart}
          style={({ pressed }) => [styles.start, pressed && styles.startPressed]}
        >
          <Text style={styles.startLabel}>Почати</Text>
        </Pressable>
      </View>

      <View style={styles.tip}>
        <RestTip index={tipIndex} />
        <Button title="Інша порада" variant="text" onPress={() => nextTip(restTips.length)} style={styles.tipButton} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  elapsed: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  logged: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingVertical: space.sm2,
    paddingHorizontal: space.md,
  },
  loggedCheck: {
    width: 24,
    height: 24,
    borderRadius: radius.checkbox,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  loggedValue: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  ring: { alignSelf: 'center' },
  controls: { flexDirection: 'row', gap: space.sm },
  control: { flex: 1, minHeight: 50, borderColor: colors.border, paddingHorizontal: space.xs },
  skip: { borderColor: colors.text },
  next: {
    backgroundColor: colors.text,
    borderRadius: radius.card,
    padding: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.md,
  },
  nextText: { flex: 1, gap: space.xxs },
  nextCaption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textOnDarkMuted },
  nextTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.onAccent },
  start: {
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.chip,
    paddingHorizontal: space.md2,
  },
  startPressed: { backgroundColor: colors.accentPressed },
  startLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.onAccent },
  tip: { alignItems: 'center', gap: space.xxs },
  tipButton: { alignSelf: 'center' },
});
