// Rest tips with illustrations, from docs/design/RestTip.dc.html. Sits directly on the background.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, fonts, space } from '@/theme/theme';

type Tip = { title: string; text: string; label: string; art: ReactNode };

const ink = colors.text;
const accent = colors.accent;

export const restTips: Tip[] = [
  {
    title: 'Ковтни води',
    text: 'Кілька ковтків між підходами, і сил на наступний вистачить.',
    label: 'Пляшка води підморгує',
    art: (
      <>
        <Rect x={49} y={12} width={22} height={13} rx={4} fill={ink} />
        <Rect x={42} y={23} width={36} height={66} rx={11} fill={colors.surface} stroke={ink} strokeWidth={2.5} />
        <Path d="M44.5 56q7.5-5 15.5 0t15.5 0V78a8.5 8.5 0 0 1-8.5 8.5H53A8.5 8.5 0 0 1 44.5 78z" fill={colors.illustrationWater} />
        <Circle cx={53} cy={42} r={2.6} fill={ink} />
        <Path d="M63 42h6" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
        <Path d="M54 49q6 4 12 0" fill="none" stroke={accent} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M88 26q3 5 0 8q-3-3 0-8z" fill={colors.illustrationWater} />
        <Path d="M30 38q2.5 4 0 6.5q-2.5-2.5 0-6.5z" fill={colors.illustrationWater} />
      </>
    ),
  },
  {
    title: 'Подихай',
    text: 'Вдих на 4 рахунки, видих на 6. Пульс заспокоїться швидше.',
    label: 'Кола дихання',
    art: (
      <>
        <Circle cx={60} cy={58} r={32} fill={colors.accentSoft} />
        <Circle cx={60} cy={58} r={21} fill={colors.accentMid} />
        <Circle cx={60} cy={58} r={11} fill={accent} />
        <Path d="M26 40a38 38 0 0 1 30-18" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M50 18l7 4-5 6" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M94 76a38 38 0 0 1-30 18" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
        <Path d="M70 98l-7-4 5-6" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: 'Відклади телефон',
    text: 'Стрічка непомітно з’їдає відпочинок. Таймер сам покличе.',
    label: 'Телефон спить',
    art: (
      <>
        <Rect x={40} y={18} width={40} height={76} rx={9} fill={ink} />
        <Rect x={44} y={26} width={32} height={58} rx={4} fill={colors.bg} />
        <Path d="M66 44a12 12 0 1 1-12-8a9 9 0 0 0 12 8z" fill={accent} />
        <SvgText x={84} y={30} fontFamily={fonts.extrabold} fontSize={16} fill={ink}>
          z
        </SvgText>
        <SvgText x={94} y={20} fontFamily={fonts.extrabold} fontSize={11} fill={ink}>
          z
        </SvgText>
        <Rect x={54} y={88} width={12} height={2.5} rx={1.25} fill={colors.textMuted} />
      </>
    ),
  },
  {
    title: 'Витри руки',
    text: 'Сухі долоні тримають гриф краще за будь-які рукавички.',
    label: 'Рушник на грифі',
    art: (
      <>
        <Rect x={12} y={32} width={96} height={6} rx={3} fill={ink} />
        <Rect x={14} y={20} width={10} height={30} rx={3} fill={accent} />
        <Rect x={96} y={20} width={10} height={30} rx={3} fill={accent} />
        <Path d="M42 30h36v54a6 6 0 0 1-6 6H48a6 6 0 0 1-6-6z" fill={colors.accentSoft} stroke={ink} strokeWidth={2.2} />
        <Path d="M42 70h36M42 76h36" stroke={accent} strokeWidth={2.5} />
      </>
    ),
  },
  {
    title: 'Згадай техніку',
    text: 'Одна підказка собі на підхід: «груди вперед» чи «коліна назовні».',
    label: 'Лампочка-ідея',
    art: (
      <>
        <Path
          d="M60 22a24 24 0 0 0-14 43c3 3 4 6 4 9h20c0-3 1-6 4-9a24 24 0 0 0-14-43z"
          fill={colors.flameInner}
          stroke={ink}
          strokeWidth={2.5}
        />
        <Rect x={50} y={76} width={20} height={12} rx={3} fill={ink} />
        <Path d="M54 92h12" stroke={ink} strokeWidth={3} strokeLinecap="round" />
        <Path d="M56 60l4-10 4 10" fill="none" stroke={accent} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M60 10v6M26 26l4 4M94 26l-4 4M18 50h6M96 50h6" stroke={accent} strokeWidth={2.6} strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Перемкни трек',
    text: 'Наступний підхід під улюблену пісню піде легше.',
    label: 'Навушники з нотами',
    art: (
      <>
        <Path d="M30 70V60a30 30 0 0 1 60 0v10" fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
        <Rect x={22} y={62} width={18} height={30} rx={7} fill={accent} />
        <Rect x={80} y={62} width={18} height={30} rx={7} fill={accent} />
        <Path d="M56 50V34l12-3v15" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={53} cy={51} r={4} fill={ink} />
        <Circle cx={65} cy={47} r={4} fill={ink} />
      </>
    ),
  },
  {
    title: 'Магнезія',
    text: 'Попереду важкий підхід? Натри руки, поки є час.',
    label: 'Миска з магнезією',
    art: (
      <>
        <Circle cx={46} cy={48} r={11} fill={colors.bg} stroke={colors.inactive} strokeWidth={2} />
        <Circle cx={62} cy={40} r={13} fill={colors.bg} stroke={colors.inactive} strokeWidth={2} />
        <Circle cx={77} cy={50} r={10} fill={colors.bg} stroke={colors.inactive} strokeWidth={2} />
        <Path d="M26 62h68a34 26 0 0 1-68 0z" fill={ink} />
        <Rect x={24} y={58} width={72} height={8} rx={4} fill={accent} />
      </>
    ),
  },
  {
    title: 'Послухай пульс',
    text: 'Дихання вирівнялось? Можна йти навіть трохи раніше.',
    label: 'Серце з лінією пульсу',
    art: (
      <>
        <Path d="M60 92C34 74 24 62 24 46a17 17 0 0 1 36-8a17 17 0 0 1 36 8c0 16-10 28-36 46z" fill={accent} />
        <Path
          d="M28 58h18l6-12 8 22 6-14 4 4h22"
          fill="none"
          stroke={colors.onAccent}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    title: 'Не сідай',
    text: 'Легка ходьба відновлює краще, ніж сидіння на лавці.',
    label: 'Кросівок у русі',
    art: (
      <>
        <Path d="M30 74c0-16 8-26 18-28l12 10c12 6 26 8 36 10c8 2 10 8 10 14H30z" fill={accent} />
        <Rect x={28} y={78} width={80} height={9} rx={4.5} fill={ink} />
        <Path d="M52 52l-5 7M59 57l-5 7M66 61l-4 7" stroke={colors.onAccent} strokeWidth={2.4} strokeLinecap="round" />
        <Path d="M8 60h14M4 70h16M10 80h12" stroke={ink} strokeWidth={2.6} strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'Уяви підхід',
    text: 'Прокрути в голові всі повтори. Мозок готує м’язи заздалегідь.',
    label: 'Мішень зі стрілою в центрі',
    art: (
      <>
        <Circle cx={56} cy={62} r={34} fill={colors.accentSoft} stroke={accent} strokeWidth={2} />
        <Circle cx={56} cy={62} r={22} fill={colors.surface} stroke={accent} strokeWidth={2} />
        <Circle cx={56} cy={62} r={10} fill={accent} />
        <Path d="M56 62L96 22" stroke={ink} strokeWidth={3} strokeLinecap="round" />
        <Path d="M90 16l8 0 0 8M96 22l6 0M96 22l0-6" fill="none" stroke={ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

export function RestTip({ index }: { index: number }) {
  const tip = restTips[((index % restTips.length) + restTips.length) % restTips.length];
  return (
    <View style={styles.tip}>
      <Svg width={120} height={110} viewBox="0 0 120 110" accessibilityLabel={tip.label}>
        <Circle cx={60} cy={58} r={48} fill={colors.surface} />
        {tip.art}
      </Svg>
      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.text}>{tip.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tip: { alignItems: 'center', gap: space.xs2, paddingHorizontal: space.sm },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textMuted, textAlign: 'center', maxWidth: 290 },
});
