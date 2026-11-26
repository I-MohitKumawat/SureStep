
/**
 * SureStep — src/screens/auth/patient-onboarding/Step9Review.tsx
 * Step 9: Compact, expandable onboarding review.
 */

import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { getLanguageDisplayName } from '../../../constants/languages';
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

type IconName = keyof typeof Ionicons.glyphMap;

/* Human-readable labels */

const LIVING_LABELS: Record<string, string> = {
  ALONE: 'Living independently',
  WITH_SPOUSE: 'With spouse / partner',
  WITH_FAMILY: 'With family',
  WITH_CAREGIVER: 'With caregiver',
  ASSISTED_LIVING: 'Senior living community',
  OTHER: 'Other arrangement',
};

const DIAGNOSIS_LABELS: Record<string, string> = {
  DIAGNOSED: 'Doctor-confirmed diagnosis',
  SUSPECTED: 'Memory changes noticed',
  NO_DEMENTIA: 'General wellbeing',
  NOT_SURE: 'Still exploring / Not sure',
};

const STAGE_LABELS: Record<string, string> = {
  Mild: 'Occasional support',
  Moderate: 'Regular support',
  Severe: 'Comprehensive care',
  Unknown: 'Not sure yet',
};

const DEMENTIA_LABELS: Record<string, string> = {
  MCI: 'Mild cognitive changes',
  Unknown: 'Not sure',
};

const COMMUNICATION_LABELS: Record<string, string> = {
  simple_text: 'Simple text',
  voice_prompts: 'Voice & audio prompts',
  visual_icons: 'Visual icons & photos',
  large_text: 'Large high-contrast font',
};

const CARE_LABELS: Record<string, string> = {
  medications: 'Medication reminders',
  safety_navigation: 'Location safety',
  daily_schedule: 'Daily routines',
  sos_emergency: 'Emergency SOS',
  memory_companionship: 'Memory activities',
  family_coordination: 'Family updates',
};

const SAFETY_LABELS: Record<string, string> = {
  wandering: 'Getting lost',
  falls: 'Risk of falling',
  confusion: 'Confusion',
  night_restlessness: 'Night restlessness',
  phone_difficulty: 'Difficulty using a phone',
  forgetting_meals: 'Forgetting meals or water',
  none: 'No safety concerns',
};

const CONDITION_LABELS: Record<string, string> = {
  Hypertension: 'High blood pressure',
  Diabetes: 'Diabetes',
  'Heart Disease': 'Heart condition',
  'Mobility Impairment': 'Mobility support',
  'Sensory Loss': 'Vision / Hearing sensitivity',
  None: 'None reported',
};

const getLabel = (
  value: string,
  labels: Record<string, string>
) => {
  if (!value) return 'Not specified';

  return labels[value] || value.replace(/_/g, ' ');
};

const formatDate = (value: string) => {
  if (!value) return 'Not provided';

  const date = new Date(`${value}T12:00:00`);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/* Detail row */

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
}) => (
  <View className="flex-row items-start justify-between gap-[12px] py-[5px]">
    <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
      {label}
    </Text>

    <Text className="flex-1 text-right font-inter-medium text-[13px] leading-[19px] text-care-ink">
      {value || 'Not provided'}
    </Text>
  </View>
);

/* Selected items */

interface DetailListProps {
  items: string[];
  emptyText?: string;
}

const DetailList: React.FC<DetailListProps> = ({
  items,
  emptyText = 'None selected',
}) => (
  <View className="gap-[8px]">
    {items.length === 0 ? (
      <Text className="font-inter-regular text-[13px] text-care-muted">
        {emptyText}
      </Text>
    ) : (
      items.map((item, index) => (
        <View
          key={`${item}-${index}`}
          className="flex-row items-start gap-[8px]"
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={17}
            color="#0E7A67"
          />

          <Text className="flex-1 font-inter-regular text-[13px] leading-[19px] text-care-ink">
            {item}
          </Text>
        </View>
      ))
    )}
  </View>
);

/* Expandable review section */

interface ReviewSectionProps {
  title: string;
  summary: string;
  icon: IconName;
  expanded: boolean;
  disabled?: boolean;
  showDivider?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  summary,
  icon,
  expanded,
  disabled = false,
  showDivider = true,
  onToggle,
  onEdit,
  children,
}) => (
  <View>
    {/* Summary */}

    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${summary}`}
      accessibilityState={{
        expanded,
        disabled,
      }}
      className="min-h-[70px] flex-row items-center gap-[10px] px-[4px] py-[12px] active:opacity-70"
    >
      <View className="h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-brand-tint">
        <Ionicons
          name={icon}
          size={20}
          color="#0E7A67"
        />
      </View>

      <View className="flex-1">
        <Text className="font-inter-semibold text-[13px] leading-[19px] text-care-ink">
          {title}
        </Text>

        <Text className="mt-[3px] font-inter-regular text-[12px] leading-[17px] text-care-muted">
          {summary}
        </Text>
      </View>

      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={17}
        color="#52605D"
      />
    </Pressable>

    {/* Expanded details */}

    {expanded && (
      <View className="mb-[12px] rounded-[12px] border border-care-border bg-care-canvas p-[12px]">
        {children}

        <View className="mt-[10px] border-t border-care-border pt-[6px]">
          <Pressable
            onPress={onEdit}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title}`}
            accessibilityState={{ disabled }}
            className="min-h-[44px] flex-row items-center justify-end gap-[6px] px-[4px] active:opacity-70"
          >
            <Ionicons
              name="pencil-outline"
              size={15}
              color="#0E7A67"
            />

            <Text className="font-inter-semibold text-[13px] text-brand-dark">
              Edit details
            </Text>
          </Pressable>
        </View>
      </View>
    )}

    {showDivider && (
      <View className="h-px bg-care-border" />
    )}
  </View>
);

/* Main screen */

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

  // All sections are collapsed initially.
  const [expandedSections, setExpandedSections] =
    useState<number[]>([]);

  const toggleSection = (step: number) => {
    setExpandedSections((previous) =>
      previous.includes(step)
        ? previous.filter((item) => item !== step)
        : [...previous, step]
    );
  };

  const editStep = (step: number) => {
    if (!submitting) {
      onJumpToStep(step);
    }
  };

  const sectionProps = (step: number) => ({
    expanded: expandedSections.includes(step),
    disabled: submitting,
    onToggle: () => toggleSection(step),
    onEdit: () => editStep(step),
  });

  const hasEmergencyContact =
    Boolean(data.emergencyContactName.trim()) &&
    Boolean(data.emergencyContactRelation.trim()) &&
    Boolean(data.emergencyContactPhone.trim());

  const showDementiaDetails =
    data.diagnosisStatus === 'DIAGNOSED' ||
    data.diagnosisStatus === 'SUSPECTED';

  const medicationSummary = !data.takesMedication
    ? 'No regular medications'
    : data.medications.length === 0
      ? 'Add medications later'
      : `${data.medications.length} medication${
          data.medications.length === 1 ? '' : 's'
        } added`;

  const safetySummary = data.safetyConcerns.includes('none')
    ? 'No safety concerns'
    : data.safetyConcerns.length > 0
      ? `${data.safetyConcerns.length} selected`
      : 'None selected';

  const primaryLanguageLabel = getLanguageDisplayName(data.primaryLanguage);

  const languageSummary = [
    primaryLanguageLabel,
    ...data.additionalLanguages.filter(
      (language) =>
        language !== data.primaryLanguage &&
        language !== primaryLanguageLabel
    ),
  ].join(', ');

  return (
    <OnboardingLayout
      title="You're almost ready!"
      currentStep={9}
      iconName="checkmark-done-circle-outline"
      backgroundVariant="mint"
      onBack={() => {
        if (!submitting) onBack();
      }}
      onNext={() => {
        if (!submitting) onSubmit();
      }}
      nextLabel="Complete setup"
      isNextLoading={submitting}
      isNextDisabled={submitting}
    >
      <View className="gap-[12px]">

        <Text className="font-inter-regular text-[13px] leading-[20px] text-care-muted">
          Review your details before finishing.
        </Text>

        {/* Submission error */}

        {!!submitError && (
          <View
            accessibilityRole="alert"
            className="flex-row items-start gap-[10px] rounded-[12px] border border-red-200 bg-red-50 p-[12px]"
          >
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color="#DC2626"
            />

            <View className="flex-1">
              <Text className="font-inter-semibold text-[13px] text-red-700">
                Unable to complete setup
              </Text>

              <Text className="mt-[4px] font-inter-regular text-[12px] leading-[18px] text-red-700">
                {submitError}
              </Text>
            </View>
          </View>
        )}

        {/* Main review container */}

        <View
          className="rounded-[20px] border border-care-border bg-white p-[12px]"
          style={{
            shadowColor: '#244A42',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            elevation: 2,
          }}
        >

          {/* 1. About patient */}

          <ReviewSection
            {...sectionProps(1)}
            title={isSelf ? 'About you' : 'Patient details'}
            icon="person-outline"
            summary={data.name || 'Not provided'}
          >
            {!!data.photoUri && (
              <View className="mb-[10px] items-center">
                <Image
                  source={{ uri: data.photoUri }}
                  accessibilityLabel="Profile photo"
                  className="h-[64px] w-[64px] rounded-full"
                />
              </View>
            )}

            <DetailRow
              label="Name"
              value={data.name}
            />

            <DetailRow
              label="Date of birth"
              value={formatDate(data.dob)}
            />

            <DetailRow
              label="Gender"
              value={data.gender}
            />
          </ReviewSection>

          {/* 2. Communication */}

          <ReviewSection
            {...sectionProps(2)}
            title="Language & communication"
            icon="chatbubble-ellipses-outline"
            summary={languageSummary}
          >
            <DetailRow
              label="Primary language"
              value={primaryLanguageLabel}
            />

            <DetailRow
              label="Other languages"
              value={
                data.additionalLanguages.join(', ') ||
                'None selected'
              }
            />

            {data.communicationPreferences.length > 0 && (
              <View className="mt-[8px] border-t border-care-border pt-[10px]">
                <Text className="mb-[8px] font-inter-semibold text-[12px] text-care-ink">
                  Communication preferences
                </Text>

                <DetailList
                  items={data.communicationPreferences.map(
                    (item) =>
                      getLabel(item, COMMUNICATION_LABELS)
                  )}
                />
              </View>
            )}
          </ReviewSection>

          {/* 3. Living situation */}

          <ReviewSection
            {...sectionProps(3)}
            title="Home & living"
            icon="home-outline"
            summary={
              [
                data.city,
                data.livingArrangement
                  ? getLabel(
                      data.livingArrangement,
                      LIVING_LABELS
                    )
                  : '',
              ]
                .filter(Boolean)
                .join(' · ') || 'Not provided'
            }
          >
            <DetailRow
              label="City"
              value={data.city}
            />

            <DetailRow
              label="Living arrangement"
              value={getLabel(
                data.livingArrangement,
                LIVING_LABELS
              )}
            />
          </ReviewSection>

          {/* 4. Health status */}

          <ReviewSection
            {...sectionProps(4)}
            title="Memory & health"
            icon="fitness-outline"
            summary={
              showDementiaDetails &&
              data.stage &&
              data.stage !== 'None'
                ? getLabel(data.stage, STAGE_LABELS)
                : getLabel(
                    data.diagnosisStatus,
                    DIAGNOSIS_LABELS
                  )
            }
          >
            <DetailRow
              label="Memory care status"
              value={getLabel(
                data.diagnosisStatus,
                DIAGNOSIS_LABELS
              )}
            />

            {showDementiaDetails && (
              <>
                <DetailRow
                  label="Condition type"
                  value={getLabel(
                    data.dementiaType,
                    DEMENTIA_LABELS
                  )}
                />

                <DetailRow
                  label="Support level"
                  value={getLabel(
                    data.stage,
                    STAGE_LABELS
                  )}
                />
              </>
            )}

            <View className="mt-[8px] border-t border-care-border pt-[10px]">
              <Text className="mb-[8px] font-inter-semibold text-[12px] text-care-ink">
                Other health factors
              </Text>

              <DetailList
                items={data.otherConditions.map(
                  (condition) =>
                    getLabel(condition, CONDITION_LABELS)
                )}
                emptyText="Not provided"
              />
            </View>
          </ReviewSection>

          {/* 5. Medication setup */}

          <ReviewSection
            {...sectionProps(5)}
            title="Daily medications"
            icon="medkit-outline"
            summary={medicationSummary}
          >
            <DetailRow
              label="Regular medications"
              value={data.takesMedication ? 'Yes' : 'No'}
            />

            {data.takesMedication &&
              data.medications.length === 0 && (
                <View className="mt-[8px] flex-row items-center gap-[8px] rounded-[10px] bg-brand-tint p-[10px]">
                  <Ionicons
                    name="time-outline"
                    size={19}
                    color="#0E7A67"
                  />

                  <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-brand-dark">
                    Medication schedule not added yet.
                  </Text>
                </View>
              )}

            {data.takesMedication &&
              data.medications.length > 0 && (
                <View className="mt-[10px] gap-[8px]">
                  {data.medications.map((medication) => (
                    <View
                      key={medication.id}
                      className="rounded-[10px] border border-care-border bg-white p-[10px]"
                    >
                      <Text className="font-inter-semibold text-[13px] text-care-ink">
                        {medication.name}
                      </Text>

                      {!!medication.dosage && (
                        <Text className="mt-[3px] font-inter-regular text-[12px] text-care-muted">
                          {medication.dosage}
                        </Text>
                      )}

                      {!!medication.times_of_day?.length && (
                        <View className="mt-[8px] flex-row flex-wrap gap-[6px]">
                          {medication.times_of_day.map(
                            (time, index) => (
                              <View
                                key={`${time}-${index}`}
                                className="flex-row items-center gap-[4px] rounded-[8px] bg-brand-tint px-[8px] py-[4px]"
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={12}
                                  color="#0E7A67"
                                />

                                <Text className="font-inter-medium text-[11px] text-brand-dark">
                                  {time}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      )}

                      {!!medication.instructions && (
                        <Text className="mt-[8px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                          {medication.instructions}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
          </ReviewSection>

          {/* 6. Care preferences */}

          <ReviewSection
            {...sectionProps(6)}
            title="Care preferences"
            icon="heart-outline"
            summary={`${data.careNeeds.length} selected`}
          >
            <DetailList
              items={data.careNeeds.map((item) =>
                getLabel(item, CARE_LABELS)
              )}
            />
          </ReviewSection>

          {/* 7. Safety concerns */}

          <ReviewSection
            {...sectionProps(7)}
            title="Safety concerns"
            icon="shield-checkmark-outline"
            summary={safetySummary}
          >
            <DetailList
              items={data.safetyConcerns.map((item) =>
                getLabel(item, SAFETY_LABELS)
              )}
            />
          </ReviewSection>

          {/* 8. Emergency contact */}

          <ReviewSection
            {...sectionProps(8)}
            title="Emergency contact"
            icon="call-outline"
            summary={
              hasEmergencyContact
                ? `${data.emergencyContactName} · ${data.emergencyContactRelation}`
                : 'Not added yet'
            }
            showDivider={false}
          >
            {hasEmergencyContact ? (
              <>
                <DetailRow
                  label="Name"
                  value={data.emergencyContactName}
                />

                <DetailRow
                  label="Relationship"
                  value={data.emergencyContactRelation}
                />

                <DetailRow
                  label="Phone number"
                  value={data.emergencyContactPhone}
                />
              </>
            ) : (
              <View className="flex-row items-start gap-[8px]">
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color="#0E7A67"
                />

                <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
                  No emergency contact configured.
                </Text>
              </View>
            )}
          </ReviewSection>

        </View>
      </View>
    </OnboardingLayout>
  );
};
