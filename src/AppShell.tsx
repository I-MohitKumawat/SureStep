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
 *
 * Auth: Firebase Auth (via AuthContext → onAuthStateChanged).
 *   No provider wrapper needed at this level — Firebase is initialized by the
 *   singleton in src/config/firebase.ts, which AuthContext imports directly.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider }        from './theme/ThemeContext';
import { AuthProvider }         from './context/AuthContext';
import { CaregiverProvider }    from './context/CaregiverContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { NotificationBanner }   from './components/shared/NotificationBanner';
import { RoleNavigator }        from './navigation/RoleNavigator';
import { useInterFonts }        from './theme/fonts';
import { C } from './theme/colors';

/** Inner shell — reads NotificationContext for the banner. */
const AppShellInner: React.FC = () => {
  const { banner, dismissBanner } = useNotifications();
  return (
    <>
      <NavigationContainer>
        <RoleNavigator />
      </NavigationContainer>
      <NotificationBanner
        visible={banner.visible}
        title={banner.title}
        body={banner.body}
        type={banner.type}
        onDismiss={dismissBanner}
      />
    </>
  );
};

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
      <ThemeProvider>
        <AuthProvider>
          <CaregiverProvider>
            <NotificationProvider>
              <SafeAreaProvider>
                <AppShellInner />
              </SafeAreaProvider>
            </NotificationProvider>
          </CaregiverProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
});

export default AppShell;
