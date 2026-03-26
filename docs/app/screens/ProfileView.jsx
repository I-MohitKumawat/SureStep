import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';

import { useUserProfile } from '../context/userProfileContext';
import { ScreenContainer } from '../components/ScreenContainer';

const { countries } = require('../utils/profile/profileData');

function FieldRow({ label, value, highContrast, theme, fontSizeLabel, fontSizeValue }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.label,
          highContrast && styles.labelHighContrast,
          !highContrast && { color: theme.colors.textSecondary },
          { fontSize: fontSizeLabel }
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          highContrast && styles.valueHighContrast,
          !highContrast && { color: theme.colors.textPrimary },
          { fontSize: fontSizeValue }
        ]}
      >
        {String(value)}
      </Text>
    </View>
  );
}

export default function ProfileView({ navigation }) {
  const { activeRole, profile, profileLoading } = useUserProfile();
  const theme = useTheme();

  const role = profile?.role ?? activeRole;
  const isPatient = role === 'patient';

  if (profileLoading) {
    return (
      <ScreenContainer style={isPatient ? styles.patientRoot : undefined}>
        <ActivityIndicator />
      </ScreenContainer>
    );
  }

  if (!role) {
    return (
      <ScreenContainer>
        <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Loading role…</Text>
      </ScreenContainer>
    );
  }

  if (!profile) {
    return (
      <ScreenContainer style={isPatient ? styles.patientRoot : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, isPatient && styles.titleHighContrast]}>Profile not set up</Text>
          <Text style={[styles.subtitle, !isPatient && { color: theme.colors.textSecondary }, isPatient && styles.subtitleHighContrast]}>
            Please complete profile setup to continue.
          </Text>
          <Pressable
            onPress={() => navigation.replace('ProfileSetup')}
            style={({ pressed }) => [
              styles.primaryButton,
              isPatient && styles.primaryButtonHighContrast,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={[styles.primaryButtonText, isPatient && styles.primaryButtonTextHighContrast, { fontSize: isPatient ? 18 : 16 }]}>
              Start profile setup
            </Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const countryLabel = profile.country ? (countries.find((c) => c.code === profile.country)?.label ?? profile.country) : '';

  const labelFont = isPatient ? 18 : 12;
  const valueFont = isPatient ? 18 : 16;

  return (
    <ScreenContainer style={isPatient ? styles.patientRoot : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, isPatient && styles.titleHighContrast, !isPatient && { color: theme.colors.textPrimary }]}>
          Your Profile
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isPatient ? '#000000' : theme.colors.surface,
              borderColor: isPatient ? '#ffffff' : theme.colors.borderSubtle
            }
          ]}
        >
          <FieldRow label="Full Name" value={profile.fullName} highContrast={isPatient} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow label="Age" value={profile.age} highContrast={isPatient} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow label="Gender" value={profile.gender} highContrast={isPatient} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow
            label="Preferred Language"
            value={profile.preferredLanguage}
            highContrast={isPatient}
            theme={theme}
            fontSizeLabel={labelFont}
            fontSizeValue={valueFont}
          />
          <FieldRow
            label="Phone"
            value={
              profile.phoneCountryCallingCode && profile.phoneNumber
                ? `${profile.phoneCountryCallingCode} ${profile.phoneNumber}`
                : ''
            }
            highContrast={isPatient}
            theme={theme}
            fontSizeLabel={labelFont}
            fontSizeValue={valueFont}
          />
          <FieldRow label="Email" value={profile.email} highContrast={isPatient} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow label="City" value={profile.city} highContrast={isPatient} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow label="Country" value={countryLabel} highContrast={isPatient} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />

          {role === 'patient' ? (
            <>
              <FieldRow
                label="Emergency Contact Name"
                value={profile.emergencyContactName}
                highContrast={isPatient}
                theme={theme}
                fontSizeLabel={labelFont}
                fontSizeValue={valueFont}
              />
              <FieldRow
                label="Emergency Contact Phone"
                value={
                  profile.emergencyPhoneCountryCallingCode && profile.emergencyPhoneNumber
                    ? `${profile.emergencyPhoneCountryCallingCode} ${profile.emergencyPhoneNumber}`
                    : ''
                }
                highContrast={isPatient}
                theme={theme}
                fontSizeLabel={labelFont}
                fontSizeValue={valueFont}
              />
            </>
          ) : null}

          {role === 'caregiver' ? (
            <FieldRow
              label="Relationship to Patient"
              value={profile.relationshipToPatient}
              highContrast={isPatient}
              theme={theme}
              fontSizeLabel={labelFont}
              fontSizeValue={valueFont}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate('ProfileEdit')}
            style={({ pressed }) => [
              styles.primaryButton,
              isPatient && styles.primaryButtonHighContrast,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={[styles.primaryButtonText, isPatient && styles.primaryButtonTextHighContrast, { fontSize: isPatient ? 18 : 16 }]}>
              Edit Profile
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.replace(role === 'patient' ? 'PatientDashboard' : 'CaregiverDashboard')}
            style={({ pressed }) => [
              styles.secondaryButton,
              isPatient && styles.secondaryButtonHighContrast,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={[styles.secondaryButtonText, isPatient && styles.secondaryButtonTextHighContrast, { fontSize: isPatient ? 18 : 16 }]}>
              Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 12,
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
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    borderColor: '#e5e7eb',
    marginBottom: 16
  },
  row: {
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 4
  },
  labelHighContrast: {
    color: '#9ca3af'
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  valueHighContrast: {
    color: '#ffffff'
  },
  actions: {
    gap: 12
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
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
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonHighContrast: {
    backgroundColor: '#000000',
    borderColor: '#ffffff'
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '800'
  },
  secondaryButtonTextHighContrast: {
    color: '#ffffff'
  }
});

