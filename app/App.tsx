import React from 'react';
import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { ThemeProvider, useTheme } from '../packages/ui/theme/ThemeProvider';

function ThemedNavigation() {
  const theme = useTheme();

  const navigationTheme: NavigationTheme = {
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.borderSubtle,
      notification: theme.colors.accent
    },
    fonts: {
      regular: { fontFamily: undefined as unknown as string, fontWeight: '400' },
      medium: { fontFamily: undefined as unknown as string, fontWeight: '500' },
      bold: { fontFamily: undefined as unknown as string, fontWeight: '700' },
      heavy: { fontFamily: undefined as unknown as string, fontWeight: '800' }
    }
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ThemedNavigation />
    </ThemeProvider>
  );
};

export default App;

