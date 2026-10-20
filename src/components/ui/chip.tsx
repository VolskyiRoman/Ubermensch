import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme/theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [styles.chip, selected ? styles.chipSelected : styles.chipIdle, pressed && styles.pressed]}
    >
      <Text style={selected ? styles.chipLabelSelected : styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

type TagProps = {
  label: string;
  variant?: 'superset' | 'neutral';
};

export function Tag({ label, variant = 'neutral' }: TagProps) {
  return (
    <View style={[styles.tag, variant === 'superset' ? styles.tagSuperset : styles.tagNeutral]}>
      <Text style={variant === 'superset' ? styles.tagLabelSuperset : styles.tagLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.chip,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  chipSelected: { backgroundColor: colors.text, borderWidth: 1, borderColor: colors.text },
  chipIdle: { borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.7 },
  chipLabelSelected: { fontFamily: fonts.bold, fontSize: 13, color: colors.onAccent },
  chipLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.tag,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  tagSuperset: { backgroundColor: colors.accentSoft },
  tagNeutral: { backgroundColor: colors.bg },
  tagLabelSuperset: { fontFamily: fonts.semibold, fontSize: 12, color: colors.accentPressed },
  tagLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.text },
});
