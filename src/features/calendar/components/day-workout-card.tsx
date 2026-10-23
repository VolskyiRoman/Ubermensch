import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, PencilIcon } from '@/components/ui';
import { describeExercises } from '@/domain/stats';
import { formatHoursMinutes, formatTonnes, pluralUk } from '@/lib/format';
import { colors, fonts, radius, sizes, space } from '@/theme/theme';

import type { CalendarWorkout } from '../load-calendar';

type DayWorkoutCardProps = {
  workout: CalendarWorkout;
  isToday: boolean;
  onEdit: () => void;
};

function exerciseCount(n: number) {
  return `${n} ${pluralUk(n, ['вправа', 'вправи', 'вправ'])}`;
}

function describe(workout: CalendarWorkout, isToday: boolean) {
  switch (workout.status) {
    case 'completed':
      return {
        status: 'ВИКОНАНО',
        statusColor: colors.success,
        meta: [
          workout.durationMin !== null ? `тривалість ${formatHoursMinutes(workout.durationMin)}` : null,
          `об’єм ${formatTonnes(workout.volumeKg)}`,
        ]
          .filter(Boolean)
          .join(' · '),
        body: describeExercises(workout.exercises),
      };
    case 'missed':
      return {
        status: 'ПРОПУЩЕНО',
        statusColor: colors.dangerText,
        meta: 'тренування не запускали',
        body: 'Можна перенести на інший день',
      };
    case 'in_progress':
      return {
        status: 'ТРИВАЄ',
        statusColor: colors.accent,
        meta: exerciseCount(workout.exercises.length),
        body: describeExercises(workout.exercises),
      };
    case 'planned':
      return {
        status: isToday ? 'ЗАПЛАНОВАНО НА СЬОГОДНІ' : 'ЗАПЛАНОВАНО',
        statusColor: colors.accent,
        meta: [
          workout.templateName ? `Шаблон «${workout.templateName}»` : null,
          exerciseCount(workout.exercises.length),
          workout.estimatedMin > 0 ? `~${workout.estimatedMin} хв` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        body: describeExercises(workout.exercises),
      };
  }
}

export function DayWorkoutCard({ workout, isToday, onEdit }: DayWorkoutCardProps) {
  const { status, statusColor, meta, body } = describe(workout, isToday);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.text}>
          <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
          <Text style={styles.name}>{workout.name}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        {(workout.status === 'planned' || workout.status === 'missed') && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Редагувати тренування"
            onPress={onEdit}
            hitSlop={4}
            style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
          >
            <PencilIcon />
          </Pressable>
        )}
      </View>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  text: { flex: 1, gap: space.xxs },
  status: { fontFamily: fonts.bold, fontSize: 12 },
  name: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  edit: {
    width: sizes.calendarDay,
    height: sizes.calendarDay,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.divider },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.text },
});
