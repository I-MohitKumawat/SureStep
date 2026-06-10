/**
 * SureStep — src/navigation/PatientNavigator.tsx
 * Stack navigator for PATIENT role. No bottom tab bar.
 * SosButton and OrientationStrip rendered as persistent overlays at navigator level.
 * Contexts mounted INSIDE this navigator (not globally in AppShell).
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PatientStackParams } from '../types/navigation.types';

import { TaskProvider }         from '../context/TaskContext';
import { VoiceProvider }        from '../context/VoiceContext';
import { CognitionProvider }    from '../context/CognitionContext';
import { FamiliarityProvider }  from '../context/FamiliarityContext';
import { CaregiverProvider }    from '../context/CaregiverContext';

import { PatientHomeScreen }       from '../screens/patient/PatientHomeScreen';
import { PatientGamesScreen }      from '../screens/patient/PatientGamesScreen';
import { PatientStoriesScreen }    from '../screens/patient/PatientStoriesScreen';
import { PatientActivitiesScreen } from '../screens/patient/PatientActivitiesScreen';
import { PatientWorkoutScreen }    from '../screens/patient/PatientWorkoutScreen';
import { PatientRelaxingScreen }   from '../screens/patient/PatientRelaxingScreen';
import { PatientSettingsScreen }   from '../screens/patient/PatientSettingsScreen';
import { PatientAiScreen }         from '../screens/patient/PatientAiScreen';
import { ActivityDetailScreen }    from '../screens/patient/ActivityDetailScreen';
import { ActivityPlayScreen }      from '../screens/patient/ActivityPlayScreen';
import { ActivityReportsScreen }   from '../screens/patient/ActivityReportsScreen';
import { NotificationHistoryScreen } from '../screens/shared/NotificationHistoryScreen';

const Stack = createNativeStackNavigator<PatientStackParams>();

const PatientStack: React.FC = () => (
  <Stack.Navigator initialRouteName="PatientHomeScreen" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PatientHomeScreen"       component={PatientHomeScreen} />
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
    <Stack.Screen name="NotificationHistoryScreen" component={NotificationHistoryScreen} />
  </Stack.Navigator>
);

export const PatientNavigator: React.FC = () => (
  <FamiliarityProvider>
    <CognitionProvider>
      <VoiceProvider>
        <TaskProvider>
          <CaregiverProvider>
            <PatientStack />
          </CaregiverProvider>
        </TaskProvider>
      </VoiceProvider>
    </CognitionProvider>
  </FamiliarityProvider>
);
