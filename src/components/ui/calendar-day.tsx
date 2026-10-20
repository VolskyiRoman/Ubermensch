import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  onPress?: () => void;
};

const OUTLINE_OFFSET = 4;

export function CalendarDay({ day, status, today = false, onPress }: CalendarDayProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day}, ${today ? 'сьогодні, ' : ''}${statusLabels[status]}`}
      onPress={onPress}
      hitSlop={OUTLINE_OFFSET}
      style={[styles.day, dayStyles[status]]}
    >
      {today && <View style={styles.todayOutline} />}
      <Text style={labelStyles[status]}>{day}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  day: {
    width: sizes.calendarDay,
    height: sizes.calendarDay,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayOutline: {
    position: 'absolute',
    top: -OUTLINE_OFFSET,
    left: -OUTLINE_OFFSET,
    right: -OUTLINE_OFFSET,
    bottom: -OUTLINE_OFFSET,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.button,
  },
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
