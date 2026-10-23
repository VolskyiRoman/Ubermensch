import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { colors, fonts, radius, space } from '@/theme/theme';

type DonutSegment = {
  color: string;
  done: boolean;
};

type DonutProps = {
  segments: DonutSegment[];
  label: string;
  caption?: string;
  labelSize?: number;
  size?: number;
  accessibilityLabel?: string;
};

const DONUT_VIEWBOX = 140;
const DONUT_RADIUS = 52;
const DONUT_STROKE = 16;
const DONUT_GAP = 3;

/** Day donut: one segment per item, category color when done, track otherwise. */
export function Donut({
  segments,
  label,
  caption,
  labelSize = 20,
  size = 96,
  accessibilityLabel = 'Кругова діаграма дня',
}: DonutProps) {
  const circumference = 2 * Math.PI * DONUT_RADIUS;
  const segmentLength = circumference / Math.max(segments.length, 1);
  const center = DONUT_VIEWBOX / 2;

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Svg width={size} height={size} viewBox={`0 0 ${DONUT_VIEWBOX} ${DONUT_VIEWBOX}`}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {segments.length === 0 && (
            <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none" stroke={colors.track} strokeWidth={DONUT_STROKE} />
          )}
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
        <Text style={[styles.donutLabel, { fontSize: labelSize, lineHeight: labelSize + 2 }]}>{label}</Text>
        {caption ? <Text style={styles.donutCaption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

type RestRingProps = {
  /** 0..1, remaining part of the rest. */
  progress: number;
  label: string;
  caption?: string;
  size?: number;
  labelSize?: number;
  /** Stroke width in the 260-unit view box. */
  strokeWidth?: number;
  accessibilityRole?: 'timer' | 'image';
  accessibilityLabel?: string;
};

const RING_VIEWBOX = 260;
const RING_RADIUS = 110;
const RING_STROKE = 18;

/** Progress ring: rest countdown, plan completion. */
export function RestRing({
  progress,
  label,
  caption,
  size = 96,
  labelSize = 20,
  strokeWidth = RING_STROKE,
  accessibilityRole = 'timer',
  accessibilityLabel,
}: RestRingProps) {
  const radius = RING_RADIUS;
  const circumference = 2 * Math.PI * radius;
  const center = RING_VIEWBOX / 2;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? `Таймер відпочинку, ${label}`}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${RING_VIEWBOX} ${RING_VIEWBOX}`}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke={colors.track} strokeWidth={strokeWidth} />
        {clamped > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * clamped} ${circumference}`}
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.ringLabel, { fontSize: labelSize, lineHeight: labelSize + 2 }]}>{label}</Text>
        {caption ? <Text style={styles.ringCaption}>{caption}</Text> : null}
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
  /** Levels 0–3, filled row by row; null leaves the cell empty. */
  levels: (number | null)[];
  columns: number;
  /** Fixed cell size; without it cells fill the available width. */
  cellSize?: number;
  accessibilityLabel?: string;
};

const HEAT_GAP = 3;
const DEFAULT_HEAT_CELL = 10;

export function Heatmap({ levels, columns, cellSize, accessibilityLabel }: HeatmapProps) {
  const [width, setWidth] = useState(0);
  const size = cellSize ?? (width > 0 ? (width - HEAT_GAP * (columns - 1)) / columns : DEFAULT_HEAT_CELL);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < levels.length; i += columns) rows.push(levels.slice(i, i + columns));

  return (
    <View
      style={styles.heatmap}
      onLayout={cellSize ? undefined : (e) => setWidth(e.nativeEvent.layout.width)}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {rows.map((row, r) => (
        <View key={r} style={styles.heatRow}>
          {row.map((level, c) => (
            <View
              key={c}
              style={{
                width: size,
                height: size,
                borderRadius: radius.cell,
                backgroundColor: level === null ? 'transparent' : colors.heat[Math.min(Math.max(level, 0), 3)],
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

type LineChartProps = {
  values: number[];
  width: number;
  height: number;
  /** Y axis labels on three gridlines (top, middle, bottom). */
  showGrid?: boolean;
  color?: string;
  /** Bottom labels under the first and last point. */
  startLabel?: string;
  endLabel?: string;
  formatTick?: (value: number) => string;
  accessibilityLabel: string;
};

const CHART_LEFT = 24;
const CHART_LABEL_HEIGHT = 18;

/** Line chart with the latest point highlighted. */
export function LineChart({
  values,
  width,
  height,
  showGrid = false,
  color = colors.accent,
  startLabel,
  endLabel,
  formatTick = (v) => String(Math.round(v)),
  accessibilityLabel,
}: LineChartProps) {
  const left = showGrid ? CHART_LEFT : 10;
  const right = width - 10;
  const top = 10;
  const bottom = height - (startLabel || endLabel ? CHART_LABEL_HEIGHT : 10);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = rawMax === rawMin ? Math.max(1, rawMax * 0.05) : 0;
  const min = rawMin - pad;
  const max = rawMax + pad;
  const x = (i: number) => (values.length === 1 ? (left + right) / 2 : left + 6 + (i / (values.length - 1)) * (right - left - 6));
  const y = (v: number) => bottom - ((v - min) / (max - min)) * (bottom - top);
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const last = values.length - 1;

  return (
    <Svg width={width} height={height} accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {showGrid &&
        [max, (max + min) / 2, min].map((v, i) => (
          <G key={i}>
            <Line x1={left} y1={y(v)} x2={right} y2={y(v)} stroke={i === 2 ? colors.border : colors.divider} strokeWidth={1} />
            <SvgText x={0} y={y(v) + 4} fontSize={10} fill={colors.textMuted} fontFamily={fonts.regular}>
              {formatTick(v)}
            </SvgText>
          </G>
        ))}
      {!showGrid && <Line x1={0} y1={bottom} x2={width} y2={bottom} stroke={colors.border} strokeWidth={1} />}
      {values.length > 1 && (
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {values.length > 0 && (
        <Circle cx={x(last)} cy={y(values[last])} r={5} fill={colors.accent} stroke={colors.surface} strokeWidth={2} />
      )}
      {startLabel && (
        <SvgText x={x(0)} y={height - 4} fontSize={10} fill={colors.textMuted} fontFamily={fonts.regular}>
          {startLabel}
        </SvgText>
      )}
      {endLabel && (
        <SvgText x={right} y={height - 4} fontSize={10} fill={colors.textMuted} fontFamily={fonts.regular} textAnchor="end">
          {endLabel}
        </SvgText>
      )}
    </Svg>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Tab-like switch, e.g. "Розрах. 1ПМ / Макс. вага / Об’єм". */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[styles.segmentedItem, selected && styles.segmentedItemSelected]}
          >
            <Text style={selected ? styles.segmentedLabelSelected : styles.segmentedLabel}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: { fontFamily: fonts.extrabold, color: colors.text },
  donutCaption: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  ringLabel: { fontFamily: fonts.extrabold, color: colors.text },
  ringCaption: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  segmented: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.chip, padding: 3 },
  segmentedItem: { flex: 1, borderRadius: radius.tag, paddingVertical: space.xs2 + 1, alignItems: 'center' },
  segmentedItemSelected: { backgroundColor: colors.surface },
  segmentedLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  segmentedLabelSelected: { fontFamily: fonts.bold, fontSize: 12, color: colors.text },
  segments: { flexDirection: 'row', gap: space.xs },
  segment: { flex: 1, height: 5, borderRadius: radius.segment },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs2 },
  bar: { flex: 1, borderRadius: radius.bar },
  heatmap: { gap: HEAT_GAP },
  heatRow: { flexDirection: 'row', gap: HEAT_GAP },
});
