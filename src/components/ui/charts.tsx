import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors, fonts, radius, space } from '@/theme/theme';

type DonutSegment = {
  color: string;
  done: boolean;
};

type DonutProps = {
  segments: DonutSegment[];
  label: string;
  size?: number;
  accessibilityLabel?: string;
};

const DONUT_VIEWBOX = 140;
const DONUT_RADIUS = 52;
const DONUT_STROKE = 16;
const DONUT_GAP = 3;

/** Day donut: one segment per item, category color when done, track otherwise. */
export function Donut({ segments, label, size = 96, accessibilityLabel = 'Кругова діаграма дня' }: DonutProps) {
  const circumference = 2 * Math.PI * DONUT_RADIUS;
  const segmentLength = circumference / Math.max(segments.length, 1);
  const center = DONUT_VIEWBOX / 2;

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} viewBox={`0 0 ${DONUT_VIEWBOX} ${DONUT_VIEWBOX}`}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {segments.map((segment, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={DONUT_RADIUS}
              fill="none"
              stroke={segment.done ? segment.color : colors.track}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${segmentLength - DONUT_GAP} ${circumference}`}
              strokeDashoffset={-i * segmentLength}
            />
          ))}
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={styles.donutLabel}>{label}</Text>
      </View>
    </View>
  );
}

type RestRingProps = {
  /** 0..1, remaining part of the rest. */
  progress: number;
  label: string;
  size?: number;
  labelSize?: number;
};

const RING_VIEWBOX = 260;
const RING_RADIUS = 110;
const RING_STROKE = 18;

export function RestRing({ progress, label, size = 96, labelSize = 20 }: RestRingProps) {
  const circumference = 2 * Math.PI * RING_RADIUS;
  const center = RING_VIEWBOX / 2;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="timer" accessibilityLabel={`Таймер відпочинку, ${label}`}>
      <Svg width={size} height={size} viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}>
        <Circle cx={center} cy={center} r={RING_RADIUS} fill="none" stroke={colors.track} strokeWidth={RING_STROKE} />
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.accent}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${circumference * clamped} ${circumference}`}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.ringLabel, { fontSize: labelSize }]}>{label}</Text>
      </View>
    </View>
  );
}

type SegmentProgressProps = {
  total: number;
  done: number;
};

/** Segmented progress, e.g. sets done in an exercise. */
export function SegmentProgress({ total, done }: SegmentProgressProps) {
  return (
    <View style={styles.segments} accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: done }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.segment, { backgroundColor: i < done ? colors.accent : colors.border }]} />
      ))}
    </View>
  );
}

type Bar = {
  value: number;
  color?: string;
};

type BarChartProps = {
  bars: Bar[];
  height?: number;
};

const EMPTY_BAR_HEIGHT = 4;

export function BarChart({ bars, height = 56 }: BarChartProps) {
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <View style={[styles.bars, { height }]}>
      {bars.map((bar, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            bar.value > 0
              ? { height: (bar.value / max) * height, backgroundColor: bar.color ?? colors.accent }
              : { height: EMPTY_BAR_HEIGHT, backgroundColor: colors.track },
          ]}
        />
      ))}
    </View>
  );
}

type HeatmapProps = {
  /** Levels 0–3, filled row by row. */
  levels: number[];
  columns: number;
  cellSize?: number;
};

const HEAT_GAP = 3;

export function Heatmap({ levels, columns, cellSize = 10 }: HeatmapProps) {
  const rows: number[][] = [];
  for (let i = 0; i < levels.length; i += columns) rows.push(levels.slice(i, i + columns));

  return (
    <View style={styles.heatmap}>
      {rows.map((row, r) => (
        <View key={r} style={styles.heatRow}>
          {row.map((level, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: radius.cell,
                backgroundColor: colors.heat[Math.min(Math.max(level, 0), 3)],
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  ringLabel: { fontFamily: fonts.extrabold, color: colors.text },
  segments: { flexDirection: 'row', gap: space.xs },
  segment: { flex: 1, height: 5, borderRadius: radius.segment },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs2 },
  bar: { flex: 1, borderRadius: radius.bar },
  heatmap: { gap: HEAT_GAP },
  heatRow: { flexDirection: 'row', gap: HEAT_GAP },
});
