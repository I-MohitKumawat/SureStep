/**
 * SureStep — src/AppShell.tsx
 * Root wrapper for the entire app. Mounted once in App.tsx.
 * Provider order (outermost → innermost):
 *   GestureHandlerRootView → ThemeProvider → AuthProvider → NotificationProvider
 *   → SafeAreaProvider → NavigationContainer → RoleNavigator
 *
 * Context mounting rules:
 *   - AuthProvider: global (needed before NavigationContainer renders)
 *   - NotificationProvider: global (FCM token registered before any screen renders)
 *   - PatientStateProvider, TaskProvider, etc.: mounted INSIDE role navigators, NOT here.
 *     This enforces data isolation — a family member never touches task state.
 *
 * Font loading:
 *   - useInterFonts() blocks rendering until Inter is loaded.
 *   - AppLoading shows the splash screen while fonts are loading.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

import { ThemeProvider }        from './theme/ThemeContext';
import { AuthProvider }         from './context/AuthContext';
import { CaregiverProvider }    from './context/CaregiverContext';
import { NotificationProvider } from './context/NotificationContext';
import { RoleNavigator }        from './navigation/RoleNavigator';
import { useInterFonts }        from './theme/fonts';
import { C } from './theme/colors';

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

if (!publishableKey) {
  console.warn('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables.');
}

const AppShell: React.FC = () => {
  const fontsLoaded = useInterFonts();

  // Block render until Inter is loaded to prevent FOUT (Flash of Unstyled Text)
  if (!fontsLoaded) {
    return (
      <View style={s.splash}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={s.root}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ThemeProvider>
          <AuthProvider>
            <CaregiverProvider>
              <NotificationProvider>
                <SafeAreaProvider>
                  <NavigationContainer>
                    <RoleNavigator />
                  </NavigationContainer>
                </SafeAreaProvider>
              </NotificationProvider>
            </CaregiverProvider>
          </AuthProvider>
        </ThemeProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
});

export default AppShell;
