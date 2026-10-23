import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, TrophyIcon } from '@/components/ui';
import { fromDateKey } from '@/lib/dates';
import { formatDecimal, formatShortDate } from '@/lib/format';
import { colors, fonts, radius, sizes, space } from '@/theme/theme';

import type { LatestPr } from '../types';

type LatestPrCardProps = {
  pr: LatestPr;
  onShowAll: () => void;
};

export function LatestPrCard({ pr, onShowAll }: LatestPrCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.icon}>
        <TrophyIcon size={22} />
      </View>
      <View style={styles.text}>
        <Text style={styles.caption}>Останній рекорд · {formatShortDate(fromDateKey(pr.date))}</Text>
        <Text style={styles.title}>
          {pr.exercise} · {formatDecimal(pr.weightKg)} кг × {pr.reps}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Усі рекорди"
        onPress={onShowAll}
        style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
      >
        <Text style={styles.linkLabel}>Усі</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: space.md2,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  link: { minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'flex-end', justifyContent: 'center' },
  linkPressed: { opacity: 0.6 },
  linkLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.accent },
});
