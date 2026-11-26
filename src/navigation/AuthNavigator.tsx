
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../types/navigation.types';
import { useAuth } from '../context/AuthContext';

import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { PhoneAuthScreen } from '../screens/auth/PhoneAuthScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

import { PatientOnboardingScreen } from '../screens/auth/patient-onboarding/PatientOnboardingScreen';
import { FamilyOnboardingScreen } from '../screens/auth/family-onboarding/FamilyOnboardingScreen';
import { CaregiverOnboardingScreen } from '../screens/auth/caregiver-onboarding/CaregiverOnboardingScreen';

const Stack = createNativeStackNavigator<AuthStackParams>();

type Props = {
  initialRoute?: keyof AuthStackParams;
};

export const AuthNavigator: React.FC<Props> = ({
  initialRoute,
}) => {
  const { status, user } = useAuth();

  const isOnboarding =
    status === 'no_role' ||
    status === 'no_profile';

  let initialRouteName: keyof AuthStackParams =
    'WelcomeScreen';

  // New user after successful phone verification.
  if (status === 'no_role') {
    initialRouteName = 'RoleSelectionScreen';
  }

  // Existing user with an incomplete profile.
  else if (status === 'no_profile') {
    switch (user?.role) {
      case 'PATIENT':
        initialRouteName = 'PatientOnboardingScreen';
        break;

      case 'FAMILY':
        initialRouteName = 'FamilyOnboardingScreen';
        break;

      case 'CAREGIVER':
        initialRouteName = 'CaregiverOnboardingScreen';
        break;

      default:
        initialRouteName = 'ProfileSetupScreen';
        break;
    }
  }

  // Allow supported initial routes before authentication.
  else if (
    initialRoute === 'WelcomeScreen' ||
    initialRoute === 'PhoneAuthScreen'
  ) {
    initialRouteName = initialRoute;
  }

  return (
    <Stack.Navigator
      key={isOnboarding ? 'onboarding' : 'authentication'}
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isOnboarding ? (
        <>
          <Stack.Screen
            name="WelcomeScreen"
            component={WelcomeScreen}
          />

          <Stack.Screen
            name="PhoneAuthScreen"
            component={PhoneAuthScreen}
          />

          <Stack.Screen
            name="PatientOnboardingScreen"
            component={PatientOnboardingScreen}
          />

          <Stack.Screen
            name="FamilyOnboardingScreen"
            component={FamilyOnboardingScreen}
          />

          <Stack.Screen
            name="CaregiverOnboardingScreen"
            component={CaregiverOnboardingScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="RoleSelectionScreen"
            component={RoleSelectionScreen}
          />

          <Stack.Screen
            name="PatientOnboardingScreen"
            component={PatientOnboardingScreen}
            initialParams={{
              intent: 'RECEIVING_CARE',
            }}
          />

          <Stack.Screen
            name="FamilyOnboardingScreen"
            component={FamilyOnboardingScreen}
            initialParams={{
              intent: 'SUPPORTING_AS_FAMILY',
            }}
          />

          <Stack.Screen
            name="CaregiverOnboardingScreen"
            component={CaregiverOnboardingScreen}
            initialParams={{
              intent: 'PROFESSIONAL_CAREGIVER',
            }}
          />

          <Stack.Screen
            name="ProfileSetupScreen"
            component={ProfileSetupScreen}
          />

          <Stack.Screen
            name="WelcomeScreen"
            component={WelcomeScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
