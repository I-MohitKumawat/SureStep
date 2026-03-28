import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootNavigator } from './RootNavigator';
import { DoctorNavigator } from './DoctorNavigator';
import { useAuth } from '../../../packages/core/auth/AuthContext';
import { useUserProfile } from '../context/userProfileContext';
import { ProfileLoadingScreen } from '../screens/ProfileLoadingScreen';

const ProfileLoadingStack = createNativeStackNavigator<{ ProfileLoading: undefined }>();

function ProfileLoadingNavigator() {
  return (
    <ProfileLoadingStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileLoadingStack.Screen name="ProfileLoading" component={ProfileLoadingScreen} />
    </ProfileLoadingStack.Navigator>
  );
}

export const RoleNavigator: React.FC = () => {
  const { auth } = useAuth();
  const { profileLoading, hasProfileForRouting } = useUserProfile();

  if (auth.status !== 'authenticated') {
    return <RootNavigator initialRouteName="PhoneAuth" />;
  }

  const userRole = auth.user?.role;

  if (userRole === 'DOCTOR') {
    return <DoctorNavigator />;
  }

  if (profileLoading) {
    return <ProfileLoadingNavigator />;
  }

  const initialRouteName = !hasProfileForRouting
    ? 'ProfileSetup'
    : userRole === 'PATIENT'
      ? 'PatientDashboard'
      : 'CaregiverDashboard';

  return (
    <RootNavigator
      key={`${userRole ?? 'unknown'}-${initialRouteName}`}
      initialRouteName={initialRouteName}
    />
  );
};

