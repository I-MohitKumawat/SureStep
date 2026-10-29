/**
 * SureStep — src/theme/tokens.ts
 * Raw design tokens: spacing, border radius, font sizes, shadows, z-index.
 * Migrated from: packages/ui/theme/tokens.ts (extended with SureStep tokens).
 */

export type ColorMode = 'light' | 'dark';

// ─── Spacing Scale ───────────────────────────────────────────────────────────
export const spacing = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
  xxxl:48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const radius = {
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  full: 999,
} as const;

// ─── Font Sizes ──────────────────────────────────────────────────────────────
export const fontSize = {
  xs:   10,
  sm:   12,
  md:   14,
  lg:   16,
  xl:   18,
  xxl:  22,
  xxxl: 26,
  h2:   30,
  h1:   36,
} as const;

// ─── Typography Presets ──────────────────────────────────────────────────────
export const typography = {
  heading: { fontSize: 20, fontWeight: '600' as const },
  body:    { fontSize: 14, lineHeight: 20 },
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ─── Z-Index Scale ───────────────────────────────────────────────────────────
export const zIndex = {
  base:    0,
  card:    1,
  overlay: 10,
  modal:   20,
  toast:   30,
  sos:     40,  // SOS button always on top
} as const;

// ─── Theme Colors (light/dark) ───────────────────────────────────────────────
const lightColors = {
  background:    '#FAF8F5',
  surface:       '#FFFFFF',
  textPrimary:   '#161E1C',
  textSecondary: '#52605D',
  borderSubtle:  '#E5E0D8',
  accent:        '#0E7A67',
  error:         '#DC2626',
} as const;

const darkColors = {
  background:    '#121816',
  surface:       '#1C2422',
  textPrimary:   '#F5F7F6',
  textSecondary: '#9EABA7',
  borderSubtle:  '#2C3835',
  accent:        '#0E7A67',
  error:         '#DC2626',
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;

export type Theme = {
  mode:       ColorMode;
  colors:     ThemeColors;
  spacing:    typeof spacing;
  radius:     typeof radius;
  fontSize:   typeof fontSize;
  typography: typeof typography;
  shadow:     typeof shadow;
  zIndex:     typeof zIndex;
};

export const createTheme = (mode: ColorMode): Theme => ({
  mode,
  colors:     mode === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  fontSize,
  typography,
  shadow,
  zIndex,
});
