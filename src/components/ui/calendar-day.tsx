import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, radius, sizes } from '@/theme/theme';

export type CalendarDayStatus = 'done' | 'missed' | 'planned' | 'empty';

const statusLabels: Record<CalendarDayStatus, string> = {
  done: 'виконано',
  missed: 'пропущено',
  planned: 'заплановано',
  empty: 'без тренування',
};

type CalendarDayProps = {
  day: number;
  status: CalendarDayStatus;
  today?: boolean;
  /** Empty past days are drawn in the main text color, future ones muted. */
  past?: boolean;
  selected?: boolean;
  onPress?: () => void;
};

/** Outline sits 2 px outside the 36 px day, as in docs/design/Calendar.dc.html. */
const OUTLINE_GAP = 2;
const OUTLINE_WIDTH = 2;
const OUTLINE_INSET = -(OUTLINE_GAP + OUTLINE_WIDTH);
const SPRING = { damping: 14, stiffness: 260, mass: 0.6 };

export function CalendarDay({ day, status, today = false, past = false, selected = false, onPress }: CalendarDayProps) {
  const reduceMotion = useReducedMotion();
  // 0 = not selected, 1 = selected: the frame springs in from a smaller, turned size and the day "pops".
  const progress = useSharedValue(selected ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = selected ? 1 : 0;
      return;
    }
    progress.value = selected ? withSpring(1, SPRING) : withTiming(0, { duration: 140 });
    if (selected) pop.value = withSequence(withTiming(0.86, { duration: 90 }), withSpring(1, SPRING));
  }, [selected, reduceMotion, progress, pop]);

  const frameStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + 0.4 * progress.value }, { rotate: `${(1 - progress.value) * -45}deg` }],
  }));
  const dayStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${day}, ${today ? 'сьогодні, ' : ''}${statusLabels[status]}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        hitSlop={(sizes.touch - sizes.calendarDay) / 2}
      >
        {today && <View style={[styles.outline, styles.todayOutline]} />}
        {/* Today already has an accent outline; selecting it thickens that outline instead of adding a second one. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.outline, today ? styles.selectedTodayOutline : styles.selectedOutline, frameStyle]}
        />
        <Animated.View style={[styles.day, dayStyles[status], dayStyle]}>
          <Text style={[labelStyles[status], status === 'empty' && past && styles.pastLabel]}>{day}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center' },
  day: {
    width: sizes.calendarDay,
    height: sizes.calendarDay,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastLabel: { color: colors.text },
  outline: {
    position: 'absolute',
    top: OUTLINE_INSET,
    left: OUTLINE_INSET,
    right: OUTLINE_INSET,
    bottom: OUTLINE_INSET,
    borderRadius: radius.chip + OUTLINE_GAP + OUTLINE_WIDTH,
  },
  todayOutline: { borderWidth: OUTLINE_WIDTH, borderColor: colors.accent },
  selectedOutline: { borderWidth: OUTLINE_WIDTH, borderColor: colors.text },
  selectedTodayOutline: { borderWidth: OUTLINE_WIDTH + 1, borderColor: colors.accent },
});

const dayStyles = StyleSheet.create({
  done: { backgroundColor: colors.successSoft },
  missed: { backgroundColor: colors.danger },
  planned: { backgroundColor: colors.accentSoft },
  empty: {},
});

const labelStyles = StyleSheet.create({
  done: { fontFamily: fonts.bold, fontSize: 14, color: colors.success },
  missed: { fontFamily: fonts.bold, fontSize: 14, color: colors.onAccent },
  planned: { fontFamily: fonts.bold, fontSize: 14, color: colors.accentPressed },
  empty: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
});
