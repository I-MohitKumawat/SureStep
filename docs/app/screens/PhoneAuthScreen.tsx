import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PhoneAuth'>;

const PRIMARY_LAVENDER = '#BFA2DB';
const INPUT_BG = '#F5F0FA';

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');

  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [focusedField, setFocusedField] = useState<'phone' | 'otp' | null>(null);

  const phoneInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  const phoneValid = useMemo(() => /^\d{10}$/.test(phoneNumber), [phoneNumber]);

  const otpDigits = useMemo(() => otp.replace(/\D/g, '').slice(0, 6), [otp]);
  const otpValid = useMemo(() => /^\d{4,6}$/.test(otpDigits), [otpDigits]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    // Keep focus flow consistent with the two-step UX.
    if (showOTP) {
      otpInputRef.current?.focus();
      return;
    }
    phoneInputRef.current?.focus();
  }, [showOTP]);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  const handleSendOTP = async () => {
    if (!phoneValid) {
      setError('Enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setOtp('');

    
    // Simulate API call
    setTimeout(() => {
      setShowOTP(true);
      setResendTimer(30);
      setIsLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = async (otpValue: string) => {
    if (!otpValid) {
      setError('Enter a valid OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate verification
    setTimeout(() => {
      // Mock verification - accept test OTPs for now.
      if (otpValue === '0000' || otpValue === '1111') {
        navigation.replace('RoleEntry');
        return;
      }

      setError('Invalid OTP. Please try again.');
      setOtp('');
      otpInputRef.current?.focus();
      setIsLoading(false);
    }, 650);
  };

  const handleResendOTP = () => {
    if (resendTimer > 0 || isLoading) return;
    setError('');
    setResendTimer(30);
      Keyboard.dismiss();
    }, 1000);
  };

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleVerifyOTP = (otpValue: string) => {
    setError('');
    
    // Mock verification - accept "0000" as valid
    if (otpValue === '0000') {
      // Navigate to role selection
      navigation.replace('RoleEntry');
    } else {
      setError('Invalid OTP. Please try again.');
      // Clear OTP inputs
      setOtp(['', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = () => {
    if (resendTimer === 0) {
      setResendTimer(30);
      setError('');
      // In real app, this would trigger another API call
    }
  };

  const handleBackToPhone = () => {
    setShowOTP(false);
    setOtp(['', '', '', '']);
    setError('');
    setResendTimer(0);
    phoneInputRef.current?.focus();
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    return cleaned.slice(0, 10);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Welcome to SureStep
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {showOTP ? 'Enter the 4-digit code sent to your phone' : 'Enter your phone number to continue'}
          </Text>

          {!showOTP ? (
            <View style={styles.phoneInputContainer}>
              <View style={[styles.countryCode, { borderColor: theme.colors.borderSubtle }]}>
                <Text style={[styles.countryCodeText, { color: theme.colors.textPrimary }]}>+1</Text>
              </View>
              <TextInput
                ref={phoneInputRef}
                style={[
                  styles.phoneInput,
                  { 
                    borderColor: error ? theme.colors.error : theme.colors.borderSubtle,
                    color: theme.colors.textPrimary
                  }
                ]}
                placeholder="(555) 123-4567"
                placeholderTextColor={theme.colors.textSecondary}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(formatPhoneNumber(text));
                  setError('');
                }}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>
          ) : (
            <View style={styles.otpContainer}>
              <View style={styles.otpInputs}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      otpRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      { 
                        borderColor: error ? theme.colors.error : theme.colors.borderSubtle,
                        color: theme.colors.textPrimary
                      }
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOTPChange(value, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    secureTextEntry
                    textAlign="center"
                  />
                ))}
              </View>
              
              <Pressable onPress={handleBackToPhone} style={styles.backButton}>
                <Text style={[styles.backButtonText, { color: theme.colors.accent }]}>
                  ← Back to phone number
                </Text>
              </Pressable>
            </View>
          )}

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          {!showOTP ? (
            <Pressable
              onPress={handleSendOTP}
              disabled={isLoading || phoneNumber.length < 10}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: 
                    isLoading || phoneNumber.length < 10
                      ? theme.colors.borderSubtle
                      : theme.colors.accent,
                  opacity: pressed ? 0.85 : 1
                }
              ]}
            >
              <Text style={[
                styles.sendButtonText,
                { color: isLoading || phoneNumber.length < 10 ? theme.colors.textSecondary : '#ffffff' }
              ]}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                Didn't receive the code?
              </Text>
              <Pressable
                onPress={handleResendOTP}
                disabled={resendTimer > 0}
                style={({ pressed }) => [
                  styles.resendButton,
                  { opacity: resendTimer > 0 ? 0.5 : pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={[styles.resendButtonText, { color: theme.colors.accent }]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,

    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  logoText: {
    color: 'rgba(17, 24, 39, 0.65)',
    fontWeight: '800',
    fontSize: 18
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2.6,
    marginBottom: 34,
    color: '#1A1A1A'
  },

  middle: {
    width: '100%',
    alignItems: 'center'
  },
  loginTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center'
  },
  loginSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7A7A7A',
    marginBottom: 28,
    textAlign: 'center'
  },

  inputs: {
    width: '100%'
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500'
  },
  inputFocused: {
    shadowColor: PRIMARY_LAVENDER,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  errorText: {
    width: '100%',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'left'
  },

  loginButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },

  otpFooter: {
    width: '100%',
    marginTop: 18,
    alignItems: 'center'
  },
  backLink: {
    width: '100%',
    alignItems: 'flex-start'
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700'
  },
  resendContainer: {
    marginTop: 16,
    alignItems: 'center'
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '800'
  },

  bottomShapeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 320,
    justifyContent: 'flex-end'
  },
  bottomShape: {
    position: 'absolute',
    left: -60,
    right: -60,
    bottom: -190,
    height: 320,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 70,
    transform: [{ rotate: '-6deg' }]
  }
});


    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  countryCode: {
    borderWidth: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 0,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    width: 70,
    height: 70,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  sendButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

