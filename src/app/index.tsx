import { useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppText,
  BackIcon,
  BarChart,
  BigStepper,
  Button,
  CalendarDay,
  Card,
  CategoryStatCard,
  Checkbox,
  Chip,
  Donut,
  ExerciseRow,
  FlameIcon,
  formatWeight,
  Heatmap,
  IconButton,
  PlusIcon,
  RecordRow,
  RestRing,
  SegmentProgress,
  SetRow,
  SetTimer,
  StatCard,
  Stepper,
  StreakCard,
  TabBar,
  Tag,
  TextField,
  Toggle,
  TodayWorkoutCard,
  type TabKey,
  type TextVariant,
} from '@/components/ui';
import { colors, fonts, radius, screenPadding, sizes, space } from '@/theme/theme';

type ColorToken = Exclude<keyof typeof colors, 'heat'>;

const swatches: { name: string; token: ColorToken; fg: ColorToken }[] = [
  { name: 'Фон', token: 'bg', fg: 'text' },
  { name: 'Поверхня', token: 'surface', fg: 'text' },
  { name: 'Межа', token: 'border', fg: 'text' },
  { name: 'Розділювач', token: 'divider', fg: 'text' },
  { name: 'Порожнє', token: 'track', fg: 'text' },
  { name: 'Неактивне', token: 'inactive', fg: 'text' },
  { name: 'Текст', token: 'text', fg: 'onAccent' },
  { name: 'Другорядний', token: 'textMuted', fg: 'onAccent' },
  { name: 'Акцент', token: 'accent', fg: 'onAccent' },
  { name: 'Акцент натиснутий', token: 'accentPressed', fg: 'onAccent' },
  { name: 'Акцент світлий', token: 'accentSoft', fg: 'accentPressed' },
  { name: 'Акцент середній', token: 'accentMid', fg: 'accentPressed' },
  { name: 'Полум’я', token: 'flameInner', fg: 'accentPressed' },
  { name: 'Виконано', token: 'success', fg: 'onAccent' },
  { name: 'Виконано світлий', token: 'successSoft', fg: 'success' },
  { name: 'Пропущено', token: 'danger', fg: 'onAccent' },
  { name: 'Їжа', token: 'catFood', fg: 'text' },
  { name: 'Сон', token: 'catSleep', fg: 'onAccent' },
];

const typeSamples: { name: string; spec: string; variant: TextVariant; sample: string; color?: string }[] = [
  { name: 'Display', spec: '52 / 800', variant: 'display', sample: '12', color: colors.accent },
  { name: 'Таймер', spec: '64 / 800', variant: 'timer', sample: '00:42' },
  { name: 'H1', spec: '30 / 800', variant: 'h1', sample: 'Календар' },
  { name: 'H1 дата', spec: '26 / 800', variant: 'h1Date', sample: 'Середа, 21 жовтня' },
  { name: 'Число картки', spec: '22–26 / 800', variant: 'number', sample: '2/3 · 412 т' },
  { name: 'H2', spec: '16 / 700', variant: 'h2', sample: 'План на сьогодні' },
  { name: 'Тіло', spec: '14–15 / 600', variant: 'body', sample: 'Присідання зі штангою' },
  { name: 'Другорядний', spec: '12–13 / 400', variant: 'secondary', sample: '6 вправ · ~70 хв' },
  { name: 'Мітка', spec: '11–12 / 700, капс', variant: 'label', sample: 'Вправа 1 з 4' },
];

const spaceSamples = [space.xs, space.sm, space.md, space.lg, space.xl, space.xxl, space.xxxl];

const radiusSamples: { value: number; name: string }[] = [
  { value: radius.tag, name: '8 · тег' },
  { value: radius.chip, name: '10 · чип' },
  { value: radius.input, name: '12 · поле' },
  { value: radius.button, name: '14 · кнопка' },
  { value: radius.cardSmall, name: '16–20 · картка' },
  { value: radius.hero, name: '22 · герой' },
];

const flameSizes = [16, 20, 32, 44];

const donutSegments = [
  { color: colors.catWorkout, done: false },
  { color: colors.catHabit, done: true },
  { color: colors.catHabit, done: true },
  { color: colors.catHabit, done: false },
  { color: colors.catFood, done: true },
  { color: colors.catFood, done: true },
  { color: colors.catFood, done: false },
  { color: colors.catSleep, done: true },
];

const heatLevels = [0, 1, 2, 3, 3, 0, 1, 0, 2, 0, 3, 1];

const WEIGHT_STEP = 2.5;
const REST_STEP = 15;

function formatRest(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DemoCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card style={styles.demoCard}>
      <AppText variant="label">{label}</AppText>
      {children}
    </Card>
  );
}

export default function UiKitScreen() {
  const [chip, setChip] = useState(true);
  const [unchecked, setUnchecked] = useState(false);
  const [checked, setChecked] = useState(true);
  const [toggleOn, setToggleOn] = useState(true);
  const [toggleOff, setToggleOff] = useState(false);
  const [rest, setRest] = useState(180);
  const [weight, setWeight] = useState(100);
  const [field, setField] = useState('Ноги');
  const [tab, setTab] = useState<TabKey>('dashboard');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="label">Тема 8 · Світлий спорт</AppText>
          <AppText variant="h1">UI kit</AppText>
          <AppText variant="secondary">Шрифт Exo 2 · базова сітка 4 px · екран 390 px, поля 20 px</AppText>
        </View>

        <Section title="Кольори">
          <View style={styles.swatches}>
            {swatches.map((s) => (
              <View key={s.token} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: colors[s.token] }]}>
                  <Text style={[styles.swatchHex, { color: colors[s.fg] }]}>{colors[s.token]}</Text>
                </View>
                <Text style={styles.swatchName}>{s.name}</Text>
                <Text style={styles.mono}>{s.token}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Типографіка">
          <Card style={styles.listCard}>
            {typeSamples.map((t, i) => (
              <View key={t.name} style={[styles.typeRow, i < typeSamples.length - 1 && styles.divider]}>
                <View style={styles.typeMeta}>
                  <Text style={styles.swatchName}>{t.name}</Text>
                  <Text style={styles.mono}>{t.spec}</Text>
                </View>
                <AppText variant={t.variant} color={t.color}>
                  {t.sample}
                </AppText>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Відступи й радіуси">
          <Card style={styles.demoCard}>
            <View style={styles.samplesRow}>
              {spaceSamples.map((n) => (
                <View key={n} style={styles.sample}>
                  <View style={{ width: n, height: n, backgroundColor: colors.accentMid, borderRadius: radius.segment }} />
                  <AppText variant="caption">{n}</AppText>
                </View>
              ))}
            </View>
            <View style={styles.radiiRow}>
              {radiusSamples.map((r) => (
                <View key={r.name} style={styles.radiusSample}>
                  <View style={[styles.radiusBox, { borderRadius: r.value }]} />
                  <AppText variant="caption" style={styles.center}>
                    {r.name}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Іконка стріку">
          <Card style={styles.demoCard}>
            <View style={styles.samplesRow}>
              {flameSizes.map((size) => (
                <View key={size} style={styles.sample}>
                  <FlameIcon size={size} />
                  <AppText variant="caption">{size} px</AppText>
                </View>
              ))}
            </View>
            <AppText variant="caption">
              Два шари: зовнішнє полум’я — акцент, внутрішнє — {colors.flameInner}. Завжди поруч із числом стріку.
            </AppText>
          </Card>
        </Section>

        <Section title="Компоненти">
          <DemoCard label="Кнопки">
            <Button title="Основна · Почати тренування" />
            <Button title="Основна · натиснута" pressed />
            <Button title="Другорядна · Завершити вправу" variant="secondary" />
            <Button title="Темна · Готово" variant="dark" />
            <View style={styles.inlineRow}>
              <IconButton accessibilityLabel="Додати">
                <PlusIcon color={colors.onAccent} />
              </IconButton>
              <IconButton accessibilityLabel="Назад" variant="outline">
                <BackIcon />
              </IconButton>
              <Button title="Текстова" variant="text" />
              <Button title="Вимкнена" disabled style={styles.compact} />
            </View>
          </DemoCard>

          <DemoCard label="Вибір і введення">
            <View style={styles.wrapRow}>
              <Chip label="Чип вибраний" selected={chip} onPress={() => setChip(!chip)} />
              <Chip label="Чип" selected={!chip} onPress={() => setChip(!chip)} />
              <Tag label="Тег суперсету" variant="superset" />
              <Tag label="Тег вправи" />
            </View>
            <View style={styles.inlineRow}>
              <Checkbox checked={unchecked} onChange={setUnchecked} label="Не відмічено" />
              <Checkbox checked={checked} onChange={setChecked} label="Виконано" />
            </View>
            <View style={styles.inlineRow}>
              <Toggle value={toggleOn} onValueChange={setToggleOn} accessibilityLabel="Нагадування" />
              <Toggle value={toggleOff} onValueChange={setToggleOff} accessibilityLabel="Вібрація" />
              <Stepper
                value={formatRest(rest)}
                accessibilityLabel="Відпочинок"
                onDecrement={() => setRest((s) => Math.max(0, s - REST_STEP))}
                onIncrement={() => setRest((s) => s + REST_STEP)}
              />
            </View>
            <TextField label="Поле" value={field} onChangeText={setField} />
            <TextField placeholder="Поле у фокусі…" focused />
            <View style={styles.inlineRow}>
              <View style={styles.half}>
                <BigStepper
                  label="Вага, кг"
                  value={formatWeight(weight)}
                  decrementLabel={`−${formatWeight(WEIGHT_STEP)}`}
                  incrementLabel={`+${formatWeight(WEIGHT_STEP)}`}
                  onDecrement={() => setWeight((w) => Math.max(0, w - WEIGHT_STEP))}
                  onIncrement={() => setWeight((w) => w + WEIGHT_STEP)}
                />
              </View>
              <AppText variant="caption" style={styles.half}>
                Великий степер для ваги й повторів. Кнопки 44 px заввишки на екрані.
              </AppText>
            </View>
          </DemoCard>

          <DemoCard label="Календар і прогрес">
            <View style={styles.calendarRow}>
              {(
                [
                  { day: 6, status: 'done', caption: 'виконано' },
                  { day: 11, status: 'missed', caption: 'пропущено' },
                  { day: 23, status: 'planned', caption: 'заплановано' },
                  { day: 21, status: 'planned', caption: 'сьогодні', today: true },
                  { day: 27, status: 'empty', caption: 'порожній' },
                ] as const
              ).map((d) => (
                <View key={d.day} style={styles.sample}>
                  <CalendarDay day={d.day} status={d.status} today={'today' in d} />
                  <Text style={styles.tiny}>{d.caption}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inlineRow}>
              <Donut segments={donutSegments} label="5/8" />
              <AppText variant="caption" style={styles.flex}>
                Кругова діаграма дня: сегмент на кожен пункт, колір категорії для виконаного, порожній колір для решти.
                Проміжок 3 px.
              </AppText>
            </View>
            <SegmentProgress total={4} done={2} />
            <View style={styles.chartsRow}>
              <View style={styles.flex}>
                <BarChart bars={[{ value: 40 }, { value: 0 }, { value: 52, color: colors.text }, { value: 30 }]} />
              </View>
              <Heatmap levels={heatLevels} columns={4} />
            </View>
          </DemoCard>

          <DemoCard label="Картки">
            <StreakCard title="Ідеальний день" subtitle="Рекорд: 21 день" value={12} />
            <View style={styles.inlineRow}>
              <CategoryStatCard label="Звички" color={colors.catHabit} value="2/3" streak={15} />
              <StatCard value="64" label="тренування" />
            </View>
            <TodayWorkoutCard caption="Тренування сьогодні" title="Ноги" actionLabel="Почати" />
          </DemoCard>

          <DemoCard label="Рядки списків">
            <ExerciseRow index="1" title="Присідання зі штангою" subtitle="4 підходи · відпочинок 3:00" />
            <ExerciseRow index="A1" title="Вправа в суперсеті" subtitle="без відпочинку → A2" superset />
            <SetRow index={2} weightKg={100} reps={8} duration="0:51" done />
            <RecordRow title="Рекорд" subtitle="розрах. 1ПМ" value="128 кг" />
          </DemoCard>

          <DemoCard label="Таббар і таймери">
            <View style={styles.tabBarFrame}>
              <TabBar active={tab} onChange={setTab} />
            </View>
            <View style={styles.inlineRow}>
              <SetTimer label="Підхід триває" time="00:42" />
              <RestRing progress={0.745} label="2:14" />
            </View>
          </DemoCard>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, gap: space.xxxl, paddingBottom: space.xxxl * 2 },
  header: { gap: space.xs2 },
  section: { gap: space.md2 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  swatch: { width: '30%', flexGrow: 1, gap: space.xs },
  swatchColor: {
    height: 72,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
    padding: space.sm,
  },
  swatchHex: { fontFamily: fonts.bold, fontSize: 11 },
  swatchName: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 11, color: colors.textMuted },
  listCard: { paddingVertical: space.sm },
  typeRow: { paddingVertical: space.md, gap: space.xs },
  typeMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  demoCard: { gap: space.md2 },
  samplesRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md2, flexWrap: 'wrap' },
  sample: { alignItems: 'center', gap: space.xs2 },
  radiiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md2 },
  radiusSample: { width: 72, alignItems: 'center', gap: space.xs2 },
  radiusBox: { width: 56, height: 56, borderWidth: 2, borderColor: colors.text },
  center: { textAlign: 'center' },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' },
  wrapRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs2, flexWrap: 'wrap' },
  compact: { minHeight: sizes.touch, paddingHorizontal: space.md2 },
  half: { flex: 1 },
  flex: { flex: 1 },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: space.xs },
  tiny: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },
  chartsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  tabBarFrame: { marginHorizontal: -space.xl },
});
