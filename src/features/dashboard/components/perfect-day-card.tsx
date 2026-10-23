import { StyleSheet, Text, View } from 'react-native';

import { formatDays, pluralUk } from '@/lib/format';
import { colors, fonts, radius, space, type } from '@/theme/theme';

import { BurningFlame } from './burning-flame';

type PerfectDayCardProps = {
  streak: number;
  best: number;
  /** Today is already perfect: the flame burns. */
  today: boolean;
};

export function PerfectDayCard({ streak, best, today }: PerfectDayCardProps) {
  const daysInRow = `${pluralUk(streak, ['день', 'дні', 'днів'])} поспіль`;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`Ідеальний день: ${streak} ${daysInRow}. Рекорд: ${formatDays(best)}${today ? '. Сьогодні все виконано' : ''}`}
    >
      <View style={styles.text}>
        <Text style={styles.title}>Ідеальний день</Text>
        <Text style={styles.description}>{'Усе виконано: тренування,\nзвички, їжа і сон'}</Text>
        <Text style={styles.best}>Рекорд: {formatDays(best)}</Text>
      </View>
      <View style={styles.value}>
        <BurningFlame size={48} burning={today} />
        <View style={styles.number}>
          <Text style={[type.display, styles.streak]}>{streak}</Text>
          <Text style={styles.best}>{daysInRow}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.hero,
    paddingVertical: space.lg,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: { gap: space.xs, flexShrink: 1 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
  description: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  best: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  value: { flexDirection: 'row', alignItems: 'center', gap: space.xs2 },
  number: { alignItems: 'flex-end' },
  streak: { color: colors.accent },
});
