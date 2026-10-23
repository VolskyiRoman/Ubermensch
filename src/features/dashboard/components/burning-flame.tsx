import { useEffect, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors, radius } from '@/theme/theme';

const OUTER = 'M12 2c.6 3.2 3 4.8 4.6 7 1.4 1.9 2.4 3.9 2.4 6.2C19 19 15.9 22 12 22s-7-3-7-6.8c0-2.4 1.2-4.4 2.8-5.9.2 1.6 1 2.8 2.2 3.4-.3-3.9 1-7.4 2-10.7z';
const MIDDLE = 'M12 6.5c.8 2.3 2.5 3.6 3.5 5.2.9 1.3 1.5 2.7 1.5 4.2 0 3.4-2.2 6.1-5 6.1s-5-2.7-5-6.1c0-1.8.9-3.3 2.1-4.3.2 1.2.8 2 1.6 2.4-.2-2.6.4-5 1.3-7.5z';
const CORE = 'M12 12.5c1.6 1.6 3 3 3 5a3 3 0 0 1-6 0c0-1.3.7-2.3 1.6-3 .2.8.6 1.3 1.2 1.6-.1-1.4.1-2.6.2-3.6z';

const lit = { outer: colors.accent, middle: colors.flameMid, core: colors.flameCore };
// Not a perfect day yet: the flame only smoulders.
const smouldering = { outer: colors.accentMid, middle: colors.flameInner, core: colors.accentSoft };

/** Each tongue flickers at its own pace so the motion never looks like a loop. */
const FLICKER_MS = { outer: 900, middle: 640, core: 470, glow: 1500 };
const SMOULDER_MS = 2400;
const EMBER_MS = 1800;
const EMBERS = [
  { x: -0.14, delay: 0 },
  { x: 0.12, delay: 650 },
  { x: -0.02, delay: 1250 },
];

function loop(value: SharedValue<number>, duration: number, delay = 0, reverse = true) {
  value.value = 0;
  value.value = withDelay(
    delay,
    withRepeat(withTiming(1, { duration, easing: reverse ? Easing.inOut(Easing.sin) : Easing.out(Easing.quad) }), -1, reverse),
  );
}

type BurningFlameProps = {
  size: number;
  /** Today is a perfect day: the flame burns with glow and embers. */
  burning: boolean;
};

/** Animated flame of the "Ідеальний день" card on the dashboard. */
export function BurningFlame({ size, burning }: BurningFlameProps) {
  const reduceMotion = useReducedMotion();
  const outer = useSharedValue(0.5);
  const middle = useSharedValue(0.5);
  const core = useSharedValue(0.5);
  const glow = useSharedValue(0.5);
  const ember0 = useSharedValue(0);
  const ember1 = useSharedValue(0);
  const ember2 = useSharedValue(0);
  const embers = [ember0, ember1, ember2];

  useEffect(() => {
    const all = [outer, middle, core, glow, ember0, ember1, ember2];
    all.forEach(cancelAnimation);
    if (reduceMotion) {
      [outer, middle, core, glow].forEach((v) => (v.value = 0.5));
      return;
    }
    if (burning) {
      loop(outer, FLICKER_MS.outer);
      loop(middle, FLICKER_MS.middle, 120);
      loop(core, FLICKER_MS.core, 60);
      loop(glow, FLICKER_MS.glow);
      [ember0, ember1, ember2].forEach((v, i) => loop(v, EMBER_MS, EMBERS[i].delay, false));
    } else {
      loop(outer, SMOULDER_MS);
      loop(middle, SMOULDER_MS, 300);
      loop(core, SMOULDER_MS, 600);
    }
    return () => all.forEach(cancelAnimation);
  }, [burning, reduceMotion, outer, middle, core, glow, ember0, ember1, ember2]);

  // Amplitudes: a perfect day flickers hard, otherwise the flame barely breathes.
  const amp = burning ? 1 : 0.25;

  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: 1 + 0.07 * amp * outer.value },
      { scaleX: 1 - 0.03 * amp * outer.value },
      { skewX: `${(outer.value - 0.5) * 6 * amp}deg` },
    ],
  }));
  const middleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.94 + 0.14 * amp * middle.value }, { rotate: `${(0.5 - middle.value) * 8 * amp}deg` }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + 0.16 * amp * core.value }, { translateY: (1 - core.value) * amp }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.4 * glow.value,
    transform: [{ scale: 0.9 + 0.2 * glow.value }],
  }));

  const palette = burning ? lit : smouldering;
  const glowSize = size * 1.7;

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {burning && (
        <Animated.View
          style={[
            styles.layer,
            { width: glowSize, height: glowSize, left: (size - glowSize) / 2, top: (size - glowSize) / 2 + size * 0.1 },
            glowStyle,
          ]}
        >
          <Svg width={glowSize} height={glowSize} viewBox="0 0 24 24">
            <Defs>
              <RadialGradient id="flameGlow" cx="12" cy="12" r="12" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={colors.flameGlow} stopOpacity={0.55} />
                <Stop offset="1" stopColor={colors.flameGlow} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="12" cy="12" r="12" fill="url(#flameGlow)" />
          </Svg>
        </Animated.View>
      )}

      {burning &&
        embers.map((value, i) => <Ember key={i} value={value} size={size} x={EMBERS[i].x} />)}

      <FlameLayer size={size} d={OUTER} color={palette.outer} style={outerStyle} />
      <FlameLayer size={size} d={MIDDLE} color={palette.middle} style={middleStyle} />
      <FlameLayer size={size} d={CORE} color={palette.core} style={coreStyle} />
    </View>
  );
}

type FlameLayerProps = {
  size: number;
  d: string;
  color: string;
  style: ComponentProps<typeof Animated.View>['style'];
};

function FlameLayer({ size, d, color, style }: FlameLayerProps) {
  return (
    <Animated.View style={[styles.layer, styles.fromBase, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={d} fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** A spark that rises from the tip of the flame and fades out. */
function Ember({ value, size, x }: { value: SharedValue<number>; size: number; x: number }) {
  const dot = Math.max(3, size * 0.08);
  const style = useAnimatedStyle(() => {
    const t = value.value;
    return {
      opacity: t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85,
      transform: [{ translateY: -size * 0.6 * t }, { translateX: x * size * t }, { scale: 1 - 0.6 * t }],
    };
  });
  return (
    <Animated.View
      style={[
        styles.layer,
        styles.ember,
        { width: dot, height: dot, left: size / 2 - dot / 2, top: size * 0.15 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
  // Flames stretch and sway from their base, not their center.
  fromBase: { transformOrigin: '50% 92%' },
  ember: { borderRadius: radius.pill, backgroundColor: colors.flameCore },
});
