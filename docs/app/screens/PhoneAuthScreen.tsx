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
  };

  const handleBackToPhone = () => {
    setShowOTP(false);
    setOtp('');
    setError('');
    setResendTimer(0);
  };

  const handlePrimary = () => {
    if (isLoading) return;
    if (!showOTP && otpValid) {
      setShowOTP(true);
      void handleVerifyOTP(otpDigits);
      return;
    }
    if (!showOTP) {
      void handleSendOTP();
      return;
    }
    void handleVerifyOTP(otpDigits);
  };

  const primaryDisabled = isLoading || (!showOTP ? !phoneValid : !otpValid);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#FFFFFF' }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View pointerEvents="none" style={styles.bottomShapeWrap}>
          <View style={[styles.bottomShape, { backgroundColor: PRIMARY_LAVENDER }]} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }
          ]}
        >
          <View style={styles.content}>
            <View style={[styles.logoBox, { backgroundColor: PRIMARY_LAVENDER }]}>
              <Text style={styles.logoText}>logo</Text>
            </View>

            <Text style={styles.brandName}>SURE STEP</Text>

            <View style={styles.middle}>
              <Text style={styles.loginTitle}>Login</Text>
              <Text style={styles.loginSubtitle}>Sign in to continue.</Text>

              <View style={styles.inputs}>
                <TextInput
                  ref={phoneInputRef}
                  style={[
                    styles.input,
                    { backgroundColor: INPUT_BG },
                    {
                      borderColor: focusedField === 'phone' ? PRIMARY_LAVENDER : theme.colors.borderSubtle
                    },
                    focusedField === 'phone' && styles.inputFocused
                  ]}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(formatPhoneNumber(text));
                    setError('');
                  }}
                  onFocus={() => setFocusedField('phone')}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />

                <View style={{ marginTop: 14, width: '100%' }}>
                  <TextInput
                    ref={otpInputRef}
                    style={[
                      styles.input,
                      { backgroundColor: INPUT_BG },
                      {
                        borderColor: focusedField === 'otp' ? PRIMARY_LAVENDER : theme.colors.borderSubtle
                      },
                      focusedField === 'otp' && styles.inputFocused,
                      !showOTP && { opacity: 0.6 }
                    ]}
                    placeholder="Enter OTP"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={otpDigits}
                    onChangeText={(text) => {
                      setOtp(text.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    onFocus={() => {
                      if (!showOTP) {
                        setShowOTP(true);
                        setError('');
                      }
                      setFocusedField('otp');
                    }}
                    onBlur={() => setFocusedField((f) => (f === 'otp' ? null : f))}
                    keyboardType="numeric"
                    maxLength={6}
                    secureTextEntry
                    editable
                  />
                </View>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              ) : null}

              <Pressable
                onPress={handlePrimary}
                disabled={primaryDisabled}
                style={({ pressed }) => [
                  styles.loginButton,
                  {
                    backgroundColor: primaryDisabled ? theme.colors.borderSubtle : PRIMARY_LAVENDER
                  },
                  pressed && !primaryDisabled && { opacity: 0.9, transform: [{ scale: 0.99 }] }
                ]}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Please wait...' : 'Log in'}
                </Text>
              </Pressable>

              {showOTP ? (
                <View style={styles.otpFooter}>
                  <Pressable onPress={handleBackToPhone} style={styles.backLink}>
                    <Text style={[styles.backLinkText, { color: PRIMARY_LAVENDER }]}>
                      ← Back to phone number
                    </Text>
                  </Pressable>

                  <View style={styles.resendContainer}>
                    <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
                      Didn't receive the code?
                    </Text>
                    <Pressable
                      onPress={handleResendOTP}
                      disabled={resendTimer > 0 || isLoading}
                      style={({ pressed }) => [
                        styles.resendButton,
                        { opacity: resendTimer > 0 ? 0.5 : pressed ? 0.85 : 1 }
                      ]}
                    >
                      <Text style={[styles.resendButtonText, { color: PRIMARY_LAVENDER }]}>
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollContent: {
    flexGrow: 1
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

