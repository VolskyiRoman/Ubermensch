import { StyleSheet, Text, View } from 'react-native';

import { Card, Donut } from '@/components/ui';
import { joinUk } from '@/lib/format';
import { colors, fonts, space } from '@/theme/theme';

import { remainingItems } from '../selectors';
import type { DailyCategory, DailyItem } from '../types';

const categoryColors: Record<DailyCategory, string> = {
  workout: colors.catWorkout,
  habit: colors.catHabit,
  food: colors.catFood,
  sleep: colors.catSleep,
};

type DayStatsCardProps = {
  items: DailyItem[];
};

export function DayStatsCard({ items }: DayStatsCardProps) {
  const remaining = remainingItems(items);
  const done = items.length - remaining.length;

  return (
    <Card style={styles.card}>
      <Donut
        size={140}
        label={`${done}/${items.length}`}
        caption="виконано"
        labelSize={30}
        accessibilityLabel={`Виконано ${done} з ${items.length} пунктів дня`}
        segments={items.map((item) => ({ color: categoryColors[item.category], done: item.done }))}
      />
      <View style={styles.text}>
        <Text style={styles.title}>Статистика дня</Text>
        {items.length === 0 ? (
          <Text style={styles.remaining}>На сьогодні нічого не заплановано</Text>
        ) : remaining.length > 0 ? (
          <>
            <Text style={styles.remaining}>Залишилось: {joinUk(remaining.map((item) => item.title))}</Text>
            <Text style={styles.toGo}>Ще {remaining.length} до ідеального дня</Text>
          </>
        ) : (
          <Text style={styles.toGo}>Ідеальний день</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  text: { flex: 1, gap: space.xs2 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  remaining: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  toGo: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent },
});
