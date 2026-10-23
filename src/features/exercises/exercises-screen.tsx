import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, BackLink, Button, Card, Chip, TextField } from '@/components/ui';
import { useDbQuery } from '@/db/use-db-query';
import { colors, fonts, screenPadding, space } from '@/theme/theme';

import { createCustomExercise, loadExercises } from '../plan/plan-repo';

const OTHER = 'Інше';

/** Exercise library: built-in exercises by muscle group plus the user's own. */
export function ExercisesScreen() {
  const { data = [] } = useDbQuery(loadExercises, []);
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState(OTHER);

  const q = query.trim().toLocaleLowerCase('uk');
  const filtered = q ? data.filter((e) => e.name.toLocaleLowerCase('uk').includes(q)) : data;
  const groups = [...new Set(data.map((e) => e.muscleGroup))].sort((a, b) => (a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b, 'uk')));
  const nameTaken = data.some((e) => e.name.toLocaleLowerCase('uk') === newName.trim().toLocaleLowerCase('uk'));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Профіль" onPress={() => router.back()} />
          <AppText variant="h1" accessibilityRole="header">
            Бібліотека вправ
          </AppText>
          <TextField placeholder="Пошук вправи" accessibilityLabel="Пошук вправи" value={query} onChangeText={setQuery} />

          {groups.map((group) => {
            const inGroup = filtered.filter((e) => e.muscleGroup === group);
            if (inGroup.length === 0) return null;
            return (
              <Card key={group} style={styles.card}>
                <Text style={styles.group} accessibilityRole="header">
                  {group}
                </Text>
                {inGroup.map((e) => (
                  <View key={e.id} style={styles.row}>
                    <Text style={styles.name}>{e.name}</Text>
                    <Text style={styles.meta}>{e.isCustom ? 'своя' : e.equipment.toLocaleLowerCase('uk')}</Text>
                  </View>
                ))}
              </Card>
            );
          })}

          <Card style={styles.form}>
            <Text style={styles.group}>Своя вправа</Text>
            <TextField label="Назва" value={newName} onChangeText={setNewName} placeholder="Жим у Сміті" />
            <View style={styles.chips}>
              {[...new Set([...groups, OTHER])].map((g) => (
                <Chip key={g} label={g} selected={g === newGroup} onPress={() => setNewGroup(g)} />
              ))}
            </View>
            <Button
              title="Створити свою вправу"
              disabled={newName.trim().length === 0 || nameTaken}
              onPress={() => {
                createCustomExercise(newName, newGroup);
                setNewName('');
              }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.xs, gap: space.md },
  card: { paddingVertical: space.md2, paddingHorizontal: space.lg },
  group: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, paddingBottom: space.xs2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  form: { padding: space.lg, gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs2 },
});
