
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step4Capabilities.tsx
 * Caregiver Onboarding Step 4: Care capabilities and specializations.
 */

import React, { useState } from 'react';

import {
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';

import type {
  ChipOption,
} from '../../../components/onboarding/MultiSelectChips';

import {
  CAPABILITY_OPTIONS,
} from '../../../types/care.types';

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
  {
    id: 'alzheimers',
    label: "Alzheimer's Disease",
    icon: 'sparkles-outline',
  },
  {
    id: 'vascular_dementia',
    label: 'Vascular Dementia',
    icon: 'git-branch-outline',
  },
  {
    id: 'lewy_body',
    label: 'Lewy Body Dementia',
    icon: 'eye-outline',
  },
  {
    id: 'ftd',
    label: 'Frontotemporal Dementia (FTD)',
    icon: 'bandage-outline',
  },
  {
    id: 'mci',
    label: 'Mild Cognitive Impairment (MCI)',
    icon: 'bulb-outline',
  },
  {
    id: 'parkinsons',
    label: "Parkinson's Disease",
    icon: 'fitness-outline',
  },
  {
    id: 'post_stroke',
    label: 'Post-Stroke Recovery',
    icon: 'shield-outline',
  },
];

/* Responsive grid helper */

const createRows = <T,>(
  items: readonly T[],
  columns: number
): T[][] => {
  const rows: T[][] = [];

  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return rows;
};

/* Main screen */

export const Step4Capabilities: React.FC<
  Step4Props
> = ({
  careCapabilities,
  specializations,
  onUpdate,
  onNext,
  onBack,
}) => {

  const { width, fontScale } =
    useWindowDimensions();

  const [showSpecializations, setShowSpecializations] =
    useState(specializations.length > 0);

  const singleColumn =
    width < 360 || fontScale > 1.3;

  const columns = singleColumn ? 1 : 2;

  const capabilityRows = createRows(
    CAPABILITY_OPTIONS,
    columns
  );

  /* Toggle care capability */

  const toggleCapability = (id: string) => {
    const updated = careCapabilities.includes(id)
      ? careCapabilities.filter(
          (item) => item !== id
        )
      : [...careCapabilities, id];

    onUpdate({
      careCapabilities: updated,
    });
  };

  /* Toggle specialization */

  const toggleSpecialization = (id: string) => {
    const updated = specializations.includes(id)
      ? specializations.filter(
          (item) => item !== id
        )
      : [...specializations, id];

    onUpdate({
      specializations: updated,
    });
  };

  /* Require at least one valid capability */

  const isComplete = CAPABILITY_OPTIONS.some(
    (item) => careCapabilities.includes(item.id)
  );

  return (
    <OnboardingLayout
      title="Your care skills"
      subtitle="Select the care you can provide."
      currentStep={4}
      totalSteps={9}
      iconName="fitness-outline"
      backgroundVariant="ocean"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
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

        {/* 1. Care capabilities */}

        <View className="mb-[12px] flex-row items-center justify-between gap-[8px]">

          <Text className="flex-1 font-inter-semibold text-[14px] leading-[20px] text-care-ink">
            Care capabilities *
          </Text>

          <Text className="font-inter-medium text-[12px] text-brand-dark">
            {careCapabilities.length} selected
          </Text>

        </View>

        <View className="gap-[8px]">

          {capabilityRows.map((row, rowIndex) => (

            <View
              key={rowIndex}
              className="flex-row items-stretch gap-[8px]"
            >

              {row.map((item) => {
                const selected =
                  careCapabilities.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      toggleCapability(item.id)
                    }
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.label}
                    accessibilityState={{
                      checked: selected,
                    }}
                    className={`relative flex-1 rounded-[12px] border p-[12px] active:opacity-70 ${
                      singleColumn
                        ? 'min-h-[56px] flex-row items-center gap-[12px] pr-[36px]'
                        : 'min-h-[100px] items-center justify-center gap-[8px] pt-[26px]'
                    } ${
                      selected
                        ? 'border-brand bg-care-selected'
                        : 'border-care-border bg-care-canvas'
                    }`}
                  >

                    {/* Selection indicator */}

                    <View className="absolute right-[8px] top-[8px]">

                      <Ionicons
                        name={
                          selected
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={17}
                        color={
                          selected
                            ? '#0E7A67'
                            : '#AAB8B2'
                        }
                      />

                    </View>

                    {/* Capability icon */}

                    <Ionicons
                      name={
                        item.icon || 'heart-outline'
                      }
                      size={26}
                      color={
                        selected
                          ? '#0E7A67'
                          : '#256C78'
                      }
                    />

                    {/* Capability label */}

                    <Text
                      className={`font-inter-medium text-[13px] leading-[18px] ${
                        singleColumn
                          ? 'flex-1'
                          : 'text-center'
                      } ${
                        selected
                          ? 'text-brand-dark'
                          : 'text-care-ink'
                      }`}
                    >
                      {item.label}
                    </Text>

                  </Pressable>
                );
              })}

              {/* Keep the final odd card aligned */}

              {!singleColumn && row.length === 1 && (
                <View className="flex-1" />
              )}

            </View>
          ))}

        </View>

        {/* Section divider */}

        <View className="my-[18px] h-px bg-care-border" />

        {/* 2. Optional specializations */}

        <Pressable
          onPress={() =>
            setShowSpecializations(
              (previous) => !previous
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Condition specializations, optional"
          accessibilityState={{
            expanded: showSpecializations,
          }}
          className="min-h-[52px] flex-row items-center gap-[10px] active:opacity-70"
        >

          <View className="h-[40px] w-[40px] items-center justify-center rounded-[10px] bg-[#E1F2F4]">

            <Ionicons
              name="ribbon-outline"
              size={22}
              color="#256C78"
            />

          </View>

          <View className="flex-1">

            <Text className="font-inter-semibold text-[14px] leading-[20px] text-care-ink">
              Specializations
            </Text>

            <Text className="mt-[3px] font-inter-regular text-[12px] text-care-muted">
              {specializations.length > 0
                ? `${specializations.length} selected`
                : 'Optional'}
            </Text>

          </View>

          <Ionicons
            name={
              showSpecializations
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={18}
            color="#52605D"
          />

        </Pressable>

        {/* Expandable specialization options */}

        {showSpecializations && (

          <View className="mt-[12px] gap-[8px]">

            {SPECIALIZATION_OPTIONS.map((item) => {
              const selected =
                specializations.includes(item.id);

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    toggleSpecialization(item.id)
                  }
                  accessibilityRole="checkbox"
                  accessibilityLabel={item.label}
                  accessibilityState={{
                    checked: selected,
                  }}
                  className={`min-h-[52px] flex-row items-center gap-[10px] rounded-[12px] border px-[12px] py-[10px] active:opacity-70 ${
                    selected
                      ? 'border-brand bg-care-selected'
                      : 'border-care-border bg-care-canvas'
                  }`}
                >

                  <Ionicons
                    name={
                      item.icon || 'ribbon-outline'
                    }
                    size={21}
                    color={
                      selected
                        ? '#0E7A67'
                        : '#256C78'
                    }
                  />

                  <Text
                    className={`flex-1 font-inter-medium text-[13px] leading-[19px] ${
                      selected
                        ? 'text-brand-dark'
                        : 'text-care-ink'
                    }`}
                  >
                    {item.label}
                  </Text>

                  <Ionicons
                    name={
                      selected
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={19}
                    color={
                      selected
                        ? '#0E7A67'
                        : '#AAB8B2'
                    }
                  />

                </Pressable>
              );
            })}

          </View>
        )}

      </View>

    </OnboardingLayout>
  );
};
