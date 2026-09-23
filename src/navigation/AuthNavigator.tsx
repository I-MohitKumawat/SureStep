import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../types/navigation.types';
import { useAuth } from '../context/AuthContext';

// ── Screen imports ────────────────────────────────────────────────────────────
import { WelcomeScreen }           from '../screens/auth/WelcomeScreen';
import { PhoneAuthScreen }         from '../screens/auth/PhoneAuthScreen';
import { RoleSelectionScreen }     from '../screens/auth/RoleSelectionScreen';
import ProfileSetupScreen          from '../screens/auth/ProfileSetupScreen';
import { PatientOnboardingScreen } from '../screens/auth/patient-onboarding/PatientOnboardingScreen';
import { FamilyOnboardingScreen }  from '../screens/auth/family-onboarding/FamilyOnboardingScreen';
import { CaregiverOnboardingScreen } from '../screens/auth/caregiver-onboarding/CaregiverOnboardingScreen';
import { InviteAcceptScreen }      from '../screens/auth/InviteAcceptScreen';

const Stack = createNativeStackNavigator<AuthStackParams>();

type Props = { initialRoute?: keyof AuthStackParams };

export const AuthNavigator: React.FC<Props> = () => {
  const { status, user } = useAuth();
  const isOnboarding = status === 'no_role' || status === 'no_profile';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboarding ? (
        <>
          <Stack.Screen name="WelcomeScreen"             component={WelcomeScreen} />
          <Stack.Screen name="PhoneAuthScreen"           component={PhoneAuthScreen} />
          <Stack.Screen name="InviteAcceptScreen"        component={InviteAcceptScreen} />
          <Stack.Screen name="PatientOnboardingScreen"   component={PatientOnboardingScreen} />
          <Stack.Screen name="FamilyOnboardingScreen"    component={FamilyOnboardingScreen} />
          <Stack.Screen name="CaregiverOnboardingScreen" component={CaregiverOnboardingScreen} />
        </>
      ) : status === 'no_profile' ? (
        <>
          {user?.role === 'PATIENT' ? (
            <>
              <Stack.Screen name="PatientOnboardingScreen"   component={PatientOnboardingScreen} initialParams={{ intent: 'RECEIVING_CARE' }} />
              <Stack.Screen name="FamilyOnboardingScreen"    component={FamilyOnboardingScreen} />
              <Stack.Screen name="CaregiverOnboardingScreen" component={CaregiverOnboardingScreen} />
              <Stack.Screen name="ProfileSetupScreen"        component={ProfileSetupScreen} />
            </>
          ) : user?.role === 'FAMILY' ? (
            <>
              <Stack.Screen name="FamilyOnboardingScreen"    component={FamilyOnboardingScreen} initialParams={{ intent: 'SUPPORTING_AS_FAMILY' }} />
              <Stack.Screen name="PatientOnboardingScreen"   component={PatientOnboardingScreen} />
              <Stack.Screen name="CaregiverOnboardingScreen" component={CaregiverOnboardingScreen} />
              <Stack.Screen name="ProfileSetupScreen"        component={ProfileSetupScreen} />
            </>
          ) : user?.role === 'CAREGIVER' ? (
            <>
              <Stack.Screen name="CaregiverOnboardingScreen" component={CaregiverOnboardingScreen} initialParams={{ intent: 'PROFESSIONAL_CAREGIVER' }} />
              <Stack.Screen name="PatientOnboardingScreen"   component={PatientOnboardingScreen} />
              <Stack.Screen name="FamilyOnboardingScreen"    component={FamilyOnboardingScreen} />
              <Stack.Screen name="ProfileSetupScreen"        component={ProfileSetupScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="ProfileSetupScreen"        component={ProfileSetupScreen} />
              <Stack.Screen name="PatientOnboardingScreen"   component={PatientOnboardingScreen} />
              <Stack.Screen name="FamilyOnboardingScreen"    component={FamilyOnboardingScreen} />
              <Stack.Screen name="CaregiverOnboardingScreen" component={CaregiverOnboardingScreen} />
            </>
          )}
          <Stack.Screen name="RoleSelectionScreen"     component={RoleSelectionScreen} />
          <Stack.Screen name="WelcomeScreen"           component={WelcomeScreen} />
          <Stack.Screen name="InviteAcceptScreen"      component={InviteAcceptScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="RoleSelectionScreen"     component={RoleSelectionScreen} />
          <Stack.Screen name="PatientOnboardingScreen" component={PatientOnboardingScreen} />
          <Stack.Screen name="FamilyOnboardingScreen"  component={FamilyOnboardingScreen} />
          <Stack.Screen name="CaregiverOnboardingScreen" component={CaregiverOnboardingScreen} />
          <Stack.Screen name="ProfileSetupScreen"      component={ProfileSetupScreen} />
          <Stack.Screen name="WelcomeScreen"           component={WelcomeScreen} />
          <Stack.Screen name="InviteAcceptScreen"      component={InviteAcceptScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
