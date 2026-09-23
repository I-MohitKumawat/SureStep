/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step6Languages.tsx
 * Caregiver Onboarding Step 6: Languages Spoken.
 */
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { MultiSelectChips, ChipOption } from '../../../components/onboarding/MultiSelectChips';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step6Props {
  languagesSpoken: string[];
  onUpdate: (fields: { languagesSpoken: string[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMMON_LANGUAGES: ChipOption[] = [
  { id: 'English', label: 'English', icon: 'chatbubbles-outline' },
  { id: 'Hindi', label: 'Hindi', icon: 'chatbubbles-outline' },
  { id: 'Kannada', label: 'Kannada', icon: 'chatbubbles-outline' },
  { id: 'Tamil', label: 'Tamil', icon: 'chatbubbles-outline' },
  { id: 'Telugu', label: 'Telugu', icon: 'chatbubbles-outline' },
  { id: 'Malayalam', label: 'Malayalam', icon: 'chatbubbles-outline' },
  { id: 'Marathi', label: 'Marathi', icon: 'chatbubbles-outline' },
  { id: 'Bengali', label: 'Bengali', icon: 'chatbubbles-outline' },
  { id: 'Gujarati', label: 'Gujarati', icon: 'chatbubbles-outline' },
  { id: 'Punjabi', label: 'Punjabi', icon: 'chatbubbles-outline' },
  { id: 'Urdu', label: 'Urdu', icon: 'chatbubbles-outline' },
  { id: 'Odia', label: 'Odia', icon: 'chatbubbles-outline' },
  { id: 'Assamese', label: 'Assamese', icon: 'chatbubbles-outline' },
];

export const Step6Languages: React.FC<Step6Props> = ({
  languagesSpoken,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [customLang, setCustomLang] = useState('');

  const toggleLanguage = (lang: string) => {
    if (languagesSpoken.includes(lang)) {
      onUpdate({ languagesSpoken: languagesSpoken.filter((l) => l !== lang) });
    } else {
      onUpdate({ languagesSpoken: [...languagesSpoken, lang] });
    }
  };

  const handleAddCustom = () => {
    const trimmed = customLang.trim();
    if (!trimmed) return;
    if (!languagesSpoken.includes(trimmed)) {
      onUpdate({ languagesSpoken: [...languagesSpoken, trimmed] });
    }
    setCustomLang('');
  };

  const isComplete = languagesSpoken.length > 0;

  return (
    <OnboardingLayout
      title="Languages You Speak"
      subtitle="Patients and families frequently search for caregivers who can comfortably communicate in their mother tongue."
      currentStep={6}
      totalSteps={9}
      iconName="language-outline"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View style={s.section}>
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>Select All Spoken Languages *</Text>
          <Text style={s.counter}>{languagesSpoken.length} selected</Text>
        </View>

        <MultiSelectChips
          options={COMMON_LANGUAGES}
          selectedIds={languagesSpoken}
          onToggle={toggleLanguage}
        />
      </View>

      {/* Add Other Language */}
      <View style={s.customSection}>
        <Text style={s.customLabel}>Speak another language not listed?</Text>
        <View style={s.customRow}>
          <TextInput
            style={s.customInput}
            placeholder="e.g., Konkani, Marwari, Tulu..."
            placeholderTextColor="#9CA3AF"
            value={customLang}
            onChangeText={setCustomLang}
            onSubmitEditing={handleAddCustom}
          />
          <Pressable
            onPress={handleAddCustom}
            disabled={!customLang.trim()}
            style={[s.addBtn, !customLang.trim() && s.addBtnDisabled]}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  counter: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.primary,
  },
  customSection: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  customLabel: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.textSecondary,
    marginBottom: 8,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
});
