import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, Pressable } from 'react-native';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

import { useUserProfile } from '../context/userProfileContext';
import { ScreenContainer } from '../components/ScreenContainer';
import ProfileForm from '../components/ProfileForm';

export default function ProfileEdit({ navigation }) {
  const { activeRole, profileLoading, profile, saveProfile } = useUserProfile();
  const theme = useTheme();

  const role = profile?.role ?? activeRole;
  const isPatient = role === 'patient';

  if (profileLoading) {
    return (
      <ScreenContainer style={isPatient ? styles.patientRoot : undefined}>
        <Text>Loading…</Text>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer style={isPatient ? styles.patientRoot : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, isPatient && styles.titleHighContrast, !isPatient && { color: theme.colors.textPrimary }]}>
            Profile not set up
          </Text>
          <Text style={[styles.subtitle, isPatient && styles.subtitleHighContrast, !isPatient && { color: theme.colors.textSecondary }]}>
            Start profile setup to edit your information.
          </Text>
          <Pressable
            onPress={() => navigation.replace('ProfileSetup')}
            style={({ pressed }) => [
              styles.primaryButton,
              isPatient && styles.primaryButtonHighContrast,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={[styles.primaryButtonText, isPatient && styles.primaryButtonTextHighContrast]}>
              Start setup
            </Text>
          </Pressable>
        </ScrollView>
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
          <Text
            style={[
              styles.title,
              isPatient && styles.titleHighContrast,
              !isPatient && { color: theme.colors.textPrimary }
            ]}
          >
            Edit Profile
          </Text>

          <ProfileForm
            role={role}
            initialValues={profile}
            submitLabel="Save"
            onSubmit={async (draft) => {
              await saveProfile(draft);
              navigation.replace('ProfileView');
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
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primaryButtonHighContrast: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#ffffff'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  primaryButtonTextHighContrast: {
    color: '#ffffff'
  }
});

