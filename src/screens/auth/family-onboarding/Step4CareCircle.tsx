/**
 * SureStep — src/screens/auth/family-onboarding/Step4CareCircle.tsx
 * Family Onboarding Step 4: Optional Care Circle invitation code entry.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { OptionCard } from '../../../components/onboarding/OptionCard';
import { validateInviteCode } from '../../../services/familyService';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';

interface Step4Props {
  hasInvite: boolean | null;
  inviteCode: string;
  verifiedPatientName?: string | null;
  onUpdate: (fields: {
    hasInvite?: boolean | null;
    inviteCode?: string;
    verifiedPatientName?: string | null;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4CareCircle: React.FC<Step4Props> = ({
  hasInvite,
  inviteCode,
  verifiedPatientName,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleVerifyCode = async () => {
    const trimmed = inviteCode.trim().toUpperCase();
    if (trimmed.length < 4) {
      setCheckError('Please enter a valid Care Circle code.');
      return;
    }
    setChecking(true);
    setCheckError(null);
    try {
      const res = await validateInviteCode(trimmed);
      const data = res.data?.data || res.data;
      if (data?.valid) {
        onUpdate({
          inviteCode: trimmed,
          verifiedPatientName: data.patientName,
        });
      } else {
        setCheckError('Invalid or expired invite code.');
        onUpdate({ verifiedPatientName: null });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Could not verify code. Please check and try again.';
      setCheckError(msg);
      onUpdate({ verifiedPatientName: null });
    } finally {
      setChecking(false);
    }
  };

  const isNextDisabled =
    hasInvite === true && inviteCode.trim().length === 0;

  return (
    <OnboardingLayout
      title="Are you already part of their Care Circle?"
      subtitle="If someone gave you a Care Circle code, enter it below to request access."
      currentStep={4}
      totalSteps={5}
      iconName="shield-checkmark"
      onBack={onBack}
      onNext={onNext}
      onSkip={() => {
        onUpdate({ hasInvite: false, inviteCode: '', verifiedPatientName: null });
        onNext();
      }}
      skipLabel="Skip for now"
      isNextDisabled={isNextDisabled}
    >
      <View style={s.section}>
        <Text style={s.sectionTitle}>Do you have an invite code? *</Text>
        <View style={s.cardGroup}>
          <OptionCard
            title="Yes, I have an invitation code"
            description="A caregiver or family member shared a code with me"
            icon="key-outline"
            selected={hasInvite === true}
            onPress={() => {
              onUpdate({ hasInvite: true });
              setCheckError(null);
            }}
          />
          <OptionCard
            title="Not yet"
            description="I'll connect with them or create a Care Circle later"
            icon="time-outline"
            selected={hasInvite === false}
            onPress={() => {
              onUpdate({ hasInvite: false, inviteCode: '', verifiedPatientName: null });
              setCheckError(null);
            }}
          />
        </View>
      </View>

      {/* Code Input Section */}
      {hasInvite === true && (
        <View style={s.codeSection}>
          <Text style={s.sectionTitle}>Care Circle Code *</Text>
          <Text style={s.sectionHint}>Enter the 6-character code (e.g. ABC123)</Text>

          <View style={s.inputRow}>
            <View style={s.codeContainer}>
              <Ionicons name="qr-code-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
              <TextInput
                style={s.codeInput}
                placeholder="ENTER CODE"
                placeholderTextColor="#9CA3AF"
                value={inviteCode}
                onChangeText={(t) => {
                  onUpdate({ inviteCode: t.toUpperCase(), verifiedPatientName: null });
                  setCheckError(null);
                }}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            <Pressable
              onPress={handleVerifyCode}
              disabled={checking || inviteCode.trim().length < 4}
              style={({ pressed }) => [
                s.verifyBtn,
                (checking || inviteCode.trim().length < 4) && s.verifyBtnDisabled,
                pressed && s.verifyBtnPressed,
              ]}
            >
              {checking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.verifyBtnText}>Verify</Text>
              )}
            </Pressable>
          </View>

          {/* Verification Feedback */}
          {verifiedPatientName ? (
            <View style={s.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#065F46" />
              <Text style={s.successText}>
                Verified: Invite to join <Text style={{ fontFamily: F.bold }}>{verifiedPatientName}&apos;s</Text> Care Circle
              </Text>
            </View>
          ) : null}

          {checkError ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={18} color={C.error} />
              <Text style={s.errorText}>{checkError}</Text>
            </View>
          ) : null}

          {/* Workflow Explanation Callout */}
          <View style={s.infoNotice}>
            <Ionicons name="shield-outline" size={18} color={C.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>Owner Approval Required</Text>
              <Text style={s.infoText}>
                Entering an invitation code submits a request to join. The Care Circle owner will review your profile and approve your membership. Permissions are not granted automatically.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Not Yet Info */}
      {hasInvite === false && (
        <View style={s.infoNotice}>
          <Ionicons name="sparkles-outline" size={18} color={C.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.infoTitle}>Connect Anytime</Text>
            <Text style={s.infoText}>
              No problem! You can complete your account now. Once logged into your Family dashboard, you can connect to a patient by phone number or invite code whenever you are ready.
            </Text>
          </View>
        </View>
      )}
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
  codeSection: {
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  codeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 8,
  },
  codeInput: {
    flex: 1,
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
    letterSpacing: 2,
  },
  verifyBtn: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  verifyBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  verifyBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  successText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 13,
    color: '#065F46',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 13,
    color: C.error,
  },
  infoNotice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F0FBF8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C6EBE2',
    padding: 14,
    marginTop: 8,
  },
  infoTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.primaryDark,
    marginBottom: 2,
  },
  infoText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },
});
