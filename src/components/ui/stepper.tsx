import { Pressable, StyleSheet, Text, View } from 'react-native';

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
};

/** Large stepper for weight and reps. */
export function BigStepper({ label, value, decrementLabel, incrementLabel, onDecrement, onIncrement }: BigStepperProps) {
  return (
    <View style={styles.big}>
      <Text style={styles.bigLabel}>{label}</Text>
      <Text style={styles.bigValue}>{value}</Text>
      <View style={styles.bigButtons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${decrementLabel}`}
          onPress={onDecrement}
          style={({ pressed }) => [styles.bigButton, pressed && styles.pressed]}
        >
          <Text style={styles.bigButtonLabel}>{decrementLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${incrementLabel}`}
          onPress={onIncrement}
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
