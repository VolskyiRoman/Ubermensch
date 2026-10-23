import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius, sizes, space } from '@/theme/theme';

type StepperProps = {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  accessibilityLabel: string;
};

/** Compact stepper, e.g. rest duration "3:00". */
export function Stepper({ value, onDecrement, onIncrement, accessibilityLabel }: StepperProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: менше`}
        onPress={onDecrement}
        hitSlop={6}
        style={({ pressed }) => [styles.small, pressed && styles.pressed]}
      >
        <Text style={styles.smallLabel}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: більше`}
        onPress={onIncrement}
        hitSlop={6}
        style={({ pressed }) => [styles.small, pressed && styles.pressed]}
      >
        <Text style={styles.smallLabel}>+</Text>
      </Pressable>
    </View>
  );
}

type BigStepperProps = {
  label: string;
  value: string;
  decrementLabel: string;
  incrementLabel: string;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Makes the value typeable; called with the raw text on every keystroke. */
  onChangeText?: (text: string) => void;
  keyboardType?: 'decimal-pad' | 'number-pad';
};

/** Large stepper for weight and reps; with `onChangeText` the value can also be typed. */
export function BigStepper({
  label,
  value,
  decrementLabel,
  incrementLabel,
  onDecrement,
  onIncrement,
  onChangeText,
  keyboardType = 'decimal-pad',
}: BigStepperProps) {
  const input = useRef<TextInput>(null);
  // While typing, the raw text is shown ("82," mid-entry); the formatted value returns on blur.
  const [draft, setDraft] = useState<string | null>(null);
  const step = (change: () => void) => () => {
    input.current?.blur();
    setDraft(null);
    change();
  };

  return (
    <View style={styles.big}>
      <Text style={styles.bigLabel}>{label}</Text>
      {onChangeText ? (
        <TextInput
          ref={input}
          accessibilityLabel={label}
          accessibilityHint="Двічі торкніться, щоб ввести значення"
          value={draft ?? value}
          onFocus={() => setDraft(value)}
          onChangeText={(text) => {
            setDraft(text);
            onChangeText(text);
          }}
          onBlur={() => setDraft(null)}
          keyboardType={keyboardType}
          selectTextOnFocus
          returnKeyType="done"
          style={[styles.bigValue, styles.bigInput, draft !== null && styles.bigInputFocused]}
        />
      ) : (
        <Text style={styles.bigValue}>{value}</Text>
      )}
      <View style={styles.bigButtons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${decrementLabel}`}
          onPress={step(onDecrement)}
          style={({ pressed }) => [styles.bigButton, pressed && styles.pressed]}
        >
          <Text style={styles.bigButtonLabel}>{decrementLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${incrementLabel}`}
          onPress={step(onIncrement)}
          style={({ pressed }) => [styles.bigButton, pressed && styles.pressed]}
        >
          <Text style={styles.bigButtonLabel}>{incrementLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs2 },
  small: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.tag,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  value: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text, minWidth: 38, textAlign: 'center' },
  pressed: { opacity: 0.6 },
  big: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.panel,
    padding: space.md,
    alignItems: 'center',
    gap: space.xs2,
  },
  bigLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  bigValue: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 38, color: colors.text },
  bigInput: {
    alignSelf: 'stretch',
    minHeight: sizes.touch,
    padding: 0,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
  },
  bigInputFocused: { borderBottomColor: colors.accent },
  bigButtons: { flexDirection: 'row', gap: space.xs2, alignSelf: 'stretch' },
  bigButton: {
    flex: 1,
    height: sizes.touch,
    borderRadius: radius.chip,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigButtonLabel: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.text },
});
