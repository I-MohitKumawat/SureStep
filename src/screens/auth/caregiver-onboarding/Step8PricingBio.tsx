
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step8PricingBio.tsx
 * Caregiver Onboarding Step 8: Pricing, bio and profile visibility.
 */

import React, { useState } from 'react';

import {
  Keyboard,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';

interface Step8Props {
  hourlyRate: string;
  dailyRate: string;
  bio: string;
  isDiscoverable: boolean;

  onUpdate: (fields: {
    hourlyRate?: string;
    dailyRate?: string;
    bio?: string;
    isDiscoverable?: boolean;
  }) => void;

  onNext: () => void;
  onBack: () => void;
}

const MAX_BIO_LENGTH = 500;

type IconName = keyof typeof Ionicons.glyphMap;

/* Validate optional monetary values */

const isValidRate = (value: string): boolean => {
  const trimmed = value.trim();

  // Empty pricing is allowed.
  if (!trimmed) return true;

  // Allow positive numbers with up to two decimal places.
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return false;
  }

  const amount = Number(trimmed);

  return (
    Number.isFinite(amount) &&
    amount > 0
  );
};

/* Reusable section heading */

interface SectionHeadingProps {
  title: string;
  icon: IconName;
  optional?: boolean;
}

const SectionHeading: React.FC<
  SectionHeadingProps
> = ({
  title,
  icon,
  optional = false,
}) => (
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

    {optional && (
      <Text className="font-inter-regular text-[12px] text-care-muted">
        Optional
      </Text>
    )}

  </View>
);

/* Reusable pricing input */

interface RateFieldProps {
  label: string;
  unit: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const RateField: React.FC<
  RateFieldProps
> = ({
  label,
  unit,
  placeholder,
  value,
  onChange,
}) => {

  const [focused, setFocused] =
    useState(false);

  const invalid =
    !isValidRate(value);

  const handleChange = (
    text: string
  ) => {

    // Permit intermediate decimal input,
    // while rejecting multiple decimal points
    // and non-numeric characters.

    if (/^\d*(\.\d{0,2})?$/.test(text)) {
      onChange(text);
    }
  };

  const handleBlur = () => {
    setFocused(false);

    // Normalize a valid trailing decimal.
    // For example, "250." becomes "250".

    if (/^\d+\.$/.test(value)) {
      onChange(value.slice(0, -1));
    }

    // Normalize amounts such as ".50" to "0.50".

    else if (/^\.\d{1,2}$/.test(value)) {
      onChange(`0${value}`);
    }
  };

  return (
    <View className="flex-1">

      <Text className="mb-[6px] font-inter-medium text-[13px] text-care-ink">
        {label}
      </Text>

      <View
        className={`min-h-[52px] flex-row items-center gap-[8px] rounded-[12px] border bg-care-canvas px-[12px] ${
          invalid && !focused
            ? 'border-red-400'
            : focused
              ? 'border-brand'
              : 'border-care-border'
        }`}
      >

        <Text className="font-inter-semibold text-[18px] text-brand">
          ₹
        </Text>

        <TextInput
          className="min-h-[52px] flex-1 font-inter-medium text-[16px] text-care-ink"
          accessibilityLabel={label}
          placeholder={placeholder}
          placeholderTextColor="#68766F"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          maxLength={12}
          returnKeyType="done"
        />

      </View>

      <Text className="mt-[6px] font-inter-regular text-[11px] text-care-muted">
        {unit}
      </Text>

      {invalid && !focused && (
        <Text
          accessibilityLiveRegion="polite"
          className="mt-[4px] font-inter-regular text-[11px] leading-[16px] text-red-600"
        >
          Enter a valid positive amount.
        </Text>
      )}

    </View>
  );
};

/* Main onboarding screen */

export const Step8PricingBio: React.FC<
  Step8Props
> = ({
  hourlyRate,
  dailyRate,
  bio,
  isDiscoverable,
  onUpdate,
  onNext,
  onBack,
}) => {

  const [bioFocused, setBioFocused] =
    useState(false);

  const { width, fontScale } =
    useWindowDimensions();

  const singleColumn =
    width < 360 || fontScale > 1.3;

  /* Validation */

  const areRatesValid =
    isValidRate(hourlyRate) &&
    isValidRate(dailyRate);

  const isBioValid =
    bio.length <= MAX_BIO_LENGTH;

  const isComplete =
    areRatesValid && isBioValid;

  /* Continue to review */

  const handleContinue = () => {
    if (!isComplete) return;

    Keyboard.dismiss();
    onNext();
  };

  return (
    <OnboardingLayout
      title="Your profile preferences"
      subtitle="Personalize your professional profile."
      currentStep={8}
      totalSteps={9}
      iconName="person-circle-outline"
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

        {/* 1. Expected rates */}

        <SectionHeading
          title="Expected rates"
          icon="wallet-outline"
          optional
        />

        <View
          className={`gap-[10px] ${
            singleColumn
              ? 'flex-col'
              : 'flex-row items-start'
          }`}
        >

          {/* Hourly pricing */}

          <RateField
            label="Hourly rate"
            unit="Per hour"
            placeholder="250"
            value={hourlyRate}
            onChange={(value) =>
              onUpdate({
                hourlyRate: value,
              })
            }
          />

          {/* Daily pricing */}

          <RateField
            label="Daily rate"
            unit="Per day"
            placeholder="1800"
            value={dailyRate}
            onChange={(value) =>
              onUpdate({
                dailyRate: value,
              })
            }
          />

        </View>

        <View className="mt-[12px] flex-row items-start gap-[7px]">

          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#256C78"
          />

          <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
            Leave blank to discuss pricing
            directly with families.
          </Text>

        </View>

        <View className="my-[18px] h-px bg-care-border" />

        {/* 2. Professional bio */}

        <SectionHeading
          title="Professional bio"
          icon="document-text-outline"
          optional
        />

        <TextInput
          className={`min-h-[120px] rounded-[12px] border bg-care-canvas px-[12px] py-[12px] font-inter-regular text-[13px] leading-[20px] text-care-ink ${
            !isBioValid
              ? 'border-red-400'
              : bioFocused
                ? 'border-brand'
                : 'border-care-border'
          }`}
          accessibilityLabel="Professional bio"
          placeholder="Tell families about your experience and approach to care."
          placeholderTextColor="#68766F"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={bio}
          onChangeText={(value) =>
            onUpdate({
              bio: value,
            })
          }
          onFocus={() =>
            setBioFocused(true)
          }
          onBlur={() =>
            setBioFocused(false)
          }
          maxLength={MAX_BIO_LENGTH}
          autoCapitalize="sentences"
        />

        {/* Character counter */}

        <View className="mt-[6px] flex-row items-center justify-end">

          <Text
            className={`font-inter-medium text-[11px] ${
              !isBioValid
                ? 'text-red-600'
                : bio.length >= MAX_BIO_LENGTH
                  ? 'text-brand-dark'
                  : 'text-care-muted'
            }`}
          >
            {bio.length}/{MAX_BIO_LENGTH}
          </Text>

        </View>

        <View className="my-[18px] h-px bg-care-border" />

        {/* 3. Profile visibility */}

        <SectionHeading
          title="Profile visibility"
          icon="shield-checkmark-outline"
        />

        <View
          className={`rounded-[12px] border p-[12px] ${
            isDiscoverable
              ? 'border-brand bg-care-selected'
              : 'border-care-border bg-care-canvas'
          }`}
        >

          <View className="flex-row items-center gap-[10px]">

            {/* Privacy status icon */}

            <View
              className={`h-[42px] w-[42px] items-center justify-center rounded-[12px] ${
                isDiscoverable
                  ? 'bg-[#CDECE0]'
                  : 'bg-[#E1F2F4]'
              }`}
            >

              <Ionicons
                name={
                  isDiscoverable
                    ? 'globe-outline'
                    : 'lock-closed-outline'
                }
                size={23}
                color={
                  isDiscoverable
                    ? '#0E7A67'
                    : '#256C78'
                }
              />

            </View>

            {/* Current visibility status */}

            <View className="flex-1">

              <Text
                className={`font-inter-semibold text-[13px] leading-[19px] ${
                  isDiscoverable
                    ? 'text-brand-dark'
                    : 'text-care-ink'
                }`}
              >
                {isDiscoverable
                  ? 'Discoverable profile'
                  : 'Private profile'}
              </Text>

              <Text className="mt-[3px] font-inter-regular text-[11px] text-care-muted">
                {isDiscoverable
                  ? 'Directory visibility on'
                  : 'Directory visibility off'}
              </Text>

            </View>

            {/* Discoverability toggle */}

            <Switch
              value={isDiscoverable}
              onValueChange={(value) =>
                onUpdate({
                  isDiscoverable: value,
                })
              }
              accessibilityRole="switch"
              accessibilityLabel="Make profile discoverable"
              accessibilityState={{
                checked: isDiscoverable,
              }}
              trackColor={{
                false: '#D0D5D3',
                true: '#0E7A67',
              }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D0D5D3"
            />

          </View>

          {/* Privacy explanation */}

          <View className="my-[12px] h-px bg-care-border" />

          <Text className="font-inter-regular text-[12px] leading-[18px] text-care-muted">
            {isDiscoverable
              ? 'Families can find your profile in the caregiver directory and send care requests.'
              : 'Your profile stays hidden from caregiver directory searches.'}
          </Text>

        </View>

      </View>

    </OnboardingLayout>
  );
};
