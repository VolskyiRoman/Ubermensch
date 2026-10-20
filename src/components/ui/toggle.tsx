import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, space } from '@/theme/theme';

type ToggleProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  accessibilityLabel: string;
};

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const KNOB = 22;
const INSET = 3;

export function Toggle({ value, onValueChange, accessibilityLabel }: ToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onValueChange?.(!value)}
      hitSlop={space.sm}
      style={[styles.track, { backgroundColor: value ? colors.accent : colors.inactive }]}
    >
      <View style={[styles.knob, { left: value ? TRACK_WIDTH - KNOB - INSET : INSET }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
  },
  knob: {
    position: 'absolute',
    top: INSET,
    width: KNOB,
    height: KNOB,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});
