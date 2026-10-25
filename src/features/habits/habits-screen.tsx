import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SproutIllustration } from '@/components/illustrations/empty-states';
import { AppText, CheckIcon, EmptyState, FlameIcon, IconButton, InfoIcon, PlusIcon } from '@/components/ui';
import { useDbQuery } from '@/db/use-db-query';
import { fromDateKey, todayKey } from '@/lib/dates';
import { formatDays, formatWeekdayShort } from '@/lib/format';
import { colors, fonts, radius, screenPadding, sizes, space } from '@/theme/theme';

import { habitCategories } from './categories';
import { loadHabits, setHabitDone, type HabitRow, type HabitSection, type WeekDay } from './habits-repo';

function openHabitForm(id?: number) {
  router.push({ pathname: '/habit/[id]', params: { id: id === undefined ? 'new' : String(id) } });
}

export function HabitsScreen() {
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const { data } = useDbQuery(() => loadHabits(today, selected), [today, selected]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <AppText variant="h1" accessibilityRole="header">
            Звички
          </AppText>
          <IconButton accessibilityLabel="Додати звичку" onPress={() => openHabitForm()}>
            <PlusIcon color={colors.onAccent} />
          </IconButton>
        </View>

        {data && (
          <>
            <WeekStrip week={data.week} today={today} selected={selected} isEmpty={data.isEmpty} onSelect={setSelected} />

            {data.isEmpty ? (
              <EmptyState
                illustration={<SproutIllustration />}
                title="Тут виростуть твої звички"
                text="Почни з однієї маленької: склянка води зранку чи 10 хвилин розтяжки. Їжу теж можна відмічати тут, а сон — у профілі."
                actionLabel="Додати першу звичку"
                onAction={() => openHabitForm()}
              />
            ) : (
              data.sections.map((section) => (
                <SectionCard
                  key={section.category}
                  section={section}
                  onToggle={(item) => setHabitDone(item.id, selected, !item.done)}
                />
              ))
            )}
          </>
        )}

        <View style={styles.note}>
          <InfoIcon color={colors.textMuted} />
          <Text style={styles.noteText}>
            Те, що не відмічено до кінця дня, вважається невиконаним. Ідеальний день зараховується, коли виконано все:
            звички, їжу, сон і тренування.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type WeekStripProps = {
  week: WeekDay[];
  today: string;
  selected: string;
  isEmpty: boolean;
  onSelect: (date: string) => void;
};

function WeekStrip({ week, today, selected, isEmpty, onSelect }: WeekStripProps) {
  return (
    <View style={styles.week}>
      {week.map((day) => {
        const future = day.date > today;
        const isSelected = day.date === selected;
        const fraction = !isEmpty && !future && day.total > 0 ? `${day.done}/${day.total}` : '·';
        const fg = isSelected ? colors.onAccent : future ? colors.textMuted : colors.text;
        const date = fromDateKey(day.date);
        return (
          <Pressable
            key={day.date}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: future }}
            accessibilityLabel={`${formatWeekdayShort(date)} ${date.getDate()}${fraction === '·' ? '' : `, виконано ${fraction}`}`}
            disabled={future}
            onPress={() => onSelect(day.date)}
            style={[styles.weekDay, isSelected ? styles.weekDaySelected : future ? null : styles.weekDayPast]}
          >
            <Text style={[styles.weekName, { color: fg }]}>{formatWeekdayShort(date)}</Text>
            <Text style={[styles.weekNumber, { color: fg }]}>{date.getDate()}</Text>
            <Text style={[styles.weekFraction, { color: fg }]}>{fraction}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectionCard({ section, onToggle }: { section: HabitSection; onToggle: (item: HabitRow) => void }) {
  const { label, color } = habitCategories[section.category];
  const done = section.items.filter((i) => i.done).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.sectionLabel} accessibilityRole="header">
            {label}
          </Text>
          <Text style={styles.sectionFraction}>
            {done}/{section.items.length}
          </Text>
        </View>
        <View style={styles.streak} accessible accessibilityLabel={`Стрік: ${formatDays(section.streak)}`}>
          <FlameIcon size={18} />
          <Text style={styles.streakText}>{formatDays(section.streak)}</Text>
        </View>
      </View>
      {section.items.map((item) => (
        <HabitItem key={item.id} item={item} showStreak={section.category === 'habit'} onToggle={() => onToggle(item)} />
      ))}
    </View>
  );
}

function HabitItem({ item, showStreak, onToggle }: { item: HabitRow; showStreak: boolean; onToggle: () => void }) {
  const meta = [item.description, showStreak && item.streak > 0 ? `стрік ${item.streak}` : null].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.done }}
      accessibilityLabel={meta ? `${item.name}, ${meta}` : item.name}
      accessibilityHint="Утримуйте, щоб редагувати"
      onPress={onToggle}
      onLongPress={() => openHabitForm(item.id)}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={[styles.box, item.done ? styles.boxChecked : styles.boxIdle]}>{item.done && <CheckIcon />}</View>
      <View style={styles.itemText}>
        <Text style={styles.itemName}>{item.name}</Text>
        {meta ? <Text style={styles.itemMeta}>{meta}</Text> : null}
      </View>
      <Text style={[styles.itemStatus, { color: item.done ? colors.text : colors.textMuted }]}>
        {item.done ? 'Виконано' : 'Не відмічено'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  week: { flexDirection: 'row', gap: space.xs2 },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDayPast: { backgroundColor: colors.surface },
  weekDaySelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  weekName: { fontFamily: fonts.semibold, fontSize: 11 },
  weekNumber: { fontFamily: fonts.extrabold, fontSize: 16 },
  weekFraction: { fontFamily: fonts.bold, fontSize: 10 },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: space.md2,
    paddingHorizontal: space.lg,
    gap: space.xxs,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: space.xs2 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  sectionFraction: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.textMuted },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pressed: { opacity: 0.7 },
  box: {
    width: sizes.checkbox,
    height: sizes.checkbox,
    borderRadius: radius.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxIdle: { borderWidth: 2, borderColor: colors.inactive },
  boxChecked: { backgroundColor: colors.accent },
  itemText: { flex: 1, paddingVertical: space.xs2 },
  itemName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  itemMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  itemStatus: { fontFamily: fonts.bold, fontSize: 12 },
  note: { flexDirection: 'row', gap: space.sm2, alignItems: 'flex-start', paddingVertical: space.xs, paddingHorizontal: space.xs2 },
  noteText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
});
