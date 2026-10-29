/**
 * SureStep — src/screens/auth/patient-onboarding/Step6CareNeeds.tsx
 * Step 6: Care & support needs selection.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step6Props {
  intent: OnboardingIntent;
  careNeeds: string[];
  onUpdate: (fields: { careNeeds?: string[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const CARE_NEED_OPTIONS = [
  {
    id: 'medications',
    title: 'Medication Reminders',
    desc: 'Audio & visual prompts for timely pill-taking',
    icon: 'alarm-outline' as const,
  },
  {
    id: 'safety_navigation',
    title: 'Location Safety & Navigation',
    desc: 'Safe area boundaries, home route guidance, and wandering protection',
    icon: 'navigate-outline' as const,
  },
  {
    id: 'daily_schedule',
    title: 'Daily Routines & Tasks',
    desc: 'Step-by-step assistance with morning routines, meals, and appointments',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'sos_emergency',
    title: 'Instant Emergency SOS',
    desc: 'One-tap emergency call and automatic location transmission',
    icon: 'alert-circle-outline' as const,
  },
  {
    id: 'memory_companionship',
    title: 'Memory Games & Familiar Media',
    desc: 'Photo albums, favorite music, and gentle cognitive games',
    icon: 'sparkles-outline' as const,
  },
  {
    id: 'family_coordination',
    title: 'Family Updates & Circle',
    desc: 'Keeps loved ones informed about daily wellbeing and milestones',
    icon: 'people-outline' as const,
  },
];

export const Step6CareNeeds: React.FC<Step6Props> = ({
  intent,
  careNeeds,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const toggleNeed = (id: string) => {
    onUpdate({
      careNeeds: careNeeds.includes(id)
        ? careNeeds.filter((n) => n !== id)
        : [...careNeeds, id],
    });
  };

  const isComplete = careNeeds.length > 0;

  return (
    <OnboardingLayout
      title={isSelf ? 'Areas Where We Can Help' : 'Daily Support Needs'}
      subtitle={
        isSelf
          ? 'Select what kind of assistance will make your days smoother and safer. Choose all that apply.'
          : 'Select the primary support features to enable for their daily care plan.'
      }
      currentStep={6}
      iconName="heart"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View style={s.section}>
        <Text style={s.sectionTitle}>Support Categories *</Text>
        <Text style={s.sectionHint}>Select all that apply</Text>
        <View style={s.cardGroup}>
          {CARE_NEED_OPTIONS.map((item) => (
            <OptionCard
              key={item.id}
              title={item.title}
              description={item.desc}
              icon={item.icon}
              selected={careNeeds.includes(item.id)}
              onPress={() => toggleNeed(item.id)}
              multiSelect
            />
          ))}
        </View>
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
