import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../../packages/core/auth/AuthContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'PhoneAuth'>;

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (isSubmitting) return;
    const phoneValid = /^\d{10}$/.test(phoneNumber);
    const otpValid   = /^\d{4}$/.test(otp);
    if (!phoneValid || !otpValid) { setShowErrors(true); return; }

    setIsSubmitting(true);
    try {
      let userRole: string | null = null;

      if (otp === '0000') {
        // 0000 = universal dev OTP: look up existing user by phone only
        const { data } = await supabase
          .from('mock_users').select('role').eq('phone_number', phoneNumber).maybeSingle();
        userRole = data?.role ?? null;
      } else {
        // Normal OTP: prefer exact match
        const { data, error } = await supabase
          .from('mock_users').select('role')
          .eq('phone_number', phoneNumber).eq('otp', otp).maybeSingle();
        if (!error && data) {
          userRole = data.role;
        } else {
          // Fallback: allow known phone even when OTP mismatch in dev data
          const { data: byPhone } = await supabase
            .from('mock_users').select('role').eq('phone_number', phoneNumber).maybeSingle();
          if (!byPhone) { setShowErrors(true); return; }
          userRole = byPhone.role;
        }
      }

      // Store phone for all downstream screens
      await AsyncStorage.setItem('current_phone', phoneNumber);

      // Do NOT wipe the confirmed-caregiver key here — only clear it for genuinely
      // new registrations (no role yet), so returning patients keep their link.
      const normalizedRole = userRole?.toString().trim().toLowerCase() ?? null;

      if (!normalizedRole) {
        // Brand-new phone — clear any stale data and send to role selection
        await AsyncStorage.removeItem(`surestep_confirmed_caregiver_${phoneNumber}`);
        // Use PATIENT role so RoleNavigator opens profile setup for new user
        login({ id: phoneNumber, email: `${phoneNumber}@surestep.app`, role: 'PATIENT' }, 'mock-token');
        return;
      }

      // Authenticate the user. RoleNavigator decides final screen.
      const authRole = normalizedRole === 'caregiver' ? 'CAREGIVER' : 'PATIENT';
      login({ id: phoneNumber, email: `${phoneNumber}@surestep.app`, role: authRole }, 'mock-token');
    } catch (err) {
      console.warn('Phone login failed:', err);
      setShowErrors(true);
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
          >
            <Text style={styles.loginText}>{isSubmitting ? 'Logging in...' : 'Log in'}</Text>
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
