/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step3ExperienceSkills.tsx
 * Caregiver Onboarding Step 3: Experience & Dementia Experience.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step3Props {
  yearsExperience: number | null;
  dementiaExperienceYears: number | null;
  hasDementiaTraining: boolean;
  onUpdate: (fields: {
    yearsExperience?: number | null;
    dementiaExperienceYears?: number | null;
    hasDementiaTraining?: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const EXPERIENCE_PRESETS = [
  { label: '< 1 yr', value: 0 },
  { label: '1-2 yrs', value: 2 },
  { label: '3-5 yrs', value: 4 },
  { label: '6-9 yrs', value: 7 },
  { label: '10+ yrs', value: 12 },
];

export const Step3ExperienceSkills: React.FC<Step3Props> = ({
  yearsExperience,
  dementiaExperienceYears,
  hasDementiaTraining,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isTotalValid = yearsExperience !== null && yearsExperience >= 0;
  const isDementiaValid =
    dementiaExperienceYears !== null &&
    dementiaExperienceYears >= 0 &&
    (yearsExperience === null || dementiaExperienceYears <= yearsExperience);

  const isValid = isTotalValid && isDementiaValid;

  return (
    <OnboardingLayout
      title="Experience in Caregiving"
      subtitle="SureStep connects you with dementia care opportunities. Please specify your general and dementia-specific experience."
      currentStep={3}
      totalSteps={9}
      iconName="time-outline"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isValid}
    >
      {/* 1. Total Years of Care Experience */}
      <View style={s.section}>
        <View style={s.labelRow}>
          <Text style={s.fieldLabel}>Total Caregiving Experience *</Text>
          {yearsExperience !== null ? (
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {yearsExperience === 0 ? 'Less than 1 yr' : `${yearsExperience} years`}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={s.presetsRow}>
          {EXPERIENCE_PRESETS.map((p) => {
            const isSelected = yearsExperience === p.value;
            return (
              <Pressable
                key={p.label}
                onPress={() => {
                  onUpdate({ yearsExperience: p.value });
                  if (dementiaExperienceYears !== null && dementiaExperienceYears > p.value) {
                    onUpdate({ dementiaExperienceYears: p.value });
                  }
                }}
                style={[s.presetChip, isSelected && s.presetChipSelected]}
              >
                <Text style={[s.presetChipText, isSelected && s.presetChipTextSelected]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.inputContainer}>
          <Ionicons name="medal-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Or enter exact years (e.g., 3)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={yearsExperience !== null ? String(yearsExperience) : ''}
            onChangeText={(txt) => {
              const cleaned = txt.replace(/[^0-9]/g, '');
              const val = cleaned === '' ? null : parseInt(cleaned, 10);
              onUpdate({ yearsExperience: val });
              if (val !== null && dementiaExperienceYears !== null && dementiaExperienceYears > val) {
                onUpdate({ dementiaExperienceYears: val });
              }
            }}
          />
        </View>
      </View>

      {/* 2. Dementia-Specific Experience */}
      <View style={s.section}>
        <View style={s.labelRow}>
          <Text style={s.fieldLabel}>Dementia & Memory Care Experience *</Text>
          {dementiaExperienceYears !== null ? (
            <View style={s.badgeDementia}>
              <Text style={s.badgeDementiaText}>
                {dementiaExperienceYears === 0 ? 'None yet' : `${dementiaExperienceYears} yrs with dementia`}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={s.subLabel}>
          Experience supporting individuals living with Alzheimer's, vascular dementia, or cognitive decline.
        </Text>

        <View style={s.presetsRow}>
          {[
            { label: 'None', value: 0 },
            { label: '1-2 yrs', value: 2 },
            { label: '3-5 yrs', value: 4 },
            { label: '6+ yrs', value: 6 },
          ].map((p) => {
            const isSelected = dementiaExperienceYears === p.value;
            const exceedsTotal = yearsExperience !== null && p.value > yearsExperience;
            return (
              <Pressable
                key={p.label}
                disabled={exceedsTotal}
                onPress={() => onUpdate({ dementiaExperienceYears: p.value })}
                style={[
                  s.presetChip,
                  isSelected && s.presetChipSelected,
                  exceedsTotal && s.presetChipDisabled,
                ]}
              >
                <Text
                  style={[
                    s.presetChipText,
                    isSelected && s.presetChipTextSelected,
                    exceedsTotal && s.presetChipTextDisabled,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.inputContainer}>
          <Ionicons name="sparkles-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Or enter exact years (e.g., 2)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={dementiaExperienceYears !== null ? String(dementiaExperienceYears) : ''}
            onChangeText={(txt) => {
              const cleaned = txt.replace(/[^0-9]/g, '');
              const val = cleaned === '' ? null : parseInt(cleaned, 10);
              onUpdate({ dementiaExperienceYears: val });
            }}
          />
        </View>

        {yearsExperience !== null &&
          dementiaExperienceYears !== null &&
          dementiaExperienceYears > yearsExperience && (
            <Text style={s.errorHint}>
              Dementia experience cannot exceed total caregiving experience ({yearsExperience} yrs).
            </Text>
          )}
      </View>

      {/* 3. Dementia Training Toggle */}
      <View style={s.trainingCard}>
        <View style={s.trainingLeft}>
          <View style={s.iconWrap}>
            <Ionicons name="ribbon-outline" size={22} color={C.primary} />
          </View>
          <View style={s.trainingTextWrap}>
            <Text style={s.trainingTitle}>Dementia Care Training</Text>
            <Text style={s.trainingSub}>
              I have completed formal coursework or training in dementia care (e.g., ARDSI, NIMHANS, or equivalent).
            </Text>
          </View>
        </View>
        <Switch
          value={hasDementiaTraining}
          onValueChange={(val) => onUpdate({ hasDementiaTraining: val })}
          trackColor={{ false: '#E5E7EB', true: C.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    marginBottom: 10,
    lineHeight: 17,
  },
  badge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.primary,
  },
  badgeDementia: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeDementiaText: {
    fontSize: 11,
    fontFamily: F.medium,
    color: '#7C3AED',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  presetChipDisabled: {
    opacity: 0.4,
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.textSecondary,
  },
  presetChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: F.bold,
  },
  presetChipTextDisabled: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
  errorHint: {
    fontSize: 12,
    fontFamily: F.medium,
    color: '#EF4444',
    marginTop: 6,
  },
  trainingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  trainingLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  trainingTextWrap: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.textPrimary,
    marginBottom: 4,
  },
  trainingSub: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    lineHeight: 16,
  },
});
