
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  CareBackground,
  CareFooterBackground,
  type CareBackgroundVariant,
} from '../shared/CareBackground';

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  children: ReactNode;
  footerExtra?: ReactNode;
  headerRight?: ReactNode;
  backgroundVariant?: CareBackgroundVariant | 'default';
  layoutVariant?: 'default' | 'minimal';
}

export const OnboardingLayout: React.FC<
  OnboardingLayoutProps
> = ({
  title,
  subtitle,
  currentStep,
  totalSteps = 9,
  onBack,
  onNext,
  nextLabel = 'Continue',
  isNextDisabled = false,
  isNextLoading = false,
  onSkip,
  skipLabel = 'Skip',
  iconName = 'sparkles',
  iconColor = '#0E7A67',
  iconBg = '#E6F4F1',
  children,
  footerExtra,
  headerRight,
  backgroundVariant = 'coastal',
  layoutVariant = 'default',
}) => {
  const total = Math.max(1, Math.floor(totalSteps));
  const step = Math.min(total, Math.max(1, currentStep));

  const disabled = isNextDisabled || isNextLoading;
  const isMinimal = layoutVariant === 'minimal';

  const variant =
    backgroundVariant === 'default'
      ? 'coastal'
      : backgroundVariant;

  const progress = (step / total) * 100;

  return (
    <View className="flex-1 bg-care-canvas">
      <StatusBar barStyle="dark-content" />

      <CareBackground variant={variant} />

      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={
            Platform.OS === 'ios' ? 'padding' : undefined
          }
        >

          {/* Top navigation */}

          <View className="w-full max-w-[520px] self-center px-[24px]">
            <View className="min-h-[48px] flex-row items-center justify-between">

              {onBack ? (
                <Pressable
                  onPress={onBack}
                  disabled={isNextLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  accessibilityState={{
                    disabled: isNextLoading,
                  }}
                  className={`h-[44px] w-[44px] items-center justify-center rounded-full active:opacity-70 ${
                    isMinimal ? 'bg-white' : ''
                  }`}
                >
                  <Ionicons
                    name="arrow-back"
                    size={21}
                    color="#254D51"
                  />
                </Pressable>
              ) : (
                <View className="w-[44px]" />
              )}

              {onSkip ? (
                <Pressable
                  onPress={onSkip}
                  disabled={isNextLoading}
                  accessibilityRole="button"
                  className="min-h-[44px] justify-center px-[8px]"
                >
                  <Text className="font-inter-medium text-[14px] text-care-muted">
                    {skipLabel}
                  </Text>
                </Pressable>
              ) : headerRight ? (
                headerRight
              ) : isMinimal ? (
                <Text className="font-inter-medium text-[12px] text-care-muted">
                  Step {step} of {total}
                </Text>
              ) : null}

            </View>

            {/* Minimal progress bar */}

            {isMinimal && (
              <View
                accessibilityRole="progressbar"
                accessibilityLabel="Onboarding progress"
                accessibilityValue={{
                  min: 0,
                  max: total,
                  now: step,
                  text: `Step ${step} of ${total}`,
                }}
                className="mb-[8px] mt-[12px] h-[5px] overflow-hidden rounded-full bg-white/70"
              >
                <View
                  className="h-full rounded-full bg-brand"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </View>
            )}
          </View>

          {/* Scrollable content */}

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full max-w-[520px] self-center px-[24px] pb-[12px] pt-[8px]">

              {isMinimal ? (

                /* New minimal header */

                <View className="mb-[22px] mt-[12px] flex-row items-center gap-[12px]">
                  <View className="flex-1">

                    <Text
                      accessibilityRole="header"
                      className="font-inter-bold text-[26px] leading-[34px] text-care-plum"
                    >
                      {title}
                    </Text>

                    {!!subtitle && (
                      <Text className="mt-[6px] font-inter-regular text-[13px] leading-[20px] text-care-muted">
                        {subtitle}
                      </Text>
                    )}

                  </View>

                  <View
                    className="h-[56px] w-[56px] items-center justify-center rounded-[18px] border border-white bg-white"
                    style={{
                      shadowColor: '#244A42',
                      shadowOpacity: 0.06,
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowRadius: 6,
                      elevation: 1,
                    }}
                  >
                    <Ionicons
                      name={iconName}
                      size={27}
                      color={iconColor}
                    />
                  </View>
                </View>

              ) : (

                /* Existing patient onboarding header */

                <>
                  <View className="mb-[12px] items-center">
                    <View className="relative h-[64px] w-[64px]">

                      <View className="absolute right-0 top-0 h-[54px] w-[54px] rotate-12 rounded-[19px] bg-[#9EDDD4]" />

                      <View
                        className="absolute bottom-0 left-0 h-[56px] w-[56px] items-center justify-center rounded-[19px] border border-white"
                        style={{
                          backgroundColor: iconBg,
                        }}
                      >
                        <View className="h-[39px] w-[39px] items-center justify-center rounded-[14px] bg-white">
                          <Ionicons
                            name={iconName}
                            size={23}
                            color={iconColor}
                          />
                        </View>
                      </View>

                      <View className="absolute right-0 top-0 h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-white bg-brand">
                        <Ionicons
                          name="sparkles"
                          size={10}
                          color="white"
                        />
                      </View>

                    </View>
                  </View>

                  <Text
                    accessibilityRole="header"
                    className="text-center font-inter-bold text-[24px] leading-[30px] text-care-plum"
                  >
                    {title}
                  </Text>

                  {!!subtitle && (
                    <Text className="mt-[6px] text-center font-inter-regular text-[13px] leading-[19px] text-care-muted">
                      {subtitle}
                    </Text>
                  )}

                  <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Onboarding progress"
                    accessibilityValue={{
                      min: 0,
                      max: total,
                      now: step,
                      text: `Step ${step} of ${total}`,
                    }}
                    className="mb-[18px] mt-[10px] flex-row items-center justify-center gap-[6px]"
                  >
                    {Array.from(
                      { length: total },
                      (_, index) => (
                        <View
                          key={index}
                          className={`h-[4px] rounded-full ${
                            index + 1 === step
                              ? 'w-[20px] bg-brand'
                              : index + 1 < step
                                ? 'w-[4px] bg-[#9CCFC1]'
                                : 'w-[4px] bg-[#C2D4CF]'
                          }`}
                        />
                      )
                    )}
                  </View>
                </>
              )}

              {children}

            </View>
          </ScrollView>

          {/* Footer */}

          <View className="relative">
            <CareFooterBackground variant={variant} />

            <View className="w-full max-w-[520px] self-center px-[24px] pb-[12px] pt-[24px]">

              {!!footerExtra && (
                <View className="mb-[8px]">
                  {footerExtra}
                </View>
              )}

              <Pressable
                onPress={onNext}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={nextLabel}
                accessibilityState={{
                  disabled,
                  busy: isNextLoading,
                }}
                className={`min-h-[52px] flex-row items-center justify-center gap-[8px] rounded-full px-[16px] ${
                  isNextDisabled
                    ? 'bg-[#E5E0D8]'
                    : 'bg-brand active:bg-brand-dark'
                }`}
                style={
                  isNextDisabled
                    ? undefined
                    : {
                        shadowColor: '#0A5D50',
                        shadowOpacity: 0.18,
                        shadowOffset: {
                          width: 0,
                          height: 3,
                        },
                        shadowRadius: 6,
                        elevation: 3,
                      }
                }
              >
                {isNextLoading ? (
                  <ActivityIndicator
                    color={
                      isNextDisabled
                        ? '#52605D'
                        : '#FFFFFF'
                    }
                  />
                ) : (
                  <>
                    <Text
                      className={`font-inter-bold text-[15px] ${
                        isNextDisabled
                          ? 'text-care-muted'
                          : 'text-white'
                      }`}
                    >
                      {nextLabel}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color={
                        isNextDisabled
                          ? '#52605D'
                          : '#FFFFFF'
                      }
                    />
                  </>
                )}
              </Pressable>

            </View>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingLayout;
