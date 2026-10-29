/**
 * SureStep — src/screens/auth/RoleSelectionScreen.tsx
 * Onboarding intent selection screen: "How will you use SureStep?"
 * Replaces the legacy role selection with four user-centric intents.
 */
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { AuthStackParams, OnboardingIntent } from '../../types/navigation.types';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParams, 'RoleSelectionScreen'>;

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

// ─── Screen ──────────────────────────────────────────────────────────────────
export const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { firebaseUser, loginDevMode } = useAuth();
  const [selectedIntent, setSelectedIntent] = useState<OnboardingIntent | null>(null);

  const handleContinue = () => {
    if (!selectedIntent) return;

    switch (selectedIntent) {
      case 'RECEIVING_CARE':
        navigation.navigate('PatientOnboardingScreen', { intent: 'RECEIVING_CARE' });
        break;
      case 'SETTING_UP_CARE':
        navigation.navigate('PatientOnboardingScreen', { intent: 'SETTING_UP_CARE' });
        break;
      case 'SUPPORTING_AS_FAMILY':
        navigation.navigate('FamilyOnboardingScreen', { intent: 'SUPPORTING_AS_FAMILY' });
        break;
      case 'PROFESSIONAL_CAREGIVER':
        navigation.navigate('CaregiverOnboardingScreen', { intent: 'PROFESSIONAL_CAREGIVER' });
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

  const phoneDisplay = firebaseUser?.phoneNumber ?? '';

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      {() => (
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top navigation row */}
          <View style={s.topNav}>
            <Pressable onPress={handleBack} style={s.backBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color={C.textSecondary} />
              <Text style={s.backBtnText}>Back</Text>
            </Pressable>

            {phoneDisplay ? (
              <Text style={s.phoneSubtitle}>{phoneDisplay}</Text>
            ) : (
              <View style={{ width: 48 }} />
            )}
          </View>

          {/* Minimal illustration area */}
          <View style={s.illustrationWrapper}>
            <View style={s.illustrationBlob}>
              <View style={s.illustrationIconBubble}>
                <Ionicons name="sparkles" size={24} color={C.primary} />
              </View>
            </View>
          </View>

          {/* Central Question */}
          <Text style={s.heading}>How will you use SureStep?</Text>

          {/* Minimal progress indicator */}
          <View style={s.progressDots}>
            <View style={s.progressDotActive} />
            <View style={s.progressDot} />
            <View style={s.progressDot} />
            <View style={s.progressDot} />
          </View>

          {/* Intent Options */}
          <View style={s.optionsContainer}>
            {INTENT_OPTIONS.map((opt) => {
              const isSelected = selectedIntent === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedIntent(opt.id)}
                  style={({ pressed }) => [
                    s.optionCard,
                    isSelected && s.optionCardSelected,
                    pressed && s.optionCardPressed,
                  ]}
                >
                  <View style={[s.iconBox, isSelected && s.iconBoxSelected]}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={isSelected ? C.primary : C.textSecondary}
                    />
                  </View>

                  <Text style={[s.optionText, isSelected && s.optionTextSelected]}>
                    {opt.label}
                  </Text>

                  <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                    {isSelected && <View style={s.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Bottom CTA */}
          <View style={s.footer}>
            <Pressable
              onPress={handleContinue}
              disabled={!selectedIntent}
              style={({ pressed }) => [
                s.continueBtn,
                !selectedIntent && s.continueBtnDisabled,
                pressed && selectedIntent && s.continueBtnPressed,
              ]}
            >
              <Text style={[s.continueBtnText, !selectedIntent && s.continueBtnTextDisabled]}>
                Continue →
              </Text>
            </Pressable>

            <Pressable
              onPress={() => loginDevMode('FAMILY')}
              style={({ pressed }) => [
                { marginTop: 14, alignItems: 'center', padding: 8 },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={{ color: '#0E7A67', fontFamily: F.bold, fontSize: 14, textDecorationLine: 'underline' }}>
                ⚡ Quick Dev Mode: Enter as Family (Ananya) →
              </Text>
            </Pressable>

            <Pressable
              onPress={() => loginDevMode('PATIENT')}
              style={({ pressed }) => [
                { marginTop: 6, alignItems: 'center', padding: 8 },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={{ color: C.textSecondary, fontFamily: F.medium, fontSize: 12, textDecorationLine: 'underline' }}>
                Enter as Patient (Ramesh) →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.surface,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    flexGrow: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    marginLeft: 2,
  },
  phoneSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  illustrationBlob: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: F.extraBold,
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    gap: 6,
  },
  progressDotActive: {
    width: 20,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.borderMid,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 14,
  },
  optionCardSelected: {
    borderColor: C.primary,
    backgroundColor: '#F0FBF8',
  },
  optionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: '#E0F5F0',
  },
  optionText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 15,
    color: C.textPrimary,
    lineHeight: 21,
  },
  optionTextSelected: {
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
  },
  continueBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  continueBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  continueBtnTextDisabled: {
    color: '#9CA3AF',
  },
});
