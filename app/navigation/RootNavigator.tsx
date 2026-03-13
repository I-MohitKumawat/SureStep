import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { CaregiverDashboardScreen } from '../screens/CaregiverDashboardScreen';
import { PatientDetailScreen } from '../screens/PatientDetailScreen';
import { RoutineManagerScreen } from '../screens/RoutineManagerScreen';
import { RoutineEditorScreen } from '../screens/RoutineEditorScreen';

import { DevRoleSwitchScreen } from '../screens/DevRoleSwitchScreen';
import { RoutineManagerScreen } from '../screens/RoutineManagerScreen';


import { useTheme } from '../../packages/ui/theme/ThemeProvider';

export type HomeStackParamList = {
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

export type MoreStackParamList = {
  More: undefined;
  DevRoleSwitch: undefined;
};

export type RootTabParamList = {
  HomeTab: undefined;
  MoreTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function HomeStackNavigator() {
  const theme = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: true,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
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

function MoreStackNavigator() {
  const theme = useTheme();

  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: true,
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <MoreStack.Screen name="More" component={MoreScreen} options={{ title: 'More' }} />
      {__DEV__ ? (
        <MoreStack.Screen
          name="DevRoleSwitch"
          component={DevRoleSwitchScreen}
          options={{ title: 'Dev role switch' }}
        />
      ) : null}
    </MoreStack.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderSubtle
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="MoreTab" component={MoreStackNavigator} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

