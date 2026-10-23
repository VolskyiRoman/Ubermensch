import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigStepper, Button } from '@/components/ui';
import { todayKey } from '@/lib/dates';
import { formatDecimal, parseDecimal } from '@/lib/format';
import { colors, fonts, radius, screenPadding, space } from '@/theme/theme';

import { lastBodyWeight, logBodyWeight } from './profile-repo';

/** Body weight changes slowly, so it moves in 0.1 kg steps (lifting weights use 2.5). */
const STEP_KG = 0.1;
const DEFAULT_KG = 75;

type BodyWeightSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** Compact bottom sheet for logging today's body weight. */
export function BodyWeightSheet({ visible, onClose }: BodyWeightSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible && <SheetContent onClose={onClose} />}
    </Modal>
  );
}

function SheetContent({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [weightKg, setWeightKg] = useState(() => lastBodyWeight() ?? DEFAULT_KG);
  const step = (direction: 1 | -1) => setWeightKg((w) => Math.max(0, Math.round((w + direction * STEP_KG) * 10) / 10));

  return (
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.dismiss} accessibilityRole="button" accessibilityLabel="Закрити" onPress={onClose} />
      {/* Tapping the sheet outside the input hides the keyboard. */}
      <Pressable
        accessible={false}
        onPress={Keyboard.dismiss}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]}
        accessibilityViewIsModal
        accessibilityLabel="Вага тіла"
      >
        <View style={styles.grabber} />
        <Text style={styles.title} accessibilityRole="header">
          Вага тіла
        </Text>
        <BigStepper
          label="Вага, кг"
          value={formatDecimal(weightKg)}
          decrementLabel="−0,1"
          incrementLabel="+0,1"
          onDecrement={() => step(-1)}
          onIncrement={() => step(1)}
          onChangeText={(text) => {
            const kg = parseDecimal(text);
            if (kg !== null) setWeightKg(Math.round(kg * 10) / 10);
          }}
        />
        <Button
          title="Записати"
          onPress={() => {
            logBodyWeight(todayKey(), weightKg);
            onClose();
          }}
        />
      </Pressable>
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
    paddingTop: space.sm2,
    paddingHorizontal: screenPadding,
    gap: space.lg,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: radius.segment, backgroundColor: colors.border },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
});
