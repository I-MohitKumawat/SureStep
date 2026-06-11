/**
 * SureStep — src/navigation/FamilyNavigator.tsx
 * Stack navigator and Bottom Tab Navigator for FAMILY role.
 *
 * Gate logic:
 *   - If FamilyContext has no linked patient → show FamilyLinkPatientScreen
 *   - Once linked → show FamilyTabs bottom tab navigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { FamilyStackParams, FamilyTabParams } from '../types/navigation.types';

import { PatientStateProvider }    from '../context/PatientStateContext';
import { PatientTrackingProvider } from '../context/PatientTrackingContext';
import { AlertProvider }           from '../context/AlertContext';
import { FamilyProvider, useFamilyContext } from '../context/FamilyContext';
import { TaskProvider }            from '../context/TaskContext';

import { FamilyLinkPatientScreen } from '../screens/family/FamilyLinkPatientScreen';
import { FamilyFeedScreen }        from '../screens/family/FamilyFeedScreen';
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

const Stack = createNativeStackNavigator<FamilyStackParams>();
const Tab = createBottomTabNavigator<FamilyTabParams>();

/** Bottom tab navigator containing the main dashboard views. */
const FamilyTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <FamilyBottomBar {...props} />}
    screenOptions={{ headerShown: false }}
    initialRouteName="FamilyFeedScreen"
  >
    <Tab.Screen name="FamilyFeedScreen"     component={FamilyFeedScreen} />
    <Tab.Screen name="FamilyMapScreen"      component={FamilyMapScreen} />
    <Tab.Screen name="FamilyAlertsScreen"   component={FamilyAlertsScreen} />
    <Tab.Screen name="FamilyMessagesScreen" component={FamilyMessagesScreen} />
    <Tab.Screen name="FamilySettingsScreen" component={FamilySettingsScreen} />
  </Tab.Navigator>
);

/** Inner stack — rendered after FamilyProvider is mounted so we can read context. */
const FamilyStack: React.FC = () => {
  const { hasPatient, isLoading } = useFamilyContext();

  const initialRoute: keyof FamilyStackParams =
    !isLoading && !hasPatient ? 'FamilyLinkPatientScreen' : 'FamilyTabs';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyLinkPatientScreen" component={FamilyLinkPatientScreen} />
      <Stack.Screen name="FamilyTabs"              component={FamilyTabs} />
      <Stack.Screen name="FamilyStoriesScreen"     component={FamilyStoriesScreen} />
      <Stack.Screen name="NotificationHistoryScreen" component={NotificationHistoryScreen} />
      <Stack.Screen name="NotificationSettingsScreen" component={NotificationSettingsScreen} />
      <Stack.Screen name="NotificationTestScreen"     component={NotificationTestScreen} />
      <Stack.Screen name="PatientProfileScreen"    component={PatientProfileScreen} />
    </Stack.Navigator>
  );
};

export const FamilyNavigator: React.FC = () => (
  <AlertProvider>
    <PatientStateProvider>
      <PatientTrackingProvider>
        <TaskProvider>
          <FamilyProvider>
            <FamilyStack />
          </FamilyProvider>
        </TaskProvider>
      </PatientTrackingProvider>
    </PatientStateProvider>
  </AlertProvider>
);
