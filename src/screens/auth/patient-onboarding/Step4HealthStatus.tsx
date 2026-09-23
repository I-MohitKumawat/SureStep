/**
 * SureStep — src/screens/auth/patient-onboarding/Step4HealthStatus.tsx
 * Step 4: Dementia diagnosis status, type, stage, and other health conditions.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { MultiSelectChips, ChipOption } from '../../../components/onboarding/MultiSelectChips';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step4Props {
  intent: OnboardingIntent;
  diagnosisStatus: string;
  dementiaType: string;
  stage: string;
  otherConditions: string[];
  onUpdate: (fields: {
    diagnosisStatus?: string;
    dementiaType?: string;
    stage?: string;
    otherConditions?: string[];
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const DIAGNOSIS_OPTIONS = [
  { id: 'DIAGNOSED', title: 'Diagnosed by a Doctor', desc: 'Formally confirmed medical diagnosis', icon: 'medical-outline' as const },
  { id: 'SUSPECTED', title: 'Suspected / Symptoms Present', desc: 'Memory issues noticed, awaiting official diagnosis', icon: 'eye-outline' as const },
  { id: 'NO_DEMENTIA', title: 'No Known Dementia', desc: 'Using SureStep for general senior routine and safety', icon: 'shield-checkmark-outline' as const },
  { id: 'NOT_SURE', title: 'Not Sure / Under Evaluation', desc: 'Currently being examined or unassessed', icon: 'help-circle-outline' as const },
];

const DEMENTIA_TYPES: ChipOption[] = [
  { id: "Alzheimer's", label: "Alzheimer's Disease" },
  { id: 'Vascular', label: 'Vascular Dementia' },
  { id: 'Lewy Body', label: 'Lewy Body Dementia' },
  { id: 'Frontotemporal', label: 'Frontotemporal (FTD)' },
  { id: 'MCI', label: 'Mild Cognitive Impairment' },
  { id: 'Mixed / Other', label: 'Mixed / Other' },
  { id: 'Unknown', label: 'Not Sure / Unspecified' },
];

const STAGE_OPTIONS = [
  { id: 'Mild', title: 'Early / Mild', desc: 'Independent with occasional memory slips' },
  { id: 'Moderate', title: 'Moderate', desc: 'Requires regular assistance with daily activities' },
  { id: 'Severe', title: 'Advanced / Severe', desc: 'Needs full-time comprehensive supervision' },
  { id: 'Unknown', title: 'Not Sure / Unassessed', desc: 'Stage has not been determined' },
];

const CONDITION_OPTIONS: ChipOption[] = [
  { id: 'Hypertension', label: 'High Blood Pressure', icon: 'pulse-outline' },
  { id: 'Diabetes', label: 'Diabetes', icon: 'water-outline' },
  { id: 'Heart Disease', label: 'Heart Condition', icon: 'heart-outline' },
  { id: 'Mobility Impairment', label: 'Mobility / Walking Issues', icon: 'walk-outline' },
  { id: 'Sensory Loss', label: 'Vision / Hearing Loss', icon: 'glasses-outline' },
  { id: 'None', label: 'None / Not Applicable', icon: 'checkmark-outline' },
];

export const Step4HealthStatus: React.FC<Step4Props> = ({
  intent,
  diagnosisStatus,
  dementiaType,
  stage,
  otherConditions,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';
  const showDementiaDetails =
    diagnosisStatus === 'DIAGNOSED' || diagnosisStatus === 'SUSPECTED';

  const toggleCondition = (id: string) => {
    if (id === 'None') {
      onUpdate({ otherConditions: ['None'] });
      return;
    }
    const filtered = otherConditions.filter((c) => c !== 'None');
    onUpdate({
      otherConditions: filtered.includes(id)
        ? filtered.filter((c) => c !== id)
        : [...filtered, id],
    });
  };

  const isComplete =
    diagnosisStatus.length > 0 &&
    (!showDementiaDetails || (dementiaType.length > 0 && stage.length > 0));

  return (
    <OnboardingLayout
      title={isSelf ? 'Tell us about your health' : 'Health & Cognitive Status'}
      subtitle={
        isSelf
          ? 'Helps us tailor your reminder paces and cognitive baseline tests.'
          : 'Helps caregivers and family configure appropriate safety thresholds.'
      }
      currentStep={4}
      iconName="fitness"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      {/* Dementia Diagnosis Status */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          {isSelf ? 'Have you been diagnosed with memory loss or dementia?' : 'Diagnosis Status *'}
        </Text>
        <View style={s.cardGroup}>
          {DIAGNOSIS_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              title={opt.title}
              description={opt.desc}
              icon={opt.icon}
              selected={diagnosisStatus === opt.id}
              onPress={() => {
                onUpdate({
                  diagnosisStatus: opt.id,
                  // If switching to NO_DEMENTIA or NOT_SURE, fill sensible defaults
                  dementiaType: opt.id === 'NO_DEMENTIA' ? 'None' : dementiaType,
                  stage: opt.id === 'NO_DEMENTIA' ? 'None' : stage,
                });
              }}
            />
          ))}
        </View>
      </View>

      {/* Conditional: Dementia Type & Stage */}
      {showDementiaDetails && (
        <>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Type of Condition (if known) *</Text>
            <MultiSelectChips
              options={DEMENTIA_TYPES}
              selectedIds={dementiaType ? [dementiaType] : []}
              onToggle={(id) => onUpdate({ dementiaType: id })}
              allowMultiple={false}
            />
          </View>

          <View style={[s.section, { marginTop: 14 }]}>
            <Text style={s.sectionTitle}>Approximate Stage *</Text>
            <View style={s.cardGroup}>
              {STAGE_OPTIONS.map((st) => (
                <OptionCard
                  key={st.id}
                  title={st.title}
                  description={st.desc}
                  selected={stage === st.id}
                  onPress={() => onUpdate({ stage: st.id })}
                />
              ))}
            </View>
          </View>
        </>
      )}

      {/* Other Health Conditions */}
      <View style={[s.section, { marginTop: 14 }]}>
        <Text style={s.sectionTitle}>Other Health Conditions (Optional)</Text>
        <Text style={s.sectionHint}>Select any co-existing conditions</Text>
        <MultiSelectChips
          options={CONDITION_OPTIONS}
          selectedIds={otherConditions}
          onToggle={toggleCondition}
        />
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 10,
  },
  cardGroup: {
    gap: 2,
  },
});
