import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { ColorMode, Theme, createTheme } from './tokens';

// Some TS setups (especially with React 19 + bundled types) can disagree on the
// shape of the `react` module. We keep runtime usage correct and type our own API.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReactAny = require('react') as any;
const createContext = ReactAny.createContext as <T>(defaultValue: T) => any;
const useContext = ReactAny.useContext as <T>(ctx: any) => T;
const useMemo = ReactAny.useMemo as <T>(factory: () => T, deps: unknown[]) => T;
const useState = ReactAny.useState as <T>(initial: T) => [T, (next: T) => void];

type ThemeContextValue = {
  theme: Theme;
  modePreference: 'system' | ColorMode;
  setModePreference: (value: 'system' | ColorMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
  initialMode?: 'system' | ColorMode;
};

export const ThemeProvider = ({ children, initialMode }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const [modePreference, setModePreference] = useState<'system' | ColorMode>(initialMode ?? 'system');
  const resolvedMode: ColorMode =
    modePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : modePreference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: createTheme(resolvedMode),
      modePreference,
      setModePreference
    }),
    [resolvedMode, modePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  const ctx = useContext<ThemeContextValue | undefined>(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx.theme;
};

export const useThemePreference = () => {
  const ctx = useContext<ThemeContextValue | undefined>(ThemeContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within a ThemeProvider');
  }
  return { modePreference: ctx.modePreference, setModePreference: ctx.setModePreference };
};

