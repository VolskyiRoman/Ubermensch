import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, space } from '@/theme/theme';

import { FlameIcon } from './icons';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type StreakCardProps = {
  title: string;
  subtitle: string;
  value: number;
};

/** Hero streak card, e.g. "Ідеальний день". */
export function StreakCard({ title, subtitle, value }: StreakCardProps) {
  return (
    <View style={styles.streak} accessible accessibilityLabel={`${title}, ${value}. ${subtitle}`}>
      <View style={styles.streakText}>
        <Text style={styles.streakTitle}>{title}</Text>
        <Text style={styles.streakSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.streakValue}>
        <FlameIcon size={32} />
        <Text style={styles.streakNumber}>{value}</Text>
      </View>
    </View>
  );
}

type CategoryStatCardProps = {
  label: string;
  color: string;
  value: string;
  streak: number;
};

export function CategoryStatCard({ label, color, value, streak }: CategoryStatCardProps) {
  return (
    <View style={styles.category}>
      <View style={styles.categoryHeader}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.categoryLabel}>{label}</Text>
      </View>
      <View style={styles.categoryFooter}>
        <Text style={styles.categoryValue}>{value}</Text>
        <Text style={styles.categoryStreak}>{streak}</Text>
      </View>
    </View>
  );
}

type StatCardProps = {
  value: string;
  label: string;
};

export function StatCard({ value, label }: StatCardProps) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type TodayWorkoutCardProps = {
  caption: string;
  title: string;
  actionLabel: string;
  onPress?: () => void;
};

export function TodayWorkoutCard({ caption, title, actionLabel, onPress }: TodayWorkoutCardProps) {
  return (
    <View style={styles.today}>
      <View>
        <Text style={styles.todayCaption}>{caption}</Text>
        <Text style={styles.todayTitle}>{title}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel}: ${title}`}
        onPress={onPress}
        hitSlop={6}
        style={({ pressed }) => [styles.todayAction, pressed && styles.todayActionPressed]}
      >
        <Text style={styles.todayActionLabel}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

type SetTimerProps = {
  label: string;
  time: string;
};

/** Dark card with the running set time. */
export function SetTimer({ label, time }: SetTimerProps) {
  return (
    <View style={styles.setTimer} accessible accessibilityRole="timer" accessibilityLabel={`${label}, ${time}`}>
      <Text style={styles.setTimerLabel}>{label}</Text>
      <Text style={styles.setTimerTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.xl,
  },
  streak: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.hero,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakText: { gap: space.xxs },
  streakTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
  streakSubtitle: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  streakValue: { flexDirection: 'row', alignItems: 'center', gap: space.xs2 },
  streakNumber: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 44, color: colors.accent },
  category: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardSmall,
    paddingVertical: space.md,
    paddingHorizontal: space.md2,
    gap: space.xs2,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: space.xs2 },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  categoryLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  categoryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  categoryValue: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 26, color: colors.text },
  categoryStreak: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardSmall,
    padding: space.md,
    gap: space.xxs,
  },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  today: {
    backgroundColor: colors.text,
    borderRadius: radius.card,
    paddingVertical: space.md2,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayCaption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textOnDarkMuted },
  todayTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.onAccent },
  todayAction: {
    backgroundColor: colors.accent,
    borderRadius: radius.chip,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  todayActionPressed: { backgroundColor: colors.accentPressed },
  todayActionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.onAccent },
  setTimer: {
    backgroundColor: colors.text,
    borderRadius: radius.panel,
    paddingVertical: space.md2,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    gap: space.xxs,
  },
  setTimerLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.accentOnDark },
  setTimerTime: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 38, color: colors.onAccent },
});
