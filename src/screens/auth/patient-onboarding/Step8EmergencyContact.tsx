/**
 * SureStep — src/screens/auth/patient-onboarding/Step8EmergencyContact.tsx
 * Step 8: Emergency contact information and linking details.
 */
import React from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import type { OnboardingIntent } from '../../../types/navigation.types';

interface Step8Props {
  intent: OnboardingIntent;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  onUpdate: (fields: {
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

const RELATION_PRESETS = [
  'Spouse',
  'Son',
  'Daughter',
  'Sibling',
  'Grandchild',
  'Caregiver',
  'Friend',
  'Other',
];

export const Step8EmergencyContact: React.FC<Step8Props> = ({
  intent,
  emergencyContactName,
  emergencyContactRelation,
  emergencyContactPhone,
  onUpdate,
  onNext,
  onBack,
}) => {
  const isSelf = intent === 'RECEIVING_CARE';

  const isComplete =
    emergencyContactName.trim().length > 0 &&
    emergencyContactRelation.trim().length > 0 &&
    emergencyContactPhone.trim().length >= 10;

  return (
    <OnboardingLayout
      title={isSelf ? 'Who is your emergency contact?' : 'Primary Emergency Contact'}
      subtitle={
        isSelf
          ? 'Someone we can call immediately if you press the SOS button or need assistance.'
          : 'Who should be contacted immediately in an urgent or SOS situation?'
      }
      currentStep={8}
      iconName="call"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isComplete}
    >
      {/* Contact Name */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Contact Name *</Text>
        <View style={s.inputContainer}>
          <Ionicons name="person-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="e.g., Anita Sharma"
            placeholderTextColor="#9CA3AF"
            value={emergencyContactName}
            onChangeText={(t) => onUpdate({ emergencyContactName: t })}
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Relationship */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Relationship to {isSelf ? 'You' : 'Patient'} *</Text>
        <View style={s.relationChips}>
          {RELATION_PRESETS.map((rel) => {
            const isSelected = emergencyContactRelation === rel;
            return (
              <Pressable
                key={rel}
                onPress={() => onUpdate({ emergencyContactRelation: rel })}
                style={[s.relPill, isSelected && s.relPillSelected]}
              >
                <Text style={[s.relPillText, isSelected && s.relPillTextSelected]}>
                  {rel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Phone Number */}
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Phone Number *</Text>
        <View style={s.inputContainer}>
          <Ionicons name="call-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="e.g., +91 98765 43210"
            placeholderTextColor="#9CA3AF"
            value={emergencyContactPhone}
            onChangeText={(t) => onUpdate({ emergencyContactPhone: t })}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Trust & Linking Notice */}
      <View style={s.noticeCard}>
        <Ionicons name="shield-checkmark" size={20} color={C.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.noticeTitle}>Automatic Care Circle Link</Text>
          <Text style={s.noticeText}>
            If this phone number is registered on SureStep, they will be linked to your Care Circle. If not, their number is safely stored for direct SOS emergency calls without requiring an account.
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
};

const s = StyleSheet.create({
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 15,
    color: C.textPrimary,
  },
  relationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relPill: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  relPillSelected: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0E5A4A',
    borderWidth: 2,
  },
  relPillText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#374151',
  },
  relPillTextSelected: {
    color: '#0E5A4A',
    fontFamily: F.bold,
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
