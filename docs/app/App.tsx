import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { ThemeProvider, useTheme } from '../../packages/ui/theme/ThemeProvider';
import { AuthProvider } from '../../packages/core/auth/AuthContext';
import { RoleNavigator } from './navigation/RoleNavigator';
import { UserProfileProvider } from './context/userProfileContext.js';
import { TaskProvider } from './context/taskContext';
import { CaregiverProvider } from './context/caregiverContext';
import { useInterFonts } from './theme/fonts';
import { C } from './theme/colors';

enableScreens(true);

function ThemedNavigation() {
  const theme = useTheme();

  const navigationTheme: NavigationTheme = {
    dark: theme.mode === 'dark',
    colors: {
      primary: C.primary,
      background: C.bg,
      card: C.surface,
      text: C.textPrimary,
      border: C.border,
      notification: C.primary,
    },
    fonts: {
      regular:  { fontFamily: 'Inter_400Regular',  fontWeight: '400' },
      medium:   { fontFamily: 'Inter_500Medium',   fontWeight: '500' },
      bold:     { fontFamily: 'Inter_700Bold',     fontWeight: '700' },
      heavy:    { fontFamily: 'Inter_800ExtraBold',fontWeight: '800' },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <RoleNavigator />
    </NavigationContainer>
  );
}

const App: React.FC = () => {
  const fontsLoaded = useInterFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider initialMode="light">
          <UserProfileProvider>
            <TaskProvider>
              <CaregiverProvider>
                <SafeAreaProvider>
                  <ThemedNavigation />
                </SafeAreaProvider>
              </CaregiverProvider>
            </TaskProvider>
          </UserProfileProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;
