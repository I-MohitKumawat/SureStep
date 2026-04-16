import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { DetailsScreen } from '../screens/DetailsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { CaregiverDashboardScreen } from '../screens/CaregiverDashboardScreen';
import { PatientDetailScreen } from '../screens/PatientDetailScreen';
import { RoutineManagerScreen } from '../screens/RoutineManagerScreen';
import { RoutineEditorScreen } from '../screens/RoutineEditorScreen';
import { CaregiverManageScreen } from '../screens/CaregiverManageScreen';
import { PatientFamilyScreen } from '../screens/PatientFamilyScreen';
import { PatientFamilyProfileScreen } from '../screens/PatientFamilyProfileScreen';
import { PatientActivitiesScreen } from '../screens/PatientActivitiesScreen';
import { PatientGamesScreen } from '../screens/PatientGamesScreen';
import { RoleEntryScreen } from '../screens/RoleEntryScreen';
import { PhoneAuthScreen } from '../screens/PhoneAuthScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

import { PatientRoleScreen } from '../screens/PatientRoleScreen';
import ProfileSetup from '../screens/ProfileSetup';
import ProfileView from '../screens/ProfileView';
import ProfileEdit from '../screens/ProfileEdit';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

export type HomeStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  RoleEntry: undefined;
  Home: undefined;
  Details: undefined;
  CaregiverDashboard: undefined;
  CaregiverManage: undefined;
  PatientDashboard: undefined;
  PatientFamily: undefined;
  PatientFamilyProfile: {
    name: string;
    role: string;
    photoUrl: string;
  };
  PatientActivities: undefined;
  PatientGames: undefined;

  Settings: undefined;

  ProfileSetup: {
    role: 'caregiver' | 'patient';
  };
  ProfileView: undefined;
  ProfileEdit: undefined;

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

function HomeStackNavigator({ initialRouteName }: { initialRouteName: keyof HomeStackParamList }) {
  const theme = useTheme();

  return (
    <HomeStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: true,
        contentStyle: { backgroundColor: theme.colors.background },
        // Native stack integrates with Android hardware back (pop until root, then exit).
        gestureEnabled: true,
        fullScreenGestureEnabled: true
      }}
    >
      <HomeStack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="PhoneAuth"
        component={PhoneAuthScreen}
        options={{ headerShown: false }}
      />
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
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="CaregiverManage"
        component={CaregiverManageScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="PatientDashboard"
        component={PatientRoleScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="PatientFamily"
        component={PatientFamilyScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="PatientFamilyProfile"
        component={PatientFamilyProfileScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="PatientActivities"
        component={PatientActivitiesScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="PatientGames"
        component={PatientGamesScreen}
        options={{ headerShown: false }}
      />

      <HomeStack.Screen name="Settings" component={MoreScreen} options={{ title: 'Settings' }} />

      <HomeStack.Screen name="ProfileSetup" component={ProfileSetup} options={{ title: 'Profile' }} />
      <HomeStack.Screen name="ProfileView" component={ProfileView} options={{ title: 'Profile' }} />
      <HomeStack.Screen name="ProfileEdit" component={ProfileEdit} options={{ title: 'Edit profile' }} />

      <HomeStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={({ route }) => ({
          title: route.params.name,
          headerBackTitle: 'Back'
        })}
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

export function RootNavigator({ initialRouteName = 'PhoneAuth' }: { initialRouteName?: keyof HomeStackParamList }) {
  return <HomeStackNavigator initialRouteName={initialRouteName} />;
}

