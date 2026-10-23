import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pluralUk } from '@/lib/format';
import { colors, fonts, radius, sizes, space } from '@/theme/theme';

import type { TodayWorkout } from '../types';

type TodayWorkoutCardProps = {
  workout: TodayWorkout;
  onStart: () => void;
};

export function DashboardWorkoutCard({ workout, onStart }: TodayWorkoutCardProps) {
  const meta = [
    `${workout.exerciseCount} ${pluralUk(workout.exerciseCount, ['вправа', 'вправи', 'вправ'])}`,
    workout.supersetCount > 0
      ? `${workout.supersetCount} ${pluralUk(workout.supersetCount, ['суперсет', 'суперсети', 'суперсетів'])}`
      : null,
    `~${workout.estimatedMin} хв`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.text}>
          <Text style={styles.caption}>{workout.inProgress ? 'Тренування триває' : 'Тренування сьогодні'}</Text>
          <Text style={styles.title}>{workout.name}</Text>
          <Text style={styles.caption}>{meta}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{workout.done ? '1/1' : '0/1'}</Text>
        </View>
      </View>
      {!workout.done && (
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>{workout.inProgress ? 'Продовжити тренування' : 'Почати тренування'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.text,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  text: { gap: space.xxs, flexShrink: 1 },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textOnDarkMuted },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.onAccent },
  badge: {
    borderWidth: 1,
    borderColor: colors.borderOnDark,
    borderRadius: radius.tag,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  badgeLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.onAccent },
  button: {
    minHeight: sizes.touch,
    backgroundColor: colors.accent,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: colors.accentPressed },
  buttonLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.onAccent },
});
