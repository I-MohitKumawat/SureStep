/**
 * SureStep — src/navigation/RoleNavigator.tsx
 * Reads auth status and mounts the correct role-scoped navigator tree.
 * TDD Section 3.3.
 *
 * Replaces the monolithic RootNavigator. A patient can NEVER navigate to
 * a caregiver screen because those routes do not exist in their navigator.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator }      from './AuthNavigator';
import { PatientNavigator }   from './PatientNavigator';
import { CaregiverNavigator } from './CaregiverNavigator';
import { FamilyNavigator }    from './FamilyNavigator';
import { DoctorNavigator }    from './DoctorNavigator';
import { C } from '../theme/colors';

export const RoleNavigator: React.FC = () => {
  const { status, user } = useAuth();

  // Still loading stored tokens — show blank screen (not a flash of wrong UI)
  if (status === 'loading') {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (status === 'unauthenticated') return <AuthNavigator key="unauthenticated" />;

  if (status === 'no_role') return <AuthNavigator key="no_role" initialRoute="RoleSelectionScreen" />;

  if (status === 'no_profile') return <AuthNavigator key="no_profile" initialRoute="ProfileSetupScreen" />;

  // status === 'authenticated'
  switch (user?.role) {
    case 'PATIENT':   return <PatientNavigator />;
    case 'CAREGIVER': return <CaregiverNavigator />;
    case 'FAMILY':    return <FamilyNavigator />;
    case 'DOCTOR':    return <DoctorNavigator />;
    default:          return <AuthNavigator key="default" />;
  }
};

const s = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
});
