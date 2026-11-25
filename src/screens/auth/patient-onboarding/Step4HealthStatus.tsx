
/**
 * SureStep — src/screens/auth/patient-onboarding/Step4HealthStatus.tsx
 * Step 4: Progressive health onboarding with Android back navigation.
 */

import React, { useState, useCallback } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
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

type HealthPage = 'memory' | 'support' | 'conditions';

type IconName = keyof typeof Ionicons.glyphMap;

const DIAGNOSIS_OPTIONS = [
  {
    id: 'DIAGNOSED',
    title: 'Doctor-confirmed diagnosis',
    icon: 'medical-outline' as const,
  },
  {
    id: 'SUSPECTED',
    title: 'Noticed memory changes',
    icon: 'eye-outline' as const,
  },
  {
    id: 'NO_DEMENTIA',
    title: 'General wellbeing & routine',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 'NOT_SURE',
    title: 'Still exploring / Not sure',
    icon: 'help-circle-outline' as const,
  },
];

const DEMENTIA_TYPES = [
  { id: "Alzheimer's", label: "Alzheimer's" },
  { id: 'Vascular', label: 'Vascular' },
  { id: 'Lewy Body', label: 'Lewy Body' },
  { id: 'Frontotemporal', label: 'Frontotemporal' },
  { id: 'MCI', label: 'Mild cognitive changes' },
  { id: 'Mixed / Other', label: 'Mixed / Other' },
  { id: 'Unknown', label: 'Not sure' },
];

const STAGE_OPTIONS = [
  {
    id: 'Mild',
    title: 'Occasional support',
    desc: 'Gentle reminders throughout the day',
  },
  {
    id: 'Moderate',
    title: 'Regular support',
    desc: 'Daily assistance and structured routines',
  },
  {
    id: 'Severe',
    title: 'Comprehensive care',
    desc: 'Full-time assistance and supervision',
  },
  {
    id: 'Unknown',
    title: 'Not sure yet',
    desc: 'Adjust support as needs evolve',
  },
];

const CONDITION_OPTIONS = [
  {
    id: 'Hypertension',
    label: 'High blood pressure',
    icon: 'pulse-outline' as const,
  },
  {
    id: 'Diabetes',
    label: 'Diabetes',
    icon: 'water-outline' as const,
  },
  {
    id: 'Heart Disease',
    label: 'Heart condition',
    icon: 'heart-outline' as const,
  },
  {
    id: 'Mobility Impairment',
    label: 'Mobility / Walking support',
    icon: 'walk-outline' as const,
  },
  {
    id: 'Sensory Loss',
    label: 'Vision / Hearing sensitivity',
    icon: 'glasses-outline' as const,
  },
  {
    id: 'None',
    label: 'None / Not applicable',
    icon: 'checkmark-outline' as const,
  },
];

/* ──────────────────────────────────────────
   REUSABLE SELECTION ROW
────────────────────────────────────────── */

interface SelectionRowProps {
  title: string;
  description?: string;
  icon?: IconName;
  selected: boolean;
  multiple?: boolean;
  onPress: () => void;
}

const SelectionRow: React.FC<SelectionRowProps> = ({
  title,
  description,
  icon,
  selected,
  multiple = false,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole={multiple ? 'checkbox' : 'radio'}
    accessibilityState={{ checked: selected }}
    accessibilityLabel={
      description ? `${title}. ${description}` : title
    }
    className={`min-h-[52px] flex-row items-center gap-[10px] rounded-[12px] border px-[12px] py-[12px] active:opacity-70 ${
      selected
        ? 'border-brand bg-care-selected'
        : 'border-care-border bg-care-canvas'
    }`}
  >
    {icon && (
      <Ionicons
        name={icon}
        size={21}
        color={selected ? '#0E7A67' : '#52605D'}
      />
    )}

    <View className="flex-1">
      <Text
        className={`font-inter-medium text-[14px] leading-[20px] ${
          selected ? 'text-brand-dark' : 'text-care-ink'
        }`}
      >
        {title}
      </Text>

      {description && (
        <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          {description}
        </Text>
      )}
    </View>

    <View
      className={`h-[20px] w-[20px] items-center justify-center border ${
        multiple ? 'rounded-[5px]' : 'rounded-full'
      } ${
        selected
          ? 'border-brand bg-brand'
          : 'border-care-border bg-white'
      }`}
    >
      {selected && (
        <Ionicons
          name="checkmark"
          size={13}
          color="#FFFFFF"
        />
      )}
    </View>
  </Pressable>
);

/* ──────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────── */

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

  const [page, setPage] = useState<HealthPage>('memory');
  const [showTypes, setShowTypes] = useState(false);

  const showDementiaDetails =
    diagnosisStatus === 'DIAGNOSED' ||
    diagnosisStatus === 'SUSPECTED';

  const totalPages = showDementiaDetails ? 3 : 2;

  const currentPage =
    page === 'memory'
      ? 1
      : page === 'support'
        ? 2
        : totalPages;

  const selectedType = DEMENTIA_TYPES.find(
    (type) => type.id === dementiaType
  );

  /* ──────────────────────────────────────────
     DIAGNOSIS SELECTION
  ────────────────────────────────────────── */

  const selectDiagnosis = (id: string) => {
    if (id === 'NO_DEMENTIA') {
      onUpdate({
        diagnosisStatus: id,
        dementiaType: 'None',
        stage: 'None',
      });

      return;
    }

    onUpdate({
      diagnosisStatus: id,
      dementiaType:
        dementiaType === 'None' ? '' : dementiaType,
      stage: stage === 'None' ? '' : stage,
    });
  };

  /* ──────────────────────────────────────────
     OTHER HEALTH CONDITIONS
  ────────────────────────────────────────── */

  const toggleCondition = (id: string) => {
    if (id === 'None') {
      onUpdate({
        otherConditions: otherConditions.includes('None')
          ? []
          : ['None'],
      });

      return;
    }

    const filtered = otherConditions.filter(
      (condition) => condition !== 'None'
    );

    onUpdate({
      otherConditions: filtered.includes(id)
        ? filtered.filter((condition) => condition !== id)
        : [...filtered, id],
    });
  };

  /* ──────────────────────────────────────────
     VALIDATION
  ────────────────────────────────────────── */

  const isPageComplete =
    page === 'memory'
      ? DIAGNOSIS_OPTIONS.some(
          (option) => option.id === diagnosisStatus
        )
      : page === 'support'
        ? Boolean(selectedType) &&
          STAGE_OPTIONS.some((option) => option.id === stage)
        : true;

  /* ──────────────────────────────────────────
     NEXT SECTION
  ────────────────────────────────────────── */

  const handleNext = () => {
    if (!isPageComplete) return;

    setShowTypes(false);

    if (page === 'memory') {
      setPage(
        showDementiaDetails ? 'support' : 'conditions'
      );
      return;
    }

    if (page === 'support') {
      setPage('conditions');
      return;
    }

    // Continue to the next main onboarding step.
    onNext();
  };

  /* ──────────────────────────────────────────
     BACK NAVIGATION
  ────────────────────────────────────────── */

  const handleBack = useCallback(() => {
    // Close the expanded condition selector first.
    if (showTypes) {
      setShowTypes(false);
      return;
    }

    // Return to the previous health subsection.
    if (page === 'conditions') {
      setPage(
        showDementiaDetails ? 'support' : 'memory'
      );
      return;
    }

    // Return to memory care status.
    if (page === 'support') {
      setPage('memory');
      return;
    }

    // Return to the previous main onboarding step.
    onBack();
  }, [
    page,
    showTypes,
    showDementiaDetails,
    onBack,
  ]);

  /* ──────────────────────────────────────────
     ANDROID PHONE BACK BUTTON
  ────────────────────────────────────────── */

  useFocusEffect(
    useCallback(() => {
      // The parent handles back navigation from
      // the first subsection of Step 4.
      if (page === 'memory' && !showTypes) {
        return;
      }

      const onHardwareBackPress = () => {
        handleBack();

        // Prevent navigation from leaving Step 4.
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onHardwareBackPress
      );

      return () => {
        subscription.remove();
      };
    }, [handleBack, page, showTypes])
  );

  /* ──────────────────────────────────────────
     SCREEN CONTENT
  ────────────────────────────────────────── */

  const screenContent = {
    memory: {
      title: isSelf
        ? 'Let’s understand your needs'
        : 'Understanding their needs',

      subtitle: isSelf
        ? 'Choose what best describes your memory health.'
        : 'Choose what best describes their memory health.',

      icon: 'fitness-outline' as const,
    },

    support: {
      title: 'Personalise daily support',

      subtitle: isSelf
        ? 'Help us understand what support works for you.'
        : 'Help us understand what support works for them.',

      icon: 'heart-outline' as const,
    },

    conditions: {
      title: 'Anything else we should know?',

      subtitle:
        'Share any additional health needs for a more comfortable care experience.',

      icon: 'shield-checkmark-outline' as const,
    },
  }[page];

  return (
    <OnboardingLayout
      title={screenContent.title}
      currentStep={4}
      iconName={screenContent.icon}
      backgroundVariant="mint"
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={!isPageComplete}
    >
      <View className="gap-[12px]">

        {/* Internal progress indicator */}

        <View>
          <View className="mb-[8px] flex-row items-center justify-between">
            <Text className="font-inter-medium text-[12px] text-brand-dark">
              Health information
            </Text>

            <Text className="font-inter-regular text-[12px] text-care-muted">
              {currentPage} of {totalPages}
            </Text>
          </View>

          <View className="flex-row gap-[5px]">
            {Array.from({ length: totalPages }).map(
              (_, index) => (
                <View
                  key={index}
                  className={`h-[4px] flex-1 rounded-full ${
                    index < currentPage
                      ? 'bg-brand'
                      : 'bg-care-border'
                  }`}
                />
              )
            )}
          </View>
        </View>

        <Text className="font-inter-regular text-[13px] leading-[20px] text-care-muted">
          {screenContent.subtitle}
        </Text>

        {/* Main white container */}

        <View
          className="rounded-[20px] border border-care-border bg-white p-[16px]"
          style={{
            shadowColor: '#244A42',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 8,
            elevation: 2,
          }}
        >

          {/* SECTION 1 — Memory care status */}

          {page === 'memory' && (
            <>
              <Text className="mb-[12px] font-inter-semibold text-[13px] text-care-ink">
                Memory care status *
              </Text>

              <View
                className="gap-[8px]"
                accessibilityRole="radiogroup"
              >
                {DIAGNOSIS_OPTIONS.map((option) => (
                  <SelectionRow
                    key={option.id}
                    title={option.title}
                    icon={option.icon}
                    selected={
                      diagnosisStatus === option.id
                    }
                    onPress={() =>
                      selectDiagnosis(option.id)
                    }
                  />
                ))}
              </View>
            </>
          )}

          {/* SECTION 2 — Condition and support */}

          {page === 'support' && (
            <>
              <Text className="mb-[6px] font-inter-semibold text-[13px] text-care-ink">
                Condition type *
              </Text>

              {/* Expandable condition selector */}

              <Pressable
                onPress={() =>
                  setShowTypes((previous) => !previous)
                }
                accessibilityRole="button"
                accessibilityLabel={`Condition type, ${
                  selectedType?.label || 'Not selected'
                }`}
                accessibilityState={{
                  expanded: showTypes,
                }}
                className={`min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] py-[10px] active:opacity-70 ${
                  showTypes
                    ? 'border-brand'
                    : 'border-care-border'
                }`}
              >
                <Ionicons
                  name="medical-outline"
                  size={18}
                  color="#0E7A67"
                />

                <Text
                  className={`flex-1 font-inter-regular text-[14px] ${
                    selectedType
                      ? 'text-care-ink'
                      : 'text-care-muted'
                  }`}
                >
                  {selectedType?.label ||
                    'Select condition'}
                </Text>

                <Ionicons
                  name={
                    showTypes
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={16}
                  color="#52605D"
                />
              </Pressable>

              {/* Condition options */}

              {showTypes && (
                <View
                  className="mt-[6px] overflow-hidden rounded-[12px] border border-care-border bg-white"
                  accessibilityRole="radiogroup"
                >
                  {DEMENTIA_TYPES.map((type, index) => {
                    const selected =
                      dementiaType === type.id;

                    return (
                      <Pressable
                        key={type.id}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: selected,
                        }}
                        onPress={() => {
                          onUpdate({
                            dementiaType: type.id,
                          });

                          setShowTypes(false);
                        }}
                        className={`min-h-[44px] flex-row items-center gap-[8px] px-[12px] py-[10px] active:opacity-70 ${
                          index !==
                          DEMENTIA_TYPES.length - 1
                            ? 'border-b border-care-border'
                            : ''
                        } ${
                          selected
                            ? 'bg-care-selected'
                            : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`flex-1 font-inter-medium text-[13px] ${
                            selected
                              ? 'text-brand-dark'
                              : 'text-care-ink'
                          }`}
                        >
                          {type.label}
                        </Text>

                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={17}
                            color="#0E7A67"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <Text className="mt-[6px] font-inter-regular text-[12px] text-care-muted">
                Choose “Not sure” if you don't know.
              </Text>

              <View className="my-[16px] h-px bg-care-border" />

              {/* Daily support level */}

              <Text className="mb-[4px] font-inter-semibold text-[13px] text-care-ink">
                Daily support level *
              </Text>

              <Text className="mb-[12px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                How much daily assistance is needed?
              </Text>

              <View
                className="gap-[8px]"
                accessibilityRole="radiogroup"
              >
                {STAGE_OPTIONS.map((option) => (
                  <SelectionRow
                    key={option.id}
                    title={option.title}
                    description={option.desc}
                    selected={stage === option.id}
                    onPress={() =>
                      onUpdate({ stage: option.id })
                    }
                  />
                ))}
              </View>
            </>
          )}

          {/* SECTION 3 — Other health factors */}

          {page === 'conditions' && (
            <>
              <View className="mb-[4px] flex-row items-center justify-between gap-[8px]">
                <Text className="font-inter-semibold text-[13px] text-care-ink">
                  Other health factors
                </Text>

                <Text className="font-inter-regular text-[12px] text-care-muted">
                  Optional
                </Text>
              </View>

              <Text className="mb-[12px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                Select all that apply.
              </Text>

              <View className="gap-[8px]">
                {CONDITION_OPTIONS.map((condition) => (
                  <SelectionRow
                    key={condition.id}
                    title={condition.label}
                    icon={condition.icon}
                    multiple
                    selected={otherConditions.includes(
                      condition.id
                    )}
                    onPress={() =>
                      toggleCondition(condition.id)
                    }
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Support information */}

        {page === 'support' && (
          <View className="flex-row items-start gap-[8px] px-[4px]">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#0E7A67"
            />

            <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
              These preferences help personalise daily
              assistance. They are not a medical assessment.
            </Text>
          </View>
        )}

        {/* Skip optional information */}

        {page === 'conditions' &&
          otherConditions.length === 0 && (
            <Pressable
              onPress={handleNext}
              accessibilityRole="button"
              className="min-h-[44px] items-center justify-center active:opacity-70"
            >
              <Text className="font-inter-medium text-[13px] text-brand-dark">
                Skip for now
              </Text>
            </Pressable>
          )}

      </View>
    </OnboardingLayout>
  );
};
