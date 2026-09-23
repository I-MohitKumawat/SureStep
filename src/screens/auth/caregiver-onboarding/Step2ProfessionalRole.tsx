/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step2ProfessionalRole.tsx
 * Caregiver Onboarding Step 2: Primary Care Role & Identity.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { Ionicons } from '@expo/vector-icons';

interface Step2Props {
  role: string;
  onUpdate: (fields: { professionalRole: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'DEMENTIA_SPECIALIST',
    title: 'Dementia Care Specialist',
    description: 'Specialized in memory care, Alzheimer’s, behavioral reassurance, and cognitive support.',
    icon: 'sparkles-outline',
    badge: 'Popular',
  },
  {
    id: 'GERIATRIC_CAREGIVER',
    title: 'Geriatric Caregiver',
    description: 'Dedicated elder care, daily living support, fall risk prevention, and routine maintenance.',
    icon: 'people-outline',
  },
  {
    id: 'NURSE_CLINICAL',
    title: 'Nursing & Clinical Assistant',
    description: 'Trained in bedside clinical care, vital signs monitoring, wound care, and medical oversight.',
    icon: 'medkit-outline',
  },
  {
    id: 'GENERAL_CAREGIVER',
    title: 'General Home Care Aide',
    description: 'Personal hygiene, bathing, mobility assistance, meals, and day-to-day household support.',
    icon: 'home-outline',
  },
  {
    id: 'PALLIATIVE_CARE',
    title: 'Palliative & End-of-Life Care',
    description: 'Compassionate comfort care, pain awareness, and specialized bedside dignity.',
    icon: 'heart-outline',
  },
  {
    id: 'COMPANION',
    title: 'Companion Caregiver',
    description: 'Social engagement, conversation, cognitive activities, and accompanied outings.',
    icon: 'happy-outline',
  },
  {
    id: 'OTHER',
    title: 'Other Care Professional',
    description: 'Physiotherapy aide, allied health professional, or multi-disciplinary caregiver.',
    icon: 'shield-outline',
  },
];

export const Step2ProfessionalRole: React.FC<Step2Props> = ({
  role,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelected = Boolean(role);

  return (
    <OnboardingLayout
      title="What is your primary care role?"
      subtitle="Select the title that best describes your caregiving background and focus."
      currentStep={2}
      totalSteps={9}
      iconName="briefcase-outline"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isSelected}
    >
      <View style={s.list}>
        {ROLE_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.id}
            title={opt.title}
            description={opt.description}
            icon={opt.icon}
            badge={opt.badge}
            selected={role === opt.id}
            onPress={() => onUpdate({ professionalRole: opt.id })}
          />
        ))}
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  list: {
    gap: 12,
  },
});
