import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '@/theme/theme';

import { TrophyIcon } from './icons';

type ExerciseRowProps = {
  /** Order label: "1", or "A1" for a superset. */
  index: string;
  title: string;
  subtitle: string;
  superset?: boolean;
  divider?: boolean;
};

export function ExerciseRow({ index, title, subtitle, superset = false, divider = true }: ExerciseRowProps) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <View style={[styles.badge, superset ? styles.badgeSuperset : styles.badgeDefault]}>
        <Text style={[styles.badgeLabel, superset && styles.badgeLabelSuperset]}>{index}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

type SetRowProps = {
  index: number;
  weightKg: number;
  reps: number;
  duration: string;
  done?: boolean;
  divider?: boolean;
};

export function formatWeight(kg: number) {
  return String(kg).replace('.', ',');
}

export function SetRow({ index, weightKg, reps, duration, done = false, divider = true }: SetRowProps) {
  return (
    <View style={[styles.setRow, divider && styles.divider]}>
      <Text style={[styles.setCell, styles.setIndex]}>{index}</Text>
      <Text style={[styles.setCell, styles.setMain]}>
        {formatWeight(weightKg)} кг × {reps}
      </Text>
      <Text style={[styles.setCell, styles.setDuration]}>{duration}</Text>
      <Text style={[styles.setCell, styles.setDone]} accessibilityLabel={done ? 'виконано' : undefined}>
        {done ? '✓' : ''}
      </Text>
    </View>
  );
}

type RecordRowProps = {
  title: string;
  subtitle: string;
  value: string;
  divider?: boolean;
};

export function RecordRow({ title, subtitle, value, divider = false }: RecordRowProps) {
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <View style={styles.recordIcon}>
        <TrophyIcon />
      </View>
      <View style={styles.text}>
        <Text style={styles.recordTitle}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.recordValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  badge: { width: 28, height: 28, borderRadius: radius.tag, alignItems: 'center', justifyContent: 'center' },
  badgeDefault: { backgroundColor: colors.bg },
  badgeSuperset: { backgroundColor: colors.accent },
  badgeLabel: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.text },
  badgeLabelSuperset: { fontSize: 12, color: colors.onAccent },
  text: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  setRow: { flexDirection: 'row', alignItems: 'center', height: 42 },
  setCell: { fontSize: 14, color: colors.text },
  setIndex: { width: 44, fontFamily: fonts.extrabold },
  setMain: { flex: 1, fontFamily: fonts.bold },
  setDuration: { width: 70, fontFamily: fonts.regular, color: colors.textMuted },
  setDone: { width: 50, fontFamily: fonts.bold, textAlign: 'right' },
  recordIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.chip,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  recordValue: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
});
