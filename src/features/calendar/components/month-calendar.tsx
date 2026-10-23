import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackIcon, CalendarDay, Card, ForwardIcon, type CalendarDayStatus } from '@/components/ui';
import { fromDateKey, monthGrid } from '@/lib/dates';
import { formatMonthYear } from '@/lib/format';
import { colors, fonts, radius, sizes, space } from '@/theme/theme';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const legend: { label: string; swatch: object }[] = [
  { label: 'Виконано', swatch: { backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.successBorder } },
  { label: 'Заплановано', swatch: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accentMid } },
  { label: 'Пропущено', swatch: { backgroundColor: colors.danger } },
  { label: 'Сьогодні', swatch: { borderWidth: 2, borderColor: colors.accent } },
];

type MonthCalendarProps = {
  year: number;
  month: number;
  today: string;
  selected: string;
  statuses: Map<string, CalendarDayStatus>;
  onSelect: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  showLegend?: boolean;
};

export function MonthCalendar({
  year,
  month,
  today,
  selected,
  statuses,
  onSelect,
  onPrevMonth,
  onNextMonth,
  showLegend = true,
}: MonthCalendarProps) {
  const cells = monthGrid(year, month);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <MonthButton label="Попередній місяць" onPress={onPrevMonth}>
          <BackIcon size={16} />
        </MonthButton>
        <Text style={styles.month} accessibilityRole="header">
          {formatMonthYear(year, month)}
        </Text>
        <MonthButton label="Наступний місяць" onPress={onNextMonth}>
          <ForwardIcon size={16} />
        </MonthButton>
      </View>

      {/* Explicit week rows with flex: 1 cells: percentage widths can round past 100% and push Sunday out. */}
      <View style={styles.grid}>
        <View style={styles.week}>
          {WEEKDAYS.map((w) => (
            <View key={w} style={styles.cell}>
              <Text style={styles.weekday}>{w}</Text>
            </View>
          ))}
        </View>
        {weeks.map((week, row) => (
          <View key={row} style={styles.week}>
            {week.map((date, i) => (
              <View key={date ?? `blank-${row}-${i}`} style={[styles.cell, styles.dayCell]}>
                {date && (
                  <CalendarDay
                    day={fromDateKey(date).getDate()}
                    status={statuses.get(date) ?? 'empty'}
                    today={date === today}
                    past={date < today}
                    selected={date === selected}
                    onPress={() => onSelect(date)}
                  />
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      {showLegend && (
        <View style={styles.legend}>
          {legend.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.swatch, item.swatch]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function MonthButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: space.md2, paddingHorizontal: space.md, gap: space.sm2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xs },
  month: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  monthButton: {
    width: sizes.calendarDay,
    height: sizes.calendarDay,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.divider },
  grid: { gap: space.xs },
  week: { flexDirection: 'row' },
  cell: { flex: 1, minWidth: 0, alignItems: 'center' },
  dayCell: { height: sizes.touch, justifyContent: 'center' },
  weekday: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted, paddingVertical: space.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md, paddingTop: space.xxs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 12, height: 12, borderRadius: radius.bar },
  legendLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
});
