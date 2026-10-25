import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, LinkRow, SleepDial } from '@/components/ui';
import { sleepDeltaMin, sleepDurationMin, type SleepWindow } from '@/domain/sleep';
import { fromDateKey, todayKey } from '@/lib/dates';
import { formatHoursMinutes, formatHoursMinutesLong, formatShortDate, formatTimeOfDay } from '@/lib/format';
import { colors, fonts, radius, sizes, space } from '@/theme/theme';

import { logSleep, saveSleepSchedule, type SleepData } from './sleep-repo';
import { SleepSheet } from './sleep-sheet';

function formatRange({ bedMin, wakeMin }: SleepWindow) {
  return `${formatTimeOfDay(bedMin)}–${formatTimeOfDay(wakeMin)}`;
}

/** "на 30 хв більше за план", "як у плані" */
function formatDelta(deltaMin: number) {
  if (deltaMin === 0) return 'як у плані';
  return `на ${formatHoursMinutesLong(Math.abs(deltaMin))} ${deltaMin > 0 ? 'більше' : 'менше'} за план`;
}

/** Profile block: planned vs last night on two 24-hour dials, logging a night and the desired schedule. */
export function SleepCard({ data }: { data: SleepData }) {
  const [sheet, setSheet] = useState<'log' | 'schedule' | null>(null);
  const today = todayKey();
  const { schedule, last } = data;
  const plannedMin = sleepDurationMin(schedule);
  const loggedToday = last?.date === today;
  // Today's night if already logged (to correct it), otherwise the plan as a starting point.
  const logInitial = last && loggedToday ? last : schedule;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Сон
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={loggedToday ? 'Змінити сон за сьогодні' : 'Додати сон'}
          onPress={() => setSheet('log')}
          style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
        >
          <Text style={styles.addLabel}>{loggedToday ? 'Змінити сон' : 'Додати сон'}</Text>
        </Pressable>
      </View>

      <View style={styles.dials}>
        <View style={styles.dialColumn}>
          <SleepDial
            arc={schedule}
            label={formatHoursMinutes(plannedMin)}
            caption={formatRange(schedule)}
            accessibilityLabel={`План: ${formatRange(schedule)}, ${formatHoursMinutesLong(plannedMin)}`}
          />
          <Text style={styles.dialTitle}>План</Text>
        </View>
        <View style={styles.dialColumn}>
          <SleepDial
            arc={last}
            backgroundArc={schedule}
            label={last ? formatHoursMinutes(sleepDurationMin(last)) : '—'}
            caption={last ? formatRange(last) : 'немає запису'}
            accessibilityLabel={
              last
                ? `Факт: ${formatRange(last)}, ${formatHoursMinutesLong(sleepDurationMin(last))}, ${formatDelta(sleepDeltaMin(last, schedule))}`
                : 'Факт: немає запису'
            }
          />
          <Text style={styles.dialTitle}>{last && !loggedToday ? `Факт, ${formatShortDate(fromDateKey(last.date))}` : 'Факт'}</Text>
          {last && <Text style={styles.delta}>{formatDelta(sleepDeltaMin(last, schedule))}</Text>}
        </View>
      </View>

      <View style={styles.divider}>
        <LinkRow title="Бажаний режим" value={formatRange(schedule)} onPress={() => setSheet('schedule')} />
      </View>

      <SleepSheet
        visible={sheet === 'log'}
        title="Сон"
        initial={logInitial}
        saveLabel="Зберегти"
        onSave={(value) => logSleep(today, value)}
        onClose={() => setSheet(null)}
      />
      <SleepSheet
        visible={sheet === 'schedule'}
        title="Бажаний режим"
        initial={schedule}
        saveLabel="Зберегти режим"
        onSave={saveSleepSchedule}
        onClose={() => setSheet(null)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: space.md2, paddingHorizontal: space.lg, paddingBottom: space.xs, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  add: {
    minHeight: sizes.touch,
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
  },
  addPressed: { backgroundColor: colors.accentPressed },
  addLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.onAccent },
  dials: { flexDirection: 'row', justifyContent: 'space-around' },
  dialColumn: { alignItems: 'center', gap: space.xs },
  dialTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  delta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
});
