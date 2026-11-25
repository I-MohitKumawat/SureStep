import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAuth, signInWithPhoneNumber, getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import type { AuthStackParams } from '../../types/navigation.types';
import { setFirebaseTokenResolver } from '../../services/apiClient';

type Props = NativeStackScreenProps<AuthStackParams, 'PhoneAuthScreen'>;

const countries = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1',  flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
];

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
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

    let verifySucceeded = false;
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
      verifySucceeded = true;

      // AuthContext's onAuthStateChanged listener handles session resolution,
      // resolving the user and transitioning the navigation stack to RoleSelectionScreen.
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
      if (!verifySucceeded) {
        setLoading(false);
      }
    }
  };

  const phoneValidClean = phoneNumber.replace(/\D/g, '').replace(/^0/, '');
  const phoneInvalid = showErrors && !/^\d{10}$/.test(phoneValidClean);
  const otpInvalid   = showErrors && !/^\d{6}$/.test(otp);
  const isPhoneReady = /^\d{10}$/.test(phoneValidClean) && !loading;
  const isOtpReady   = /^\d{6}$/.test(otp) && !loading;

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
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={[{"flex":1}, { paddingHorizontal: 0, paddingVertical: 0 }]}>
      {(theme) => {
        const isDark = theme.mode === 'dark';
        return (
          <View style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            {/* SKY BACKGROUND (rendered outside ScrollView) */}
            <LinearGradient
              colors={['#57CFF2', '#BFEFFF', theme.colors.background]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{"position":"absolute","top":0,"left":0,"right":0,"height":250}}
            />

            <ScrollView
              contentContainerClassName="grow pb-[24px] justify-between" contentContainerStyle={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.md,
                }}
              keyboardShouldPersistTaps="handled"
            >

              {/* TOP HEADER / BACK BUTTON */}
              <View className="h-[40px] justify-center mb-[20px]">
                <TouchableOpacity onPress={handleBack} className="w-[44px] h-[44px] rounded-[22px] justify-center items-center" activeOpacity={0.7}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 12H5M5 12L12 19M5 12L12 5"
                      stroke={theme.colors.textSecondary}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* LOGO AREA */}
              <View className="items-center mb-[24px]">
                <View className="w-[64px] h-[64px] rounded-[32px] border-[1.5px]" style={[{"shadowColor":"#000","shadowOpacity":0.1,"shadowRadius":5,"elevation":2}, {
                    borderColor: theme.colors.borderSubtle,
                    backgroundColor: theme.colors.surface
                  }]} >
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name={codeSent ? "shield-checkmark-outline" : "phone-portrait-outline"} size={28} color="#0E7A67" />
                  </View>
                </View>
              </View>

              {/* TEXT HEADER */}
              <Text className="font-inter-bold text-[22px] text-center mb-[6px]" style={{ color: theme.colors.textPrimary }}>
                {codeSent ? 'Enter verification code' : 'Sign in to SureStep'}
              </Text>
              <Text className="font-inter-regular text-[14px] text-center mb-[36px]" style={{ color: theme.colors.textSecondary }}>
                {codeSent
                  ? `Enter the 6-digit code sent to ${selectedCountry.code} ${phoneNumber}`
                  : 'Enter your phone number to receive a verification code'}
              </Text>

              {/* FORM AREA */}
              <View className="flex-1 w-[100%]">

                {/* THE FORM BUBBLE CARD */}
                <View className="rounded-[20px] border-[1px] p-[20px] w-[100%] mb-[20px]" style={[{"shadowColor":"#000","shadowOpacity":0.04,"shadowRadius":10,"elevation":2}, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.borderSubtle,
                  }]}>
                  {!codeSent ? (
                    <>
                      {/* PHONE INPUT ROW WITH COUNTRY PICKER */}
                      <View className="flex-row gap-[10px] w-[100%] mb-[6px]">
                        {/* COUNTRY CODE PICKER */}
                        <Pressable
                          className="flex-row items-center justify-center h-[54px] rounded-[8px] border-[1px] px-[12px] gap-[4px]" style={{
                              borderColor: theme.colors.borderSubtle,
                              backgroundColor: theme.colors.background
                            }}
                          onPress={() => setCountryModalVisible(true)}
                        >
                          <Text className="text-[18px]">{selectedCountry.flag}</Text>
                          <Text className="text-[15px] font-inter-medium" style={{ color: theme.colors.textPrimary }}>{selectedCountry.code}</Text>
                          <Text className="text-[12px] ml-[2px]" style={{ color: theme.colors.textSecondary }}>▼</Text>
                        </Pressable>

                        {/* PHONE INPUT WRAPPER */}
                        <View className="flex-1 h-[54px] rounded-[8px] border-[1px] px-[14px] justify-center relative" style={[{
                            borderColor: phoneInvalid ? theme.colors.error : isPhoneFocused ? theme.colors.accent : theme.colors.borderSubtle,
                          backgroundColor: theme.colors.background
                        }]}>
                          <Text className="absolute top-[-8px] left-[10px] px-[6px] font-inter-medium text-[10px] z-[2]" style={{
                              color: theme.colors.textSecondary,
                              backgroundColor: theme.colors.surface
                            }}>
                            Phone number
                          </Text>
                          <TextInput
                            className="h-[100%] font-inter-medium text-[15px] p-[0px]" style={{ color: theme.colors.textPrimary }}
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
                      {phoneInvalid && <Text className="font-inter-regular text-[12px] mb-[12px] ml-[4px]" style={{ color: theme.colors.error }}>Phone number must be 10 digits.</Text>}

                      {authError ? (
                        <View className="my-[12px] rounded-[8px] border-[1px] px-[14px] py-[10px]" style={{
                            backgroundColor: isDark ? '#2D1E1E' : '#FEE2E2',
                            borderColor: theme.colors.error
                          }}>
                          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                            <Path
                              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              stroke={theme.colors.error}
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                          <Text className="font-inter-semibold text-[13px] leading-[18px]" style={{ color: theme.colors.error }}>{authError}</Text>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        className="mt-[18px] h-[52px] rounded-[14px] bg-brand items-center justify-center flex-row gap-[6px]" style={[{"shadowColor":"#0E7A67","shadowOpacity":0.22,"shadowOffset":{"width":0,"height":4},"shadowRadius":8,"elevation":3}, !isPhoneReady && {"backgroundColor":"#E5E0D8","shadowOpacity":0,"elevation":0}]}
                        onPress={() => void handleSendCode()}
                        disabled={!isPhoneReady || loading}
                        activeOpacity={0.88}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text className="font-inter-bold text-[16px] text-white tracking-[0.3px]" style={!isPhoneReady && {"color":"#9CA3AF"}}>Send Code</Text>
                            <Text className="text-[16px] text-white leading-[18px]" style={!isPhoneReady && {"color":"#9CA3AF"}}>▸</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View className="h-[54px] rounded-[8px] border-[1px] px-[14px] justify-center relative mb-[6px]" style={[{
                          borderColor: otpInvalid ? theme.colors.error : isOtpFocused ? theme.colors.accent : theme.colors.borderSubtle,
                          backgroundColor: theme.colors.background
                        }]}>
                        <Text className="absolute top-[-8px] left-[10px] px-[6px] font-inter-medium text-[10px] z-[2]" style={{
                            color: theme.colors.textSecondary,
                            backgroundColor: theme.colors.surface
                          }}>
                          Verification code
                        </Text>
                        <TextInput
                          className="h-[100%] font-inter-medium text-[15px] p-[0px]" style={{ color: theme.colors.textPrimary }}
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
                      {otpInvalid && <Text className="font-inter-regular text-[12px] mb-[12px] ml-[4px]" style={{ color: theme.colors.error }}>OTP must be exactly 6 digits.</Text>}

                      {authError ? (
                        <View className="my-[12px] rounded-[8px] border-[1px] px-[14px] py-[10px]" style={{
                            backgroundColor: isDark ? '#2D1E1E' : '#FEE2E2',
                            borderColor: theme.colors.error
                          }}>
                          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                            <Path
                              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              stroke={theme.colors.error}
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                          <Text className="font-inter-semibold text-[13px] leading-[18px]" style={{ color: theme.colors.error }}>{authError}</Text>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        className="mt-[18px] h-[52px] rounded-[14px] bg-brand items-center justify-center flex-row gap-[6px]" style={[{"shadowColor":"#0E7A67","shadowOpacity":0.22,"shadowOffset":{"width":0,"height":4},"shadowRadius":8,"elevation":3}, !isOtpReady && {"backgroundColor":"#E5E0D8","shadowOpacity":0,"elevation":0}]}
                        onPress={() => void handleVerifyCode()}
                        disabled={!isOtpReady || loading}
                        activeOpacity={0.88}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <>
                            <Text className="font-inter-bold text-[16px] text-white tracking-[0.3px]" style={!isOtpReady && {"color":"#9CA3AF"}}>Verify & Continue</Text>
                            <Text className="text-[16px] text-white leading-[18px]" style={!isOtpReady && {"color":"#9CA3AF"}}>▸</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* RESEND / CHANGE NUMBER SECONDARY ACTIONS */}
                      <View className="flex-row items-center justify-center mt-[18px] gap-[12px]">
                        <TouchableOpacity
                          onPress={() => void handleSendCode()}
                          disabled={loading}
                          className="py-[8px] px-[8px] min-h-[44px] justify-center"
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text className="font-inter-semibold text-[14px] text-brand">Resend Code</Text>
                        </TouchableOpacity>
                        <Text className="text-[14px]" style={{ color: theme.colors.borderSubtle }}>•</Text>
                        <TouchableOpacity
                          onPress={handleBack}
                          className="py-[8px] px-[8px] min-h-[44px] justify-center"
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text className="font-inter-medium text-[14px]" style={{ color: theme.colors.textSecondary }}>Change Number</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>

                {/* TERMS */}
                {!codeSent && (
                  <Text className="font-inter-medium text-[12px] text-center" style={{ color: theme.colors.textSecondary, marginTop: 24 }}>
                    By signing in, you agree to our{"\n"}
                    <Text className="font-inter-bold underline" style={{ color: theme.colors.accent }}>Terms and Conditions</Text>
                    {" and "}
                    <Text className="font-inter-bold underline" style={{ color: theme.colors.accent }}>Privacy Policy</Text>
                  </Text>
                )}
              </View>

              {/* FOOTER */}
              <View className="flex-row justify-between items-center mt-[40px] border-t-[1px] pt-[20px]" style={{ borderTopColor: theme.colors.borderSubtle }}>
                <Text className="text-[11px] font-inter-regular" style={{ color: theme.colors.textSecondary }}>
                  Secured by <Text className="font-inter-bold" style={{ color: theme.colors.textPrimary }}>Firebase</Text>
                </Text>
                <View className="flex-row gap-[12px]">
                  <Text className="text-[11px] font-inter-medium" style={{ color: theme.colors.textSecondary }}>Help</Text>
                  <Text className="text-[11px] font-inter-medium" style={{ color: theme.colors.textSecondary }}>Privacy</Text>
                  <Text className="text-[11px] font-inter-medium" style={{ color: theme.colors.textSecondary }}>Terms</Text>
                </View>
              </View>

              {/* COUNTRY SELECTOR MODAL */}
              <Modal
                visible={countryModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCountryModalVisible(false)}
              >
                <View className="flex-1 justify-end">
                  <Pressable className="absolute top-[0px] left-[0px] right-[0px] bottom-[0px] bg-[rgba(0,0,0,0.4)]" onPress={() => setCountryModalVisible(false)} />
                  <View className="rounded-tl-[16px] rounded-tr-[16px] pt-[16px] px-[20px] pb-[40px] max-h-[40%]" style={{ backgroundColor: theme.colors.surface }}>
                    <View className="pb-[12px] border-b-[1px] mb-[8px]" style={{ borderBottomColor: theme.colors.borderSubtle }}>
                      <Text className="font-inter-bold text-[16px] text-center" style={{ color: theme.colors.textPrimary }}>Select Country Code</Text>
                    </View>
                    <FlatList
                      data={countries}
                      keyExtractor={(item) => item.code}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          className="flex-row items-center py-[14px] border-b-[0.5px]" style={{ borderBottomColor: theme.colors.borderSubtle }}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedCountry(item);
                            setCountryModalVisible(false);
                          }}
                        >
                          <Text className="text-[20px] mr-[12px]">{item.flag}</Text>
                          <Text className="flex-1 font-inter-medium text-[15px]" style={{ color: theme.colors.textPrimary }}>{item.name}</Text>
                          <Text className="font-inter-bold text-[15px]" style={{ color: theme.colors.textSecondary }}>{item.code}</Text>
                        </TouchableOpacity>
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
