import React from 'react';

import { RootNavigator } from './RootNavigator';
import { useAuth } from '../../packages/core/auth/AuthContext';

export const RoleNavigator: React.FC = () => {
  const { auth } = useAuth();

  if (auth.status !== 'authenticated') {
    // Until real auth/role-switch UI exists (FE-AUTH / FE-ROLE-003),
    // unauthenticated state renders nothing.
    return null;
  }

  // For now, all roles share the same navigator; later tasks will
  // specialize these per role.
  switch (auth.user.role) {
    case 'PATIENT':
    case 'CAREGIVER':
    case 'DOCTOR':
    default:
      return <RootNavigator />;
  }
};

