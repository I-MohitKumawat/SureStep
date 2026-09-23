/**
 * SureStep — src/components/onboarding/OnboardingLayout.tsx
 * Reusable layout wrapper for modern onboarding steps matching visual reference.
 */
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

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
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
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
  iconColor = C.primary,
  iconBg = '#EAF7F4',
  children,
  footerExtra,
}) => {
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={s.safeArea}>
      <KeyboardAvoidingView
        style={s.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top navigation row */}
          <View style={s.topNav}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [s.backBtn, pressed && s.pressedOpacity]}
                hitSlop={12}
              >
                <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
                <Text style={s.backBtnText}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ width: 60 }} />
            )}

            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>
                Step {currentStep} of {totalSteps}
              </Text>
            </View>

            {onSkip ? (
              <Pressable
                onPress={onSkip}
                style={({ pressed }) => [s.skipBtn, pressed && s.pressedOpacity]}
                hitSlop={12}
              >
                <Text style={s.skipBtnText}>{skipLabel}</Text>
              </Pressable>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Minimal illustration area */}
          <View style={s.illustrationWrapper}>
            <View style={[s.illustrationBlob, { backgroundColor: iconBg }]}>
              <View style={s.illustrationIconBubble}>
                <Ionicons name={iconName} size={26} color={iconColor} />
              </View>
            </View>
          </View>

          {/* Heading */}
          <Text style={s.heading}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

          {/* Progress dots */}
          <View style={s.progressDots}>
            {Array.from({ length: totalSteps }, (_, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === currentStep;
              const isPast = stepNum < currentStep;
              return (
                <View
                  key={stepNum}
                  style={[
                    s.progressDot,
                    isActive && s.progressDotActive,
                    isPast && s.progressDotPast,
                  ]}
                />
              );
            })}
          </View>

          {/* Main Content */}
          <View style={s.contentWrapper}>{children}</View>
        </ScrollView>

        {/* Bottom CTA Footer */}
        <View style={s.footer}>
          {footerExtra}
          <Pressable
            onPress={onNext}
            disabled={isNextDisabled || isNextLoading}
            style={({ pressed }) => [
              s.continueBtn,
              isNextDisabled && s.continueBtnDisabled,
              pressed && !isNextDisabled && s.continueBtnPressed,
            ]}
          >
            {isNextLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={s.continueBtnInner}>
                <Text
                  style={[
                    s.continueBtnText,
                    isNextDisabled && s.continueBtnTextDisabled,
                  ]}
                >
                  {nextLabel}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={isNextDisabled ? '#9CA3AF' : '#FFFFFF'}
                  style={{ marginLeft: 6 }}
                />
              </View>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.surface,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textPrimary,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  stepBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.textSecondary,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  illustrationBlob: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    fontFamily: F.extraBold,
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 5,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  progressDotPast: {
    backgroundColor: C.primaryLight,
  },
  contentWrapper: {
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  continueBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  continueBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pressedOpacity: {
    opacity: 0.7,
  },
});
