
/**
 * SureStep — RoleSelectionScreen.tsx
 * Minimal onboarding intent selection.
 */

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../components/onboarding/OptionCard';

import { useAuth } from '../../context/AuthContext';

import type {
  AuthStackParams,
  OnboardingIntent,
} from '../../types/navigation.types';

type Props = NativeStackScreenProps<
  AuthStackParams,
  'RoleSelectionScreen'
>;

interface IntentOption {
  id: OnboardingIntent;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'RECEIVING_CARE',
    label: "I'm receiving care myself",
    icon: 'heart-outline',
  },
  {
    id: 'SETTING_UP_CARE',
    label: "I'm setting up care for someone",
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'SUPPORTING_AS_FAMILY',
    label: "I'm supporting someone as family",
    icon: 'people-outline',
  },
  {
    id: 'PROFESSIONAL_CAREGIVER',
    label: "I'm providing professional care",
    icon: 'medkit-outline',
  },
];

export const RoleSelectionScreen: React.FC<Props> = ({
  navigation,
}) => {
  const { firebaseUser } = useAuth();

  const [selectedIntent, setSelectedIntent] =
    useState<OnboardingIntent | null>(null);

  const phoneDisplay = firebaseUser?.phoneNumber ?? '';

  const handleContinue = () => {
    if (!selectedIntent) return;

    switch (selectedIntent) {
      case 'RECEIVING_CARE':
        navigation.navigate('PatientOnboardingScreen', {
          intent: 'RECEIVING_CARE',
        });
        break;

      case 'SETTING_UP_CARE':
        navigation.navigate('PatientOnboardingScreen', {
          intent: 'SETTING_UP_CARE',
        });
        break;

      case 'SUPPORTING_AS_FAMILY':
        navigation.navigate('FamilyOnboardingScreen', {
          intent: 'SUPPORTING_AS_FAMILY',
        });
        break;

      case 'PROFESSIONAL_CAREGIVER':
        navigation.navigate('CaregiverOnboardingScreen', {
          intent: 'PROFESSIONAL_CAREGIVER',
        });
        break;
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('WelcomeScreen');
    }
  };

  return (
    <OnboardingLayout
      title={'How will you use\nSureStep?'}
      currentStep={1}
      totalSteps={4}
      iconName="heart-outline"
      iconColor="#007D6C"
      iconBg="#E6F4F1"
      onBack={handleBack}
      onNext={handleContinue}
      nextLabel="Continue"
      isNextDisabled={!selectedIntent}
      headerRight={
        phoneDisplay ? (
          <Text
            className="font-inter-regular text-[12px] text-care-muted"
          >
            {phoneDisplay}
          </Text>
        ) : undefined
      }
    >
      <View
        accessibilityRole="radiogroup"
        className="w-full"
      >
        {INTENT_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            title={option.label}
            icon={option.icon}
            selected={selectedIntent === option.id}
            onPress={() =>
              setSelectedIntent(option.id)
            }
          />
        ))}
      </View>
    </OnboardingLayout>
  );
};

export default RoleSelectionScreen;
