
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step3ExperienceSkills.tsx
 * Caregiver Onboarding Step 3: Experience and dementia care training.
 */

import React, { useState } from 'react';

import {
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';

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

const EXPERIENCE_PRESETS = [0, 1, 2, 3, 5, 10];

type IconName = keyof typeof Ionicons.glyphMap;

/* Reusable experience input */

interface ExperienceFieldProps {
  title: string;
  icon: IconName;
  value: number | null;
  maximum?: number | null;
  zeroLabel?: string;
  error?: string;
  onChange: (value: number | null) => void;
}

const ExperienceField: React.FC<
  ExperienceFieldProps
> = ({
  title,
  icon,
  value,
  maximum,
  zeroLabel = '0 years',
  error,
  onChange,
}) => {

  const [focused, setFocused] =
    useState(false);

  const handleChange = (text: string) => {
    // Accept whole years only.
    const cleaned = text.replace(/[^0-9]/g, '');

    if (!cleaned) {
      onChange(null);
      return;
    }

    onChange(Number(cleaned));
  };

  return (
    <View>

      {/* Section heading */}

      <View className="mb-[12px] flex-row items-center gap-[10px]">

        <View className="h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#E1F2F4]">
          <Ionicons
            name={icon}
            size={21}
            color="#256C78"
          />
        </View>

        <Text className="flex-1 font-inter-semibold text-[14px] leading-[20px] text-care-ink">
          {title}
        </Text>

      </View>

      {/* Exact experience input */}

      <View
        className={`min-h-[52px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[14px] ${
          error
            ? 'border-red-400'
            : focused
              ? 'border-brand'
              : 'border-care-border'
        }`}
      >
        <TextInput
          className="min-h-[52px] flex-1 font-inter-semibold text-[18px] text-care-ink"
          accessibilityLabel={title}
          placeholder="Enter years"
          placeholderTextColor="#68766F"
          keyboardType="number-pad"
          value={
            value !== null
              ? String(value)
              : ''
          }
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={2}
          returnKeyType="done"
          selectTextOnFocus
        />

        <View className="h-[24px] w-px bg-care-border" />

        <Text className="font-inter-medium text-[13px] text-care-muted">
          {value === 1 ? 'Year' : 'Years'}
        </Text>

      </View>

      {/* Quick-select presets */}

      <View className="mt-[10px] gap-[8px]">

        {[
          EXPERIENCE_PRESETS.slice(0, 3),
          EXPERIENCE_PRESETS.slice(3, 6),
        ].map((row, rowIndex) => (

          <View
            key={rowIndex}
            className="flex-row gap-[8px]"
            accessibilityRole="radiogroup"
          >

            {row.map((preset) => {
              const selected = value === preset;

              const disabled =
                maximum !== null &&
                maximum !== undefined &&
                preset > maximum;

              return (
                <Pressable
                  key={preset}
                  disabled={disabled}
                  onPress={() => onChange(preset)}
                  accessibilityRole="radio"
                  accessibilityLabel={
                    preset === 0
                      ? zeroLabel
                      : `${preset} ${
                          preset === 1
                            ? 'year'
                            : 'years'
                        }`
                  }
                  accessibilityState={{
                    checked: selected,
                    disabled,
                  }}
                  className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-[4px] rounded-[10px] border px-[6px] py-[8px] ${
                    disabled
                      ? 'border-care-border bg-care-canvas opacity-40'
                      : selected
                        ? 'border-brand bg-care-selected'
                        : 'border-care-border bg-white active:opacity-70'
                  }`}
                >

                  {selected && !disabled && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#0E7A67"
                    />
                  )}

                  <Text
                    className={`shrink text-center font-inter-medium text-[12px] ${
                      selected && !disabled
                        ? 'text-brand-dark'
                        : 'text-care-ink'
                    }`}
                  >
                    {preset === 0
                      ? zeroLabel
                      : `${preset} ${
                          preset === 1
                            ? 'year'
                            : 'years'
                        }`}
                  </Text>

                </Pressable>
              );
            })}

          </View>
        ))}

      </View>

      {/* Validation feedback */}

      {!!error && (
        <View
          accessibilityLiveRegion="polite"
          className="mt-[10px] flex-row items-start gap-[6px]"
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color="#DC2626"
          />

          <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-red-600">
            {error}
          </Text>
        </View>
      )}

    </View>
  );
};

/* Main screen */

export const Step3ExperienceSkills: React.FC<
  Step3Props
> = ({
  yearsExperience,
  dementiaExperienceYears,
  hasDementiaTraining,
  onUpdate,
  onNext,
  onBack,
}) => {

  const isTotalValid =
    yearsExperience !== null &&
    Number.isInteger(yearsExperience) &&
    yearsExperience >= 0 &&
    yearsExperience <= 99;

  const isDementiaValid =
    dementiaExperienceYears !== null &&
    Number.isInteger(dementiaExperienceYears) &&
    dementiaExperienceYears >= 0 &&
    dementiaExperienceYears <= 99 &&
    yearsExperience !== null &&
    dementiaExperienceYears <= yearsExperience;

  const isValid =
    isTotalValid && isDementiaValid;

  const exceedsTotal =
    yearsExperience !== null &&
    dementiaExperienceYears !== null &&
    dementiaExperienceYears > yearsExperience;

  const handleContinue = () => {
    if (!isValid) return;

    onNext();
  };

  return (
    <OnboardingLayout
      title="Your experience"
      subtitle="Tell us about your caregiving experience."
      currentStep={3}
      totalSteps={9}
      iconName="ribbon-outline"
      backgroundVariant="ocean"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={handleContinue}
      isNextDisabled={!isValid}
    >

      {/* Main white container */}

      <View
        className="rounded-[20px] border border-care-border bg-white p-[16px]"
        style={{
          shadowColor: '#254D51',
          shadowOpacity: 0.08,
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowRadius: 8,
          elevation: 2,
        }}
      >

        {/* 1. Total experience */}

        <ExperienceField
          title="Total caregiving experience *"
          icon="medal-outline"
          value={yearsExperience}
          zeroLabel="0 years"
          onChange={(value) =>
            onUpdate({
              yearsExperience: value,
            })
          }
        />

        <View className="my-[18px] h-px bg-care-border" />

        {/* 2. Dementia-specific experience */}

        <ExperienceField
          title="Dementia care experience *"
          icon="sparkles-outline"
          value={dementiaExperienceYears}
          maximum={yearsExperience}
          zeroLabel="None"
          error={
            exceedsTotal
              ? 'Cannot exceed total caregiving experience.'
              : undefined
          }
          onChange={(value) =>
            onUpdate({
              dementiaExperienceYears: value,
            })
          }
        />

        <View className="my-[18px] h-px bg-care-border" />

        {/* 3. Formal dementia training */}

        <View className="min-h-[56px] flex-row items-center gap-[10px]">

          <View className="h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[#E1F2F4]">
            <Ionicons
              name="school-outline"
              size={22}
              color="#256C78"
            />
          </View>

          <View className="flex-1">

            <Text className="font-inter-semibold text-[13px] leading-[19px] text-care-ink">
              Dementia care training
            </Text>

            <Text className="mt-[3px] font-inter-regular text-[12px] leading-[17px] text-care-muted">
              Completed formal training
            </Text>

          </View>

          <Switch
            value={hasDementiaTraining}
            onValueChange={(value) =>
              onUpdate({
                hasDementiaTraining: value,
              })
            }
            accessibilityLabel="Completed formal dementia care training"
            accessibilityRole="switch"
            accessibilityState={{
              checked: hasDementiaTraining,
            }}
            trackColor={{
              false: '#D0D5D3',
              true: '#0E7A67',
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D0D5D3"
          />

        </View>

      </View>

    </OnboardingLayout>
  );
};
