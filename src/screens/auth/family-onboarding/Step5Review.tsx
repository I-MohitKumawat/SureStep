/**
 * SureStep — src/screens/auth/family-onboarding/Step5Review.tsx
 * Family Onboarding Step 5: Summary review screen with direct edit links.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step5Props {
  data: {
    name: string;
    dob: string;
    gender: string;
    language: string;
    city: string;
    photoUri?: string;
    relationLabel: string;
    proximity: string;
    involvementInterests: string[];
    hasInvite: boolean | null;
    inviteCode: string;
    verifiedPatientName?: string | null;
  };
  onJumpToStep: (stepNumber: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  submitError?: string | null;
}

const PROXIMITY_LABELS: Record<string, string> = {
  TOGETHER: 'We live together',
  NEARBY: 'Nearby (same city)',
  DIFFERENT_CITY: 'Different city',
  DIFFERENT_COUNTRY: 'Different country',
};

const INTEREST_LABELS: Record<string, string> = {
  stay_connected: 'Stay connected',
  appointments_routines: 'Appointments and routines',
  medication: 'Help with medication',
  safety_location: 'Safety and location',
  coordinate_care: 'Find and coordinate care',
  emergency: 'Emergency response',
  everyday_care: 'Everyday care',
};

export const Step5Review: React.FC<Step5Props> = ({
  data,
  onJumpToStep,
  onSubmit,
  onBack,
  submitting,
  submitError,
}) => {
  const renderCardHeader = (title: string, stepNumber: number) => (
    <View style={s.cardHeader}>
      <Text style={s.cardTitle}>{title}</Text>
      <Pressable
        onPress={() => onJumpToStep(stepNumber)}
        style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.7 }]}
        hitSlop={8}
      >
        <Ionicons name="pencil" size={14} color={C.primary} />
        <Text style={s.editText}>Edit</Text>
      </Pressable>
    </View>
  );

  return (
    <OnboardingLayout
      title="Review your information"
      subtitle="Verify your details below before finishing your family account setup."
      currentStep={5}
      totalSteps={5}
      iconName="checkmark-done-circle"
      onBack={onBack}
      onNext={onSubmit}
      nextLabel="Complete Setup"
      isNextLoading={submitting}
    >
      {submitError ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={C.error} />
          <Text style={s.errorText}>{submitError}</Text>
        </View>
      ) : null}

      {/* 1. About You */}
      <View style={s.summaryCard}>
        {renderCardHeader('About You', 1)}
        <View style={s.row}>
          <Text style={s.label}>Name:</Text>
          <Text style={s.value}>{data.name}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Date of Birth:</Text>
          <Text style={s.value}>{data.dob || 'Not provided'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Gender:</Text>
          <Text style={s.value}>{data.gender}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Location:</Text>
          <Text style={s.value}>{data.city}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Language:</Text>
          <Text style={s.value}>{data.language}</Text>
        </View>
      </View>

      {/* 2. Your Connection */}
      <View style={s.summaryCard}>
        {renderCardHeader('Your Connection', 2)}
        <View style={s.row}>
          <Text style={s.label}>Relationship:</Text>
          <Text style={s.value}>{data.relationLabel}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Proximity:</Text>
          <Text style={s.value}>
            {PROXIMITY_LABELS[data.proximity] || data.proximity || 'Not specified'}
          </Text>
        </View>
      </View>

      {/* 3. Your Involvement */}
      <View style={s.summaryCard}>
        {renderCardHeader('Ways to Participate', 3)}
        <View style={s.interestsWrap}>
          {data.involvementInterests.length > 0 ? (
            data.involvementInterests.map((interest) => (
              <View key={interest} style={s.interestPill}>
                <Ionicons name="checkmark" size={12} color={C.primaryDark} style={{ marginRight: 4 }} />
                <Text style={s.interestPillText}>
                  {INTEREST_LABELS[interest] || interest}
                </Text>
              </View>
            ))
          ) : (
            <Text style={s.value}>None selected</Text>
          )}
        </View>
      </View>

      {/* 4. Care Circle Invitation */}
      <View style={s.summaryCard}>
        {renderCardHeader('Care Circle', 4)}
        {data.hasInvite && data.inviteCode ? (
          <View>
            <View style={s.row}>
              <Text style={s.label}>Code:</Text>
              <Text style={s.value}>{data.inviteCode}</Text>
            </View>
            {data.verifiedPatientName ? (
              <View style={s.row}>
                <Text style={s.label}>Connecting to:</Text>
                <Text style={s.value}>{data.verifiedPatientName}&apos;s Circle (Pending Approval)</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={s.mutedNote}>
            Not connected yet — you can connect anytime from your dashboard.
          </Text>
        )}
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 13,
    color: C.error,
  },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F0FBF8',
  },
  editText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.primaryDark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  label: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
  },
  value: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  mutedNote: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
  interestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EAF7F4',
  },
  interestPillText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.primaryDark,
  },
});
