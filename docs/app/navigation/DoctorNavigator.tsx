import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DoctorRoleScreen } from '../screens/DoctorRoleScreen';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

export type DoctorStackParamList = {
  DoctorMain: undefined;
};

const Stack = createNativeStackNavigator<DoctorStackParamList>();

/**
 * Doctor mode uses a native stack so Android hardware back and iOS back gestures
 * integrate with React Navigation (single root screen → back exits the app).
 */
export function DoctorNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: true,
        contentStyle: { backgroundColor: theme.colors.background },
        gestureEnabled: true,
        fullScreenGestureEnabled: true
      }}
    >
      <Stack.Screen
        name="DoctorMain"
        component={DoctorRoleScreen}
        options={{ title: 'Doctor' }}
      />
    </Stack.Navigator>
  );
}
