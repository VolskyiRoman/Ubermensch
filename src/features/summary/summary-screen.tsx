import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomBar, Button, Card, FlameIcon, RecordRow } from '@/components/ui';
import { useDbQuery } from '@/db/use-db-query';
import type { RecordEvent } from '@/domain/records';
import { fromDateKey, todayKey } from '@/lib/dates';
import {
  formatClock,
  formatDecimal,
  formatDeltaPercent,
  formatDuration,
  formatHoursMinutes,
  formatLongDateLower,
  formatSetList,
  formatShortDate,
  formatThousands,
} from '@/lib/format';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

import { saveWorkoutNote } from '../workout/session';
import { createTemplateFromWorkout, loadSummary, type PlanRow, type SummaryData } from './load-summary';

function recordText(r: RecordEvent) {
  switch (r.kind) {
    case 'maxWeight':
      return { subtitle: 'максимальна вага', value: `${formatDecimal(r.weightKg)} кг × ${r.reps}` };
    case 'oneRepMax':
      return { subtitle: `розрах. 1ПМ, було ${Math.round(r.previous)}`, value: `${Math.round(r.value)} кг` };
    case 'reps':
      return { subtitle: `найбільше повторів, було ${r.previous}`, value: `${formatDecimal(r.weightKg)} кг × ${r.reps}` };
    case 'volume':
      return { subtitle: `об’єм за тренування, було ${formatThousands(r.previous)}`, value: `${formatThousands(r.value)} кг` };
  }
}

/** good > 0 is an improvement; returns the delta color. */
function deltaColor(good: number) {
  return good > 0 ? colors.growth : good < 0 ? colors.dangerText : colors.textMuted;
}

function signed(n: number, unit = '') {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}${unit}`;
}

export function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const { data } = useDbQuery(() => loadSummary(workoutId, todayKey()), [workoutId]);

  const close = () => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {data ? <SummaryContent data={data} onDone={close} /> : <View style={styles.screen} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryContent({ data, onDone }: { data: SummaryData; onDone: () => void }) {
  const [note, setNote] = useState(data.notes ?? '');
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const { stats, streak, comparison } = data;

  const metrics = [
    {
      label: 'Тривалість',
      value: formatDuration(stats.durationSec),
      sub: `активно ${formatDuration(stats.activeSec)} · відпочинок ${formatDuration(stats.restSec)}`,
    },
    { label: 'Об’єм', value: `${formatThousands(stats.volumeKg)} кг`, sub: 'без розминкових підходів' },
    {
      label: 'Підходи',
      value: String(stats.sets),
      sub: stats.warmupSec > 0 ? `розминка ${formatClock(stats.warmupSec)}` : 'без розминки',
    },
    {
      label: 'Повтори',
      value: String(stats.reps),
      sub: stats.sets > 0 ? `в середньому ${Math.round(stats.reps / stats.sets)} за підхід` : '—',
    },
    {
      label: 'Вправи',
      value: String(stats.exercises),
      sub: stats.supersetExercises > 0 ? `з них ${stats.supersetExercises} у суперсеті` : 'без суперсетів',
    },
    { label: 'Щільність', value: `${stats.densityKgPerMin} кг/хв`, sub: 'об’єм за хвилину' },
  ];

  const finish = () => {
    saveWorkoutNote(data.id, note);
    onDone();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleBlock}>
          <Text style={styles.caption}>
            {data.name} · {formatLongDateLower(fromDateKey(data.date))}
          </Text>
          <Text style={styles.title} accessibilityRole="header">
            Тренування завершено
          </Text>
        </View>

        <View style={styles.streak} accessible accessibilityLabel={`Стрік тренувань: ${streak.current}`}>
          <FlameIcon size={44} />
          <View style={styles.streakText}>
            <Text style={styles.streakTitle}>Стрік тренувань +1</Text>
            <Text style={styles.streakSub}>
              {streak.current >= streak.best ? 'це твій рекорд' : `до рекорду лишилось ${streak.best - streak.current}`}
            </Text>
          </View>
          <Text style={styles.streakValue}>{streak.current}</Text>
        </View>

        <View style={styles.grid}>
          {metrics.map((m) => (
            <View key={m.label} style={styles.metric}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricSub}>{m.sub}</Text>
            </View>
          ))}
        </View>

        {stats.restActualAvgSec !== null && stats.restPlannedAvgSec !== null && (
          <RestCard actual={stats.restActualAvgSec} planned={stats.restPlannedAvgSec} />
        )}

        {comparison && (
          <Card style={styles.listCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Порівняно з минулим разом</Text>
              <Text style={styles.cardMeta}>{formatShortDate(fromDateKey(comparison.date))}</Text>
            </View>
            <CompareRow
              label="Об’єм"
              was={formatThousands(comparison.previous.volumeKg)}
              now={`${formatThousands(stats.volumeKg)} кг`}
              delta={comparison.change.volumePercent === null ? '—' : formatDeltaPercent(comparison.change.volumePercent)}
              color={deltaColor(comparison.change.volumePercent ?? 0)}
            />
            <CompareRow
              label="Тривалість"
              was={formatHoursMinutes(Math.round(comparison.previous.durationSec / 60))}
              now={formatHoursMinutes(Math.round(stats.durationSec / 60))}
              delta={signed(comparison.change.durationDeltaMin, ' хв')}
              color={deltaColor(-comparison.change.durationDeltaMin)}
            />
            <CompareRow
              label="Повтори"
              was={String(comparison.previous.reps)}
              now={String(stats.reps)}
              delta={signed(comparison.change.repsDelta)}
              color={deltaColor(comparison.change.repsDelta)}
            />
          </Card>
        )}

        {data.plan.length > 0 && <PlanCard rows={data.plan} />}

        {data.records.length > 0 && (
          <Card style={styles.recordsCard}>
            <Text style={styles.cardTitle}>Нові рекорди · {data.records.length}</Text>
            {data.records.map((r) => {
              const { subtitle, value } = recordText(r);
              return <RecordRow key={`${r.exerciseId}-${r.kind}`} title={r.exerciseName} subtitle={subtitle} value={value} />;
            })}
          </Card>
        )}

        {data.offerTemplate && !offerDismissed && !templateSaved && (
          <View style={styles.offer}>
            <View style={styles.offerText}>
              <Text style={styles.offerTitle}>Зберегти як шаблон?</Text>
              <Text style={styles.offerBody}>
                Такого набору вправ ще немає серед шаблонів. Наступного разу його можна буде призначити в один дотик.
              </Text>
            </View>
            <View style={styles.offerActions}>
              <Button title="Не зараз" variant="outlineOnDark" style={styles.offerLater} onPress={() => setOfferDismissed(true)} />
              <Button
                title="Створити шаблон"
                style={styles.offerCreate}
                onPress={() => {
                  createTemplateFromWorkout(data.id);
                  setTemplateSaved(true);
                }}
              />
            </View>
          </View>
        )}
        {templateSaved && <Text style={styles.saved}>Шаблон «{data.name}» збережено</Text>}

        <View style={styles.noteField}>
          <Text style={styles.noteLabel}>Нотатка до тренування</Text>
          <TextInput
            accessibilityLabel="Нотатка до тренування"
            value={note}
            onChangeText={setNote}
            onBlur={() => saveWorkoutNote(data.id, note)}
            placeholder="Як пройшло тренування?"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.note}
          />
        </View>
      </ScrollView>
      <BottomBar>
        <Button title="Готово" variant="dark" onPress={finish} />
      </BottomBar>
    </>
  );
}

function RestCard({ actual, planned }: { actual: number; planned: number }) {
  const diff = actual - planned;
  const max = Math.max(actual, planned, 1);
  return (
    <Card style={styles.restCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Відпочинок</Text>
        <Text style={[styles.restDiff, { color: diff > 0 ? colors.accentPressed : colors.growth }]}>
          {diff === 0 ? 'як у плані' : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} с до плану`}
        </Text>
      </View>
      {[
        { label: 'Фактично', value: actual, color: colors.accent },
        { label: 'План', value: planned, color: colors.text },
      ].map((row) => (
        <View key={row.label} style={styles.restRow}>
          <Text style={styles.restLabel}>{row.label}</Text>
          <View style={styles.restTrack}>
            <View style={[styles.restBar, { width: `${(row.value / max) * 100}%`, backgroundColor: row.color }]} />
          </View>
          <Text style={styles.restValue}>{formatClock(row.value)}</Text>
        </View>
      ))}
      <Text style={styles.cardMeta}>Середнє значення між робочими підходами, розминка не враховується</Text>
    </Card>
  );
}

function PlanCard({ rows }: { rows: PlanRow[] }) {
  const planned = rows.reduce((sum, r) => sum + r.totals.plannedVolumeKg, 0);
  const actual = rows.reduce((sum, r) => sum + r.totals.actualVolumeKg, 0);
  const percent = planned > 0 ? Math.round((actual / planned) * 100) : null;

  return (
    <Card style={styles.listCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>План і факт</Text>
        {percent !== null && (
          <Text style={[styles.restDiff, { color: deltaColor(percent - 100) }]}>{percent}% об’єму плану</Text>
        )}
      </View>
      {rows.map((row) => {
        const repsDelta = row.totals.actualReps - row.totals.plannedReps;
        return (
          <View
            key={row.id}
            style={styles.planRow}
            accessible
            accessibilityLabel={`${row.name}. План: ${formatSetList(row.planned)}. Факт: ${formatSetList(row.actual)}`}
          >
            <View style={styles.planText}>
              <Text style={styles.planName}>{row.name}</Text>
              <Text style={styles.planLine}>план {formatSetList(row.planned)}</Text>
              <Text style={styles.planLine}>
                факт <Text style={styles.compareNow}>{formatSetList(row.actual)}</Text>
              </Text>
            </View>
            <Text style={[styles.compareDelta, { color: deltaColor(repsDelta) }]}>
              {repsDelta === 0 ? '=' : signed(repsDelta)} повт.
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

function CompareRow({ label, was, now, delta, color }: { label: string; was: string; now: string; delta: string; color: string }) {
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={styles.compareWas}>
        {was} → <Text style={styles.compareNow}>{now}</Text>
      </Text>
      <Text style={[styles.compareDelta, { color }]}>{delta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md },
  titleBlock: { gap: space.xxs },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  title: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -0.5, color: colors.text },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.hero,
    paddingVertical: space.lg,
    paddingHorizontal: 18,
  },
  streakText: { flex: 1 },
  streakTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
  streakSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  streakValue: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 46, color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  metric: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.cardSmall,
    paddingVertical: space.md,
    paddingHorizontal: space.md2,
    gap: space.xxs,
  },
  metricLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  metricValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  metricSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  restCard: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.sm2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  cardMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  restDiff: { fontFamily: fonts.bold, fontSize: 13 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm2 },
  restLabel: { width: 70, fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  restTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: colors.track },
  restBar: { height: 12, borderRadius: 6 },
  restValue: { width: 40, textAlign: 'right', fontFamily: fonts.extrabold, fontSize: 13, color: colors.text },
  listCard: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.xxs },
  compareRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, borderTopWidth: 1, borderTopColor: colors.divider },
  compareLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  compareWas: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginRight: space.md },
  compareNow: { fontFamily: fonts.bold, color: colors.text },
  compareDelta: { minWidth: 48, textAlign: 'right', fontFamily: fonts.extrabold, fontSize: 14 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm2,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  planText: { flex: 1, gap: space.xxs },
  planName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  planLine: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  recordsCard: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.sm2 },
  offer: { backgroundColor: colors.text, borderRadius: radius.card, padding: space.lg, gap: space.md },
  offerText: { gap: space.xs },
  offerTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.onAccent },
  offerBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textOnDarkMuted },
  offerActions: { flexDirection: 'row', gap: space.sm },
  offerLater: { flex: 1, borderRadius: radius.input },
  offerCreate: { flex: 1, borderRadius: radius.input, paddingVertical: space.md },
  saved: { fontFamily: fonts.semibold, fontSize: 13, color: colors.growth, textAlign: 'center' },
  noteField: { gap: space.xs2 },
  noteLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  note: {
    minHeight: 64,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm2,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
