import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { CaregiverDashboardScreen } from '../screens/CaregiverDashboardScreen';
import { PatientDetailScreen } from '../screens/PatientDetailScreen';
import { RoutineManagerScreen } from '../screens/RoutineManagerScreen';
import { RoutineEditorScreen } from '../screens/RoutineEditorScreen';
import { DevRoleSwitchScreen } from '../screens/DevRoleSwitchScreen';
import { RoleEntryScreen } from '../screens/RoleEntryScreen';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

export type HomeStackParamList = {
  RoleEntry: undefined;
  Home: undefined;
  Details: undefined;
  CaregiverDashboard: undefined;
  PatientDetail: {
    patientId: string;
    name: string;
    relationship: string;
    adherencePercent: number;
    lastActivityLabel: string;
    hasRecentAlerts: boolean;
  };
  RoutineManager: {
    patientId: string;
    patientName: string;
  };
  RoutineEditor:
    | {
        patientId: string;
        patientName: string;
        mode: 'create';
      }
    | {
        patientId: string;
        patientName: string;
        mode: 'edit';
        routine: {
          id: string;
          patientId: string;
          name: string;
          isActive: boolean;
          scheduleLabel: string;
        };
      };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  const theme = useTheme();

  return (
    <HomeStack.Navigator
      initialRouteName="RoleEntry"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: true,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <HomeStack.Screen
        name="RoleEntry"
        component={RoleEntryScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen name="Details" component={DetailsScreen} options={{ title: 'Details' }} />
      <HomeStack.Screen
        name="CaregiverDashboard"
        component={CaregiverDashboardScreen}
        options={{ title: 'Caregiver dashboard' }}
      />
      <HomeStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Patient details' }}
      />
      <HomeStack.Screen
        name="RoutineManager"
        component={RoutineManagerScreen}
        options={{ title: 'Routines' }}
      />
      <HomeStack.Screen
        name="RoutineEditor"
        component={RoutineEditorScreen}
        options={{ title: 'Routine' }}
      />
    </HomeStack.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();

  return (
    <HomeStackNavigator />
  );
}

