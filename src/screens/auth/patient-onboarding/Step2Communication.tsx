/**
 * SureStep — src/screens/auth/patient-onboarding/Step2Communication.tsx
 * Step 2: Primary language, additional languages, and communication preferences.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { MultiSelectChips, ChipOption } from '../../../components/onboarding/MultiSelectChips';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
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
  { code: 'English', label: 'English', sub: 'Default' },
  { code: 'Hindi', label: 'हिंदी (Hindi)', sub: 'North India' },
  { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', sub: 'Karnataka' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)', sub: 'Tamil Nadu' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)', sub: 'Andhra & Telangana' },
  { code: 'Malayalam', label: 'മലയാളം (Malayalam)', sub: 'Kerala' },
];

const ADDITIONAL_LANG_OPTIONS: ChipOption[] = [
  { id: 'English', label: 'English' },
  { id: 'Hindi', label: 'Hindi' },
  { id: 'Kannada', label: 'Kannada' },
  { id: 'Tamil', label: 'Tamil' },
  { id: 'Telugu', label: 'Telugu' },
  { id: 'Malayalam', label: 'Malayalam' },
  { id: 'Bengali', label: 'Bengali' },
  { id: 'Marathi', label: 'Marathi' },
  { id: 'Gujarati', label: 'Gujarati' },
  { id: 'Urdu', label: 'Urdu' },
];

const PREFERENCE_OPTIONS: ChipOption[] = [
  { id: 'simple_text', label: 'Simple Text', icon: 'document-text-outline' },
  { id: 'voice_prompts', label: 'Voice & Audio Prompts', icon: 'mic-outline' },
  { id: 'visual_icons', label: 'Visual Icons & Photos', icon: 'images-outline' },
  { id: 'large_text', label: 'Large High-Contrast Font', icon: 'text-outline' },
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

  const toggleAdditionalLanguage = (id: string) => {
    onUpdate({
      additionalLanguages: additionalLanguages.includes(id)
        ? additionalLanguages.filter((l) => l !== id)
        : [...additionalLanguages, id],
    });
  };

  const togglePreference = (id: string) => {
    onUpdate({
      communicationPreferences: communicationPreferences.includes(id)
        ? communicationPreferences.filter((p) => p !== id)
        : [...communicationPreferences, id],
    });
  };

  return (
    <OnboardingLayout
      title={isSelf ? 'Language & Understanding' : 'Language & Understanding'}
      subtitle={
        isSelf
          ? 'Choose the language you feel most comfortable speaking and reading every day.'
          : 'Choose the language and formats that bring them the greatest cognitive ease.'
      }
      currentStep={2}
      iconName="chatbubble-ellipses"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!primaryLanguage}
    >
      {/* Primary Language */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Primary Language *</Text>
        <Text style={s.sectionHint}>The main language used for audio prompts and text</Text>
        <View style={s.cardGroup}>
          {PRIMARY_LANGUAGES.map((lang) => (
            <OptionCard
              key={lang.code}
              title={lang.label}
              description={lang.sub}
              selected={primaryLanguage === lang.code}
              onPress={() => onUpdate({ primaryLanguage: lang.code })}
            />
          ))}
        </View>
      </View>

      {/* Additional Languages */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Other Languages Understood</Text>
        <Text style={s.sectionHint}>Optional languages they can understand</Text>
        <MultiSelectChips
          options={ADDITIONAL_LANG_OPTIONS.filter((l) => l.id !== primaryLanguage)}
          selectedIds={additionalLanguages}
          onToggle={toggleAdditionalLanguage}
        />
      </View>

      {/* Communication Preferences */}
      <View style={[s.section, { marginTop: 18 }]}>
        <Text style={s.sectionTitle}>Comfort & Formatting</Text>
        <Text style={s.sectionHint}>Formats that make understanding easier</Text>
        <MultiSelectChips
          options={PREFERENCE_OPTIONS}
          selectedIds={communicationPreferences}
          onToggle={togglePreference}
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
