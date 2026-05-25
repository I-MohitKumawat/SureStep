/**
 * SureStep — src/navigation/AuthNavigator.tsx
 * Unauthenticated and onboarding flow.
 * Family members arrive here via deep link from invite URL.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../types/navigation.types';

// ── Screen imports ────────────────────────────────────────────────────────────
import { WelcomeScreen }       from '../screens/auth/WelcomeScreen';
import { PhoneAuthScreen }     from '../screens/auth/PhoneAuthScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import { InviteAcceptScreen }  from '../screens/auth/InviteAcceptScreen';

const Stack = createNativeStackNavigator<AuthStackParams>();

type Props = { initialRoute?: keyof AuthStackParams };

export const AuthNavigator: React.FC<Props> = ({ initialRoute = 'WelcomeScreen' }) => (
  <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WelcomeScreen"       component={WelcomeScreen} />
    <Stack.Screen name="PhoneAuthScreen"     component={PhoneAuthScreen} />
    <Stack.Screen name="RoleSelectionScreen" component={RoleSelectionScreen} />
    <Stack.Screen name="ProfileSetupScreen"  component={ProfileSetupScreen} />
    <Stack.Screen name="InviteAcceptScreen"  component={InviteAcceptScreen} />
  </Stack.Navigator>
);
