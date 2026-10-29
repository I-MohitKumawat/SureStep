/**
 * SureStep — src/navigation/PatientNavigator.tsx
 * Stack navigator and Bottom Tab Navigator for PATIENT role.
 * Contexts mounted INSIDE this navigator (not globally in AppShell).
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { PatientStackParams, PatientTabParams } from '../types/navigation.types';

import { TaskProvider }         from '../context/TaskContext';
import { VoiceProvider }        from '../context/VoiceContext';
import { CognitionProvider }    from '../context/CognitionContext';
import { FamiliarityProvider }  from '../context/FamiliarityContext';
import { CaregiverProvider }    from '../context/CaregiverContext';

import { ReminderProvider }      from '../context/ReminderContext';
import { ReminderOverlay }       from '../components/shared/ReminderOverlay';

import { PatientHomeScreen }       from '../screens/patient/PatientHomeScreen';
import { PatientFamilyScreen }     from '../screens/patient/PatientFamilyScreen';
import { PatientCareScreen }       from '../screens/patient/PatientCareScreen';
import { PatientCareTeamScreen }   from '../screens/patient/PatientCareTeamScreen';
import { PatientActivitiesScreen } from '../screens/patient/PatientActivitiesScreen';
import { CareDiscoveryScreen }     from '../screens/patient/CareDiscoveryScreen';
import { CaregiverProfileScreen }  from '../screens/patient/CaregiverProfileScreen';
import { CareRequestScreen }       from '../screens/patient/CareRequestScreen';
import { PostCareNeedScreen }       from '../screens/patient/PostCareNeedScreen';
import { CareNeedResponsesScreen }   from '../screens/patient/CareNeedResponsesScreen';
import { CareRequestDetailScreen } from '../screens/shared/CareRequestDetailScreen';
import { CareRequestsListScreen }  from '../screens/shared/CareRequestsListScreen';
import { PatientBottomBar }        from '../components/shared/PatientBottomBar';
import { PatientPersonDetailScreen } from '../screens/patient/PatientPersonDetailScreen';
import { PatientMemoriesScreen }     from '../screens/patient/PatientMemoriesScreen';
import { PatientMemoryViewerScreen } from '../screens/patient/PatientMemoryViewerScreen';
import { PatientLanguageScreen }     from '../screens/patient/PatientLanguageScreen';
import { PatientConnectFamilyScreen } from '../screens/patient/PatientConnectFamilyScreen';
import { PatientLocationScreen }      from '../screens/patient/PatientLocationScreen';
import { PatientPersonalDetailsScreen } from '../screens/patient/PatientPersonalDetailsScreen';

import { PatientGamesScreen }      from '../screens/patient/PatientGamesScreen';
import { PatientStoriesScreen }    from '../screens/patient/PatientStoriesScreen';
import { PatientWorkoutScreen }    from '../screens/patient/PatientWorkoutScreen';
import { PatientRelaxingScreen }   from '../screens/patient/PatientRelaxingScreen';
import { PatientSettingsScreen }   from '../screens/patient/PatientSettingsScreen';
import { PatientAiScreen }         from '../screens/patient/PatientAiScreen';
import { ActivityDetailScreen }    from '../screens/patient/ActivityDetailScreen';
import { ActivityPlayScreen }      from '../screens/patient/ActivityPlayScreen';
import { ActivityReportsScreen }   from '../screens/patient/ActivityReportsScreen';
import { NotificationHistoryScreen }  from '../screens/shared/NotificationHistoryScreen';
import { NotificationSettingsScreen } from '../screens/shared/NotificationSettingsScreen';
import { NotificationTestScreen }     from '../screens/shared/NotificationTestScreen';
import { PatientProfileScreen }    from '../screens/shared/PatientProfileScreen';

import { CaregiverPatientRoutinesScreen } from '../screens/caregiver/CaregiverPatientRoutinesScreen';
import { CaregiverRoutineEditorScreen } from '../screens/caregiver/CaregiverRoutineEditorScreen';
import { usePatientCareMode } from '../hooks/usePatientCareMode';

const Stack = createNativeStackNavigator<PatientStackParams>();
const Tab = createBottomTabNavigator<PatientTabParams>();

/** Bottom tab navigator containing the 4 primary patient views. */
const PatientTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <PatientBottomBar {...props} />}
    screenOptions={{ headerShown: false }}
    initialRouteName="HomeTab"
  >
    <Tab.Screen name="HomeTab"       component={PatientHomeScreen as any} />
    <Tab.Screen name="FamilyTab"     component={PatientFamilyScreen as any} />
    <Tab.Screen name="ActivitiesTab" component={PatientActivitiesScreen as any} />
    <Tab.Screen name="CareTab"       component={PatientCareScreen as any} />
  </Tab.Navigator>
);

const PatientStack: React.FC = () => {
  const { isSelfManaged } = usePatientCareMode();

  return (
    <Stack.Navigator initialRouteName="PatientTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientTabs"             component={PatientTabs} />
      <Stack.Screen name="PatientHomeScreen"       component={PatientHomeScreen} />
      <Stack.Screen name="PatientCareScreen"       component={PatientCareScreen as any} />

      {/* Routine management & Caregiver discovery routes strictly reserved for Self-managed Patients */}
      {isSelfManaged && (
        <>
          <Stack.Screen name="PatientRoutinesScreen"         component={CaregiverPatientRoutinesScreen as any} />
          <Stack.Screen name="CaregiverRoutineEditorScreen" component={CaregiverRoutineEditorScreen as any} />
          <Stack.Screen name="CareDiscoveryScreen"           component={CareDiscoveryScreen} />
          <Stack.Screen name="CaregiverProfileScreen"        component={CaregiverProfileScreen} />
          <Stack.Screen name="CareRequestScreen"             component={CareRequestScreen} />
          <Stack.Screen name="PostCareNeedScreen"          component={PostCareNeedScreen} />
          <Stack.Screen name="CareNeedResponsesScreen"      component={CareNeedResponsesScreen} />
          <Stack.Screen name="CareRequestDetailScreen"       component={CareRequestDetailScreen} />
          <Stack.Screen name="CareRequestsListScreen"        component={CareRequestsListScreen} />
          <Stack.Screen name="PatientCareTeamScreen"         component={PatientCareTeamScreen} />
        </>
      )}

      {/* Common Patient Screens available to both Self-managed and Assisted Patients */}
      <Stack.Screen name="PatientGamesScreen"      component={PatientGamesScreen} />
      <Stack.Screen name="PatientStoriesScreen"    component={PatientStoriesScreen} />
      <Stack.Screen name="PatientActivitiesScreen" component={PatientActivitiesScreen} />
      <Stack.Screen name="PatientWorkoutScreen"    component={PatientWorkoutScreen} />
      <Stack.Screen name="PatientRelaxingScreen"   component={PatientRelaxingScreen} />
      <Stack.Screen name="PatientSettingsScreen"   component={PatientSettingsScreen} />
    <Stack.Screen name="PatientAiScreen"         component={PatientAiScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ActivityDetailScreen"    component={ActivityDetailScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="ActivityPlayScreen"      component={ActivityPlayScreen}   options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="ActivityReportsScreen"   component={ActivityReportsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="NotificationHistoryScreen"  component={NotificationHistoryScreen} />
    <Stack.Screen name="NotificationSettingsScreen" component={NotificationSettingsScreen} />
    <Stack.Screen name="NotificationTestScreen"     component={NotificationTestScreen} />
    <Stack.Screen name="PatientProfileScreen"    component={PatientProfileScreen} />
    <Stack.Screen name="PatientPersonalDetailsScreen" component={PatientPersonalDetailsScreen} />
    <Stack.Screen name="PatientPersonDetailScreen" component={PatientPersonDetailScreen} />
    <Stack.Screen name="PatientMemoriesScreen"     component={PatientMemoriesScreen} />
    <Stack.Screen name="PatientMemoryViewerScreen" component={PatientMemoryViewerScreen} />
    <Stack.Screen name="PatientLanguageScreen"     component={PatientLanguageScreen} />
    <Stack.Screen name="PatientConnectFamilyScreen" component={PatientConnectFamilyScreen} />
    <Stack.Screen name="PatientLocationScreen"      component={PatientLocationScreen} />
  </Stack.Navigator>
  );
};

export const PatientNavigator: React.FC = () => (
  <FamiliarityProvider>
    <CognitionProvider>
      <VoiceProvider>
        <TaskProvider>
          <CaregiverProvider>
            <ReminderProvider>
              <PatientStack />
              <ReminderOverlay />
            </ReminderProvider>
          </CaregiverProvider>
        </TaskProvider>
      </VoiceProvider>
    </CognitionProvider>
  </FamiliarityProvider>
);
