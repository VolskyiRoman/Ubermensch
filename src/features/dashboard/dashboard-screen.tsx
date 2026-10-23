import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, CategoryStatCard, StatCard } from '@/components/ui';
import { fromDateKey } from '@/lib/dates';
import { formatLongDate, formatTonnes } from '@/lib/format';
import { colors, screenPadding, space } from '@/theme/theme';

import { DayStatsCard } from './components/day-stats-card';
import { LatestPrCard } from './components/latest-pr-card';
import { PerfectDayCard } from './components/perfect-day-card';
import { DashboardWorkoutCard } from './components/today-workout-card';
import { WeekVolumeCard } from './components/week-volume-card';
import { startWorkout } from '../workout/session';
import { categoryProgress, isPerfectDay } from './selectors';
import type { DailyCategory } from './types';
import { useDashboard } from './use-dashboard';

const categories: { key: DailyCategory; label: string; color: string }[] = [
  { key: 'workout', label: 'Тренування', color: colors.catWorkout },
  { key: 'habit', label: 'Звички', color: colors.catHabit },
  { key: 'food', label: 'Їжа', color: colors.catFood },
  { key: 'sleep', label: 'Сон', color: colors.catSleep },
];

export function DashboardScreen() {
  const { data } = useDashboard();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {data && (
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h1Date" accessibilityRole="header">
          {formatLongDate(fromDateKey(data.today))}
        </AppText>

        <PerfectDayCard
          streak={data.perfectDayStreak}
          best={data.perfectDayBest}
          today={isPerfectDay(data.dailyItems)}
        />

        <DayStatsCard items={data.dailyItems} />

        <View style={styles.grid}>
          {categories.map((c) => {
            const { done, total } = categoryProgress(data.dailyItems, c.key);
            return (
              <View key={c.key} style={styles.gridCell}>
                <CategoryStatCard
                  label={c.label}
                  color={c.color}
                  value={total > 0 ? `${done}/${total}` : '—'}
                  streak={data.categoryStreaks[c.key]}
                  showFlame
                />
              </View>
            );
          })}
        </View>

        {data.todayWorkout && (
          <DashboardWorkoutCard
            workout={data.todayWorkout}
            onStart={() => {
              startWorkout(data.todayWorkout!.id);
              router.push('/workout/active');
            }}
          />
        )}

        <WeekVolumeCard days={data.weekVolume} previousWeekVolumeKg={data.previousWeekVolumeKg} />

        {data.latestPr && <LatestPrCard pr={data.latestPr} onShowAll={() => router.navigate('/progress')} />}

        <View style={styles.totals}>
          <StatCard value={String(data.totals.workouts)} label="тренування" />
          <StatCard value={`${data.totals.avgDurationMin} хв`} label="в середньому" />
          <StatCard value={formatTonnes(data.totals.volumeKg)} label="піднято всього" />
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  gridCell: { width: '48%', flexGrow: 1, flexDirection: 'row' },
  totals: { flexDirection: 'row', gap: space.sm },
});
