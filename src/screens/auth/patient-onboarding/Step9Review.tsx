/**
 * SureStep — src/screens/auth/patient-onboarding/Step9Review.tsx
 * Step 9: Summary review screen with direct edit links to previous steps.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { PatientMedicationItem } from '../../../types/api.types';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step9Props {
  intent: OnboardingIntent;
  data: {
    name: string;
    dob: string;
    gender: string;
    photoUri?: string;
    primaryLanguage: string;
    additionalLanguages: string[];
    communicationPreferences: string[];
    city: string;
    livingArrangement: string;
    diagnosisStatus: string;
    dementiaType: string;
    stage: string;
    otherConditions: string[];
    takesMedication: boolean;
    medications: PatientMedicationItem[];
    careNeeds: string[];
    safetyConcerns: string[];
    emergencyContactName: string;
    emergencyContactRelation: string;
    emergencyContactPhone: string;
  };
  onJumpToStep: (stepNumber: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  submitError?: string | null;
}

export const Step9Review: React.FC<Step9Props> = ({
  intent,
  data,
  onJumpToStep,
  onSubmit,
  onBack,
  submitting,
  submitError,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const renderSectionHeader = (title: string, stepNumber: number) => (
    <View style={s.cardHeader}>
      <Text style={s.cardTitle}>{title}</Text>
      <TouchableOpacity
        onPress={() => onJumpToStep(stepNumber)}
        style={s.editBtn}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="pencil" size={13} color="#0E7A67" />
        <Text style={s.editText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <OnboardingLayout
      title={isSelf ? 'Review Your Care Setup' : 'Review Care Setup'}
      subtitle="Everything looks ready. You can tap Edit on any section to make adjustments."
      currentStep={9}
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

      {/* 1. About Patient */}
      <View style={s.summaryCard}>
        {renderSectionHeader(isSelf ? 'About You' : 'Patient Details', 1)}
        <View style={s.row}>
          <Text style={s.label}>Name:</Text>
          <Text style={s.value}>{data.name || 'Not provided'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Date of Birth:</Text>
          <Text style={s.value}>{data.dob || 'Not provided'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Gender:</Text>
          <Text style={s.value}>{data.gender || 'Not specified'}</Text>
        </View>
      </View>

      {/* 2. Communication */}
      <View style={s.summaryCard}>
        {renderSectionHeader('Language & Formats', 2)}
        <View style={s.row}>
          <Text style={s.label}>Primary:</Text>
          <Text style={s.value}>{data.primaryLanguage || 'English'}</Text>
        </View>
        {data.additionalLanguages.length > 0 && (
          <View style={s.row}>
            <Text style={s.label}>Additional:</Text>
            <Text style={s.value}>{data.additionalLanguages.join(', ')}</Text>
          </View>
        )}
      </View>

      {/* 3. Living Situation */}
      <View style={s.summaryCard}>
        {renderSectionHeader('Home & Living Setup', 3)}
        <View style={s.row}>
          <Text style={s.label}>City:</Text>
          <Text style={s.value}>{data.city || 'Not provided'}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Arrangement:</Text>
          <Text style={s.value}>{data.livingArrangement || 'Not specified'}</Text>
        </View>
      </View>

      {/* 4. Health Status */}
      <View style={s.summaryCard}>
        {renderSectionHeader('Memory & Health Support', 4)}
        <View style={s.row}>
          <Text style={s.label}>Status:</Text>
          <Text style={s.value}>{data.diagnosisStatus || 'None'}</Text>
        </View>
        {data.dementiaType && data.dementiaType !== 'None' ? (
          <View style={s.row}>
            <Text style={s.label}>Type:</Text>
            <Text style={s.value}>{data.dementiaType}</Text>
          </View>
        ) : null}
        {data.stage && data.stage !== 'None' ? (
          <View style={s.row}>
            <Text style={s.label}>Support Level:</Text>
            <Text style={s.value}>{data.stage}</Text>
          </View>
        ) : null}
      </View>

      {/* 5. Medications */}
      <View style={s.summaryCard}>
        {renderSectionHeader('Daily Medications', 5)}
        <View style={s.row}>
          <Text style={s.label}>Takes Regular Meds:</Text>
          <Text style={s.value}>{data.takesMedication ? 'Yes' : 'No'}</Text>
        </View>
        {data.takesMedication && data.medications.length > 0 ? (
          <View style={{ marginTop: 6 }}>
            {data.medications.map((m) => (
              <Text key={m.id} style={s.bulletItem}>
                • {m.name} ({m.dosage}) — {m.times_of_day?.join(', ')}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {/* 6. Care Needs */}
      <View style={s.summaryCard}>
        {renderSectionHeader('Daily Support Needs', 6)}
        <Text style={s.value}>
          {data.careNeeds.length > 0
            ? data.careNeeds.map((n) => n.replace(/_/g, ' ')).join(', ')
            : 'None selected'}
        </Text>
      </View>

      {/* 7. Safety */}
      <View style={s.summaryCard}>
        {renderSectionHeader('Safety Check', 7)}
        <Text style={s.value}>
          {data.safetyConcerns.length > 0
            ? data.safetyConcerns.map((s) => s.replace(/_/g, ' ')).join(', ')
            : 'None'}
        </Text>
      </View>

      {/* 8. Emergency Contact */}
      <View style={s.summaryCard}>
        {renderSectionHeader('Trusted Contact', 8)}
        <View style={s.row}>
          <Text style={s.label}>Name:</Text>
          <Text style={s.value}>{data.emergencyContactName}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Relationship:</Text>
          <Text style={s.value}>{data.emergencyContactRelation}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Phone:</Text>
          <Text style={s.value}>{data.emergencyContactPhone}</Text>
        </View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
    paddingBottom: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#161E1C',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
  },
  editText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#0A5D50',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  label: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
  },
  value: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#161E1C',
    flexShrink: 1,
    textAlign: 'right',
  },
  bulletItem: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#161E1C',
    marginTop: 2,
  },
});
