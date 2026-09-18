import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../types/navigation.types';
import { useAuth } from '../context/AuthContext';

// ── Screen imports ────────────────────────────────────────────────────────────
import { WelcomeScreen }       from '../screens/auth/WelcomeScreen';
import { PhoneAuthScreen }     from '../screens/auth/PhoneAuthScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import ProfileSetupScreen      from '../screens/auth/ProfileSetupScreen';
import { InviteAcceptScreen }  from '../screens/auth/InviteAcceptScreen';

const Stack = createNativeStackNavigator<AuthStackParams>();

type Props = { initialRoute?: keyof AuthStackParams };

export const AuthNavigator: React.FC<Props> = () => {
  const { status } = useAuth();
  const isOnboarding = status === 'no_role' || status === 'no_profile';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboarding ? (
        <>
          <Stack.Screen name="WelcomeScreen"       component={WelcomeScreen} />
          <Stack.Screen name="PhoneAuthScreen"     component={PhoneAuthScreen} />
          <Stack.Screen name="InviteAcceptScreen"  component={InviteAcceptScreen} />
        </>
      ) : status === 'no_profile' ? (
        <>
          <Stack.Screen name="ProfileSetupScreen"  component={ProfileSetupScreen} />
          <Stack.Screen name="RoleSelectionScreen" component={RoleSelectionScreen} />
          <Stack.Screen name="WelcomeScreen"       component={WelcomeScreen} />
          <Stack.Screen name="InviteAcceptScreen"  component={InviteAcceptScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="RoleSelectionScreen" component={RoleSelectionScreen} />
          <Stack.Screen name="ProfileSetupScreen"  component={ProfileSetupScreen} />
          <Stack.Screen name="WelcomeScreen"       component={WelcomeScreen} />
          <Stack.Screen name="InviteAcceptScreen"  component={InviteAcceptScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
