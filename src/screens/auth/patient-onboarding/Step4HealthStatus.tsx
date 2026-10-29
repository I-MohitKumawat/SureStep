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
  { id: 'DIAGNOSED', title: 'Doctor-Confirmed Diagnosis', desc: 'Formal assessment provided by a medical doctor', icon: 'medical-outline' as const },
  { id: 'SUSPECTED', title: 'Memory Changes Noticed', desc: 'Experiencing memory slips or seeking reassurance', icon: 'eye-outline' as const },
  { id: 'NO_DEMENTIA', title: 'General Senior Wellbeing & Routine', desc: 'Using SureStep for daily rhythm, safety, and routine', icon: 'shield-checkmark-outline' as const },
  { id: 'NOT_SURE', title: 'Under Evaluation / Exploring', desc: 'Currently being assessed or exploring options', icon: 'help-circle-outline' as const },
];

const DEMENTIA_TYPES: ChipOption[] = [
  { id: "Alzheimer's", label: "Alzheimer's" },
  { id: 'Vascular', label: 'Vascular' },
  { id: 'Lewy Body', label: 'Lewy Body' },
  { id: 'Frontotemporal', label: 'Frontotemporal' },
  { id: 'MCI', label: 'Mild Cognitive Changes' },
  { id: 'Mixed / Other', label: 'Mixed / Other' },
  { id: 'Unknown', label: 'Not Sure / Unspecified' },
];

const STAGE_OPTIONS = [
  { id: 'Mild', title: 'Early / Mild Support', desc: 'Mainly independent; appreciates gentle daily prompts' },
  { id: 'Moderate', title: 'Moderate Support', desc: 'Benefits from regular structure and daily reminders' },
  { id: 'Severe', title: 'Comprehensive Care', desc: 'Requires full-time support and active oversight' },
  { id: 'Unknown', title: 'Unspecified / Adapting', desc: 'Support level will be adjusted as needs evolve' },
];

const CONDITION_OPTIONS: ChipOption[] = [
  { id: 'Hypertension', label: 'High Blood Pressure', icon: 'pulse-outline' },
  { id: 'Diabetes', label: 'Diabetes', icon: 'water-outline' },
  { id: 'Heart Disease', label: 'Heart Condition', icon: 'heart-outline' },
  { id: 'Mobility Impairment', label: 'Mobility / Walking Support', icon: 'walk-outline' },
  { id: 'Sensory Loss', label: 'Vision / Hearing Sensitivity', icon: 'glasses-outline' },
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
      title={isSelf ? 'Memory & Health Context' : 'Memory & Health Context'}
      subtitle={
        isSelf
          ? 'Tell us what kind of memory support feels most helpful for your routine.'
          : 'Helps us configure respectful, appropriately paced cognitive assistance.'
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
          {isSelf ? 'What best describes your memory support situation?' : 'Memory Care Status *'}
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
            <Text style={s.sectionTitle}>Condition Type (if known) *</Text>
            <MultiSelectChips
              options={DEMENTIA_TYPES}
              selectedIds={dementiaType ? [dementiaType] : []}
              onToggle={(id) => onUpdate({ dementiaType: id })}
              allowMultiple={false}
            />
          </View>

          <View style={[s.section, { marginTop: 14 }]}>
            <Text style={s.sectionTitle}>Support Level *</Text>
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
        <Text style={s.sectionTitle}>Other Health Factors (Optional)</Text>
        <Text style={s.sectionHint}>Select any co-existing needs</Text>
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
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginBottom: 10,
  },
  cardGroup: {
    gap: 2,
  },
});
