/**
 * SureStep — src/screens/auth/caregiver-onboarding/Step8PricingBio.tsx
 * Caregiver Onboarding Step 8: Rates, Professional Bio & Discoverability.
 */
import React from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step8Props {
  hourlyRate: string;
  dailyRate: string;
  bio: string;
  isDiscoverable: boolean;
  onUpdate: (fields: {
    hourlyRate?: string;
    dailyRate?: string;
    bio?: string;
    isDiscoverable?: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step8PricingBio: React.FC<Step8Props> = ({
  hourlyRate,
  dailyRate,
  bio,
  isDiscoverable,
  onUpdate,
  onNext,
  onBack,
}) => {
  return (
    <OnboardingLayout
      title="Pricing, Bio & Privacy"
      subtitle="Share your standard rates, a brief introduction, and choose your profile discoverability."
      currentStep={8}
      totalSteps={9}
      iconName="cash-outline"
      onBack={onBack}
      onNext={onNext}
    >
      {/* 1. Rates Section */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Expected Rates (INR)</Text>
        <Text style={s.sectionSubtitle}>
          Optional. You can leave these blank and discuss rates directly with families.
        </Text>

        <View style={s.ratesRow}>
          <View style={s.rateField}>
            <Text style={s.rateLabel}>Hourly Rate (₹/hr)</Text>
            <View style={s.inputContainer}>
              <Text style={s.currencyPrefix}>₹</Text>
              <TextInput
                style={s.rateInput}
                placeholder="e.g., 250"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={hourlyRate}
                onChangeText={(t) => onUpdate({ hourlyRate: t.replace(/[^0-9.]/g, '') })}
              />
            </View>
          </View>

          <View style={s.rateField}>
            <Text style={s.rateLabel}>Daily Rate (₹/day)</Text>
            <View style={s.inputContainer}>
              <Text style={s.currencyPrefix}>₹</Text>
              <TextInput
                style={s.rateInput}
                placeholder="e.g., 1800"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={dailyRate}
                onChangeText={(t) => onUpdate({ dailyRate: t.replace(/[^0-9.]/g, '') })}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 2. Professional Bio */}
      <View style={s.section}>
        <View style={s.titleRow}>
          <Text style={s.sectionTitle}>About You & Care Philosophy</Text>
          <Text style={s.counter}>{bio.trim().length} chars</Text>
        </View>
        <Text style={s.sectionSubtitle}>
          Introduce yourself to families. Describe your experience, patience, and approach to dementia care:
        </Text>
        <TextInput
          style={s.bioInput}
          placeholder="e.g., I have 4 years of experience assisting seniors with memory loss. I focus on gentle, patient communication and maintaining daily routines that preserve dignity..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={bio}
          onChangeText={(t) => onUpdate({ bio: t })}
        />
      </View>

      {/* 3. Discoverability Toggle Card */}
      <View style={s.discoverCard}>
        <View style={s.discoverLeft}>
          <View style={[s.discoverIcon, isDiscoverable && s.discoverIconActive]}>
            <Ionicons
              name={isDiscoverable ? 'globe-outline' : 'lock-closed-outline'}
              size={22}
              color={isDiscoverable ? C.primary : C.textSecondary}
            />
          </View>
          <View style={s.discoverTextWrap}>
            <Text style={s.discoverTitle}>
              {isDiscoverable ? 'Discoverable Profile (Public)' : 'Private Profile'}
            </Text>
            <Text style={s.discoverSub}>
              {isDiscoverable
                ? 'Allow families and patients in your area to view your profile and send care requests directly.'
                : 'Hidden from directory search. Only families with your direct phone number or code can invite you.'}
            </Text>
          </View>
        </View>
        <Switch
          value={isDiscoverable}
          onValueChange={(val) => onUpdate({ isDiscoverable: val })}
          trackColor={{ false: '#E5E7EB', true: C.primary }}
          thumbColor="#FFFFFF"
        />
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
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  counter: {
    fontSize: 11,
    fontFamily: F.medium,
    color: C.textSecondary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rateField: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 12,
    fontFamily: F.medium,
    color: C.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 16,
    fontFamily: F.bold,
    color: C.primary,
    marginRight: 6,
  },
  rateInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: F.regular,
    color: C.textPrimary,
  },
  bioInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: F.regular,
    color: C.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  discoverLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  discoverIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  discoverIconActive: {
    backgroundColor: '#E6F4F1',
  },
  discoverTextWrap: {
    flex: 1,
  },
  discoverTitle: {
    fontSize: 13,
    fontFamily: F.bold,
    color: C.textPrimary,
    marginBottom: 4,
  },
  discoverSub: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    lineHeight: 16,
  },
});
