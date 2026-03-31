export type ColorMode = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
} as const;

export const typography = {
  heading: {
    fontSize: 20,
    fontWeight: '600' as const
  },
  body: {
    fontSize: 14,
    lineHeight: 20
  }
} as const;

const lightColors = {
  background: '#ffffff',
  surface: '#f8f9fb',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  borderSubtle: '#e0e0e0',
  accent: '#2563eb',
  error: '#dc2626'
} as const;

const darkColors = {
  background: '#020617',
  surface: '#020617',
  textPrimary: '#e5e7eb',
  textSecondary: '#9ca3af',
  borderSubtle: '#1f2933',
  accent: '#3b82f6',
  error: '#ef4444'
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;

export type Theme = {
  mode: ColorMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
};

export const createTheme = (mode: ColorMode): Theme => ({
  mode,
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing,
  typography
});

