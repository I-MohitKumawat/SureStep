import React from 'react';
import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { ThemeProvider, useTheme } from '../../packages/ui/theme/ThemeProvider';
import { AuthProvider } from '../../packages/core/auth/AuthContext';
import { RoleNavigator } from './navigation/RoleNavigator';
import { UserProfileProvider } from './context/userProfileContext.js';

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
      <RoleNavigator />
    </NavigationContainer>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider initialMode="light">
        <UserProfileProvider>
          <ThemedNavigation />
        </UserProfileProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;

