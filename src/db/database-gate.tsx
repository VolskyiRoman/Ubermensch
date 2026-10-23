import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { refreshWorkoutReminders } from '@/features/plan/plan-repo';
import { todayKey } from '@/lib/dates';
import { colors, screenPadding, space } from '@/theme/theme';

import { db } from './client';
import migrations from './migrations/migrations';
import { markMissedWorkouts, seedDefaults } from './seed';

type SetupState = { status: 'pending' } | { status: 'ready' } | { status: 'failed'; error: Error };

/** Runs migrations and the launch-time housekeeping before rendering the app. */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const [setup, setSetup] = useState<SetupState>({ status: 'pending' });

  useEffect(() => {
    migrate(db, migrations)
      .then(() => {
        seedDefaults();
        markMissedWorkouts(todayKey());
        void refreshWorkoutReminders();
        setSetup({ status: 'ready' });
      })
      .catch((error: Error) => setSetup({ status: 'failed', error }));

    // The day may change while the app is in the background.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') markMissedWorkouts(todayKey());
    });
    return () => subscription.remove();
  }, []);

  if (setup.status === 'failed') {
    return (
      <View style={styles.error}>
        <AppText variant="h2">Не вдалося відкрити базу даних</AppText>
        <AppText variant="secondary">{setup.error.message}</AppText>
      </View>
    );
  }

  return setup.status === 'ready' ? children : null;
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: 'center', padding: screenPadding, gap: space.sm, backgroundColor: colors.bg },
});
