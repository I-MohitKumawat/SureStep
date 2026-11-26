
/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step2ProfessionalRole.tsx
 * Caregiver Onboarding Step 2: Primary professional role.
 */

import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';

interface Step2Props {
  role: string;

  onUpdate: (fields: {
    professionalRole: string;
  }) => void;

  onNext: () => void;
  onBack: () => void;
}

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'DEMENTIA_SPECIALIST',
    title: 'Dementia Care Specialist',
    description: 'Memory and cognitive support',
    icon: 'sparkles-outline',
  },
  {
    id: 'GERIATRIC_CAREGIVER',
    title: 'Geriatric Caregiver',
    description: 'Elder care and daily routines',
    icon: 'people-outline',
  },
  {
    id: 'NURSE_CLINICAL',
    title: 'Nursing & Clinical Assistant',
    description: 'Clinical and bedside care',
    icon: 'medkit-outline',
  },
  {
    id: 'GENERAL_CAREGIVER',
    title: 'General Home Care Aide',
    description: 'Personal care and daily assistance',
    icon: 'home-outline',
  },
  {
    id: 'PALLIATIVE_CARE',
    title: 'Palliative & End-of-Life Care',
    description: 'Comfort and compassionate care',
    icon: 'heart-outline',
  },
  {
    id: 'COMPANION',
    title: 'Companion Caregiver',
    description: 'Companionship and activities',
    icon: 'happy-outline',
  },
  {
    id: 'OTHER',
    title: 'Other Care Professional',
    description: 'Other professional care services',
    icon: 'shield-outline',
  },
];

export const Step2ProfessionalRole: React.FC<
  Step2Props
> = ({
  role,
  onUpdate,
  onNext,
  onBack,
}) => {

  const isSelected = ROLE_OPTIONS.some(
    (item) => item.id === role
  );

  return (
    <OnboardingLayout
      title="Your professional role"
      subtitle="Choose your primary care role."
      currentStep={2}
      totalSteps={9}
      iconName="briefcase-outline"
      backgroundVariant="ocean"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isSelected}
    >

      {/* Main white container */}

      <View
        className="gap-[8px] rounded-[20px] border border-care-border bg-white p-[12px]"
        accessibilityRole="radiogroup"
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

        {ROLE_OPTIONS.map((item) => {
          const selected = role === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() =>
                onUpdate({
                  professionalRole: item.id,
                })
              }
              accessibilityRole="radio"
              accessibilityLabel={`${item.title}. ${item.description}`}
              accessibilityState={{
                checked: selected,
              }}
              className={`min-h-[72px] flex-row items-center gap-[10px] rounded-[12px] border px-[10px] py-[12px] active:opacity-70 ${
                selected
                  ? 'border-brand bg-care-selected'
                  : 'border-care-border bg-care-canvas'
              }`}
            >

              {/* Role icon */}

              <View
                className={`h-[40px] w-[40px] items-center justify-center rounded-[10px] ${
                  selected
                    ? 'bg-[#CDECE0]'
                    : 'bg-[#E1F2F4]'
                }`}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={
                    selected
                      ? '#0E7A67'
                      : '#256C78'
                  }
                />
              </View>

              {/* Role information */}

              <View className="flex-1">

                <Text
                  className={`font-inter-semibold text-[13px] leading-[19px] ${
                    selected
                      ? 'text-brand-dark'
                      : 'text-care-ink'
                  }`}
                >
                  {item.title}
                </Text>

                <Text className="mt-[3px] font-inter-regular text-[12px] leading-[17px] text-care-muted">
                  {item.description}
                </Text>

              </View>

              {/* Selection indicator */}

              <Ionicons
                name={
                  selected
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={21}
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

    </OnboardingLayout>
  );
};
