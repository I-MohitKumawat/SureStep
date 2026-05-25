/**
 * SureStep — src/navigation/DoctorNavigator.tsx
 * Read-only portal for DOCTOR role.
 * Migrated from: app/navigation/DoctorNavigator.tsx
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DoctorStackParams } from '../types/navigation.types';

import { DoctorPatientListScreen }      from '../screens/doctor/DoctorPatientListScreen';
import { DoctorCognitiveReportScreen }  from '../screens/doctor/DoctorCognitiveReportScreen';
import { DoctorAssessmentDetailScreen } from '../screens/doctor/DoctorAssessmentDetailScreen';

const Stack = createNativeStackNavigator<DoctorStackParams>();

export const DoctorNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="DoctorPatientListScreen" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DoctorPatientListScreen"      component={DoctorPatientListScreen} />
    <Stack.Screen name="DoctorCognitiveReportScreen"  component={DoctorCognitiveReportScreen} />
    <Stack.Screen name="DoctorAssessmentDetailScreen" component={DoctorAssessmentDetailScreen} />
  </Stack.Navigator>
);
