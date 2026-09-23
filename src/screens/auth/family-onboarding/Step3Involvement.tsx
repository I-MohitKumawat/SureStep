/**
 * SureStep — src/screens/auth/family-onboarding/Step3Involvement.tsx
 * Family Onboarding Step 3: Participation and involvement preferences.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step3Props {
  involvementInterests: string[];
  onUpdate: (fields: { involvementInterests?: string[] }) => void;
  onNext: () => void;
  onBack: () => void;
}

const INVOLVEMENT_OPTIONS = [
  {
    id: 'stay_connected',
    title: 'Stay connected',
    desc: 'Share family moments, photos, and gentle check-ins',
    icon: 'chatbubbles-outline' as const,
  },
  {
    id: 'appointments_routines',
    title: 'Keep up with appointments and routines',
    desc: 'Stay informed about doctor visits and daily schedules',
    icon: 'calendar-outline' as const,
  },
  {
    id: 'medication',
    title: 'Help with medication',
    desc: 'Keep track of daily medications and timely refills',
    icon: 'medkit-outline' as const,
  },
  {
    id: 'safety_location',
    title: 'Help with safety and location',
    desc: 'Follow safe areas and receive wander/safe zone alerts',
    icon: 'navigate-outline' as const,
  },
  {
    id: 'coordinate_care',
    title: 'Help find and coordinate care',
    desc: 'Collaborate with doctors, therapists, and professional caregivers',
    icon: 'people-outline' as const,
  },
  {
    id: 'emergency',
    title: 'Be there in an emergency',
    desc: 'Receive immediate alerts if urgent help or SOS is triggered',
    icon: 'alert-circle-outline' as const,
  },
  {
    id: 'everyday_care',
    title: 'Help with everyday care',
    desc: 'Provide support with daily tasks and personal comfort',
    icon: 'heart-outline' as const,
  },
];

export const Step3Involvement: React.FC<Step3Props> = ({
  involvementInterests,
  onUpdate,
  onNext,
  onBack,
}) => {
  const toggleInterest = (id: string) => {
    onUpdate({
      involvementInterests: involvementInterests.includes(id)
        ? involvementInterests.filter((i) => i !== id)
        : [...involvementInterests, id],
    });
  };

  const isComplete = involvementInterests.length > 0;

  return (
    <OnboardingLayout
      title="How would you like to be there for them?"
      subtitle="Select the ways you'd like to participate. These are your personal interests, not set-in-stone obligations."
      currentStep={3}
      totalSteps={5}
      iconName="heart"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      <View style={s.section}>
        <Text style={s.sectionTitle}>Ways to Participate *</Text>
        <Text style={s.sectionHint}>Select all that apply</Text>
        <View style={s.cardGroup}>
          {INVOLVEMENT_OPTIONS.map((item) => (
            <OptionCard
              key={item.id}
              title={item.title}
              description={item.desc}
              icon={item.icon}
              selected={involvementInterests.includes(item.id)}
              onPress={() => toggleInterest(item.id)}
              multiSelect
            />
          ))}
        </View>
      </View>

      {/* Distinction from permissions note */}
      <View style={s.noticeCard}>
        <Ionicons name="information-circle-outline" size={20} color={C.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.noticeTitle}>Participation Interests vs Permissions</Text>
          <Text style={s.noticeText}>
            Selecting these areas helps your care circle understand how you wish to be involved. Actual access permissions are managed and granted by the Care Circle owner.
          </Text>
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
  noticeCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F0FBF8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C6EBE2',
    padding: 14,
    marginTop: 8,
  },
  noticeTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.primaryDark,
    marginBottom: 2,
  },
  noticeText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },
});
