/**
 * SureStep — src/screens/auth/family-onboarding/Step2Connection.tsx
 * Family Onboarding Step 2: Relationship to patient and physical proximity.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step2Props {
  relationLabel: string;
  proximity: string;
  onUpdate: (fields: { relationLabel?: string; proximity?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

const RELATION_OPTIONS = [
  { id: 'Spouse or partner', title: 'Spouse or partner', icon: 'heart-outline' as const },
  { id: 'Son or daughter', title: 'Son or daughter', icon: 'people-outline' as const },
  { id: 'Parent', title: 'Parent', icon: 'home-outline' as const },
  { id: 'Sibling', title: 'Sibling', icon: 'person-outline' as const },
  { id: 'Grandchild', title: 'Grandchild', icon: 'sparkles-outline' as const },
  { id: 'Other relative', title: 'Other relative', icon: 'git-network-outline' as const },
  { id: 'Family friend', title: 'Family friend', icon: 'happy-outline' as const },
  { id: 'Other', title: 'Other', icon: 'help-circle-outline' as const },
];

const PROXIMITY_OPTIONS = [
  { id: 'TOGETHER', title: 'We live together', desc: 'In the same household', icon: 'home-outline' as const },
  { id: 'NEARBY', title: 'Nearby', desc: 'In the same neighborhood or city', icon: 'navigate-outline' as const },
  { id: 'DIFFERENT_CITY', title: 'Different city', desc: 'Living in another city or region', icon: 'train-outline' as const },
  { id: 'DIFFERENT_COUNTRY', title: 'Different country', desc: 'Supporting from abroad', icon: 'airplane-outline' as const },
];

export const Step2Connection: React.FC<Step2Props> = ({
  relationLabel,
  proximity,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isComplete = relationLabel.length > 0 && proximity.length > 0;

  return (
    <OnboardingLayout
      title="How are you connected to them?"
      subtitle="Tell us your relationship and how close you live to the person you are supporting."
      currentStep={2}
      totalSteps={5}
      iconName="people"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      {/* Relationship */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Your Relationship *</Text>
        <View style={s.cardGroup}>
          {RELATION_OPTIONS.map((item) => (
            <OptionCard
              key={item.id}
              title={item.title}
              icon={item.icon}
              selected={relationLabel === item.id}
              onPress={() => onUpdate({ relationLabel: item.id })}
            />
          ))}
        </View>
      </View>

      {/* Proximity */}
      <View style={[s.section, { marginTop: 14 }]}>
        <Text style={s.sectionTitle}>How close do you live to them? *</Text>
        <Text style={s.sectionHint}>
          Helps understand your physical proximity (not caregiving duty)
        </Text>
        <View style={s.cardGroup}>
          {PROXIMITY_OPTIONS.map((item) => (
            <OptionCard
              key={item.id}
              title={item.title}
              description={item.desc}
              icon={item.icon}
              selected={proximity === item.id}
              onPress={() => onUpdate({ proximity: item.id })}
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
