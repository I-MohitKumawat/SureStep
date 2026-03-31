import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { ThemeProvider, useTheme } from '../../packages/ui/theme/ThemeProvider';
import { AuthProvider } from '../../packages/core/auth/AuthContext';
import { RoleNavigator } from './navigation/RoleNavigator';
import { UserProfileProvider } from './context/userProfileContext.js';

enableScreens(true);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider initialMode="light">
          <UserProfileProvider>
            <SafeAreaProvider>
              <ThemedNavigation />
            </SafeAreaProvider>
          </UserProfileProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;

