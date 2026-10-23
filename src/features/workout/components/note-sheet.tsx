import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

type NoteSheetProps = {
  visible: boolean;
  initial: string;
  onSave: (text: string) => void;
  onClose: () => void;
};

/** Workout note, also shown and editable on the summary. */
export function NoteSheet({ visible, initial, onSave, onClose }: NoteSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible && <Content initial={initial} onSave={onSave} onClose={onClose} />}
    </Modal>
  );
}

function Content({ initial, onSave, onClose }: Omit<NoteSheetProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(initial);

  return (
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.dismiss} accessibilityRole="button" accessibilityLabel="Закрити" onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]} accessibilityViewIsModal>
        <Text style={styles.title}>Нотатка до тренування</Text>
        <TextInput
          accessibilityLabel="Нотатка до тренування"
          value={text}
          onChangeText={setText}
          placeholder="Як пройшло тренування?"
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
          style={styles.input}
        />
        <Button
          title="Зберегти"
          onPress={() => {
            onSave(text);
            onClose();
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.xl,
    paddingHorizontal: screenPadding,
    gap: space.md,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  input: {
    minHeight: 96,
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
