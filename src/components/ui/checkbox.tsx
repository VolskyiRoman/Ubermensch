import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, sizes, space } from '@/theme/theme';

import { CheckIcon } from './icons';

type CheckboxProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  accessibilityLabel?: string;
};

export function Checkbox({ checked, onChange, label, accessibilityLabel }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => onChange?.(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked ? styles.boxChecked : styles.boxIdle]}>{checked && <CheckIcon />}</View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.touch,
    minWidth: sizes.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  box: {
    width: sizes.checkbox,
    height: sizes.checkbox,
    borderRadius: radius.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxIdle: { borderWidth: 2, borderColor: colors.inactive },
  boxChecked: { backgroundColor: colors.accent },
  label: { fontFamily: fonts.regular, fontSize: 13, color: colors.text },
});
