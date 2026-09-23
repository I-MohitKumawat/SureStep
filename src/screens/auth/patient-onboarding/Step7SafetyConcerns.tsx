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
    title: 'Wandering / Getting Lost',
    desc: 'Leaving home unexpectedly or difficulty finding the way back',
    icon: 'walk-outline' as const,
  },
  {
    id: 'falls',
    title: 'Falls & Balance Unsteadiness',
    desc: 'Tripping, loss of balance, or requiring walking support',
    icon: 'alert-circle-outline' as const,
  },
  {
    id: 'confusion',
    title: 'Confusion & Disorientation',
    desc: 'Uncertainty about time, location, or familiar surroundings',
    icon: 'help-circle-outline' as const,
  },
  {
    id: 'night_restlessness',
    title: 'Night Wandering / Sundowning',
    desc: 'Heightened anxiety, wakefulness, or restlessness in the evening',
    icon: 'moon-outline' as const,
  },
  {
    id: 'phone_difficulty',
    title: 'Trouble Using a Phone',
    desc: 'Difficulty answering calls, unlocking the screen, or reading messages',
    icon: 'phone-portrait-outline' as const,
  },
  {
    id: 'forgetting_meals',
    title: 'Forgetting Meals or Water',
    desc: 'Skipping hydration or meal times without reminders',
    icon: 'restaurant-outline' as const,
  },
  {
    id: 'none',
    title: 'No Immediate Safety Concerns',
    desc: 'General monitoring is sufficient at this time',
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
      title={isSelf ? 'Safety Situations to Watch' : 'Specific Safety Concerns'}
      subtitle={
        isSelf
          ? 'Let us know if you experience any of these so we can provide gentle support.'
          : 'Enables tailored alerts and sensitivity thresholds for their care team.'
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 10,
  },
  cardGroup: {
    gap: 2,
  },
});
