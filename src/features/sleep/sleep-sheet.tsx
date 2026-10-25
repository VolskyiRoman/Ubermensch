import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigStepper, Button } from '@/components/ui';
import { parseTimeOfDay, SLEEP_STEP_MIN, sleepDurationMin, wrapTimeOfDay, type SleepWindow } from '@/domain/sleep';
import { formatHoursMinutesLong, formatTimeOfDay } from '@/lib/format';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

type SleepSheetProps = {
  visible: boolean;
  title: string;
  initial: SleepWindow;
  saveLabel: string;
  onSave: (value: SleepWindow) => void;
  onClose: () => void;
};

/** Bottom sheet with bedtime and wake-up steppers: logs a night or sets the desired schedule. */
export function SleepSheet(props: SleepSheetProps) {
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      {props.visible && <SheetContent {...props} />}
    </Modal>
  );
}

const stepLabel = `${SLEEP_STEP_MIN} хв`;

function SheetContent({ title, initial, saveLabel, onSave, onClose }: SleepSheetProps) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(initial);
  const step = (key: keyof SleepWindow, direction: 1 | -1) =>
    setValue((v) => ({ ...v, [key]: wrapTimeOfDay(v[key] + direction * SLEEP_STEP_MIN) }));
  const type = (key: keyof SleepWindow) => (text: string) => {
    const min = parseTimeOfDay(text);
    if (min !== null) setValue((v) => ({ ...v, [key]: min }));
  };

  return (
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.dismiss} accessibilityRole="button" accessibilityLabel="Закрити" onPress={onClose} />
      {/* Tapping the sheet outside the inputs hides the keyboard. */}
      <Pressable
        accessible={false}
        onPress={Keyboard.dismiss}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]}
        accessibilityViewIsModal
        accessibilityLabel={title}
      >
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.duration}>
            Тривалість: <Text style={styles.durationValue}>{formatHoursMinutesLong(sleepDurationMin(value))}</Text>
          </Text>
        </View>
        <View style={styles.steppers}>
          <View style={styles.stepper}>
            <BigStepper
              label="Відбій"
              value={formatTimeOfDay(value.bedMin)}
              decrementLabel={`−${stepLabel}`}
              incrementLabel={`+${stepLabel}`}
              onDecrement={() => step('bedMin', -1)}
              onIncrement={() => step('bedMin', 1)}
              onChangeText={type('bedMin')}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.stepper}>
            <BigStepper
              label="Підйом"
              value={formatTimeOfDay(value.wakeMin)}
              decrementLabel={`−${stepLabel}`}
              incrementLabel={`+${stepLabel}`}
              onDecrement={() => step('wakeMin', -1)}
              onIncrement={() => step('wakeMin', 1)}
              onChangeText={type('wakeMin')}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Button
          title={saveLabel}
          onPress={() => {
            onSave(value);
            onClose();
          }}
        />
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
  header: { gap: space.xxs },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  duration: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  durationValue: { fontFamily: fonts.bold, color: colors.text },
  steppers: { flexDirection: 'row', gap: space.sm2 },
  stepper: { flex: 1 },
});
