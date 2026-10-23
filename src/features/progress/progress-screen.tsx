import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  Card,
  ChevronDownIcon,
  FlameIcon,
  Heatmap,
  LineChart,
  RecordRow,
  RestRing,
  Segmented,
  StatCard,
} from '@/components/ui';
import { useDbQuery } from '@/db/use-db-query';
import type { RecordEvent } from '@/domain/records';
import { addDays, fromDateKey, todayKey } from '@/lib/dates';
import { formatDecimal, formatMonthShort, formatShortDate, formatThousands, formatTonnes } from '@/lib/format';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

import { BAR_WEEKS, HEATMAP_WEEKS, loadProgress, type ExercisePoint, type ProgressData } from './load-progress';

type Metric = 'oneRepMax' | 'maxWeight' | 'volume';

const metricOptions: { value: Metric; label: string }[] = [
  { value: 'oneRepMax', label: 'Розрах. 1ПМ' },
  { value: 'maxWeight', label: 'Макс. вага' },
  { value: 'volume', label: 'Об’єм' },
];

const BAR_MAX_HEIGHT = 90;

function recordText(r: RecordEvent) {
  switch (r.kind) {
    case 'maxWeight':
      return { kind: 'Максимальна вага', value: `${formatDecimal(r.weightKg)} кг × ${r.reps}` };
    case 'oneRepMax':
      return { kind: 'Розрахунковий 1ПМ', value: `${Math.round(r.value)} кг` };
    case 'reps':
      return { kind: 'Найбільше повторів', value: `${formatDecimal(r.weightKg)} кг × ${r.reps}` };
    case 'volume':
      return { kind: 'Об’єм за тренування', value: `${formatThousands(r.value)} кг` };
  }
}

export function ProgressScreen() {
  const { data } = useDbQuery(() => loadProgress(todayKey()), []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="h1" accessibilityRole="header">
          Прогрес
        </AppText>
        {data && <ProgressContent data={data} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressContent({ data }: { data: ProgressData }) {
  return (
    <>
      <View style={styles.row}>
        <StatCard value={String(data.totals.workouts)} label="тренування" />
        <StatCard value={`${data.totals.hours} год`} label="у залі" />
        <StatCard value={formatTonnes(data.totals.volumeKg)} label="піднято" />
      </View>

      <Card style={styles.planCard}>
        <RestRing
          size={104}
          strokeWidth={30}
          labelSize={22}
          progress={(data.plan.percent ?? 0) / 100}
          label={data.plan.percent === null ? '—' : `${data.plan.percent}%`}
          accessibilityRole="image"
          accessibilityLabel={
            data.plan.percent === null ? 'Немає запланованих тренувань' : `Виконано ${data.plan.percent} відсотків запланованих тренувань`
          }
        />
        <View style={styles.planText}>
          <Text style={styles.cardTitle}>Виконання плану</Text>
          <Text style={styles.muted}>
            {data.plan.completed} з {data.plan.planned} запланованих тренувань за 30 днів
          </Text>
          <View style={styles.streak}>
            <FlameIcon size={18} />
            <Text style={styles.streakText}>
              Стрік {data.streak.current} · рекорд {data.streak.best}
            </Text>
          </View>
        </View>
      </Card>

      <ActivityCard data={data} />
      <WeeksCard data={data} />
      {data.exercises.length > 0 && <ExerciseCard data={data} />}

      {data.records.length > 0 && (
        <Card style={styles.listCard}>
          <Text style={styles.cardTitle}>Рекорди</Text>
          {data.records.map((r, i) => {
            const { kind, value } = recordText(r);
            return (
              <View key={`${r.exerciseId}-${r.workoutId}`} style={[styles.recordRow, i > 0 && styles.divider]}>
                <View style={styles.recordMain}>
                  <RecordRow title={r.exerciseName} subtitle={kind} value={value} />
                </View>
                <Text style={styles.recordDate}>{formatShortDate(fromDateKey(r.date))}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {data.duration.average !== null && <DurationCard duration={data.duration} />}
    </>
  );
}

function ActivityCard({ data }: { data: ProgressData }) {
  const monthAt = (col: number) => formatMonthShort(fromDateKey(addDays(data.heatmap.firstDate, col * 7)).getMonth());
  const third = Math.floor(HEATMAP_WEEKS / 3);

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Активність</Text>
        <Text style={styles.caption}>останні 6 місяців</Text>
      </View>
      <Heatmap levels={data.heatmap.levels} columns={HEATMAP_WEEKS} accessibilityLabel="Активність за останні 6 місяців" />
      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{monthAt(0)}</Text>
        <Text style={styles.axisLabel}>{monthAt(third)}</Text>
        <Text style={styles.axisLabel}>{monthAt(third * 2)}</Text>
        <View style={styles.legend}>
          <Text style={styles.axisLabel}>менше</Text>
          {colors.heat.map((c) => (
            <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
          ))}
          <Text style={styles.axisLabel}>більше</Text>
        </View>
      </View>
    </Card>
  );
}

function WeeksCard({ data }: { data: ProgressData }) {
  const max = Math.max(...data.weeks.map((w) => w.volumeKg), 1);
  const monthOf = (i: number) => formatMonthShort(fromDateKey(data.weeks[i].weekStart).getMonth());

  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.cardTitle}>Тренування й об’єм по тижнях</Text>
      <View style={styles.bars}>
        {data.weeks.map((w, i) => (
          <View
            key={w.weekStart}
            style={styles.barColumn}
            accessible
            accessibilityLabel={`Тиждень з ${formatShortDate(fromDateKey(w.weekStart))}: ${w.workouts} тренувань, ${formatTonnes(w.volumeKg)}`}
          >
            <Text style={styles.barCount}>{w.workouts}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: w.volumeKg > 0 ? Math.max(4, (w.volumeKg / max) * BAR_MAX_HEIGHT) : 4,
                  backgroundColor: w.volumeKg === 0 ? colors.track : i === BAR_WEEKS - 1 ? colors.accent : colors.text,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{monthOf(0)}</Text>
        <Text style={styles.axisLabel}>{monthOf(Math.floor(BAR_WEEKS / 2))}</Text>
        <Text style={styles.axisLabel}>{monthOf(BAR_WEEKS - 1)}</Text>
      </View>
      <Text style={styles.caption}>Цифра над стовпчиком — кількість тренувань, висота — об’єм у тоннах</Text>
    </Card>
  );
}

function ExerciseCard({ data }: { data: ProgressData }) {
  const [exerciseId, setExerciseId] = useState(data.exercises[0].id);
  const [metric, setMetric] = useState<Metric>('oneRepMax');
  const [picking, setPicking] = useState(false);
  const [width, setWidth] = useState(0);

  const exercise = data.exercises.find((e) => e.id === exerciseId) ?? data.exercises[0];
  const points: ExercisePoint[] = data.series.get(exercise.id) ?? [];
  const values = points.map((p) => Math.round(p[metric]));
  const last = values[values.length - 1] ?? 0;
  const first = values[0] ?? 0;
  const weeks = points.length > 1 ? Math.max(1, Math.round((fromDateKey(points[points.length - 1].date).getTime() - fromDateKey(points[0].date).getTime()) / (7 * 86400000))) : 0;
  const delta = last - first;
  const unit = metric === 'volume' ? formatThousands : String;

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Прогрес по вправі</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Вправа: ${exercise.name}. Змінити`}
          onPress={() => setPicking(true)}
          hitSlop={4}
          style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
        >
          <Text style={styles.pickerLabel} numberOfLines={1}>
            {exercise.name}
          </Text>
          <ChevronDownIcon size={14} />
        </Pressable>
      </View>
      <Segmented options={metricOptions} value={metric} onChange={setMetric} />
      <View style={styles.valueRow}>
        <Text style={styles.bigValue}>{unit(last)} кг</Text>
        {weeks > 0 && (
          <Text style={[styles.delta, { color: delta >= 0 ? colors.growth : colors.dangerText }]}>
            {delta >= 0 ? '+' : '−'}
            {unit(Math.abs(delta))} кг за {weeks} тиж
          </Text>
        )}
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && values.length > 0 && (
          <LineChart
            values={values}
            width={width}
            height={140}
            showGrid
            startLabel={formatShortDate(fromDateKey(points[0].date))}
            endLabel={formatShortDate(fromDateKey(points[points.length - 1].date))}
            accessibilityLabel={`${exercise.name}: з ${unit(first)} до ${unit(last)} кг`}
          />
        )}
      </View>

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} accessibilityRole="button" accessibilityLabel="Закрити" onPress={() => setPicking(false)}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <ScrollView>
              {data.exercises.map((e, i) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: e.id === exercise.id }}
                  onPress={() => {
                    setExerciseId(e.id);
                    setPicking(false);
                  }}
                  style={({ pressed }) => [styles.option, i > 0 && styles.divider, pressed && styles.pressed]}
                >
                  <Text style={[styles.optionLabel, e.id === exercise.id && styles.optionSelected]}>{e.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Card>
  );
}

function DurationCard({ duration }: { duration: ProgressData['duration'] }) {
  const max = Math.max(...duration.recent, 1);
  return (
    <Card style={styles.durationCard}>
      <View style={styles.durationText}>
        <Text style={styles.caption}>Середня тривалість</Text>
        <Text style={styles.durationValue}>{duration.average} хв</Text>
      </View>
      <View style={styles.miniBars} accessible accessibilityLabel="Тривалість останніх тренувань">
        {duration.recent.map((d, i) => (
          <View key={i} style={[styles.miniBar, { height: Math.max(4, (d / max) * 40) }]} />
        ))}
      </View>
      {duration.delta !== null && (
        <Text style={[styles.delta, { color: duration.delta <= 0 ? colors.growth : colors.textMuted }]}>
          {duration.delta > 0 ? '+' : duration.delta < 0 ? '−' : ''}
          {Math.abs(duration.delta)} хв
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md },
  row: { flexDirection: 'row', gap: space.sm },
  planCard: { padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.lg },
  planText: { flex: 1, gap: space.xs2 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  streak: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  streakText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  sectionCard: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.sm2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  axis: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  axisLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendCell: { width: 9, height: 9, borderRadius: radius.cell },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs2, height: BAR_MAX_HEIGHT + 20 },
  barColumn: { flex: 1, alignItems: 'center', gap: space.xs },
  barCount: { fontFamily: fonts.bold, fontSize: 10, color: colors.textMuted },
  bar: { alignSelf: 'stretch', borderRadius: radius.bar },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    maxWidth: '55%',
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    paddingHorizontal: space.sm2,
  },
  pickerLabel: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  pressed: { opacity: 0.7 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  bigValue: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  delta: { fontFamily: fonts.bold, fontSize: 13 },
  listCard: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.xs2 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  recordMain: { flex: 1 },
  recordDate: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, minWidth: 44, textAlign: 'right' },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  durationCard: {
    paddingVertical: space.md2,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationText: { gap: space.xxs },
  durationValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  miniBars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs, height: 40 },
  miniBar: { width: 10, borderRadius: radius.segment, backgroundColor: colors.text },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: screenPadding },
  sheet: { maxHeight: '70%', backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: space.lg },
  option: { minHeight: 48, justifyContent: 'center' },
  optionLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  optionSelected: { fontFamily: fonts.extrabold, color: colors.accent },
});
