/**
 * SureStep — src/navigation/FamilyNavigator.tsx
 * Stack navigator and Bottom Tab Navigator for FAMILY role.
 *
 * Gate logic:
 *   - If FamilyContext has no linked patient → show FamilyLinkPatientScreen
 *   - Once linked → show FamilyTabs bottom tab navigator
 */
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { FamilyStackParams, FamilyTabParams } from '../types/navigation.types';
import { C } from '../theme/colors';

import { PatientStateProvider }    from '../context/PatientStateContext';
import { FamilyProvider, useFamilyContext } from '../context/FamilyContext';
import { TaskProvider }            from '../context/TaskContext';

import { FamilyLinkPatientScreen } from '../screens/family/FamilyLinkPatientScreen';
import { FamilyHomeScreen }        from '../screens/family/FamilyHomeScreen';
import { FamilyFeedScreen }        from '../screens/family/FamilyFeedScreen';
import { FamilyPatientOverviewScreen } from '../screens/family/FamilyPatientOverviewScreen';
import { FamilyPatientRoutinesScreen } from '../screens/family/FamilyPatientRoutinesScreen';
import { FamilyRoutineEditorScreen }   from '../screens/family/FamilyRoutineEditorScreen';
import { FamilyPeopleScreen }      from '../screens/family/FamilyPeopleScreen';
import { FamilyMapScreen }         from '../screens/family/FamilyMapScreen';
import { FamilyAlertsScreen }      from '../screens/family/FamilyAlertsScreen';
import { FamilyStoriesScreen }     from '../screens/family/FamilyStoriesScreen';
import { FamilyMessagesScreen }    from '../screens/family/FamilyMessagesScreen';
import { FamilySettingsScreen }    from '../screens/family/FamilySettingsScreen';
import { FamilyBottomBar }         from '../components/shared/FamilyBottomBar';

import { NotificationHistoryScreen } from '../screens/shared/NotificationHistoryScreen';
import { NotificationSettingsScreen } from '../screens/shared/NotificationSettingsScreen';
import { NotificationTestScreen }     from '../screens/shared/NotificationTestScreen';
import { PatientProfileScreen } from '../screens/shared/PatientProfileScreen';
import { CareDiscoveryScreen } from '../screens/patient/CareDiscoveryScreen';
import { CaregiverProfileScreen } from '../screens/patient/CaregiverProfileScreen';
import { CareRequestScreen } from '../screens/patient/CareRequestScreen';
import { CareRequestDetailScreen } from '../screens/shared/CareRequestDetailScreen';
import { CareRequestsListScreen } from '../screens/shared/CareRequestsListScreen';

const Stack = createNativeStackNavigator<FamilyStackParams>();
const Tab = createBottomTabNavigator<FamilyTabParams>();

/** Bottom tab navigator containing the 4 primary approved family views: Home | People | Alerts | Care */
const FamilyTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <FamilyBottomBar {...props} />}
    screenOptions={{ headerShown: false }}
    initialRouteName="HomeTab"
  >
    <Tab.Screen name="HomeTab"   component={FamilyHomeScreen} />
    <Tab.Screen name="PeopleTab" component={FamilyPeopleScreen} />
    <Tab.Screen name="AlertsTab" component={FamilyAlertsScreen} />
    <Tab.Screen name="CareTab"   component={CareRequestsListScreen as any} />
  </Tab.Navigator>
);

/** Inner stack — rendered after FamilyProvider is mounted so we can read context. */
const FamilyStack: React.FC = () => {
  const { hasPatient, isLoading } = useFamilyContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  // Always land on FamilyTabs so user sees the approved Family Home
  const initialRoute: keyof FamilyStackParams = 'FamilyTabs';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyTabs"                  component={FamilyTabs} />
      <Stack.Screen name="FamilyHomeScreen"            component={FamilyHomeScreen} />
      <Stack.Screen name="FamilyPatientOverviewScreen" component={FamilyPatientOverviewScreen} />
      <Stack.Screen name="FamilyPatientRoutinesScreen" component={FamilyPatientRoutinesScreen} />
      <Stack.Screen name="FamilyRoutineEditorScreen"   component={FamilyRoutineEditorScreen} />
      <Stack.Screen name="FamilyPeopleScreen"          component={FamilyPeopleScreen} />
      <Stack.Screen name="FamilyLinkPatientScreen"     component={FamilyLinkPatientScreen} />
      <Stack.Screen name="FamilyMapScreen"             component={FamilyMapScreen} />
      <Stack.Screen name="FamilyStoriesScreen"         component={FamilyStoriesScreen} />
      <Stack.Screen name="CareDiscoveryScreen"         component={CareDiscoveryScreen} />
      <Stack.Screen name="CaregiverProfileScreen"      component={CaregiverProfileScreen} />
      <Stack.Screen name="CareRequestScreen"           component={CareRequestScreen} />
      <Stack.Screen name="CareRequestDetailScreen"     component={CareRequestDetailScreen} />
      <Stack.Screen name="CareRequestsListScreen"      component={CareRequestsListScreen} />
      <Stack.Screen name="NotificationHistoryScreen"   component={NotificationHistoryScreen} />
      <Stack.Screen name="NotificationSettingsScreen"  component={NotificationSettingsScreen} />
      <Stack.Screen name="NotificationTestScreen"      component={NotificationTestScreen} />
      <Stack.Screen name="PatientProfileScreen"        component={PatientProfileScreen} />
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
