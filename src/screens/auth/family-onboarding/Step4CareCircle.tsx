
/**
 * SureStep — src/screens/auth/family-onboarding/Step4CareCircle.tsx
 * Family Onboarding Step 4: Optional Care Circle connection.
 */

import React, {
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../../components/onboarding/OnboardingLayout';
import { validateInviteCode } from '../../../services/familyService';

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

  const [checkError, setCheckError] =
    useState<string | null>(null);

  const [inputFocused, setInputFocused] =
    useState(false);

  // Prevent outdated verification requests from
  // overwriting newer input or skipped selections.
  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  const normalizedCode =
    inviteCode.trim().toUpperCase();

  const isVerified =
    hasInvite === true &&
    normalizedCode.length >= 4 &&
    Boolean(verifiedPatientName?.trim());

  const canVerify =
    !checking &&
    !isVerified &&
    normalizedCode.length >= 4;

  const isNextDisabled =
    checking ||
    (hasInvite === true && !isVerified);

  /* Clear pending verification */

  const resetVerification = () => {
    requestId.current += 1;

    setChecking(false);
    setCheckError(null);
  };

  /* Select Yes */

  const handleHasInvite = () => {
    if (hasInvite === true) return;

    resetVerification();

    onUpdate({
      hasInvite: true,
      verifiedPatientName: null,
    });
  };

  /* Select Not Yet */

  const handleNoInvite = () => {
    Keyboard.dismiss();

    resetVerification();

    onUpdate({
      hasInvite: false,
      inviteCode: '',
      verifiedPatientName: null,
    });
  };

  /* Skip optional setup */

  const handleSkip = () => {
    handleNoInvite();
    onNext();
  };

  /* Handle code input */

  const handleCodeChange = (text: string) => {
    resetVerification();

    onUpdate({
      inviteCode: text.toUpperCase(),
      verifiedPatientName: null,
    });
  };

  /* Verify invitation through the backend */

  const handleVerifyCode = async () => {
    if (checking || isVerified) return;

    const trimmed =
      inviteCode.trim().toUpperCase();

    if (trimmed.length < 4) {
      setCheckError(
        'Please enter a valid invitation code.'
      );

      return;
    }

    Keyboard.dismiss();

    const currentRequest = ++requestId.current;

    setChecking(true);
    setCheckError(null);

    onUpdate({
      verifiedPatientName: null,
    });

    try {
      const res = await validateInviteCode(trimmed);

      // Ignore responses from outdated requests.
      if (currentRequest !== requestId.current) {
        return;
      }

      const data = res.data?.data || res.data;

      const patientName =
        typeof data?.patientName === 'string'
          ? data.patientName.trim()
          : '';

      if (data?.valid && patientName) {
        onUpdate({
          inviteCode: trimmed,
          verifiedPatientName: patientName,
        });
      } else {
        setCheckError(
          data?.valid
            ? 'Unable to identify the Care Circle. Please try again.'
            : 'Invalid or expired invitation code.'
        );

        onUpdate({
          verifiedPatientName: null,
        });
      }

    } catch (err: any) {
      if (currentRequest !== requestId.current) {
        return;
      }

      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Could not verify the code. Please try again.';

      setCheckError(message);

      onUpdate({
        verifiedPatientName: null,
      });

    } finally {
      if (currentRequest === requestId.current) {
        setChecking(false);
      }
    }
  };

  /* Continue */

  const handleContinue = () => {
    if (checking) return;

    if (hasInvite === true) {
      if (!isVerified) {
        setCheckError(
          'Please verify your invitation code first.'
        );

        return;
      }

      onNext();
      return;
    }

    // No invitation selected or explicitly skipped.
    handleSkip();
  };

  const inviteOptions = [
    {
      value: true,
      title: 'Yes, I have one',
      icon: 'key-outline' as const,
    },
    {
      value: false,
      title: 'Not yet',
      icon: 'time-outline' as const,
    },
  ];

  return (
    <OnboardingLayout
      title="Join a Care Circle"
      subtitle="Connect with your loved one."
      currentStep={4}
      totalSteps={5}
      iconName="shield-checkmark-outline"
      backgroundVariant="lavender"
      layoutVariant="minimal"
      onBack={onBack}
      onNext={handleContinue}
      isNextDisabled={isNextDisabled}
    >
      <View className="gap-[12px]">

        {/* Main white container */}

        <View
          className="rounded-[20px] border border-care-border bg-white p-[16px]"
          style={{
            shadowColor: '#54456B',
            shadowOpacity: 0.07,
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowRadius: 8,
            elevation: 2,
          }}
        >

          {/* Section heading */}

          <View className="mb-[12px] flex-row items-center justify-between gap-[8px]">

            <Text className="flex-1 font-inter-semibold text-[14px] text-care-ink">
              Have an invite code?
            </Text>

            <Text className="font-inter-regular text-[12px] text-care-muted">
              Optional
            </Text>

          </View>

          {/* Yes / Not yet selection */}

          <View
            className="flex-row items-stretch gap-[8px]"
            accessibilityRole="radiogroup"
          >
            {inviteOptions.map((item) => {
              const selected =
                hasInvite === item.value;

              return (
                <Pressable
                  key={String(item.value)}
                  onPress={
                    item.value
                      ? handleHasInvite
                      : handleNoInvite
                  }
                  accessibilityRole="radio"
                  accessibilityLabel={item.title}
                  accessibilityState={{
                    checked: selected,
                  }}
                  className={`relative min-h-[104px] flex-1 items-center justify-center gap-[8px] rounded-[12px] border px-[10px] pb-[12px] pt-[26px] active:opacity-70 ${
                    selected
                      ? 'border-brand bg-care-selected'
                      : 'border-care-border bg-care-canvas'
                  }`}
                >

                  <View className="absolute right-[8px] top-[8px]">
                    <Ionicons
                      name={
                        selected
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={17}
                      color={
                        selected
                          ? '#0E7A67'
                          : '#AAB8B2'
                      }
                    />
                  </View>

                  <Ionicons
                    name={item.icon}
                    size={28}
                    color={
                      selected
                        ? '#0E7A67'
                        : '#655481'
                    }
                  />

                  <Text
                    className={`text-center font-inter-medium text-[13px] leading-[18px] ${
                      selected
                        ? 'text-brand-dark'
                        : 'text-care-ink'
                    }`}
                  >
                    {item.title}
                  </Text>

                </Pressable>
              );
            })}
          </View>

          {/* Invitation code section */}

          {hasInvite === true && (
            <>

              <View className="my-[18px] h-px bg-care-border" />

              <Text className="mb-[8px] font-inter-semibold text-[13px] text-care-ink">
                Invitation code
              </Text>

              <View className="flex-row items-stretch gap-[8px]">

                {/* Code input */}

                <View
                  className={`min-h-[50px] flex-1 flex-row items-center gap-[8px] rounded-[12px] border bg-care-canvas px-[12px] ${
                    inputFocused || isVerified
                      ? 'border-brand'
                      : 'border-care-border'
                  }`}
                >
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color={
                      isVerified
                        ? '#0E7A67'
                        : '#655481'
                    }
                  />

                  <TextInput
                    className="min-h-[50px] flex-1 font-inter-semibold text-[15px] tracking-[2px] text-care-ink"
                    accessibilityLabel="Care Circle invitation code"
                    placeholder="ABC123"
                    placeholderTextColor="#68766F"
                    value={inviteCode}
                    onChangeText={handleCodeChange}
                    onFocus={() =>
                      setInputFocused(true)
                    }
                    onBlur={() =>
                      setInputFocused(false)
                    }
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoComplete="off"
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (canVerify) {
                        handleVerifyCode();
                      }
                    }}
                  />
                </View>

                {/* Verify button */}

                <Pressable
                  onPress={handleVerifyCode}
                  disabled={!canVerify}
                  accessibilityRole="button"
                  accessibilityLabel="Verify invitation code"
                  accessibilityState={{
                    disabled: !canVerify,
                    busy: checking,
                  }}
                  className={`min-h-[50px] min-w-[80px] items-center justify-center rounded-[12px] px-[14px] py-[10px] ${
                    isVerified
                      ? 'border border-brand bg-care-selected'
                      : checking || canVerify
                        ? 'bg-brand active:opacity-80'
                        : 'bg-[#E5E0D8]'
                  }`}
                >
                  {checking ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : isVerified ? (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color="#0E7A67"
                    />
                  ) : (
                    <Text
                      className={`font-inter-semibold text-[13px] ${
                        canVerify
                          ? 'text-white'
                          : 'text-care-muted'
                      }`}
                    >
                      Verify
                    </Text>
                  )}
                </Pressable>

              </View>

              {/* Successful verification */}

              {isVerified && (
                <View
                  accessibilityLiveRegion="polite"
                  className="mt-[12px] flex-row items-center gap-[10px] rounded-[12px] border border-[#C6EBE2] bg-care-selected p-[12px]"
                >
                  <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-white">
                    <Ionicons
                      name="checkmark-circle"
                      size={25}
                      color="#0E7A67"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="font-inter-semibold text-[13px] text-brand-dark">
                      Invitation verified
                    </Text>

                    <Text className="mt-[3px] font-inter-regular text-[12px] leading-[18px] text-care-muted">
                      {verifiedPatientName}&apos;s Care Circle
                    </Text>
                  </View>
                </View>
              )}

              {/* Verification error */}

              {!!checkError && (
                <View
                  accessibilityLiveRegion="polite"
                  className="mt-[10px] flex-row items-start gap-[8px] rounded-[10px] bg-red-50 p-[10px]"
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#DC2626"
                  />

                  <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-red-700">
                    {checkError}
                  </Text>
                </View>
              )}

              {/* Short approval notice */}

              <View className="mt-[16px] flex-row items-start gap-[8px]">

                <Ionicons
                  name="shield-outline"
                  size={18}
                  color="#655481"
                />

                <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
                  Joining requires the Care Circle
                  owner's approval.
                </Text>

              </View>

            </>
          )}

          {/* Connecting later */}

          {hasInvite === false && (
            <View className="mt-[14px] flex-row items-center gap-[10px] rounded-[12px] bg-[#F4EFFA] p-[12px]">

              <Ionicons
                name="information-circle-outline"
                size={21}
                color="#655481"
              />

              <Text className="flex-1 font-inter-regular text-[12px] leading-[18px] text-care-muted">
                You can connect later from your dashboard.
              </Text>

            </View>
          )}

        </View>

        {/* Optional skip action */}

        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          className="min-h-[44px] items-center justify-center active:opacity-70"
        >
          <Text className="font-inter-medium text-[13px] text-brand-dark">
            Connect later
          </Text>
        </Pressable>

      </View>
    </OnboardingLayout>
  );
};
