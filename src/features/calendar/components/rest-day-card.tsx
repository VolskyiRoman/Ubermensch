import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

import { Card } from '@/components/ui';
import { colors, fonts, radius, sizes, space } from '@/theme/theme';

/** Dumbbell sleeping on a pillow, from docs/design/Calendar.dc.html. */
function SleepingDumbbell() {
  return (
    <Svg width={160} height={104} viewBox="0 0 160 112" accessibilityLabel="Гантель спить на подушці">
      <Rect x={20} y={74} width={120} height={30} rx={15} fill={colors.accentSoft} />
      <Rect x={30} y={80} width={100} height={4} rx={2} fill={colors.accentMid} />
      <Rect x={46} y={62} width={68} height={8} rx={4} fill={colors.text} />
      <Rect x={34} y={48} width={14} height={34} rx={4} fill={colors.accent} />
      <Rect x={112} y={48} width={14} height={34} rx={4} fill={colors.accent} />
      <Path d="M37 60q4 3 8 0M115 60q4 3 8 0" fill="none" stroke={colors.onAccent} strokeWidth={2} strokeLinecap="round" />
      <SvgText x={126} y={38} fontFamily={fonts.extrabold} fontSize={18} fill={colors.text}>
        Z
      </SvgText>
      <SvgText x={140} y={24} fontFamily={fonts.extrabold} fontSize={13} fill={colors.text}>
        z
      </SvgText>
      <SvgText x={149} y={13} fontFamily={fonts.extrabold} fontSize={10} fill={colors.text}>
        z
      </SvgText>
    </Svg>
  );
}

type RestDayCardProps = {
  onSchedule: () => void;
};

export function RestDayCard({ onSchedule }: RestDayCardProps) {
  return (
    <Card style={styles.card}>
      <SleepingDumbbell />
      <Text style={styles.title}>День відпочинку</Text>
      <Text style={styles.text}>Тренувань на цей день немає. М’язи теж ростуть, поки ти відпочиваєш.</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onSchedule}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>Призначити тренування</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: space.lg, paddingHorizontal: space.lg, alignItems: 'center', gap: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  text: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  button: {
    marginTop: space.xs,
    minHeight: sizes.touch,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.input,
    paddingHorizontal: space.lg,
  },
  pressed: { backgroundColor: colors.divider },
  buttonLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
