import React from 'react';
import { ActivityIndicator } from 'react-native';

import { RootNavigator } from './RootNavigator';
import { useAuth } from '../../../packages/core/auth/AuthContext';
import { DoctorRoleScreen } from '../screens/DoctorRoleScreen';
import { useUserProfile } from '../context/userProfileContext';
import { ScreenContainer } from '../components/ScreenContainer';

export const RoleNavigator: React.FC = () => {
  const { auth } = useAuth();
  const { profileLoading, profileExists } = useUserProfile();

  if (auth.status !== 'authenticated') {
    return <RootNavigator initialRouteName="RoleEntry" />;
  }

  const userRole = auth.user?.role;

  if (userRole === 'DOCTOR') {
    return <DoctorRoleScreen />;
  }

  if (profileLoading) {
    return (
      <ScreenContainer>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  const initialRouteName = !profileExists
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

