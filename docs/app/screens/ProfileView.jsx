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
  if (profileLoading) {
    return (
      <ScreenContainer>
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
      <ScreenContainer>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.topBackButton, { borderColor: theme.colors.borderSubtle }, pressed && { opacity: 0.85 }]}
          >
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Profile not set up</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Please complete profile setup to continue.
          </Text>
          <Pressable
            onPress={() => navigation.replace('ProfileSetup')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={[styles.primaryButtonText, { fontSize: 16 }]}>
              Start profile setup
            </Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const countryLabel = profile.country ? (countries.find((c) => c.code === profile.country)?.label ?? profile.country) : '';

  const labelFont = 12;
  const valueFont = 16;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.topBackButton, { borderColor: theme.colors.borderSubtle }, pressed && { opacity: 0.85 }]}
        >
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Your Profile
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderSubtle
            }
          ]}
        >
          <FieldRow label="Full Name" value={profile.fullName} highContrast={false} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow label="Age" value={profile.age} highContrast={false} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow label="Gender" value={profile.gender} highContrast={false} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow
            label="Preferred Language"
            value={profile.preferredLanguage}
            highContrast={false}
            theme={theme}
            fontSizeLabel={labelFont}
            fontSizeValue={valueFont}
          />
          <FieldRow label="City" value={profile.city} highContrast={false} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />
          <FieldRow label="Country" value={countryLabel} highContrast={false} theme={theme} fontSizeLabel={labelFont} fontSizeValue={valueFont} />

          {/* Relationship to Patient removed from caregiver profile view */}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate('ProfileEdit')}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={[styles.primaryButtonText, { fontSize: 16 }]}>
              Edit Profile
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.replace(role === 'patient' ? 'PatientDashboard' : 'CaregiverDashboard')}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.85 }
            ]}
          >
            <Text style={[styles.secondaryButtonText, { fontSize: 16 }]}>
              Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBackButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12
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
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: '#4b5563'
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
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800'
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
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '800'
  },
});

