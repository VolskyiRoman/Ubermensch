import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card, DownloadIcon, LineChart, LinkRow, Stepper, Toggle } from '@/components/ui';
import { saveSetting } from '@/db/settings';
import { useDbQuery } from '@/db/use-db-query';
import { REST_STEP_SEC } from '@/domain/workout-flow';
import { addDays, fromDateKey, todayKey } from '@/lib/dates';
import { formatClock, formatDecimal, formatMonthName } from '@/lib/format';
import { cancelAllNotifications, ensureNotificationPermission } from '@/lib/notifications';
import { colors, fonts, radius, screenPadding, sizes, space } from '@/theme/theme';

import { refreshWorkoutReminders } from '../plan/plan-repo';
import { SleepCard } from '../sleep/sleep-card';
import { resetActiveWorkout } from '../workout/active-workout-store';
import { BodyWeightSheet } from './body-weight-sheet';
import { exportCsv } from './export-csv';
import { loadProfile, resetAllData, type ProfileData } from './profile-repo';

const MIN_REST_SEC = 15;
const MAX_REST_SEC = 600;

export function ProfileScreen() {
  const { data } = useDbQuery(() => loadProfile(todayKey()), []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h1" accessibilityRole="header">
          Профіль
        </AppText>
        {data && <ProfileContent data={data} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileContent({ data }: { data: ProfileData }) {
  const [exporting, setExporting] = useState(false);
  const { settings } = data;

  const setRest = (sec: number) => saveSetting('default_rest_sec', Math.min(MAX_REST_SEC, Math.max(MIN_REST_SEC, sec)));

  const setNotification = async (key: 'notif_rest' | 'notif_workout_day', value: boolean) => {
    saveSetting(key, value);
    if (value && !(await ensureNotificationPermission())) {
      Alert.alert('Сповіщення вимкнені', 'Дозволь сповіщення для застосунку в налаштуваннях телефона.');
    }
    if (key === 'notif_workout_day') void refreshWorkoutReminders();
  };

  const confirmReset = () => {
    Alert.alert(
      'Скинути всі дані?',
      'Тренування, шаблони, звички, сон, вага тіла і налаштування будуть видалені назавжди. Це не можна скасувати.',
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Скинути',
          style: 'destructive',
          onPress: () => {
            resetActiveWorkout();
            resetAllData();
            void cancelAllNotifications();
          },
        },
      ],
    );
  };

  const runExport = async () => {
    setExporting(true);
    try {
      await exportCsv();
    } catch (e) {
      Alert.alert('Не вдалося експортувати', (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <BodyWeightCard data={data} />
      <SleepCard data={data.sleep} />

      <Card style={styles.listCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Відпочинок за замовчуванням</Text>
            <Text style={styles.settingSub}>для нових вправ</Text>
          </View>
          <Stepper
            accessibilityLabel="Відпочинок за замовчуванням, крок 15 секунд"
            value={formatClock(settings.defaultRestSec)}
            onDecrement={() => setRest(settings.defaultRestSec - REST_STEP_SEC)}
            onIncrement={() => setRest(settings.defaultRestSec + REST_STEP_SEC)}
          />
        </View>
        <View style={[styles.settingRow, styles.divider]}>
          <Text style={[styles.settingTitle, styles.settingText]}>Сповіщення таймера відпочинку</Text>
          <Toggle
            value={settings.notifRest}
            onValueChange={(v) => void setNotification('notif_rest', v)}
            accessibilityLabel="Сповіщення таймера відпочинку"
          />
        </View>
        <View style={[styles.settingRow, styles.divider]}>
          <Text style={[styles.settingTitle, styles.settingText]}>Нагадування в день тренування</Text>
          <Toggle
            value={settings.notifWorkoutDay}
            onValueChange={(v) => void setNotification('notif_workout_day', v)}
            accessibilityLabel="Нагадування в день тренування"
          />
        </View>
      </Card>

      <Card style={styles.listCard}>
        <LinkRow title="Шаблони тренувань" value={String(data.templateCount)} onPress={() => router.push('/templates')} />
        <LinkRow title="Бібліотека вправ" value={String(data.exerciseCount)} onPress={() => router.push('/exercises')} divider />
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: exporting, disabled: exporting }}
        disabled={exporting}
        onPress={() => void runExport()}
        style={({ pressed }) => [styles.export, (pressed || exporting) && styles.exportPressed]}
      >
        <DownloadIcon />
        <Text style={styles.exportLabel}>Експорт даних у CSV</Text>
      </Pressable>
      <Text style={styles.footnote}>Усі дані зберігаються лише на цьому телефоні</Text>

      <Pressable
        accessibilityRole="button"
        onPress={confirmReset}
        style={({ pressed }) => [styles.reset, pressed && styles.resetPressed]}
      >
        <Text style={styles.resetLabel}>Скинути всі дані</Text>
      </Pressable>
    </>
  );
}

function BodyWeightCard({ data }: { data: ProfileData }) {
  const [width, setWidth] = useState(0);
  const [logging, setLogging] = useState(false);
  const today = todayKey();
  const months = [3, 2, 1, 0].map((n) => {
    const d = fromDateKey(addDays(today, -n * 30));
    return formatMonthName(d.getMonth());
  });

  return (
    <Card style={styles.weightCard}>
      <View style={styles.weightHeader}>
        <View style={styles.weightText}>
          <Text style={styles.settingSub}>Вага тіла</Text>
          {data.latest === null ? (
            <Text style={styles.empty}>Ще немає записів</Text>
          ) : (
            <View style={styles.weightValueRow}>
              <Text style={styles.weightValue}>{formatDecimal(data.latest)} кг</Text>
              {data.delta !== null && (
                <Text style={styles.weightDelta}>
                  {data.delta > 0 ? '+' : data.delta < 0 ? '−' : ''}
                  {formatDecimal(Math.abs(data.delta))} за 3 міс
                </Text>
              )}
            </View>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Записати вагу тіла"
          onPress={() => setLogging(true)}
          style={({ pressed }) => [styles.log, pressed && styles.logPressed]}
        >
          <Text style={styles.logLabel}>Записати</Text>
        </Pressable>
      </View>
      {data.weights.length > 0 && (
        <>
          <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {width > 0 && (
              <LineChart
                values={data.weights.map((w) => w.weightKg)}
                width={width}
                height={110}
                color={colors.text}
                accessibilityLabel={`Вага тіла: з ${formatDecimal(data.weights[0].weightKg)} до ${formatDecimal(data.weights[data.weights.length - 1].weightKg)} кг`}
              />
            )}
          </View>
          <View style={styles.months}>
            {months.map((m, i) => (
              <Text key={i} style={styles.monthLabel}>
                {m}
              </Text>
            ))}
          </View>
        </>
      )}
      <BodyWeightSheet visible={logging} onClose={() => setLogging(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md },
  weightCard: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.sm2 },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weightText: { gap: space.xxs, flexShrink: 1 },
  weightValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  weightValue: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text },
  weightDelta: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  empty: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  log: {
    minHeight: sizes.touch,
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.chip,
    paddingHorizontal: space.md,
  },
  logPressed: { backgroundColor: colors.accentPressed },
  logLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.onAccent },
  months: { flexDirection: 'row', justifyContent: 'space-between' },
  monthLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  listCard: { paddingVertical: space.xs, paddingHorizontal: space.lg },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 58, gap: space.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  settingText: { flex: 1 },
  settingTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  settingSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  export: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 52,
    borderWidth: 1,
    borderColor: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
  },
  exportPressed: { backgroundColor: colors.divider },
  exportLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  reset: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touch,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.button,
    marginTop: space.md,
  },
  resetPressed: { backgroundColor: colors.divider },
  resetLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.dangerText },
  footnote: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
