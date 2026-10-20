import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/theme';

type IconProps = {
  size?: number;
  color?: string;
};

type StrokeIconProps = IconProps & {
  strokeWidth?: number;
  children: ReactNode;
};

function StrokeIcon({ size = 22, color = colors.text, strokeWidth = 1.8, children }: StrokeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </Svg>
  );
}

// Two layers: accent outer flame, flameInner core. Always placed next to the streak number.
export function FlameIcon({ size = 20 }: Pick<IconProps, 'size'>) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M12 2c.6 3.2 3 4.8 4.6 7 1.4 1.9 2.4 3.9 2.4 6.2C19 19 15.9 22 12 22s-7-3-7-6.8c0-2.4 1.2-4.4 2.8-5.9.2 1.6 1 2.8 2.2 3.4-.3-3.9 1-7.4 2-10.7z"
        fill={colors.accent}
      />
      <Path
        d="M12 12.5c1.6 1.6 3 3 3 5a3 3 0 0 1-6 0c0-1.3.7-2.3 1.6-3 .2.8.6 1.3 1.2 1.6-.1-1.4.1-2.6.2-3.6z"
        fill={colors.flameInner}
      />
    </Svg>
  );
}

export function CheckIcon({ size = 13, color = colors.onAccent }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M2.5 6.2l2.3 2.3 4.7-5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={2.2} {...props}>
      <Path d="M12 5v14M5 12h14" />
    </StrokeIcon>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <StrokeIcon size={18} strokeWidth={2.2} {...props}>
      <Path d="M15 6l-6 6 6 6" />
    </StrokeIcon>
  );
}

export function TrophyIcon({ size = 18, color = colors.accent }: IconProps) {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <Path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
    </StrokeIcon>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <Rect x={3} y={3} width={7} height={9} rx={2} />
      <Rect x={14} y={3} width={7} height={5} rx={2} />
      <Rect x={14} y={12} width={7} height={9} rx={2} />
      <Rect x={3} y={16} width={7} height={5} rx={2} />
    </StrokeIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </StrokeIcon>
  );
}

export function ProgressIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <Path d="M3 21h18M6 17v-5M11 17V6M16 17v-8M20 17v-3" />
    </StrokeIcon>
  );
}

export function HabitsIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M8 12.5l2.7 2.7L16 9.5" />
    </StrokeIcon>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </StrokeIcon>
  );
}
