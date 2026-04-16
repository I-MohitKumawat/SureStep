import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { writeSharedProfile, PATIENT_PROFILE_KEY, CAREGIVER_PROFILE_KEY } from '../utils/sharedProfile';

type Props = NativeStackScreenProps<HomeStackParamList, 'PhoneAuth'>;

// Seed the userProfileContext-compatible profile as well as the shared profile
const PROFILE_KEY_PREFIX = 'surestep_user_profile_';

async function seedHardcodedPatient() {
  const patientProfile = { fullName: 'Srinivas', role: 'patient', dob: '1960-01-01', gender: 'Male', city: 'Bengaluru', language: 'Kannada', batteryLevel: 82 };
  const caregiverProfile = { fullName: 'Caregiver', role: 'caregiver' };
  // Write to userProfileContext storage
  await AsyncStorage.setItem(`${PROFILE_KEY_PREFIX}patient`, JSON.stringify(patientProfile));
  await AsyncStorage.setItem(`${PROFILE_KEY_PREFIX}caregiver`, JSON.stringify(caregiverProfile));
  // Write to shared profile so CaregiverDashboard can read patient name
  await writeSharedProfile({ fullName: 'Srinivas', role: 'patient', batteryLevel: 82 });
  await writeSharedProfile({ fullName: 'Caregiver', role: 'caregiver' });
}

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const handleLogin = async () => {
    const phoneValid = /^\d{10}$/.test(phoneNumber);
    const otpValid   = /^\d{4}$/.test(otp);
    if (!phoneValid || !otpValid) { setShowErrors(true); return; }

    if (phoneNumber === '1111111111' && otp === '1111') {
      await seedHardcodedPatient();
      navigation.navigate('CaregiverPatients');
      return;
    }
    if (phoneNumber === '2222222222' && otp === '2222') {
      await seedHardcodedPatient();
      navigation.navigate('PatientDashboard');
      return;
    }
    navigation.navigate('RoleEntry');
  };

  const phoneInvalid = showErrors && !/^\d{10}$/.test(phoneNumber);
  const otpInvalid   = showErrors && !/^\d{4}$/.test(otp);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>👣</Text>
        </View>
        <Text style={styles.brand}>SURE STEP</Text>

        <View style={styles.formSection}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <TextInput
            style={[styles.input, phoneInvalid && styles.inputError]}
            placeholder="10-digit number"
            placeholderTextColor={C.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          {phoneInvalid && <Text style={styles.errorText}>Phone number must be 10 digits.</Text>}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>OTP</Text>
          <TextInput
            style={[styles.input, otpInvalid && styles.inputError]}
            placeholder="4-digit code"
            placeholderTextColor={C.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />
          {otpInvalid && <Text style={styles.errorText}>OTP must be exactly 4 digits.</Text>}

          <Pressable
            style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
            onPress={handleLogin}
          >
            <Text style={styles.loginText}>Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },

  logoBox: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  logoIcon: { fontSize: 36 },
  brand: {
    alignSelf: 'center',
    fontFamily: F.extraBold,
    fontSize: 16,
    letterSpacing: 3,
    color: C.textPrimary,
    marginBottom: 36,
  },

  formSection: { flex: 1 },
  title: {
    fontFamily: F.bold,
    fontSize: 30,
    color: C.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 15,
    color: C.textSecondary,
    marginBottom: 28,
  },

  inputLabel: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: C.textSecondary,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    fontFamily: F.medium,
    fontSize: 16,
    color: C.textPrimary,
    marginBottom: 4,
  },
  inputError: { borderColor: C.error },
  errorText: {
    fontFamily: F.regular,
    color: C.error,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },

  loginButton: {
    marginTop: 28,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  loginText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.primaryText,
  },
});
