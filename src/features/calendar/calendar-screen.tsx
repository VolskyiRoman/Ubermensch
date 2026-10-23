import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, IconButton, PlusIcon, type CalendarDayStatus } from '@/components/ui';
import { useDbQuery } from '@/db/use-db-query';
import { fromDateKey, monthKey, todayKey } from '@/lib/dates';
import { formatDayTitle } from '@/lib/format';
import { colors, fonts, screenPadding, space } from '@/theme/theme';

import { DayWorkoutCard } from './components/day-workout-card';
import { MonthCalendar } from './components/month-calendar';
import { RestDayCard } from './components/rest-day-card';
import { loadCalendarMonth, type CalendarWorkout } from './load-calendar';

const dayStatus: Record<CalendarWorkout['status'], CalendarDayStatus> = {
  completed: 'done',
  missed: 'missed',
  planned: 'planned',
  in_progress: 'planned',
};

function openPlan(params: { id?: string; date?: string }) {
  router.push({ pathname: '/workout/plan', params });
}

export function CalendarScreen() {
  const today = todayKey();
  const [visible, setVisible] = useState(() => {
    const d = fromDateKey(today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  const { data: monthWorkouts = [] } = useDbQuery(
    () => loadCalendarMonth(visible.year, visible.month),
    [visible.year, visible.month],
  );

  const statuses = new Map<string, CalendarDayStatus>();
  for (const w of monthWorkouts) if (!statuses.has(w.date)) statuses.set(w.date, dayStatus[w.status]);
  const selectedWorkout = monthWorkouts.find((w) => w.date === selected);

  const shiftMonth = (delta: number) => {
    const first = fromDateKey(monthKey(visible.year, visible.month + delta));
    const next = { year: first.getFullYear(), month: first.getMonth() };
    setVisible(next);
    const t = fromDateKey(today);
    const isCurrentMonth = t.getFullYear() === next.year && t.getMonth() === next.month;
    setSelected(isCurrentMonth ? today : monthKey(next.year, next.month));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="h1" accessibilityRole="header">
            Календар
          </AppText>
          <IconButton accessibilityLabel="Призначити тренування" onPress={() => openPlan({ date: selected })}>
            <PlusIcon color={colors.onAccent} />
          </IconButton>
        </View>

        <MonthCalendar
          year={visible.year}
          month={visible.month}
          today={today}
          selected={selected}
          statuses={statuses}
          onSelect={setSelected}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
        />

        {/* Re-keyed on every selection so the day's details slide in. */}
        <Animated.View key={selected} entering={FadeInDown.duration(220)} style={styles.day}>
          <Text style={styles.dayTitle}>{formatDayTitle(fromDateKey(selected), selected === today)}</Text>
          {selectedWorkout ? (
            <DayWorkoutCard
              workout={selectedWorkout}
              isToday={selected === today}
              onEdit={() => openPlan({ id: String(selectedWorkout.id) })}
            />
          ) : (
            <RestDayCard onSchedule={() => openPlan({ date: selected })} />
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  day: { gap: space.md },
  dayTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
    paddingTop: space.xs,
    paddingHorizontal: space.xs,
  },
});
