/**
 * SureStep — src/components/onboarding/OnboardingLayout.tsx
 * Reusable layout wrapper for modern onboarding steps matching visual reference.
 */
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  iconColor = '#0E7A67',
  iconBg = '#E6F4F1',
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
              <TouchableOpacity
                onPress={onBack}
                style={s.backBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={20} color="#161E1C" />
                <Text style={s.backBtnText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}

            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>
                Step {currentStep} of {totalSteps}
              </Text>
            </View>

            {onSkip ? (
              <TouchableOpacity
                onPress={onSkip}
                style={s.skipBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={s.skipBtnText}>{skipLabel}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Minimal illustration area */}
          <View style={s.illustrationWrapper}>
            <View style={[s.illustrationBlob, { backgroundColor: iconBg }]}>
              <View style={s.illustrationIconBubble}>
                <Ionicons name={iconName} size={24} color={iconColor} />
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
          <TouchableOpacity
            onPress={onNext}
            disabled={isNextDisabled || isNextLoading}
            activeOpacity={0.88}
            style={[
              s.continueBtn,
              isNextDisabled && s.continueBtnDisabled,
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
                  style={{ marginLeft: 8 }}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#E6F4F1',
  },
  stepBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#0A5D50',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#52605D',
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  illustrationBlob: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4F1',
  },
  illustrationIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E7A67',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  heading: {
    fontFamily: F.bold,
    fontSize: 24,
    color: '#161E1C',
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#52605D',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E0D8',
  },
  progressDotActive: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#0E7A67',
  },
  progressDotPast: {
    backgroundColor: '#A7D7CD',
  },
  contentWrapper: {
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#E5E0D8',
  },
  continueBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0E7A67',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E7A67',
    shadowOpacity: 0.22,
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
    backgroundColor: '#E5E0D8',
    borderWidth: 1,
    borderColor: '#D6DDDD',
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
