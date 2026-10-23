import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { percentChange } from '@/domain/stats';
import { fromDateKey } from '@/lib/dates';
import { formatDeltaPercent, formatTonnes, formatWeekdayShort } from '@/lib/format';
import { colors, fonts, radius, space } from '@/theme/theme';

import { totalVolume } from '../selectors';
import type { DayVolume } from '../types';

const MAX_BAR_HEIGHT = 60;
const EMPTY_BAR_HEIGHT = 4;

type WeekVolumeCardProps = {
  days: DayVolume[];
  previousWeekVolumeKg: number;
};

export function WeekVolumeCard({ days, previousWeekVolumeKg }: WeekVolumeCardProps) {
  const total = totalVolume(days);
  const delta = percentChange(total, previousWeekVolumeKg);
  const max = Math.max(...days.map((d) => d.volumeKg), 1);
  const todayIndex = days.length - 1;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Об’єм за 7 днів</Text>
        <Text style={styles.summary}>
          <Text style={styles.total}>{formatTonnes(total)}</Text>
          {delta !== null && ` · ${formatDeltaPercent(delta)}`}
        </Text>
      </View>
      <View style={styles.bars}>
        {days.map((day, i) => {
          const isToday = i === todayIndex;
          const isBest = day.volumeKg === max && day.volumeKg > 0;
          return (
            <View
              key={day.date}
              style={styles.column}
              accessible
              accessibilityLabel={`${formatWeekdayShort(fromDateKey(day.date))}: ${formatTonnes(day.volumeKg)}`}
            >
              <View
                style={[
                  styles.bar,
                  day.volumeKg > 0
                    ? {
                        height: (day.volumeKg / max) * MAX_BAR_HEIGHT,
                        backgroundColor: isBest ? colors.text : colors.accent,
                      }
                    : { height: EMPTY_BAR_HEIGHT, backgroundColor: colors.track },
                ]}
              />
              <Text style={[styles.day, isToday && styles.today]}>{formatWeekdayShort(fromDateKey(day.date))}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  summary: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  total: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm2 },
  column: { flex: 1, alignItems: 'center', gap: space.xs2 },
  bar: { alignSelf: 'stretch', borderRadius: radius.bar },
  day: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  today: { fontFamily: fonts.bold, color: colors.text },
});
