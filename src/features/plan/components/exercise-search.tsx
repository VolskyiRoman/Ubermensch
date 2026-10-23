import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SearchIcon } from '@/components/ui';
import { colors, fonts, radius, space } from '@/theme/theme';

import type { ExerciseOption } from '../plan-repo';

const MAX_RESULTS = 5;

function normalize(s: string) {
  return s.trim().toLocaleLowerCase('uk');
}

type ExerciseSearchProps = {
  exercises: ExerciseOption[];
  onPick: (exercise: ExerciseOption) => void;
  onCreate: (name: string) => void;
};

/** "Додати вправу…" field with a dropdown of matches and "Створити свою вправу". */
export function ExerciseSearch({ exercises, onPick, onCreate }: ExerciseSearchProps) {
  const [query, setQuery] = useState('');
  const q = normalize(query);
  const matches = q ? exercises.filter((e) => normalize(e.name).includes(q)).slice(0, MAX_RESULTS) : [];
  const exact = exercises.some((e) => normalize(e.name) === q);

  const pick = (exercise: ExerciseOption) => {
    onPick(exercise);
    setQuery('');
  };

  return (
    <View style={styles.box}>
      <View style={[styles.inputRow, q.length > 0 && styles.divider]}>
        <SearchIcon color={colors.textMuted} />
        <TextInput
          accessibilityLabel="Пошук вправи"
          placeholder="Додати вправу…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          returnKeyType="search"
        />
      </View>
      {matches.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`Додати: ${e.name}`}
          onPress={() => pick(e)}
          style={({ pressed }) => [styles.option, styles.divider, pressed && styles.pressed]}
        >
          <View style={styles.optionText}>
            <Text style={styles.optionName}>{e.name}</Text>
            <Text style={styles.optionMeta}>
              {e.muscleGroup} · {e.equipment.toLocaleLowerCase('uk')}
            </Text>
          </View>
          <Text style={styles.plus}>+</Text>
        </Pressable>
      ))}
      {q.length > 0 && !exact && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onCreate(query.trim());
            setQuery('');
          }}
          style={({ pressed }) => [styles.create, pressed && styles.pressed]}
        >
          <Text style={styles.createLabel}>+ Створити свою вправу</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.cardSmall,
    overflow: 'hidden',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm2, paddingHorizontal: space.md2, height: 50 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  input: { flex: 1, height: 50, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: space.md2,
    paddingVertical: space.xs,
  },
  pressed: { backgroundColor: colors.divider },
  optionText: { flex: 1 },
  optionName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  optionMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  plus: { fontFamily: fonts.semibold, fontSize: 20, color: colors.accent },
  create: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  createLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
});
