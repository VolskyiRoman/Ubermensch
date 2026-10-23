import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigStepper, Button, RepeatIcon, Stepper } from '@/components/ui';
import { REST_STEP_SEC, stepWeight } from '@/domain/workout-flow';
import { formatClock, formatDecimal, parseDecimal } from '@/lib/format';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

import type { WeightReps } from '../load-active';
import { PlanDelta } from './plan-delta';

type LogSetSheetProps = {
  visible: boolean;
  setNumber: number;
  durationSec: number;
  initial: WeightReps;
  /** Plan for this set, shown with the difference from the entered values. */
  planned: WeightReps | null;
  /** "Як минулий" values: previous set of this session or the same set last time. */
  previous: WeightReps | null;
  /** null hides the rest row (next superset member follows without rest). */
  restSec: number | null;
  saveLabel: string;
  onSave: (values: WeightReps & { restSec: number }) => void;
  onClose: () => void;
};

/** "Завершення підходу" bottom sheet from docs/design/LogSet.dc.html. */
export function LogSetSheet(props: LogSetSheetProps) {
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      {props.visible && <SheetContent {...props} />}
    </Modal>
  );
}

function SheetContent({ setNumber, durationSec, initial, planned, previous, restSec, saveLabel, onSave, onClose }: LogSetSheetProps) {
  const insets = useSafeAreaInsets();
  const [weightKg, setWeightKg] = useState(initial.weightKg);
  const [reps, setReps] = useState(initial.reps);
  const [rest, setRest] = useState(restSec ?? 0);

  return (
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.dismiss} accessibilityRole="button" accessibilityLabel="Закрити" onPress={onClose} />
      {/* Tapping the sheet outside the inputs hides the keyboard. */}
      <Pressable
        accessible={false}
        onPress={Keyboard.dismiss}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]}
        accessibilityViewIsModal
        accessibilityLabel="Завершення підходу"
      >
        <View style={styles.grabber} />
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Підхід {setNumber}</Text>
            <Text style={styles.duration}>
              Тривалість підходу: <Text style={styles.durationValue}>{formatClock(durationSec)}</Text>
            </Text>
          </View>
          {previous && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Як минулий: ${formatDecimal(previous.weightKg)} кілограмів, ${previous.reps} повторів`}
              onPress={() => {
                Keyboard.dismiss();
                setWeightKg(previous.weightKg);
                setReps(previous.reps);
                void Haptics.selectionAsync();
              }}
              style={({ pressed }) => [styles.repeat, pressed && styles.pressed]}
            >
              <RepeatIcon color={colors.onAccent} />
              <Text style={styles.repeatLabel}>
                Як минулий: {formatDecimal(previous.weightKg)} × {previous.reps}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.steppers}>
          <View style={styles.stepper}>
            <BigStepper
              label="Вага, кг"
              value={formatDecimal(weightKg)}
              decrementLabel="−2,5"
              incrementLabel="+2,5"
              onDecrement={() => setWeightKg((w) => stepWeight(w, -1))}
              onIncrement={() => setWeightKg((w) => stepWeight(w, 1))}
              onChangeText={(text) => {
                const kg = parseDecimal(text);
                if (kg !== null) setWeightKg(Math.round(kg * 100) / 100);
              }}
            />
          </View>
          <View style={styles.stepper}>
            <BigStepper
              label="Повтори"
              value={String(reps)}
              decrementLabel="−"
              incrementLabel="+"
              onDecrement={() => setReps((r) => Math.max(0, r - 1))}
              onIncrement={() => setReps((r) => r + 1)}
              keyboardType="number-pad"
              onChangeText={(text) => {
                if (/^\d+$/.test(text)) setReps(Number(text));
              }}
            />
          </View>
        </View>

        {planned && (
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>
              План: <Text style={styles.planValue}>{formatDecimal(planned.weightKg)} кг × {planned.reps}</Text>
            </Text>
            <PlanDelta planned={planned} actual={{ weightKg, reps }} style={styles.planDelta} />
          </View>
        )}

        {restSec !== null && (
          <View style={styles.restRow}>
            <Text style={styles.restLabel}>Відпочинок після підходу</Text>
            <Stepper
              accessibilityLabel="Відпочинок"
              value={formatClock(rest)}
              onDecrement={() => setRest((r) => Math.max(0, r - REST_STEP_SEC))}
              onIncrement={() => setRest((r) => r + REST_STEP_SEC)}
            />
          </View>
        )}

        <Button title={saveLabel} onPress={() => onSave({ weightKg, reps, restSec: restSec === null ? 0 : rest })} />
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.sm2,
    paddingHorizontal: screenPadding,
    gap: space.lg,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: radius.segment, backgroundColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: space.sm },
  headerText: { gap: space.xxs, flexShrink: 1 },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  duration: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  durationValue: { fontFamily: fonts.bold, color: colors.text },
  repeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs2,
    minHeight: 44,
    backgroundColor: colors.text,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
  },
  pressed: { opacity: 0.85 },
  repeatLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.onAccent },
  steppers: { flexDirection: 'row', gap: space.sm2 },
  stepper: { flex: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, marginTop: -space.xs },
  planLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  planValue: { fontFamily: fonts.bold, color: colors.text },
  planDelta: { fontSize: 13 },
  restRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
});
