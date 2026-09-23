/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step9Review.tsx
 * Caregiver Onboarding Step 9: Comprehensive Review & Submit.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { CaregiverOnboardingState } from './CaregiverOnboardingScreen';

interface Step9Props {
  data: CaregiverOnboardingState;
  onJumpToStep: (stepNumber: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  submitError?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  DEMENTIA_SPECIALIST: 'Dementia Care Specialist',
  GERIATRIC_CAREGIVER: 'Geriatric Caregiver',
  NURSE_CLINICAL: 'Nursing & Clinical Assistant',
  GENERAL_CAREGIVER: 'General Home Care Aide',
  PALLIATIVE_CARE: 'Palliative & End-of-Life Care',
  COMPANION: 'Companion Caregiver',
  OTHER: 'Other Care Professional',
};

const CAPABILITY_LABELS: Record<string, string> = {
  hygiene_bathing: 'Bathing & Personal Hygiene',
  mobility_transfers: 'Mobility & Transfers',
  medication_prompts: 'Medication Reminders',
  meal_prep_feeding: 'Meal Prep & Feeding',
  wandering_prevention: 'Wandering Prevention & Safety',
  behavioral_reassurance: 'Sundowning & Agitation Support',
  cognitive_stimulation: 'Companionship & Memory Games',
  bedridden_care: 'Bedridden & Pressure Sore Care',
  incontinence_care: 'Incontinence & Toileting',
  vitals_monitoring: 'Vitals Monitoring (BP/SpO2)',
};

const SHIFT_LABELS: Record<string, string> = {
  DAY_SHIFT: 'Day Shifts',
  EVENING_SHIFT: 'Evening Shifts',
  OVERNIGHT: 'Overnight Care',
  LIVE_IN: '24-Hour / Live-in',
  WEEKEND: 'Weekend Only',
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  RESPITE: 'Respite / Relief Care',
  ON_CALL: 'On-call Emergency',
};

export const Step9Review: React.FC<Step9Props> = ({
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
      title="Review Your Profile"
      subtitle="Please verify your caregiver profile details before finalizing your professional account."
      currentStep={9}
      totalSteps={9}
      iconName="checkmark-done-circle"
      onBack={onBack}
      onNext={onSubmit}
      nextLabel="Complete Professional Profile"
      isNextLoading={submitting}
    >
      {submitError ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={C.error} />
          <Text style={s.errorText}>{submitError}</Text>
        </View>
      ) : null}

      {/* Notice Banner */}
      <View style={s.noticeBanner}>
        <Ionicons name="shield-checkmark-outline" size={20} color={C.primary} style={s.noticeIcon} />
        <Text style={s.noticeText}>
          Your professional profile is self-reported and will be visible according to your privacy settings. You can edit any details or upload verification documents later in settings.
        </Text>
      </View>

      {/* 1. Basic Identity */}
      <View style={s.summaryCard}>
        {renderCardHeader('Personal Details', 1)}
        <View style={s.row}>
          <Text style={s.label}>Full Name:</Text>
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
          <Text style={s.label}>Base City:</Text>
          <Text style={s.value}>{data.city}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Profile Photo:</Text>
          <Text style={s.value}>{data.photoUri ? 'Uploaded' : 'None'}</Text>
        </View>
      </View>

      {/* 2. Professional Role */}
      <View style={s.summaryCard}>
        {renderCardHeader('Primary Care Role', 2)}
        <View style={s.row}>
          <Text style={s.label}>Title / Identity:</Text>
          <Text style={[s.value, s.highlightValue]}>
            {ROLE_LABELS[data.professionalRole] || data.professionalRole || 'Not specified'}
          </Text>
        </View>
      </View>

      {/* 3. Experience & Dementia Focus */}
      <View style={s.summaryCard}>
        {renderCardHeader('Experience & Dementia Training', 3)}
        <View style={s.row}>
          <Text style={s.label}>Total Experience:</Text>
          <Text style={s.value}>
            {data.yearsExperience === 0 ? 'Less than 1 year' : `${data.yearsExperience} years`}
          </Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Dementia Care Experience:</Text>
          <Text style={s.value}>
            {data.dementiaExperienceYears === 0
              ? 'None yet'
              : `${data.dementiaExperienceYears} years`}
          </Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Formal Dementia Training:</Text>
          <Text style={s.value}>{data.hasDementiaTraining ? 'Yes (Certified/Trained)' : 'No'}</Text>
        </View>
      </View>

      {/* 4. Capabilities & Specializations */}
      <View style={s.summaryCard}>
        {renderCardHeader('Capabilities & Specializations', 4)}
        <Text style={s.labelSub}>Care Capabilities:</Text>
        <View style={s.tagRow}>
          {data.careCapabilities.map((cap) => (
            <View key={cap} style={s.tag}>
              <Text style={s.tagText}>{CAPABILITY_LABELS[cap] || cap}</Text>
            </View>
          ))}
        </View>
        {data.specializations.length > 0 ? (
          <>
            <Text style={[s.labelSub, { marginTop: 10 }]}>Specializations:</Text>
            <View style={s.tagRow}>
              {data.specializations.map((spec) => (
                <View key={spec} style={[s.tag, s.tagPurple]}>
                  <Text style={[s.tagText, s.tagPurpleText]}>{spec}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>

      {/* 5. Qualifications */}
      <View style={s.summaryCard}>
        {renderCardHeader('Qualifications & Credentials', 5)}
        {data.qualifications.length === 0 ? (
          <Text style={s.emptyNotice}>No credentials added (optional)</Text>
        ) : (
          data.qualifications.map((q) => (
            <View key={q.id} style={s.qualItem}>
              <Text style={s.qualItemName}>{q.name}</Text>
              <Text style={s.qualItemSub}>
                {q.issuer} {q.year ? `• ${q.year}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 6. Languages */}
      <View style={s.summaryCard}>
        {renderCardHeader('Languages Spoken', 6)}
        <View style={s.tagRow}>
          {data.languagesSpoken.map((lang) => (
            <View key={lang} style={s.tag}>
              <Text style={s.tagText}>{lang}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 7. Availability & Area */}
      <View style={s.summaryCard}>
        {renderCardHeader('Availability & Service Area', 7)}
        <View style={s.row}>
          <Text style={s.label}>Operating Area:</Text>
          <Text style={s.value}>{data.serviceCity || data.city}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Travel Radius:</Text>
          <Text style={s.value}>{data.serviceRadiusKm} km</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Max Patients:</Text>
          <Text style={s.value}>{data.maxPatients} patients</Text>
        </View>
        <Text style={[s.labelSub, { marginTop: 8 }]}>Accepted Shifts:</Text>
        <View style={s.tagRow}>
          {data.availabilityTypes.map((shift) => (
            <View key={shift} style={s.tag}>
              <Text style={s.tagText}>{SHIFT_LABELS[shift] || shift}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 8. Pricing, Bio & Discoverability */}
      <View style={s.summaryCard}>
        {renderCardHeader('Pricing, Bio & Discoverability', 8)}
        <View style={s.row}>
          <Text style={s.label}>Hourly Rate:</Text>
          <Text style={s.value}>{data.hourlyRate ? `₹${data.hourlyRate}/hr` : 'Negotiable'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Daily Rate:</Text>
          <Text style={s.value}>{data.dailyRate ? `₹${data.dailyRate}/day` : 'Negotiable'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Directory Discoverability:</Text>
          <Text style={[s.value, { color: data.isDiscoverable ? C.primary : C.textSecondary }]}>
            {data.isDiscoverable ? 'Public (Discoverable)' : 'Private (Invite only)'}
          </Text>
        </View>
        {data.bio.trim() ? (
          <View style={{ marginTop: 8 }}>
            <Text style={s.labelSub}>Bio:</Text>
            <Text style={s.bioText}>{data.bio.trim()}</Text>
          </View>
        ) : null}
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: F.medium,
    color: C.error,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F4F1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: F.regular,
    color: '#065F46',
    lineHeight: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E6F4F1',
  },
  editText: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: F.regular,
    color: C.textSecondary,
  },
  value: {
    fontSize: 13,
    fontFamily: F.medium,
    color: C.textPrimary,
  },
  highlightValue: {
    fontFamily: F.bold,
    color: C.primary,
  },
  labelSub: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.textSecondary,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.textPrimary,
  },
  tagPurple: {
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
  },
  tagPurpleText: {
    color: '#7C3AED',
  },
  qualItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  qualItemName: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  qualItemSub: {
    fontSize: 11,
    fontFamily: F.regular,
    color: C.primary,
    marginTop: 2,
  },
  emptyNotice: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    fontStyle: 'italic',
  },
  bioText: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textPrimary,
    lineHeight: 17,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
});
