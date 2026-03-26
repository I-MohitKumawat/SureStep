import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useAuth } from '../../../packages/core/auth/AuthContext';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

import { useUserProfile } from '../context/userProfileContext';
import { ScreenContainer } from '../components/ScreenContainer';
import ProfileForm from '../components/ProfileForm';

export default function ProfileSetup({ navigation }) {
  const { activeRole, profileLoading, saveProfile } = useUserProfile();
  const { auth } = useAuth();
  const theme = useTheme();

  const role =
    activeRole ??
    (auth.status === 'authenticated'
      ? auth.user.role === 'PATIENT'
        ? 'patient'
        : auth.user.role === 'CAREGIVER'
          ? 'caregiver'
          : null
      : null);

  const isPatient = role === 'patient';

  if (!role || profileLoading) {
    return (
      <ScreenContainer style={isPatient ? styles.patientRoot : undefined}>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={isPatient ? styles.patientRoot : undefined}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, isPatient && styles.titleHighContrast, !isPatient && { color: theme.colors.textPrimary }]}>
            Profile Setup
          </Text>
          <Text style={[styles.subtitle, isPatient && styles.subtitleHighContrast, !isPatient && { color: theme.colors.textSecondary }]}>
            Let’s create your care profile.
          </Text>

          <ProfileForm
            role={role}
            initialValues={null}
            submitLabel="Save & Continue"
            onSubmit={async (draft) => {
              await saveProfile(draft);
              navigation.replace(role === 'patient' ? 'PatientDashboard' : 'CaregiverDashboard');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  patientRoot: {
    backgroundColor: '#000000'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    color: '#111827'
  },
  titleHighContrast: {
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: '#4b5563'
  },
  subtitleHighContrast: {
    color: '#9ca3af'
  }
});

