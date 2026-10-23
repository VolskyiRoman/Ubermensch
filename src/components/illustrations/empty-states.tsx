// Empty-state illustrations, path data from docs/design/Habits.dc.html and Templates.dc.html.
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/theme';

/** Sprout in a pot with a check mark. */
export function SproutIllustration() {
  return (
    <Svg width={160} height={130} viewBox="0 0 160 130" accessibilityLabel="Паросток у вазоні з галочкою">
      <Circle cx={80} cy={66} r={58} fill={colors.bg} />
      <Path d="M80 86V44" stroke={colors.text} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={66} cy={62} rx={15} ry={7} rotation={-28} origin="66, 62" fill={colors.illustrationLeaf} />
      <Ellipse cx={94} cy={54} rx={15} ry={7} rotation={28} origin="94, 54" fill={colors.illustrationLeaf} />
      <Circle cx={80} cy={30} r={13} fill={colors.text} />
      <Path d="M74 30l4 4 8-8" fill="none" stroke={colors.onAccent} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={52} y={84} width={56} height={12} rx={4} fill={colors.accentPressed} />
      <Path d="M56 96h48l-6 26H62z" fill={colors.accent} />
      <Path d="M66 106h28" stroke={colors.flameInner} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Empty clipboard with a plus. */
export function ClipboardIllustration() {
  return (
    <Svg width={160} height={130} viewBox="0 0 160 130" accessibilityLabel="Порожній планшет для нотаток зі знаком плюс">
      <Circle cx={80} cy={66} r={58} fill={colors.bg} />
      <Rect x={46} y={22} width={68} height={92} rx={10} fill={colors.surface} stroke={colors.text} strokeWidth={2.5} />
      <Rect x={64} y={14} width={32} height={16} rx={5} fill={colors.text} />
      <Rect x={58} y={44} width={44} height={7} rx={3.5} fill={colors.track} />
      <Rect x={58} y={59} width={32} height={7} rx={3.5} fill={colors.track} />
      <Rect x={58} y={74} width={38} height={7} rx={3.5} fill={colors.track} />
      <Circle cx={114} cy={102} r={17} fill={colors.accent} />
      <Path d="M114 94v16M106 102h16" stroke={colors.onAccent} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
