/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step4Capabilities.tsx
 * Caregiver Onboarding Step 4: Care Capabilities & Specializations.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { MultiSelectChips, ChipOption } from '../../../components/onboarding/MultiSelectChips';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import { CAPABILITY_OPTIONS } from '../../../types/care.types';

interface Step4Props {
  careCapabilities: string[];
  specializations: string[];
  onUpdate: (fields: {
    careCapabilities?: string[];
    specializations?: string[];
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const SPECIALIZATION_OPTIONS: ChipOption[] = [
  { id: 'alzheimers', label: "Alzheimer's Disease", icon: 'sparkles-outline' },
  { id: 'vascular_dementia', label: 'Vascular Dementia', icon: 'git-branch-outline' },
  { id: 'lewy_body', label: 'Lewy Body Dementia', icon: 'eye-outline' },
  { id: 'ftd', label: 'Frontotemporal Dementia (FTD)', icon: 'bandage-outline' },
  { id: 'mci', label: 'Mild Cognitive Impairment (MCI)', icon: 'bulb-outline' },
  { id: 'parkinsons', label: "Parkinson's Disease", icon: 'fitness-outline' },
  { id: 'post_stroke', label: 'Post-Stroke Recovery', icon: 'shield-outline' },
];

export const Step4Capabilities: React.FC<Step4Props> = ({
  careCapabilities,
  specializations,
  onUpdate,
  onNext,
  onBack,
}) => {
  const toggleCapability = (id: string) => {
    if (careCapabilities.includes(id)) {
      onUpdate({ careCapabilities: careCapabilities.filter((c) => c !== id) });
    } else {
      onUpdate({ careCapabilities: [...careCapabilities, id] });
    }
  };

  const toggleSpecialization = (id: string) => {
    if (specializations.includes(id)) {
      onUpdate({ specializations: specializations.filter((s) => s !== id) });
    } else {
      onUpdate({ specializations: [...specializations, id] });
    }
  };

  const isComplete = careCapabilities.length > 0;

  return (
    <OnboardingLayout
      title="Care Capabilities & Focus"
      subtitle="Select the hands-on care support you provide and any condition areas you specialize in."
      currentStep={4}
      totalSteps={9}
      iconName="fitness-outline"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View style={s.section}>
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>Daily Care Capabilities *</Text>
          <Text style={s.counter}>{careCapabilities.length} selected</Text>
        </View>
        <Text style={s.sectionSubtitle}>
          Select all practical skills you feel confident performing:
        </Text>
        <MultiSelectChips
          options={CAPABILITY_OPTIONS}
          selectedIds={careCapabilities}
          onToggle={toggleCapability}
        />
      </View>

      <View style={s.section}>
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>Condition Specializations</Text>
          <Text style={s.counter}>{specializations.length} selected</Text>
        </View>
        <Text style={s.sectionSubtitle}>
          Select any conditions you have hands-on experience or familiarity with:
        </Text>
        <MultiSelectChips
          options={SPECIALIZATION_OPTIONS}
          selectedIds={specializations}
          onToggle={toggleSpecialization}
        />
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  counter: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
});
