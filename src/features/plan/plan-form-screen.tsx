import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomBar, Button, CalendarIcon, Chip, ModalHeader, TextField, Toggle } from '@/components/ui';
import { loadSettings } from '@/db/settings';
import { mergeSuperset, moveItem, removeItem, setRest, setTargetSets, splitSuperset } from '@/domain/plan';
import { estimateWorkoutMin } from '@/domain/stats';
import { fromDateKey, monthKey, todayKey } from '@/lib/dates';
import { formatDayMonth, formatExerciseCount, formatWeekdayShortDate } from '@/lib/format';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

import { MonthCalendar } from '../calendar/components/month-calendar';
import { ExerciseSearch } from './components/exercise-search';
import { PlanItems } from './components/plan-items';
import {
  createCustomExercise,
  deleteTemplate,
  deleteWorkout,
  loadExercises,
  loadTemplateDraft,
  loadTemplateItems,
  loadTemplateList,
  loadWorkoutDraft,
  newKey,
  saveTemplate,
  saveWorkout,
  type DraftItem,
  type ExerciseOption,
} from './plan-repo';

type Mode = 'workout' | 'template';

type Draft = { name: string; date: string; templateId: number | null; items: DraftItem[] };

function initialDraft(mode: Mode, params: { id?: string; date?: string; templateId?: string }): Draft {
  const id = params.id ? Number(params.id) : null;
  if (mode === 'template') {
    const template = id !== null ? loadTemplateDraft(id) : null;
    return { name: template?.name ?? '', date: todayKey(), templateId: null, items: template?.items ?? [] };
  }
  if (id !== null) {
    const workout = loadWorkoutDraft(id);
    if (workout) return { ...workout, date: workout.date < todayKey() ? todayKey() : workout.date };
  }
  const date = params.date && params.date >= todayKey() ? params.date : todayKey();
  if (params.templateId) {
    const templateId = Number(params.templateId);
    const name = loadTemplateList().find((t) => t.id === templateId)?.name ?? '';
    return { name, date, templateId, items: loadTemplateItems(templateId) };
  }
  return { name: '', date, templateId: null, items: [] };
}

export function PlanFormScreen({ mode }: { mode: Mode }) {
  const params = useLocalSearchParams<{ id?: string; date?: string; templateId?: string }>();
  const id = params.id ? Number(params.id) : null;
  const [draft, setDraft] = useState(() => initialDraft(mode, params));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [exercises, setExercises] = useState(loadExercises);
  const [templateList] = useState(() => (mode === 'workout' ? loadTemplateList() : []));
  const [defaultRestSec] = useState(() => loadSettings().defaultRestSec);

  const items = draft.items;
  const setItems = (next: DraftItem[]) => setDraft((d) => ({ ...d, items: next }));
  const canSave = draft.name.trim().length > 0 && items.length > 0;

  const addExercise = (exercise: ExerciseOption) =>
    setItems([
      ...items,
      {
        key: newKey(),
        exerciseId: exercise.id,
        name: exercise.name,
        supersetGroup: null,
        targetSets: 3,
        restSec: defaultRestSec,
        targetReps: null,
        targetWeightKg: null,
      },
    ]);

  const pickTemplate = (templateId: number | null) => {
    setSelected(new Set());
    if (templateId === null) {
      setDraft((d) => ({ ...d, templateId: null }));
      return;
    }
    const name = templateList.find((t) => t.id === templateId)?.name ?? draft.name;
    setDraft((d) => ({ ...d, templateId, name, items: loadTemplateItems(templateId) }));
  };

  const toggleSelected = (key: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const save = () => {
    const name = draft.name.trim();
    if (mode === 'template') saveTemplate(id, name, items);
    else saveWorkout(id, { name, date: draft.date, templateId: draft.templateId, items, saveAsTemplate });
    router.back();
  };

  const remove = () =>
    Alert.alert(mode === 'template' ? 'Видалити шаблон?' : 'Видалити тренування?', 'Цю дію не можна скасувати.', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => {
          if (mode === 'template') deleteTemplate(id!);
          else deleteWorkout(id!);
          router.back();
        },
      },
    ]);

  const date = fromDateKey(draft.date);
  const title = mode === 'template' ? (id === null ? 'Новий шаблон' : 'Шаблон') : id === null ? 'Нове тренування' : 'Тренування';
  const saveLabel =
    mode === 'template' ? 'Зберегти шаблон' : id === null ? `Призначити на ${formatDayMonth(date)}` : 'Зберегти зміни';
  const estimated = estimateWorkoutMin(items);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ModalHeader title={title} onClose={() => router.back()} />

          <View style={styles.row}>
            <View style={styles.cell}>
              <TextField
                label="Назва"
                value={draft.name}
                onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
                placeholder="Ноги"
              />
            </View>
            {mode === 'workout' && (
              <View style={[styles.cell, styles.field]}>
                <Text style={styles.label}>Дата</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Дата: ${formatDayMonth(date)}`}
                  accessibilityState={{ expanded: pickingDate }}
                  onPress={() => setPickingDate((v) => !v)}
                  style={[styles.dateButton, pickingDate && styles.dateButtonActive]}
                >
                  <CalendarIcon size={18} color={colors.accent} />
                  <Text style={styles.dateLabel}>{formatWeekdayShortDate(date)}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {pickingDate && (
            <DatePicker
              value={draft.date}
              onChange={(value) => {
                setDraft((d) => ({ ...d, date: value }));
                setPickingDate(false);
              }}
            />
          )}

          {mode === 'workout' && templateList.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Шаблон</Text>
              <View style={styles.chips}>
                {templateList.map((t) => (
                  <Chip key={t.id} label={t.name} selected={draft.templateId === t.id} onPress={() => pickTemplate(t.id)} />
                ))}
                <Chip label="Без шаблону" selected={draft.templateId === null} onPress={() => pickTemplate(null)} />
              </View>
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={styles.listTitle} accessibilityRole="header">
              Вправи
            </Text>
            {items.length > 0 && (
              <Text style={styles.listMeta}>
                {formatExerciseCount(items.length)}
                {estimated > 0 ? ` · ~${estimated} хв` : ''}
              </Text>
            )}
          </View>

          <PlanItems
            items={items}
            selected={selected}
            onToggle={toggleSelected}
            onSets={(index, sets) => setItems(setTargetSets(items, index, sets))}
            onRest={(index, rest) => setItems(setRest(items, index, rest))}
            onMove={(index, direction) => setItems(moveItem(items, index, direction))}
            onRemove={(index) => {
              setItems(removeItem(items, index));
              setSelected(new Set());
            }}
            onSplit={(index) => setItems(splitSuperset(items, index))}
          />

          <ExerciseSearch
            exercises={exercises}
            onPick={addExercise}
            onCreate={(name) => {
              const created = createCustomExercise(name);
              setExercises(loadExercises());
              addExercise(created);
            }}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: selected.size < 2 }}
            disabled={selected.size < 2}
            onPress={() => {
              setItems(
                mergeSuperset(
                  items,
                  items.flatMap((item, i) => (selected.has(item.key) ? [i] : [])),
                ),
              );
              setSelected(new Set());
            }}
            style={({ pressed }) => [styles.merge, selected.size < 2 && styles.mergeDisabled, pressed && styles.pressed]}
          >
            <Text style={styles.mergeLabel}>Об’єднати вибрані в суперсет</Text>
          </Pressable>

          {mode === 'workout' && id === null && draft.templateId === null && (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Зберегти як шаблон</Text>
              <Toggle value={saveAsTemplate} onValueChange={setSaveAsTemplate} accessibilityLabel="Зберегти як шаблон" />
            </View>
          )}

          {id !== null && (
            <Button
              title={mode === 'template' ? 'Видалити шаблон' : 'Видалити тренування'}
              variant="text"
              onPress={remove}
            />
          )}
        </ScrollView>

        <BottomBar>
          <Button title={saveLabel} onPress={save} disabled={!canSave} />
        </BottomBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const today = todayKey();
  const [visible, setVisible] = useState(() => {
    const d = fromDateKey(value);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const shift = (delta: number) => {
    const first = fromDateKey(monthKey(visible.year, visible.month + delta));
    setVisible({ year: first.getFullYear(), month: first.getMonth() });
  };

  return (
    <MonthCalendar
      year={visible.year}
      month={visible.month}
      today={today}
      selected={value}
      statuses={new Map()}
      onSelect={(date) => {
        if (date >= today) onChange(date);
      }}
      onPrevMonth={() => shift(-1)}
      onNextMonth={() => shift(1)}
      showLegend={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md2 },
  row: { flexDirection: 'row', gap: space.sm },
  cell: { flex: 1 },
  field: { gap: space.xs2 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  dateButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    backgroundColor: colors.surface,
  },
  dateButtonActive: { borderColor: colors.text },
  dateLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs2 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: space.xs },
  listTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  listMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  merge: {
    height: 46,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textDisabled,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mergeDisabled: { opacity: 0.45 },
  pressed: { backgroundColor: colors.divider },
  mergeLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.xs,
    paddingHorizontal: space.xxs,
  },
  toggleLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
});
