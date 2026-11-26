
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step7AvailabilityArea.tsx
 * Caregiver Onboarding Step 7: Availability and service area.
 */

import React, { useState } from 'react';

import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';

import {
  SHIFT_OPTIONS as AVAILABILITY_OPTIONS,
} from '../../../types/care.types';

interface Step7Props {
  availabilityTypes: string[];
  serviceCity: string;
  serviceRadiusKm: number | null;
  maxPatients: number | null;
  baseCity: string;

  onUpdate: (fields: {
    availabilityTypes?: string[];
    serviceCity?: string;
    serviceRadiusKm?: number | null;
    maxPatients?: number | null;
  }) => void;

  onNext: () => void;
  onBack: () => void;
}

const RADIUS_PRESETS = [5, 10, 15, 20, 25, 40];

const CAPACITY_PRESETS = [1, 2, 3, 4, 5];

type IconName = keyof typeof Ionicons.glyphMap;

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

/* Reusable section heading */

interface SectionHeadingProps {
  title: string;
  icon: IconName;
  trailing?: string;
}

const SectionHeading: React.FC<
  SectionHeadingProps
> = ({
  title,
  icon,
  trailing,
}) => (
  <View className="mb-[12px] flex-row items-center gap-[10px]">

    <View className="h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#E1F2F4]">
      <Ionicons
        name={icon}
        size={20}
        color="#256C78"
      />
    </View>

    <Text className="flex-1 font-inter-semibold text-[14px] leading-[20px] text-care-ink">
      {title}
    </Text>

    {!!trailing && (
      <Text className="font-inter-medium text-[12px] text-care-muted">
        {trailing}
      </Text>
    )}

  </View>
);

/* Reusable numeric selection field */

interface NumericFieldProps {
  label: string;
  value: number | null;
  unit: string;
  placeholder: string;
  presets: number[];
  presetSuffix?: string;
  columns: number;
  maxDigits: number;
  onChange: (value: number | null) => void;
}

const NumericField: React.FC<
  NumericFieldProps
> = ({
  label,
  value,
  unit,
  placeholder,
  presets,
  presetSuffix = '',
  columns,
  maxDigits,
  onChange,
}) => {

  const [focused, setFocused] =
    useState(false);

  const rows = createRows(
    presets,
    columns
  );

  const handleInputChange = (
    text: string
  ) => {
    if (text === '') {
      onChange(null);
      return;
    }

    // Accept positive whole-number values.
    // Reject decimals and negative values.
    if (!/^\d+$/.test(text)) {
      return;
    }

    onChange(Number(text));
  };

  const invalid =
    value !== null &&
    (
      !Number.isInteger(value) ||
      value <= 0 ||
      value > 10 ** maxDigits - 1
    );

  return (
    <View>

      {/* Exact numeric input */}

      <View
        className={`min-h-[52px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[14px] ${
          invalid
            ? 'border-red-400'
            : focused
              ? 'border-brand'
              : 'border-care-border'
        }`}
      >

        <TextInput
          className="min-h-[52px] flex-1 font-inter-semibold text-[16px] text-care-ink"
          accessibilityLabel={label}
          placeholder={placeholder}
          placeholderTextColor="#68766F"
          keyboardType="number-pad"
          value={
            value !== null
              ? String(value)
              : ''
          }
          onChangeText={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={maxDigits}
          returnKeyType="done"
          selectTextOnFocus
        />

        <View className="h-[24px] w-px bg-care-border" />

        <Text className="font-inter-medium text-[13px] text-care-muted">
          {unit}
        </Text>

      </View>

      {/* Validation message */}

      {invalid && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-[6px] font-inter-regular text-[12px] text-red-600"
        >
          Enter a positive whole number.
        </Text>
      )}

      {/* Quick-select options */}

      <View className="mt-[10px] gap-[8px]">

        {rows.map((row, rowIndex) => (

          <View
            key={rowIndex}
            className="flex-row items-stretch gap-[8px]"
          >

            {row.map((preset) => {
              const selected =
                value === preset;

              return (
                <Pressable
                  key={preset}
                  onPress={() => {
                    onChange(preset);
                    Keyboard.dismiss();
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={`${preset} ${unit}`}
                  accessibilityState={{
                    checked: selected,
                  }}
                  className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-[4px] rounded-[10px] border px-[6px] py-[8px] active:opacity-70 ${
                    selected
                      ? 'border-brand bg-care-selected'
                      : 'border-care-border bg-care-canvas'
                  }`}
                >

                  <Text
                    className={`text-center font-inter-medium text-[13px] ${
                      selected
                        ? 'text-brand-dark'
                        : 'text-care-ink'
                    }`}
                  >
                    {preset}
                    {presetSuffix}
                  </Text>

                </Pressable>
              );
            })}

            {/* Preserve grid alignment */}

            {Array.from({
              length: columns - row.length,
            }).map((_, index) => (
              <View
                key={`empty-${index}`}
                className="flex-1"
              />
            ))}

          </View>

        ))}

      </View>

    </View>
  );
};

/* Main onboarding screen */

export const Step7AvailabilityArea: React.FC<
  Step7Props
> = ({
  availabilityTypes,
  serviceCity,
  serviceRadiusKm,
  maxPatients,
  baseCity,
  onUpdate,
  onNext,
  onBack,
}) => {

  const [cityFocused, setCityFocused] =
    useState(false);

  const { width, fontScale } =
    useWindowDimensions();

  const singleColumn =
    width < 360 || fontScale > 1.3;

  const availabilityRows = createRows(
    AVAILABILITY_OPTIONS,
    singleColumn ? 1 : 2
  );

  /* Toggle availability */

  const toggleAvailability = (
    id: string
  ) => {
    const updated =
      availabilityTypes.includes(id)
        ? availabilityTypes.filter(
            (item) => item !== id
          )
        : [
            ...availabilityTypes,
            id,
          ];

    onUpdate({
      availabilityTypes: updated,
    });
  };

  /* Effective service location */

  const effectiveCity =
    serviceCity.trim() ||
    baseCity.trim();

  /* Validation */

  const hasAvailability =
    AVAILABILITY_OPTIONS.some(
      (item) =>
        availabilityTypes.includes(item.id)
    );

  const isRadiusValid =
    serviceRadiusKm !== null &&
    Number.isInteger(serviceRadiusKm) &&
    serviceRadiusKm > 0 &&
    serviceRadiusKm <= 999;

  const isCapacityValid =
    maxPatients !== null &&
    Number.isInteger(maxPatients) &&
    maxPatients > 0 &&
    maxPatients <= 99;

  const isComplete =
    hasAvailability &&
    isRadiusValid &&
    isCapacityValid;

  const handleContinue = () => {
    if (!isComplete) return;

    Keyboard.dismiss();
    onNext();
  };

  return (
    <OnboardingLayout
      title="Availability & service area"
      subtitle="Set your working preferences."
      currentStep={7}
      totalSteps={9}
      iconName="map-outline"
      backgroundVariant="ocean"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={handleContinue}
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

        {/* 1. Working shifts */}

        <SectionHeading
          title="Working shifts *"
          icon="calendar-outline"
          trailing={`${availabilityTypes.length} selected`}
        />

        <View className="gap-[8px]">

          {availabilityRows.map(
            (row, rowIndex) => (

              <View
                key={rowIndex}
                className="flex-row items-stretch gap-[8px]"
              >

                {row.map((item) => {
                  const selected =
                    availabilityTypes.includes(
                      item.id
                    );

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        toggleAvailability(
                          item.id
                        )
                      }
                      accessibilityRole="checkbox"
                      accessibilityLabel={item.label}
                      accessibilityState={{
                        checked: selected,
                      }}
                      className={`min-h-[52px] flex-1 flex-row items-center gap-[8px] rounded-[12px] border px-[10px] py-[10px] active:opacity-70 ${
                        selected
                          ? 'border-brand bg-care-selected'
                          : 'border-care-border bg-care-canvas'
                      }`}
                    >

                      <Ionicons
                        name={
                          item.icon ||
                          'time-outline'
                        }
                        size={19}
                        color={
                          selected
                            ? '#0E7A67'
                            : '#256C78'
                        }
                      />

                      <Text
                        className={`flex-1 font-inter-medium text-[13px] leading-[18px] ${
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
                        size={17}
                        color={
                          selected
                            ? '#0E7A67'
                            : '#AAB8B2'
                        }
                      />

                    </Pressable>
                  );
                })}

                {!singleColumn &&
                  row.length === 1 && (
                    <View className="flex-1" />
                  )}

              </View>

            )
          )}

        </View>

        <View className="my-[18px] h-px bg-care-border" />

        {/* 2. Service operating area */}

        <SectionHeading
          title="Service area"
          icon="location-outline"
          trailing="Optional"
        />

        <View
          className={`min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border bg-care-canvas px-[12px] ${
            cityFocused
              ? 'border-brand'
              : 'border-care-border'
          }`}
        >

          <Ionicons
            name="location-outline"
            size={20}
            color="#256C78"
          />

          <TextInput
            className="min-h-[48px] flex-1 font-inter-regular text-[13px] text-care-ink"
            accessibilityLabel="Primary service area"
            placeholder="Enter city or locality"
            placeholderTextColor="#68766F"
            value={serviceCity}
            onChangeText={(value) =>
              onUpdate({
                serviceCity: value,
              })
            }
            onFocus={() =>
              setCityFocused(true)
            }
            onBlur={() =>
              setCityFocused(false)
            }
            autoCapitalize="words"
            returnKeyType="done"
          />

        </View>

        {/* Base city fallback */}

        {!serviceCity.trim() &&
          !!baseCity.trim() && (

            <View className="mt-[10px] flex-row items-start gap-[8px] rounded-[10px] bg-[#EAF5F6] p-[10px]">

              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#256C78"
              />

              <View className="flex-1">

                <Text className="font-inter-regular text-[12px] leading-[18px] text-care-muted">
                  Uses your base city:
                </Text>

                <Text className="mt-[2px] font-inter-medium text-[13px] leading-[18px] text-care-ink">
                  {effectiveCity}
                </Text>

              </View>

            </View>

          )}

        <View className="my-[18px] h-px bg-care-border" />

        {/* 3. Travel radius */}

        <SectionHeading
          title="Travel radius *"
          icon="navigate-outline"
        />

        <NumericField
          label="Travel radius in kilometers"
          value={serviceRadiusKm}
          unit="km"
          placeholder="Enter distance"
          presets={RADIUS_PRESETS}
          presetSuffix=" km"
          columns={singleColumn ? 2 : 3}
          maxDigits={3}
          onChange={(value) =>
            onUpdate({
              serviceRadiusKm: value,
            })
          }
        />

        <View className="my-[18px] h-px bg-care-border" />

        {/* 4. Maximum patient capacity */}

        <SectionHeading
          title="Maximum patients *"
          icon="people-outline"
        />

        <Text className="mb-[10px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          How many active patients can you safely support?
        </Text>

        <NumericField
          label="Maximum active patients"
          value={maxPatients}
          unit={
            maxPatients === 1
              ? 'Patient'
              : 'Patients'
          }
          placeholder="Enter capacity"
          presets={CAPACITY_PRESETS}
          columns={singleColumn ? 2 : 5}
          maxDigits={2}
          onChange={(value) =>
            onUpdate({
              maxPatients: value,
            })
          }
        />

      </View>

    </OnboardingLayout>
  );
};
