import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootNavigator } from './RootNavigator';
import { DoctorNavigator } from './DoctorNavigator';
import { useAuth } from '../../packages/core/auth/AuthContext';
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
    return <RootNavigator initialRouteName="Welcome" />;
  }

  const userRole = auth.user?.role;

  if (userRole === 'DOCTOR') {
    return <DoctorNavigator />;
  }

  if (profileLoading) {
    return <ProfileLoadingNavigator />;
  }

  // New user: hasn't completed profile setup yet
  if (!hasProfileForRouting) {
    const newUserRole = userRole === 'CAREGIVER' ? 'caregiver' : 'patient';
    return (
      <RootNavigator
        key={`setup-${userRole ?? 'unknown'}`}
        initialRouteName="ProfileSetup"
        initialParams={{ role: newUserRole }}
      />
    );
  }

  const initialRouteName = userRole === 'PATIENT' ? 'PatientDashboard' : 'CaregiverPatients';

  return (
    <RootNavigator
      key={`${userRole ?? 'unknown'}-${initialRouteName}`}
      initialRouteName={initialRouteName}
    />
  );
};

