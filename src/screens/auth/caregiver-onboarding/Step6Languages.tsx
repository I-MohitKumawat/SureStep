
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step6Languages.tsx
 * Caregiver Onboarding Step 6: Spoken languages.
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

interface Step6Props {
  languagesSpoken: string[];

  onUpdate: (fields: {
    languagesSpoken: string[];
  }) => void;

  onNext: () => void;
  onBack: () => void;
}

interface LanguageOption {
  id: string;
  label: string;
  nativeLabel?: string;
}

const COMMON_LANGUAGES: LanguageOption[] = [
  {
    id: 'English',
    label: 'English',
  },
  {
    id: 'Hindi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
  },
  {
    id: 'Kannada',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
  },
  {
    id: 'Tamil',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
  },
  {
    id: 'Telugu',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
  },
  {
    id: 'Malayalam',
    label: 'Malayalam',
    nativeLabel: 'മലയാളം',
  },
  {
    id: 'Marathi',
    label: 'Marathi',
    nativeLabel: 'मराठी',
  },
  {
    id: 'Bengali',
    label: 'Bengali',
    nativeLabel: 'বাংলা',
  },
  {
    id: 'Gujarati',
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
  },
  {
    id: 'Punjabi',
    label: 'Punjabi',
    nativeLabel: 'ਪੰਜਾਬੀ',
  },
  {
    id: 'Urdu',
    label: 'Urdu',
    nativeLabel: 'اردو',
  },
  {
    id: 'Odia',
    label: 'Odia',
    nativeLabel: 'ଓଡ଼ିଆ',
  },
  {
    id: 'Assamese',
    label: 'Assamese',
    nativeLabel: 'অসমীয়া',
  },
];

/* Normalize language names for comparison */

const normalizeLanguage = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

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

export const Step6Languages: React.FC<
  Step6Props
> = ({
  languagesSpoken,
  onUpdate,
  onNext,
  onBack,
}) => {

  const [customLang, setCustomLang] =
    useState('');

  const [inputFocused, setInputFocused] =
    useState(false);

  const { width, fontScale } =
    useWindowDimensions();

  const singleColumn =
    width < 340 || fontScale > 1.3;

  const columns = singleColumn ? 1 : 2;

  const languageRows = createRows(
    COMMON_LANGUAGES,
    columns
  );

  /* Check whether a language is selected */

  const isLanguageSelected = (
    language: string
  ): boolean => {
    const normalized =
      normalizeLanguage(language);

    return languagesSpoken.some(
      (item) =>
        normalizeLanguage(item) === normalized
    );
  };

  /* Extract languages outside the common list */

  const customLanguages =
    languagesSpoken.filter(
      (language) =>
        !COMMON_LANGUAGES.some(
          (item) =>
            normalizeLanguage(item.id) ===
            normalizeLanguage(language)
        )
    );

  /* Toggle a spoken language */

  const toggleLanguage = (
    language: string
  ) => {
    const normalized =
      normalizeLanguage(language);

    const updated =
      isLanguageSelected(language)
        ? languagesSpoken.filter(
            (item) =>
              normalizeLanguage(item) !==
              normalized
          )
        : [
            ...languagesSpoken,
            language,
          ];

    onUpdate({
      languagesSpoken: updated,
    });
  };

  /* Remove a custom language */

  const removeCustomLanguage = (
    language: string
  ) => {
    onUpdate({
      languagesSpoken:
        languagesSpoken.filter(
          (item) =>
            normalizeLanguage(item) !==
            normalizeLanguage(language)
        ),
    });
  };

  /* Custom language validation */

  const trimmedCustom = customLang
    .trim()
    .replace(/\s+/g, ' ');

  const isDuplicate =
    trimmedCustom.length > 0 &&
    isLanguageSelected(trimmedCustom);

  const canAddCustom =
    trimmedCustom.length > 0 &&
    !isDuplicate;

  /* Add custom language */

  const handleAddCustom = () => {
    if (!canAddCustom) return;

    // Use the existing canonical name when
    // the language is already in the common list.
    const commonLanguage =
      COMMON_LANGUAGES.find(
        (item) =>
          normalizeLanguage(item.id) ===
          normalizeLanguage(trimmedCustom)
      );

    const language =
      commonLanguage?.id || trimmedCustom;

    onUpdate({
      languagesSpoken: [
        ...languagesSpoken,
        language,
      ],
    });

    setCustomLang('');
    Keyboard.dismiss();
  };

  /* At least one language is required */

  const isComplete =
    languagesSpoken.some(
      (item) => item.trim().length > 0
    );

  const handleContinue = () => {
    if (!isComplete) return;

    Keyboard.dismiss();
    onNext();
  };

  return (
    <OnboardingLayout
      title="Languages you speak"
      subtitle="How can you communicate with patients?"
      currentStep={6}
      totalSteps={9}
      iconName="language-outline"
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

        {/* Section heading */}

        <View className="mb-[14px] flex-row items-center justify-between gap-[8px]">

          <Text className="flex-1 font-inter-semibold text-[14px] leading-[20px] text-care-ink">
            Spoken languages *
          </Text>

          <Text className="font-inter-medium text-[12px] text-brand-dark">
            {languagesSpoken.length} selected
          </Text>

        </View>

        {/* Common language selection */}

        <View className="gap-[8px]">

          {languageRows.map((row, rowIndex) => (

            <View
              key={rowIndex}
              className="flex-row items-stretch gap-[8px]"
            >

              {row.map((item) => {
                const selected =
                  isLanguageSelected(item.id);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      toggleLanguage(item.id)
                    }
                    accessibilityRole="checkbox"
                    accessibilityLabel={item.label}
                    accessibilityState={{
                      checked: selected,
                    }}
                    className={`min-h-[64px] flex-1 flex-row items-center gap-[8px] rounded-[12px] border px-[12px] py-[10px] active:opacity-70 ${
                      selected
                        ? 'border-brand bg-care-selected'
                        : 'border-care-border bg-care-canvas'
                    }`}
                  >

                    {/* Language name */}

                    <View className="flex-1">

                      <Text
                        className={`font-inter-semibold text-[13px] leading-[19px] ${
                          selected
                            ? 'text-brand-dark'
                            : 'text-care-ink'
                        }`}
                      >
                        {item.label}
                      </Text>

                      {/* Native language script */}

                      {!!item.nativeLabel && (
                        <Text
                          className={`mt-[3px] text-[12px] leading-[19px] ${
                            selected
                              ? 'text-brand-dark'
                              : 'text-care-muted'
                          }`}
                        >
                          {item.nativeLabel}
                        </Text>
                      )}

                    </View>

                    {/* Selection indicator */}

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

              {/* Align final odd option */}

              {!singleColumn && row.length === 1 && (
                <View className="flex-1" />
              )}

            </View>
          ))}

        </View>

        {/* Custom languages already added */}

        {customLanguages.length > 0 && (
          <>

            <View className="my-[16px] h-px bg-care-border" />

            <Text className="mb-[10px] font-inter-semibold text-[13px] text-care-ink">
              Other languages
            </Text>

            <View className="flex-row flex-wrap gap-[8px]">

              {customLanguages.map(
                (language, index) => (

                  <Pressable
                    key={`${language}-${index}`}
                    onPress={() =>
                      removeCustomLanguage(language)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${language}`}
                    className="min-h-[44px] max-w-full flex-row items-center gap-[8px] rounded-full border border-brand bg-care-selected px-[12px] py-[8px] active:opacity-70"
                  >

                    <Text className="shrink font-inter-medium text-[13px] text-brand-dark">
                      {language}
                    </Text>

                    <Ionicons
                      name="close-circle-outline"
                      size={17}
                      color="#0E7A67"
                    />

                  </Pressable>

                )
              )}

            </View>

          </>
        )}

        {/* Divider */}

        <View className="my-[18px] h-px bg-care-border" />

        {/* Add another language */}

        <Text className="mb-[8px] font-inter-semibold text-[13px] text-care-ink">
          Another language?
        </Text>

        <View className="flex-row items-stretch gap-[8px]">

          {/* Custom language input */}

          <View
            className={`min-h-[48px] flex-1 flex-row items-center gap-[8px] rounded-[12px] border bg-care-canvas px-[12px] ${
              inputFocused
                ? 'border-brand'
                : 'border-care-border'
            }`}
          >

            <Ionicons
              name="language-outline"
              size={19}
              color="#256C78"
            />

            <TextInput
              className="min-h-[48px] flex-1 font-inter-regular text-[13px] text-care-ink"
              accessibilityLabel="Add another spoken language"
              placeholder="e.g. Konkani, Tulu"
              placeholderTextColor="#68766F"
              value={customLang}
              onChangeText={setCustomLang}
              onFocus={() =>
                setInputFocused(true)
              }
              onBlur={() =>
                setInputFocused(false)
              }
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleAddCustom}
            />

          </View>

          {/* Add language button */}

          <Pressable
            onPress={handleAddCustom}
            disabled={!canAddCustom}
            accessibilityRole="button"
            accessibilityLabel="Add language"
            accessibilityState={{
              disabled: !canAddCustom,
            }}
            className={`min-h-[48px] w-[48px] items-center justify-center rounded-[12px] ${
              canAddCustom
                ? 'bg-brand active:opacity-80'
                : 'bg-[#E5E0D8]'
            }`}
          >

            <Ionicons
              name="add"
              size={25}
              color={
                canAddCustom
                  ? '#FFFFFF'
                  : '#52605D'
              }
            />

          </Pressable>

        </View>

        {/* Duplicate language feedback */}

        {isDuplicate && (
          <View
            accessibilityLiveRegion="polite"
            className="mt-[8px] flex-row items-center gap-[6px]"
          >

            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#256C78"
            />

            <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
              This language is already selected.
            </Text>

          </View>
        )}

      </View>

    </OnboardingLayout>
  );
};
