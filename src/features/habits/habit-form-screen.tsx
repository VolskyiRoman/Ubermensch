import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomBar, Button, Chip, ModalHeader, TextField } from '@/components/ui';
import type { HabitCategory } from '@/db/schema';
import { colors, fonts, screenPadding, space } from '@/theme/theme';

import { habitCategories } from './categories';
import { archiveHabit, categoryOrder, loadHabit, saveHabit } from './habits-repo';

export function HabitFormScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id === 'new' ? null : Number(params.id);
  const [initial] = useState(() => (id === null ? null : loadHabit(id)));
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<HabitCategory>(initial?.category ?? 'habit');
  const [description, setDescription] = useState(initial?.description ?? '');

  const save = () => {
    saveHabit(id, { name: name.trim(), category, description: description.trim() || null });
    router.back();
  };

  const archive = () =>
    Alert.alert('Прибрати звичку?', 'Історія відміток збережеться, але звичка більше не з’являтиметься в списку.', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Прибрати',
        style: 'destructive',
        onPress: () => {
          archiveHabit(id!);
          router.back();
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ModalHeader title={id === null ? 'Нова звичка' : 'Звичка'} onClose={() => router.back()} />
          <TextField label="Назва" value={name} onChangeText={setName} placeholder="Вода 2 л" autoFocus={id === null} />
          <View style={styles.field}>
            <Text style={styles.label}>Категорія</Text>
            <View style={styles.chips}>
              {categoryOrder.map((c) => (
                <Chip key={c} label={habitCategories[c].label} selected={c === category} onPress={() => setCategory(c)} />
              ))}
            </View>
          </View>
          <TextField
            label="Підказка"
            value={description}
            onChangeText={setDescription}
            placeholder="10 хв, до 10:00…"
          />
          {id !== null && <Button title="Прибрати звичку" variant="text" onPress={archive} />}
        </ScrollView>
        <BottomBar>
          <Button title="Зберегти" onPress={save} disabled={name.trim().length === 0} />
        </BottomBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.md2 },
  field: { gap: space.xs2 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs2 },
});
