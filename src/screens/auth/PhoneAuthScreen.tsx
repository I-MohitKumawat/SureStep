import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAuth, signInWithPhoneNumber, signOut, getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { AuthStackParams } from '../../types/navigation.types';
import { getMe } from '../../services/userService';
import { setFirebaseTokenResolver } from '../../services/apiClient';

type Props = NativeStackScreenProps<AuthStackParams, 'PhoneAuthScreen'>;

const countries = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1',  flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
];

export const PhoneAuthScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'signin';

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp,         setOtp]         = useState('');
  const [codeSent,    setCodeSent]    = useState(false);
  const [showErrors,  setShowErrors]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [authError,   setAuthError]   = useState<string | null>(null);

  // Stores the Firebase confirmation result after OTP is sent
  const confirmationRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null);

  // Focus states for input styling
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isOtpFocused,   setIsOtpFocused]   = useState(false);

  const handleSendCode = async () => {
    setAuthError(null);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const sanitizedPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
    const phoneValid = /^\d{10}$/.test(sanitizedPhone);
    if (!phoneValid) {
      setShowErrors(true);
      return;
    }

    setLoading(true);
    const formattedPhone = `${selectedCountry.code}${sanitizedPhone}`;

    try {
      // Firebase Native Phone Auth — sends SMS with OTP.
      const confirmation = await signInWithPhoneNumber(getAuth(), formattedPhone);
      confirmationRef.current = confirmation;
      setCodeSent(true);
      setShowErrors(false);
    } catch (err: any) {
      console.error('[Firebase Phone Auth Error]', err);
      let userMsg = 'Failed to send OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') {
        userMsg = 'Invalid phone number format. Please check and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        userMsg = 'Too many attempts. Please wait a moment and try again.';
      } else if (err.message) {
        userMsg = err.message;
      }
      setAuthError(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setAuthError(null);
    const otpValid = /^\d{6}$/.test(otp);
    if (!otpValid) {
      setShowErrors(true);
      return;
    }

    if (!confirmationRef.current) {
      setAuthError('Session expired. Please go back and request a new code.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Confirm OTP — creates the Firebase session
      const credential = await confirmationRef.current.confirm(otp);
      const fbUser = credential?.user;

      if (!fbUser) {
        setAuthError('Verification failed. Please try again.');
        return;
      }

      // Step 2: Wire up token resolver immediately
      setFirebaseTokenResolver(() => getIdToken(fbUser));

      if (mode === 'signup') {
        // Sign-up: OTP is confirmed. Firebase session is live.
        // Navigate directly to RoleSelectionScreen — don't wait for onAuthStateChanged.
        // RoleNavigator will also react to the session change, but the direct nav is faster.
        navigation.navigate('RoleSelectionScreen');

      } else {
        // Sign-in: check if user exists in DB
        try {
          await getMe();
          // Found — AuthContext.onAuthStateChanged will fire and set status = 'authenticated'
          // RoleNavigator handles the navigation automatically
        } catch (err: any) {
          if (err.response?.status === 404) {
            // Clean 404: this phone has never signed up
            await signOut(getAuth());
            setOtp('');
            setCodeSent(false);
            setAuthError('No account found for this number. Please create an account.');
          } else {
            // Network/server error — sign them out and show a useful message
            await signOut(getAuth());
            setOtp('');
            setCodeSent(false);
            setAuthError('Could not connect to the server. Please check your connection and try again.');
          }
        }
      }
    } catch (err: any) {
      console.error('[Firebase OTP Verification Error]', err);
      let userMsg = 'Invalid code. Please try again.';
      if (err.code === 'auth/invalid-verification-code') {
        userMsg = 'Incorrect verification code. Please check and try again.';
      } else if (err.code === 'auth/code-expired') {
        userMsg = 'Code has expired. Please go back and request a new one.';
      }
      setAuthError(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const phoneValidClean = phoneNumber.replace(/\D/g, '').replace(/^0/, '');
  const phoneInvalid = showErrors && !/^\d{10}$/.test(phoneValidClean);
  const otpInvalid   = showErrors && !/^\d{6}$/.test(otp);

  const handleBack = () => {
    if (codeSent) {
      setCodeSent(false);
      setOtp('');
      setAuthError(null);
      confirmationRef.current = null;
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('WelcomeScreen');
      }
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={[styles.container, { paddingHorizontal: 0, paddingVertical: 0 }]}>
      {(theme) => {
        const isDark = theme.mode === 'dark';
        return (
          <View style={{ flex: 1 }}>
            {/* SKY BACKGROUND (rendered outside ScrollView) */}
            <LinearGradient
              colors={['#57CFF2', '#BFEFFF', theme.colors.background]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.gradient}
            />

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.md,
                }
              ]}
              keyboardShouldPersistTaps="handled"
            >

              {/* TOP HEADER / BACK BUTTON */}
              <View style={styles.headerRow}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 12H5M5 12L12 19M5 12L12 5"
                      stroke={theme.colors.textSecondary}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </Pressable>
              </View>

              {/* LOGO AREA */}
              <View style={styles.logoContainer}>
                <View style={[
                  styles.logoOutline,
                  {
                    borderColor: theme.colors.borderSubtle,
                    backgroundColor: theme.colors.surface
                  }
                ]} />
              </View>

              {/* TEXT HEADER */}
              <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
                {codeSent
                  ? 'Enter verification code'
                  : mode === 'signup' ? 'Create your account' : 'Sign in to SureStep'}
              </Text>
              <Text style={[styles.brandSubtitle, { color: theme.colors.textSecondary }]}>
                {codeSent
                  ? `Enter the 6-digit code sent to ${selectedCountry.code} ${phoneNumber}`
                  : mode === 'signup'
                    ? 'Enter your phone number to get started'
                    : 'Enter your phone number to receive a verification code'}
              </Text>

              {/* FORM AREA */}
              <View style={styles.formSection}>

                {/* THE FORM BUBBLE CARD */}
                <View style={[
                  styles.formCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.borderSubtle,
                  }
                ]}>
                  {!codeSent ? (
                    <>
                      {/* PHONE INPUT ROW WITH COUNTRY PICKER */}
                      <View style={styles.phoneInputRow}>
                        {/* COUNTRY CODE PICKER */}
                        <Pressable
                          style={[
                            styles.countryPickerButton,
                            {
                              borderColor: theme.colors.borderSubtle,
                              backgroundColor: theme.colors.background
                            }
                          ]}
                          onPress={() => setCountryModalVisible(true)}
                        >
                          <Text style={styles.countryFlagText}>{selectedCountry.flag}</Text>
                          <Text style={[styles.countryCodeText, { color: theme.colors.textPrimary }]}>{selectedCountry.code}</Text>
                          <Text style={[styles.dropdownArrow, { color: theme.colors.textSecondary }]}>▼</Text>
                        </Pressable>

                        {/* PHONE INPUT WRAPPER */}
                        <View style={[
                          styles.phoneInputWrapper,
                          isPhoneFocused && { borderColor: theme.colors.accent },
                          phoneInvalid && { borderColor: theme.colors.error },
                          {
                            borderColor: theme.colors.borderSubtle,
                            backgroundColor: theme.colors.background
                          }
                        ]}>
                          <Text style={[
                            styles.floatingLabel,
                            {
                              color: theme.colors.textSecondary,
                              backgroundColor: theme.colors.surface
                            }
                          ]}>
                            Phone number
                          </Text>
                          <TextInput
                            style={[styles.input, { color: theme.colors.textPrimary }]}
                            placeholder="10-digit number"
                            placeholderTextColor={theme.colors.textSecondary}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phoneNumber}
                            onFocus={() => setIsPhoneFocused(true)}
                            onBlur={() => setIsPhoneFocused(false)}
                            onChangeText={(t) => { setPhoneNumber(t); setAuthError(null); }}
                          />
                        </View>
                      </View>
                      {phoneInvalid && <Text style={[styles.errorText, { color: theme.colors.error }]}>Phone number must be 10 digits.</Text>}

                      {authError ? (
                        <View style={[
                          styles.authErrorBox,
                          {
                            backgroundColor: isDark ? '#2D1E1E' : '#FEE2E2',
                            borderColor: theme.colors.error
                          }
                        ]}>
                          <Text style={[styles.authErrorText, { color: theme.colors.error }]}>⚠️ {authError}</Text>
                        </View>
                      ) : null}

                      <Pressable
                        style={({ pressed }) => [
                          styles.loginButton,
                          { backgroundColor: theme.colors.accent },
                          (pressed || loading) && styles.loginButtonPressed,
                        ]}
                        onPress={() => void handleSendCode()}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.loginText}>Send Code</Text>
                            <Text style={styles.buttonArrow}>▸</Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View style={[
                        styles.inputWrapper,
                        isOtpFocused && { borderColor: theme.colors.accent },
                        otpInvalid && { borderColor: theme.colors.error },
                        {
                          borderColor: theme.colors.borderSubtle,
                          backgroundColor: theme.colors.background
                        }
                      ]}>
                        <Text style={[
                          styles.floatingLabel,
                          {
                            color: theme.colors.textSecondary,
                            backgroundColor: theme.colors.surface
                          }
                        ]}>
                          Verification code
                        </Text>
                        <TextInput
                          style={[styles.input, { color: theme.colors.textPrimary }]}
                          placeholder="6-digit OTP"
                          placeholderTextColor={theme.colors.textSecondary}
                          keyboardType="number-pad"
                          maxLength={6}
                          value={otp}
                          onFocus={() => setIsOtpFocused(true)}
                          onBlur={() => setIsOtpFocused(false)}
                          onChangeText={(t) => { setOtp(t); setAuthError(null); }}
                          autoFocus
                        />
                      </View>
                      {otpInvalid && <Text style={[styles.errorText, { color: theme.colors.error }]}>OTP must be exactly 6 digits.</Text>}

                      {authError ? (
                        <View style={[
                          styles.authErrorBox,
                          {
                            backgroundColor: isDark ? '#2D1E1E' : '#FEE2E2',
                            borderColor: theme.colors.error
                          }
                        ]}>
                          <Text style={[styles.authErrorText, { color: theme.colors.error }]}>⚠️ {authError}</Text>
                        </View>
                      ) : null}

                      <Pressable
                        style={({ pressed }) => [
                          styles.loginButton,
                          { backgroundColor: theme.colors.accent },
                          (pressed || loading) && styles.loginButtonPressed,
                        ]}
                        onPress={() => void handleVerifyCode()}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.loginText}>Verify & Continue</Text>
                            <Text style={styles.buttonArrow}>▸</Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>

                {/* TERMS */}
                {!codeSent && (
                  <Text style={[styles.secondaryText, { color: theme.colors.textSecondary, marginTop: 24 }]}>
                    By signing in, you agree to our{"\n"}
                    <Text style={[styles.textWithLink, { color: theme.colors.accent }]}>Terms and Conditions</Text>
                    {" and "}
                    <Text style={[styles.textWithLink, { color: theme.colors.accent }]}>Privacy Policy</Text>
                  </Text>
                )}
              </View>

              {/* FOOTER */}
              <View style={[styles.footer, { borderTopColor: theme.colors.borderSubtle }]}>
                <Text style={[styles.footerSecured, { color: theme.colors.textSecondary }]}>
                  Secured by <Text style={[styles.firebaseBold, { color: theme.colors.textPrimary }]}>Firebase</Text>
                </Text>
                <View style={styles.footerLinks}>
                  <Text style={[styles.footerLink, { color: theme.colors.textSecondary }]}>Help</Text>
                  <Text style={[styles.footerLink, { color: theme.colors.textSecondary }]}>Privacy</Text>
                  <Text style={[styles.folderLink, { color: theme.colors.textSecondary }]}>Terms</Text>
                </View>
              </View>

              {/* COUNTRY SELECTOR MODAL */}
              <Modal
                visible={countryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCountryModalVisible(false)}
              >
                <View style={styles.modalRoot}>
                  <Pressable style={styles.modalOverlay} onPress={() => setCountryModalVisible(false)} />
                  <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderSubtle }]}>
                      <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Country Code</Text>
                    </View>
                    <FlatList
                      data={countries}
                      keyExtractor={(item) => item.code}
                      renderItem={({ item }) => (
                        <Pressable
                          style={({ pressed }) => [
                            styles.countryItem,
                            { borderBottomColor: theme.colors.borderSubtle },
                            pressed && { backgroundColor: theme.colors.background }
                          ]}
                          onPress={() => {
                            setSelectedCountry(item);
                            setCountryModalVisible(false);
                          }}
                        >
                          <Text style={styles.countryItemFlag}>{item.flag}</Text>
                          <Text style={[styles.countryItemName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                          <Text style={[styles.countryItemCode, { color: theme.colors.textSecondary }]}>{item.code}</Text>
                        </Pressable>
                      )}
                    />
                  </View>
                </View>
              </Modal>

            </ScrollView>
          </View>
        );
      }}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerRow: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoOutline: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  brandTitle: {
    fontFamily: F.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  brandSubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 36,
  },
  formSection: {
    flex: 1,
    width: '100%',
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 6,
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  countryFlagText: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: F.medium,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 2,
  },
  phoneInputWrapper: {
    flex: 1,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  inputWrapper: {
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  floatingLabel: {
    position: 'absolute',
    top: -8,
    left: 10,
    paddingHorizontal: 6,
    fontFamily: F.medium,
    fontSize: 10,
    zIndex: 2,
  },
  input: {
    height: '100%',
    fontFamily: F.medium,
    fontSize: 15,
    padding: 0,
  },
  errorText: {
    fontFamily: F.regular,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  authErrorBox: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  authErrorText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  loginButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  loginButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  loginText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  buttonArrow: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  secondaryText: {
    fontFamily: F.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  textWithLink: {
    fontFamily: F.bold,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    borderTopWidth: 1,
    paddingTop: 20,
  },
  footerSecured: {
    fontSize: 11,
    fontFamily: F.regular,
  },
  firebaseBold: {
    fontFamily: F.bold,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  footerLink: {
    fontSize: 11,
    fontFamily: F.medium,
  },
  folderLink: {
    fontSize: 11,
    fontFamily: F.medium,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '40%',
  },
  modalHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    textAlign: 'center',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryItemName: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 15,
  },
  countryItemCode: {
    fontFamily: F.bold,
    fontSize: 15,
  },
});
