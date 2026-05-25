/**
 * SureStep — src/navigation/CaregiverNavigator.tsx
 * Stack navigator for CAREGIVER role.
 * Contexts mounted INSIDE this navigator only.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../types/navigation.types';

import { PatientStateProvider } from '../context/PatientStateContext';
import { TaskProvider }         from '../context/TaskContext';
import { AlertProvider }        from '../context/AlertContext';

import { CaregiverTriageScreen }          from '../screens/caregiver/CaregiverTriageScreen';
import { CaregiverPatientDetailScreen }   from '../screens/caregiver/CaregiverPatientDetailScreen';
import { CaregiverPatientMapScreen }      from '../screens/caregiver/CaregiverPatientMapScreen';
import { CaregiverPatientRoutinesScreen } from '../screens/caregiver/CaregiverPatientRoutinesScreen';
import { CaregiverPatientAlertsScreen }   from '../screens/caregiver/CaregiverPatientAlertsScreen';
import { CaregiverPatientShiftsScreen }   from '../screens/caregiver/CaregiverPatientShiftsScreen';
import { CaregiverRoutineEditorScreen }   from '../screens/caregiver/CaregiverRoutineEditorScreen';
import { CaregiverGeofenceEditorScreen }  from '../screens/caregiver/CaregiverGeofenceEditorScreen';
import { CaregiverShiftHandoverScreen }   from '../screens/caregiver/CaregiverShiftHandoverScreen';
import { CaregiverAlertFeedScreen }       from '../screens/caregiver/CaregiverAlertFeedScreen';
import { CaregiverCalendarScreen }        from '../screens/caregiver/CaregiverCalendarScreen';
import { CaregiverMessagesScreen }        from '../screens/caregiver/CaregiverMessagesScreen';
import { CaregiverWellbeingScreen }       from '../screens/caregiver/CaregiverWellbeingScreen';
import { CaregiverProfileEditScreen }     from '../screens/caregiver/CaregiverProfileEditScreen';
import { CaregiverSettingsScreen }        from '../screens/caregiver/CaregiverSettingsScreen';

const Stack = createNativeStackNavigator<CaregiverStackParams>();

const CaregiverStack: React.FC = () => (
  <Stack.Navigator initialRouteName="CaregiverTriageScreen" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CaregiverTriageScreen"          component={CaregiverTriageScreen} />
    <Stack.Screen name="CaregiverPatientDetailScreen"   component={CaregiverPatientDetailScreen} />
    <Stack.Screen name="CaregiverPatientMapScreen"      component={CaregiverPatientMapScreen} />
    <Stack.Screen name="CaregiverPatientRoutinesScreen" component={CaregiverPatientRoutinesScreen} />
    <Stack.Screen name="CaregiverPatientAlertsScreen"   component={CaregiverPatientAlertsScreen} />
    <Stack.Screen name="CaregiverPatientShiftsScreen"   component={CaregiverPatientShiftsScreen} />
    <Stack.Screen name="CaregiverRoutineEditorScreen"   component={CaregiverRoutineEditorScreen} />
    <Stack.Screen name="CaregiverGeofenceEditorScreen"  component={CaregiverGeofenceEditorScreen} />
    <Stack.Screen name="CaregiverShiftHandoverScreen"   component={CaregiverShiftHandoverScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="CaregiverAlertFeedScreen"       component={CaregiverAlertFeedScreen} />
    <Stack.Screen name="CaregiverCalendarScreen"        component={CaregiverCalendarScreen} />
    <Stack.Screen name="CaregiverMessagesScreen"        component={CaregiverMessagesScreen} />
    <Stack.Screen name="CaregiverWellbeingScreen"       component={CaregiverWellbeingScreen} />
    <Stack.Screen name="CaregiverProfileEditScreen"     component={CaregiverProfileEditScreen} />
    <Stack.Screen name="CaregiverSettingsScreen"        component={CaregiverSettingsScreen} />
  </Stack.Navigator>
);

export const CaregiverNavigator: React.FC = () => (
  <AlertProvider>
    <PatientStateProvider>
      <TaskProvider>
        <CaregiverStack />
      </TaskProvider>
    </PatientStateProvider>
  </AlertProvider>
);
