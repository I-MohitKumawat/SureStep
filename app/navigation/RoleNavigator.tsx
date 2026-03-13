import React from 'react';

import { RootNavigator } from './RootNavigator';
import { useAuth } from '../../packages/core/auth/AuthContext';
import { PatientRoleScreen } from '../screens/PatientRoleScreen';
import { DoctorRoleScreen } from '../screens/DoctorRoleScreen';

export const RoleNavigator: React.FC = () => {
  const { auth } = useAuth();

  if (auth.status !== 'authenticated') {
    // Until real auth/role-switch UI and login exist (FE-AUTH / FE-ROLE-003),
    // unauthenticated users see the default caregiver-focused app shell.
    return <RootNavigator />;
  }

  switch (auth.user.role) {
    case 'PATIENT':
      return <PatientRoleScreen />;
    case 'DOCTOR':
      return <DoctorRoleScreen />;
    case 'CAREGIVER':
    default:
      // Caregivers see the current multi-patient dashboard shell.
      return <RootNavigator />;
  }
};

