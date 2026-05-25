/**
 * SureStep — src/navigation/FamilyNavigator.tsx
 * Stack navigator for FAMILY role.
 * Contexts mounted INSIDE this navigator only.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../types/navigation.types';

import { PatientStateProvider } from '../context/PatientStateContext';
import { AlertProvider }        from '../context/AlertContext';

import { FamilyFeedScreen }     from '../screens/family/FamilyFeedScreen';
import { FamilyMapScreen }      from '../screens/family/FamilyMapScreen';
import { FamilyAlertsScreen }   from '../screens/family/FamilyAlertsScreen';
import { FamilyStoriesScreen }  from '../screens/family/FamilyStoriesScreen';
import { FamilyMessagesScreen } from '../screens/family/FamilyMessagesScreen';
import { FamilySettingsScreen } from '../screens/family/FamilySettingsScreen';

const Stack = createNativeStackNavigator<FamilyStackParams>();

const FamilyStack: React.FC = () => (
  <Stack.Navigator initialRouteName="FamilyFeedScreen" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FamilyFeedScreen"     component={FamilyFeedScreen} />
    <Stack.Screen name="FamilyMapScreen"      component={FamilyMapScreen} />
    <Stack.Screen name="FamilyAlertsScreen"   component={FamilyAlertsScreen} />
    <Stack.Screen name="FamilyStoriesScreen"  component={FamilyStoriesScreen} />
    <Stack.Screen name="FamilyMessagesScreen" component={FamilyMessagesScreen} />
    <Stack.Screen name="FamilySettingsScreen" component={FamilySettingsScreen} />
  </Stack.Navigator>
);

export const FamilyNavigator: React.FC = () => (
  <AlertProvider>
    <PatientStateProvider>
      <FamilyStack />
    </PatientStateProvider>
  </AlertProvider>
);
