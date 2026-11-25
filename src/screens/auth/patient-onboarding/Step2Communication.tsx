
/**
 * SureStep — src/screens/auth/patient-onboarding/Step2Communication.tsx
 * Step 2: Primary language, additional languages, and communication preferences.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step2Props {
  intent: OnboardingIntent;
  primaryLanguage: string;
  additionalLanguages: string[];
  communicationPreferences: string[];
  onUpdate: (fields: {
    primaryLanguage?: string;
    additionalLanguages?: string[];
    communicationPreferences?: string[];
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRIMARY_LANGUAGES = [
  { code: 'English', label: 'English', sub: 'English' },
  { code: 'Hindi', label: 'हिंदी', sub: 'Hindi' },
  { code: 'Kannada', label: 'ಕನ್ನಡ', sub: 'Kannada' },
  { code: 'Tamil', label: 'தமிழ்', sub: 'Tamil' },
  { code: 'Telugu', label: 'తెలుగు', sub: 'Telugu' },
  { code: 'Malayalam', label: 'മലയാളം', sub: 'Malayalam' },
];

const ADDITIONAL_LANG_OPTIONS = [
  'English',
  'Hindi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Urdu',
];

const PREFERENCE_OPTIONS: {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'simple_text',
    label: 'Simple text',
    icon: 'document-text-outline',
  },
  {
    id: 'voice_prompts',
    label: 'Voice & audio prompts',
    icon: 'mic-outline',
  },
  {
    id: 'visual_icons',
    label: 'Visual icons & photos',
    icon: 'images-outline',
  },
  {
    id: 'large_text',
    label: 'Large high-contrast font',
    icon: 'text-outline',
  },
];

export const Step2Communication: React.FC<Step2Props> = ({
  intent,
  primaryLanguage,
  additionalLanguages,
  communicationPreferences,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const selectPrimaryLanguage = (language: string) => {
    onUpdate({
      primaryLanguage: language,
      additionalLanguages: additionalLanguages.filter(
        (item) => item !== language
      ),
    });
  };

  const toggleAdditionalLanguage = (language: string) => {
    onUpdate({
      additionalLanguages: additionalLanguages.includes(language)
        ? additionalLanguages.filter((item) => item !== language)
        : [...additionalLanguages, language],
    });
  };

  const togglePreference = (id: string) => {
    onUpdate({
      communicationPreferences: communicationPreferences.includes(id)
        ? communicationPreferences.filter((item) => item !== id)
        : [...communicationPreferences, id],
    });
  };

  return (
    <OnboardingLayout
      title="Language & Understanding"
      currentStep={2}
      iconName="chatbubble-ellipses-outline"
      backgroundVariant="mint"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!primaryLanguage}
    >
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
        {/* Primary Language */}

        <Text className="mb-[4px] font-inter-semibold text-[13px] text-care-ink">
          Primary language *
        </Text>

        <Text className="mb-[12px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          {isSelf
            ? 'Choose your preferred language'
            : 'Choose their preferred language'}
        </Text>

        <View
          className="gap-[8px]"
          accessibilityRole="radiogroup"
        >
          {[
            PRIMARY_LANGUAGES.slice(0, 2),
            PRIMARY_LANGUAGES.slice(2, 4),
            PRIMARY_LANGUAGES.slice(4, 6),
          ].map((row, index) => (
            <View
              key={index}
              className="flex-row gap-[8px]"
            >
              {row.map((language) => {
                const selected =
                  primaryLanguage === language.code;

                return (
                  <Pressable
                    key={language.code}
                    onPress={() =>
                      selectPrimaryLanguage(language.code)
                    }
                    accessibilityRole="radio"
                    accessibilityLabel={language.code}
                    accessibilityState={{ checked: selected }}
                    className={`min-h-[64px] flex-1 flex-row items-center gap-[6px] rounded-[12px] border px-[12px] py-[10px] active:opacity-70 ${
                      selected
                        ? 'border-brand bg-care-selected'
                        : 'border-care-border bg-care-canvas'
                    }`}
                  >
                    <View className="flex-1">
                      <Text
                        className={`font-inter-medium text-[14px] ${
                          selected
                            ? 'text-brand-dark'
                            : 'text-care-ink'
                        }`}
                      >
                        {language.label}
                      </Text>

                      <Text className="mt-[3px] font-inter-regular text-[11px] text-care-muted">
                        {language.sub}
                      </Text>
                    </View>

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
          ))}
        </View>

        {/* Divider */}

        <View className="my-[16px] h-px bg-care-border" />

        {/* Additional Languages */}

        <Text className="mb-[4px] font-inter-semibold text-[13px] text-care-ink">
          Other languages
        </Text>

        <Text className="mb-[12px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          Optional · Select all that apply
        </Text>

        <View className="flex-row flex-wrap gap-[8px]">
          {ADDITIONAL_LANG_OPTIONS.filter(
            (language) => language !== primaryLanguage
          ).map((language) => {
            const selected =
              additionalLanguages.includes(language);

            return (
              <Pressable
                key={language}
                onPress={() =>
                  toggleAdditionalLanguage(language)
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                className={`min-h-[44px] flex-row items-center justify-center gap-[5px] rounded-[10px] border px-[12px] py-[8px] active:opacity-70 ${
                  selected
                    ? 'border-brand bg-care-selected'
                    : 'border-care-border bg-white'
                }`}
              >
                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#0E7A67"
                  />
                )}

                <Text
                  className={`font-inter-medium text-[13px] ${
                    selected
                      ? 'text-brand-dark'
                      : 'text-care-ink'
                  }`}
                >
                  {language}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Divider */}

        <View className="my-[16px] h-px bg-care-border" />

        {/* Communication Preferences */}

        <Text className="mb-[4px] font-inter-semibold text-[13px] text-care-ink">
          Comfort & formatting
        </Text>

        <Text className="mb-[12px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
          Choose what makes understanding easier
        </Text>

        <View className="gap-[8px]">
          {PREFERENCE_OPTIONS.map((preference) => {
            const selected =
              communicationPreferences.includes(preference.id);

            return (
              <Pressable
                key={preference.id}
                onPress={() => togglePreference(preference.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                className={`min-h-[48px] flex-row items-center gap-[10px] rounded-[12px] border px-[12px] py-[10px] active:opacity-70 ${
                  selected
                    ? 'border-brand bg-care-selected'
                    : 'border-care-border bg-care-canvas'
                }`}
              >
                <Ionicons
                  name={preference.icon}
                  size={19}
                  color={selected ? '#0E7A67' : '#52605D'}
                />

                <Text
                  className={`flex-1 font-inter-medium text-[13px] ${
                    selected
                      ? 'text-brand-dark'
                      : 'text-care-ink'
                  }`}
                >
                  {preference.label}
                </Text>

                <View
                  className={`h-[19px] w-[19px] items-center justify-center rounded-[5px] border ${
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
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
};
