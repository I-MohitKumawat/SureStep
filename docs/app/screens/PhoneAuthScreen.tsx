import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../../packages/ui/theme/ThemeProvider';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PhoneAuth'>;

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const phoneInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (showOTP && otpRefs.current[0]) {
      otpRefs.current[0]?.focus();
    }
  }, [showOTP]);

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      setShowOTP(true);
      setResendTimer(30);
      setIsLoading(false);
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
