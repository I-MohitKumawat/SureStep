import React, { useState } from 'react';
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
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { AuthStackParams } from '../../types/navigation.types';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParams, 'PhoneAuthScreen'>;

const countries = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
];

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, isLoaded: isSignInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp,         setOtp]         = useState('');
  const [codeSent,    setCodeSent]    = useState(false);
  const [showErrors,  setShowErrors]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [authError,   setAuthError]   = useState<string | null>(null);

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

    if (!isSignInLoaded || !isSignUpLoaded || !signIn || !signUp) {
      setAuthError('Auth services are initializing. Please wait.');
      return;
    }

    setLoading(true);
    const formattedPhone = `${selectedCountry.code}${sanitizedPhone}`;

    try {
      if (activeTab === 'signin') {
        const result = await signIn.create({
          identifier: formattedPhone,
        });

        const firstFactor = result.supportedFirstFactors?.find(
          (factor: any) => factor.strategy === 'phone_code'
        );

        if (!firstFactor) {
          throw new Error('SMS verification not supported for this number.');
        }

        await signIn.prepareFirstFactor({
          strategy: 'phone_code',
          phoneNumberId: (firstFactor as any).phoneNumberId,
        });

        setCodeSent(true);
        setShowErrors(false);
      } else {
        await signUp.create({
          phoneNumber: formattedPhone,
        });
        await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
        setCodeSent(true);
        setShowErrors(false);
      }
    } catch (err: any) {
      console.error('[Clerk Auth Error]', err);
      let userMsg = err.errors?.[0]?.message || 'Failed to send OTP.';
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        userMsg = 'No account exists with this phone number. Please sign up instead.';
      } else if (err.errors?.[0]?.code === 'form_identifier_exists') {
        userMsg = 'An account already exists with this phone number. Please sign in instead.';
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

    if (!signIn || !signUp) {
      setAuthError('Auth services are initializing. Please wait.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'signup') {
        const completeSignUp = await signUp.attemptPhoneNumberVerification({
          code: otp,
        });
        if (completeSignUp.status === 'complete') {
          await setActive({ session: completeSignUp.createdSessionId });
        } else {
          setAuthError('Sign up verification incomplete. Please try again.');
        }
      } else {
        const completeSignIn = await signIn.attemptFirstFactor({
          strategy: 'phone_code',
          code: otp,
        });
        if (completeSignIn.status === 'complete') {
          await setActive({ session: completeSignIn.createdSessionId });
        } else {
          setAuthError('Sign in verification incomplete. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('[Clerk Verification Error]', err);
      setAuthError(err.errors?.[0]?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'surestep' })
      });
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('[Google OAuth Error]', err);
      setAuthError(err.errors?.[0]?.message || err.message || 'Google authentication failed.');
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
    } else {
      navigation.goBack();
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
                  : activeTab === 'signin'
                    ? 'Sign in to SureStep'
                    : 'Create your account'}
              </Text>
              <Text style={[styles.brandSubtitle, { color: theme.colors.textSecondary }]}>
                {codeSent
                  ? `Enter the 6-digit code sent to ${selectedCountry.code} ${phoneNumber}`
                  : activeTab === 'signin'
                    ? 'Welcome back! Enter your phone to continue'
                    : 'Enter your phone number to get started'}
              </Text>

              {/* FORM AREA */}
              <View style={styles.formSection}>
                {/* SIGNIN / SIGNUP SWITCHER (OUTSIDE CARD CONTAINER) */}
                {!codeSent && (
                  <View style={styles.folderTabRow}>
                    <Pressable
                      style={[
                        styles.folderTab,
                        activeTab === 'signin'
                          ? {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.borderSubtle,
                              borderBottomColor: theme.colors.surface,
                            }
                          : {
                              backgroundColor: 'transparent',
                              borderColor: 'transparent',
                            }
                      ]}
                      onPress={() => {
                        setActiveTab('signin');
                        setAuthError(null);
                      }}
                    >
                      <Text style={[
                        styles.folderTabText,
                        activeTab === 'signin'
                          ? { color: theme.colors.textPrimary, fontFamily: F.bold }
                          : { color: theme.colors.textSecondary, fontFamily: F.medium }
                      ]}>
                        Sign In
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.folderTab,
                        activeTab === 'signup'
                          ? {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.borderSubtle,
                              borderBottomColor: theme.colors.surface,
                            }
                          : {
                              backgroundColor: 'transparent',
                              borderColor: 'transparent',
                            }
                      ]}
                      onPress={() => {
                        setActiveTab('signup');
                        setAuthError(null);
                      }}
                    >
                      <Text style={[
                        styles.folderTabText,
                        activeTab === 'signup'
                          ? { color: theme.colors.textPrimary, fontFamily: F.bold }
                          : { color: theme.colors.textSecondary, fontFamily: F.medium }
                      ]}>
                        Sign Up
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* THE SEAMLESS FORM BUBBLE CARD */}
                <View style={[
                  styles.formCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.borderSubtle,
                    borderTopLeftRadius: !codeSent && activeTab === 'signin' ? 0 : 20,
                    borderTopRightRadius: !codeSent && activeTab === 'signup' ? 0 : 20,
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
                            <Text style={styles.loginText}>Continue</Text>
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
                            <Text style={styles.loginText}>Continue</Text>
                            <Text style={styles.buttonArrow}>▸</Text>
                          </>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>

                {/* DIVIDER, GOOGLE BUTTON & TERMS (rendered outside the bubble) */}
                {!codeSent && (
                  <>
                    {/* DIVIDER */}
                    <View style={styles.dividerRow}>
                      <View style={[styles.dividerLine, { backgroundColor: theme.colors.borderSubtle }]} />
                      <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>or</Text>
                      <View style={[styles.dividerLine, { backgroundColor: theme.colors.borderSubtle }]} />
                    </View>

                    {/* GOOGLE BUTTON */}
                    <Pressable
                      style={({ pressed }) => [
                        styles.googleButton,
                        {
                          borderColor: theme.colors.borderSubtle,
                          backgroundColor: theme.colors.surface
                        },
                        pressed && { opacity: 0.8 }
                      ]}
                      onPress={() => void handleGoogleAuth()}
                      disabled={loading}
                    >
                      <Text style={styles.googleIconText}>G</Text>
                      <Text style={[styles.googleText, { color: theme.colors.textPrimary }]}>Google</Text>
                    </Pressable>

                    {/* TERMS AND CONDITIONS */}
                    <Text style={[styles.secondaryText, { color: theme.colors.textSecondary, marginTop: 24 }]}>
                      By signing up or signing in, you agree to our{"\n"}
                      <Text style={[styles.textWithLink, { color: theme.colors.accent }]}>Terms and Conditions</Text>
                      {" and "}
                      <Text style={[styles.textWithLink, { color: theme.colors.accent }]}>Privacy Policy</Text>
                    </Text>
                  </>
                )}
              </View>

              {/* FOOTER */}
              <View style={[styles.footer, { borderTopColor: theme.colors.borderSubtle }]}>
                <Text style={[styles.footerSecured, { color: theme.colors.textSecondary }]}>
                  Secured by <Text style={[styles.clerkBold, { color: theme.colors.textPrimary }]}>clerk</Text>
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
  backButtonText: {
    fontSize: 24,
    lineHeight: 28,
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
  folderTabRow: {
    flexDirection: 'row',
    marginBottom: -1,
    zIndex: 2,
    width: '100%',
  },
  folderTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
  },
  folderTabText: {
    fontSize: 15,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    paddingHorizontal: 12,
    fontFamily: F.medium,
  },
  googleButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIconText: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#4285F4',
  },
  googleText: {
    fontFamily: F.bold,
    fontSize: 15,
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
  clerkBold: {
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
