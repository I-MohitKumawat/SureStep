/**
 * SureStep — src/navigation/FamilyNavigator.tsx
 * Stack and Bottom Tab navigator for FAMILY role.
 *
 * Architecture Updates:
 * - NO care circle gate: Family Home is ALWAYS accessible across all 4 states
 *   (State A: New account, State B: Circle with no patient, State C: 1 Patient, State D: Multi-patient).
 * - Canonical 4 bottom tabs: Home | People | Alerts | Care
 * - Comprehensive stack registration for Patient, Circle, Safety, Routine, and Care sub-flows.
 */
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { FamilyStackParams, FamilyTabParams } from '../types/navigation.types';
import { C } from '../theme/colors';

import { PatientStateProvider } from '../context/PatientStateContext';
import { FamilyProvider, useFamilyContext } from '../context/FamilyContext';
import { TaskProvider } from '../context/TaskContext';

// Tabs
import { FamilyHomeScreen } from '../screens/family/FamilyHomeScreen';
import { FamilyPeopleScreen } from '../screens/family/FamilyPeopleScreen';
import { FamilyAlertsScreen } from '../screens/family/FamilyAlertsScreen';
import { FamilyCareScreen } from '../screens/family/FamilyCareScreen';
import { FamilyBottomBar } from '../components/shared/FamilyBottomBar';

// Patient Sub-Flow Screens
import { PatientOverviewScreen } from '../screens/family/PatientOverviewScreen';
import { PatientRoutinesScreen } from '../screens/family/PatientRoutinesScreen';
import { PatientRoutineEditorScreen } from '../screens/family/PatientRoutineEditorScreen';
import { PatientSafetyScreen } from '../screens/family/PatientSafetyScreen';
import { PatientSafeZonesScreen } from '../screens/family/PatientSafeZonesScreen';
import { PatientSafeZoneEditorScreen } from '../screens/family/PatientSafeZoneEditorScreen';
import { PatientMemoriesScreen } from '../screens/family/PatientMemoriesScreen';
import { PatientMemoryViewerScreen } from '../screens/patient/PatientMemoryViewerScreen';

// Circle Management Sub-Flow
import { CreateCareCircleScreen } from '../screens/family/CreateCareCircleScreen';
import { JoinCareCircleScreen } from '../screens/family/JoinCareCircleScreen';
import { CareCircleManageScreen } from '../screens/family/CareCircleManageScreen';
import { CareCircleInviteScreen } from '../screens/family/CareCircleInviteScreen';
import { CareCirclePermissionsScreen } from '../screens/family/CareCirclePermissionsScreen';

// Incident & Alert Detail
import { AlertDetailScreen } from '../screens/family/AlertDetailScreen';

// Settings & Profile
import { FamilySettingsScreen } from '../screens/family/FamilySettingsScreen';
import { PatientProfileScreen } from '../screens/shared/PatientProfileScreen';

// Caregiver Sub-Flow
import { CareDiscoveryScreen } from '../screens/patient/CareDiscoveryScreen';
import { CaregiverProfileScreen } from '../screens/patient/CaregiverProfileScreen';
import { CareRequestScreen } from '../screens/patient/CareRequestScreen';
import { CareRequestDetailScreen } from '../screens/shared/CareRequestDetailScreen';
import { CareRequestsListScreen } from '../screens/shared/CareRequestsListScreen';
import { PostCareNeedScreen } from '../screens/patient/PostCareNeedScreen';
import { CareNeedResponsesScreen } from '../screens/patient/CareNeedResponsesScreen';

// Notifications
import { NotificationHistoryScreen } from '../screens/shared/NotificationHistoryScreen';
import { NotificationSettingsScreen } from '../screens/shared/NotificationSettingsScreen';
import { NotificationTestScreen } from '../screens/shared/NotificationTestScreen';

const Stack = createNativeStackNavigator<FamilyStackParams>();
const Tab = createBottomTabNavigator<FamilyTabParams>();

/** Bottom tab navigator containing the canonical 4 tabs. */
const FamilyTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <FamilyBottomBar {...props} />}
    screenOptions={{ headerShown: false }}
    initialRouteName="FamilyHomeTab"
  >
    <Tab.Screen name="FamilyHomeTab" component={FamilyHomeScreen} />
    <Tab.Screen name="FamilyPeopleTab" component={FamilyPeopleScreen} />
    <Tab.Screen name="FamilyAlertsTab" component={FamilyAlertsScreen} />
    <Tab.Screen name="FamilyCareTab" component={FamilyCareScreen} />
  </Tab.Navigator>
);

/** Inner stack — rendered after FamilyProvider is mounted so we can read context. */
const FamilyStack: React.FC = () => {
  const { isLoading } = useFamilyContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F5' }}>
        <ActivityIndicator size="large" color="#0E7A67" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName="FamilyTabs" screenOptions={{ headerShown: false }}>
      {/* Root Tabs */}
      <Stack.Screen name="FamilyTabs" component={FamilyTabs} />

      {/* Direct Tab screen registrations if navigated as standalone */}
      <Stack.Screen name="FamilyHomeScreen" component={FamilyHomeScreen} />
      <Stack.Screen name="FamilyPeopleScreen" component={FamilyPeopleScreen} />
      <Stack.Screen name="FamilyAlertsScreen" component={FamilyAlertsScreen} />
      <Stack.Screen name="FamilyCareScreen" component={FamilyCareScreen} />

      {/* Settings & Profile */}
      <Stack.Screen name="FamilySettingsScreen" component={FamilySettingsScreen} />
      <Stack.Screen name="PatientProfileScreen" component={PatientProfileScreen} />

      {/* Patient Sub-Flow */}
      <Stack.Screen name="PatientOverviewScreen" component={PatientOverviewScreen} />
      <Stack.Screen name="PatientRoutinesScreen" component={PatientRoutinesScreen} />
      <Stack.Screen name="PatientRoutineEditorScreen" component={PatientRoutineEditorScreen} />
      <Stack.Screen name="PatientSafetyScreen" component={PatientSafetyScreen} />
      <Stack.Screen name="PatientSafeZonesScreen" component={PatientSafeZonesScreen} />
      <Stack.Screen name="PatientSafeZoneEditorScreen" component={PatientSafeZoneEditorScreen} />
      <Stack.Screen name="PatientMemoriesScreen" component={PatientMemoriesScreen} />
      <Stack.Screen name="PatientMemoryViewerScreen" component={PatientMemoryViewerScreen as any} />

      {/* Care Circle Management */}
      <Stack.Screen name="CreateCareCircleScreen" component={CreateCareCircleScreen} />
      <Stack.Screen name="JoinCareCircleScreen" component={JoinCareCircleScreen} />
      <Stack.Screen name="CareCircleManageScreen" component={CareCircleManageScreen} />
      <Stack.Screen name="CareCircleInviteScreen" component={CareCircleInviteScreen} />
      <Stack.Screen name="CareCirclePermissionsScreen" component={CareCirclePermissionsScreen} />

      {/* Incident & Alert Detail */}
      <Stack.Screen name="AlertDetailScreen" component={AlertDetailScreen} />

      {/* Caregiver Discovery & Requests */}
      <Stack.Screen name="CareDiscoveryScreen" component={CareDiscoveryScreen} />
      <Stack.Screen name="CaregiverSearchScreen" component={CareDiscoveryScreen as any} />
      <Stack.Screen name="CaregiverProfileScreen" component={CaregiverProfileScreen} />
      <Stack.Screen name="CareRequestScreen" component={CareRequestScreen} />
      <Stack.Screen name="CareRequestDetailScreen" component={CareRequestDetailScreen} />
      <Stack.Screen name="CareRequestsListScreen" component={CareRequestsListScreen} />
      <Stack.Screen name="PostCareNeedScreen" component={PostCareNeedScreen} />
      <Stack.Screen name="CareNeedResponsesScreen" component={CareNeedResponsesScreen} />

      {/* Notifications */}
      <Stack.Screen name="NotificationHistoryScreen" component={NotificationHistoryScreen} />
      <Stack.Screen name="NotificationSettingsScreen" component={NotificationSettingsScreen} />
      <Stack.Screen name="NotificationTestScreen" component={NotificationTestScreen} />

      {/* Legacy Compatibility Aliases */}
      <Stack.Screen name="FamilyLinkPatientScreen" component={JoinCareCircleScreen as any} />
    </Stack.Navigator>
  );
};

export const FamilyNavigator: React.FC = () => (
  <PatientStateProvider>
    <TaskProvider>
      <FamilyProvider>
        <FamilyStack />
      </FamilyProvider>
    </TaskProvider>
  </PatientStateProvider>
);
