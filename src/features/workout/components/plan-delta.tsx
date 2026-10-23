import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { setDelta, type WeightReps } from '@/domain/plan-vs-actual';
import { formatDecimal } from '@/lib/format';
import { colors, fonts } from '@/theme/theme';

const sign = (n: number) => (n > 0 ? '+' : '−');

/** "як план", or the difference from the plan: "+2,5 кг · −1 повт." (more is green, less is red). */
export function PlanDelta({ planned, actual, style }: { planned: WeightReps; actual: WeightReps; style?: StyleProp<TextStyle> }) {
  const delta = setDelta(planned, actual);
  const parts = [
    delta.weightKg !== 0 && { text: `${sign(delta.weightKg)}${formatDecimal(Math.abs(delta.weightKg))} кг`, up: delta.weightKg > 0 },
    delta.reps !== 0 && { text: `${sign(delta.reps)}${Math.abs(delta.reps)} повт.`, up: delta.reps > 0 },
  ].filter((p) => p !== false);

  if (parts.length === 0) return <Text style={[styles.text, styles.same, style]}>як план</Text>;
  return (
    <Text style={[styles.text, style]}>
      {parts.map((p, i) => (
        <Text key={p.text}>
          {i > 0 && <Text style={styles.same}> · </Text>}
          <Text style={{ color: p.up ? colors.growth : colors.dangerText }}>{p.text}</Text>
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.bold, fontSize: 12 },
  same: { color: colors.textMuted },
});
