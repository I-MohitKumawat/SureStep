/**
 * SureStep — src/theme/ThemeContext.tsx
 * Light/dark theme provider. Single instance — wraps entire app in AppShell.
 * Migrated from: packages/ui/theme/ThemeProvider.tsx (converted to proper TSX)
 * Exports: ThemeProvider, useTheme, useThemePreference
 */
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { type ColorMode, type Theme, createTheme } from './tokens';

type ThemeContextValue = {
  theme:             Theme;
  modePreference:    'system' | ColorMode;
  setModePreference: (value: 'system' | ColorMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children:     ReactNode;
  initialMode?: 'system' | ColorMode;
};

export const ThemeProvider = ({ children, initialMode }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const [modePreference, setModePreference] = useState<'system' | ColorMode>(
    initialMode ?? 'system',
  );
  const resolvedMode: ColorMode =
    modePreference === 'system'
      ? systemScheme === 'dark' ? 'dark' : 'light'
      : modePreference;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: createTheme(resolvedMode), modePreference, setModePreference }),
    [resolvedMode, modePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Returns the active Theme object. Must be used inside ThemeProvider. */
export const useTheme = (): Theme => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx.theme;
};

/** Returns modePreference and the setter. */
export const useThemePreference = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used within a ThemeProvider');
  return { modePreference: ctx.modePreference, setModePreference: ctx.setModePreference };
};
