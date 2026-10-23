// Theme 8 "Light Sport". Single source of colors, fonts, spacing and radii.
// Never use raw hex values in components; use these tokens only.

export const colors = {
  bg: '#F4F4F1',
  surface: '#FFFFFF',
  border: '#E1E1DB',
  divider: '#EFEFEA',
  track: '#E8E8E2', // empty chart segments, rest-day bars
  inactive: '#C8C8C0', // unchecked checkbox border, toggle off

  text: '#141414',
  textMuted: '#5E5E58',
  textOnDarkMuted: '#B9B9B2',
  textDisabled: '#8A8A84',
  borderOnDark: '#4A4A44', // outlined badges on dark cards
  onAccent: '#FFFFFF',

  accent: '#C93C12',
  accentPressed: '#9E2E0C',
  accentSoft: '#FBE9E2', // planned days, superset tags
  accentMid: '#F2C3B0',
  flameInner: '#FFD3BF',
  flameMid: '#F26A1B', // animated dashboard flame: middle tongue
  flameCore: '#FFC94A', // animated dashboard flame: hot core
  flameGlow: '#FF8A4C', // animated dashboard flame: glow behind it
  accentOnDark: '#FFB59B', // accent labels on dark surfaces (set timer)
  live: '#FF6A3D', // "set in progress" dot on the dark set timer

  success: '#1B6B36', // completed days (text)
  successSoft: '#E2F1E6', // completed days (background)
  successBorder: '#A9D6B5', // calendar legend swatch
  growth: '#1F7A3A', // positive stat deltas (+6%, −4 min)
  danger: '#D92020', // missed workouts
  dangerText: '#C21B1B', // "missed" status label

  catWorkout: '#C93C12',
  catHabit: '#141414',
  catFood: '#D98A1C',
  catSleep: '#3B6EA8',

  heat: ['#EDEDE7', '#F2C3B0', '#E07D57', '#C93C12'] as const, // heatmap levels 0–3
  overlay: 'rgba(20,20,20,0.6)',
  onOverlay: '#E8E8E2', // text on the dimmed screen behind a bottom sheet

  // Illustration-only fills (empty states, rest tips).
  illustrationWater: '#8DB8E8',
  illustrationLeaf: '#2E8B57',
} as const;

// Font: Exo 2 (@expo-google-fonts/exo-2): 400, 600, 700, 800.
export const fonts = {
  regular: 'Exo2_400Regular',
  semibold: 'Exo2_600SemiBold',
  bold: 'Exo2_700Bold',
  extrabold: 'Exo2_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 52, lineHeight: 52 }, // streak number
  timer: { fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 64 },
  h1: { fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -0.5 },
  h1Date: { fontFamily: fonts.extrabold, fontSize: 26, letterSpacing: -0.3 },
  number: { fontFamily: fonts.extrabold, fontSize: 24 },
  h2: { fontFamily: fonts.bold, fontSize: 16 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15 },
  body: { fontFamily: fonts.semibold, fontSize: 14 },
  secondary: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' as const },
  tab: { fontFamily: fonts.semibold, fontSize: 11 },
} as const;

export const space = { xxs: 2, xs: 4, xs2: 6, sm: 8, sm2: 10, md: 12, md2: 14, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const screenPadding = 20;

export const radius = {
  cell: 2, // heatmap cells
  segment: 3, // segmented progress
  bar: 4, // bar chart
  checkbox: 7,
  tag: 8,
  chip: 10,
  input: 12,
  button: 14,
  card: 20,
  cardSmall: 16,
  panel: 18, // big stepper, set timer
  hero: 22,
  pill: 999,
} as const;

export const sizes = {
  touch: 44, // minimum touch target
  tabBar: 84,
  checkbox: 24,
  calendarDay: 36,
} as const;

export const theme = { colors, fonts, type, space, radius, sizes, screenPadding };
export type Theme = typeof theme;
