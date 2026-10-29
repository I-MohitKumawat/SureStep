/**
 * SureStep — src/screens/auth/patient-onboarding/Step7SafetyConcerns.tsx
 * Step 7: Safety concerns selection.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step7Props {
  intent: OnboardingIntent;
  safetyConcerns: string[];
  onUpdate: (fields: { safetyConcerns?: string[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAFETY_OPTIONS = [
  {
    id: 'wandering',
    title: 'Wandering or Wayfinding Difficulty',
    desc: 'Leaving home unexpectedly or difficulty navigating back',
    icon: 'walk-outline' as const,
  },
  {
    id: 'falls',
    title: 'Balance & Fall Vulnerability',
    desc: 'Occasional unsteadiness or requiring walking assistance',
    icon: 'alert-circle-outline' as const,
  },
  {
    id: 'confusion',
    title: 'Orientation & Familiarity Lapses',
    desc: 'Moments of uncertainty about time, location, or surroundings',
    icon: 'help-circle-outline' as const,
  },
  {
    id: 'night_restlessness',
    title: 'Evening Restlessness',
    desc: 'Heightened anxiety or wakefulness during evening hours',
    icon: 'moon-outline' as const,
  },
  {
    id: 'phone_difficulty',
    title: 'Phone & Screen Hurdles',
    desc: 'Difficulty answering calls, unlocking screens, or reading text',
    icon: 'phone-portrait-outline' as const,
  },
  {
    id: 'forgetting_meals',
    title: 'Hydration & Meal Consistency',
    desc: 'Skipping water or meals without a friendly prompt',
    icon: 'restaurant-outline' as const,
  },
  {
    id: 'none',
    title: 'No Immediate Safety Concerns',
    desc: 'General monitoring and peace of mind is sufficient',
    icon: 'checkmark-circle-outline' as const,
  },
];

export const Step7SafetyConcerns: React.FC<Step7Props> = ({
  intent,
  safetyConcerns,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const toggleConcern = (id: string) => {
    if (id === 'none') {
      onUpdate({ safetyConcerns: ['none'] });
      return;
    }
    const filtered = safetyConcerns.filter((c) => c !== 'none');
    onUpdate({
      safetyConcerns: filtered.includes(id)
        ? filtered.filter((c) => c !== id)
        : [...filtered, id],
    });
  };

  const isComplete = safetyConcerns.length > 0;

  return (
    <OnboardingLayout
      title={isSelf ? 'Safety & Peace of Mind' : 'Safety & Peace of Mind'}
      subtitle={
        isSelf
          ? 'Tell us if any of these situations ever come up, so we can be ready with gentle protection.'
          : 'Configures sensible notifications and gentle safeguards for their daily care circle.'
      }
      currentStep={7}
      iconName="shield-checkmark"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View style={s.section}>
        <Text style={s.sectionTitle}>Safety Check *</Text>
        <Text style={s.sectionHint}>Select all that apply</Text>
        <View style={s.cardGroup}>
          {SAFETY_OPTIONS.map((item) => (
            <OptionCard
              key={item.id}
              title={item.title}
              description={item.desc}
              icon={item.icon}
              selected={safetyConcerns.includes(item.id)}
              onPress={() => toggleConcern(item.id)}
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
