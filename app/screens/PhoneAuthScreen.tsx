import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../../packages/core/auth/AuthContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'PhoneAuth'>;

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp,         setOtp]         = useState('');
  const [showErrors,  setShowErrors]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [authError,   setAuthError]   = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    setAuthError(null);
    const phoneValid = /^\d{10}$/.test(phoneNumber);
    const otpValid   = /^\d{4}$/.test(otp);
    if (!phoneValid || !otpValid) { setShowErrors(true); return; }
    if (otp !== '0000') {
      setAuthError('Invalid OTP. Use 0000 to sign in.');
      return;
    }

    setLoading(true);
    try {
      // ── Single Supabase query — no AsyncStorage, no fallback ──────────────
      const { data, error } = await supabase
        .from('mock_users')
        .select('role, full_name')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (error) {
        setAuthError('Cannot reach server. Check your connection and try again.');
        return;
      }

      if (!data) {
        // Phone not found in DB → new user registration flow
        login(
          { id: phoneNumber, email: `${phoneNumber}@surestep.app`, role: 'NEW_USER' },
          'mock-token',
        );
        navigation.navigate('RoleEntry');
        return;
      }

      // Existing user — log in with their DB role + name (no extra fetch needed)
      const role = data.role === 'caregiver' ? 'CAREGIVER' : 'PATIENT';
      login(
        { id: phoneNumber, email: `${phoneNumber}@surestep.app`, role, fullName: data.full_name ?? '' },
        'mock-token',
      );

    } catch (e: unknown) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const phoneInvalid = showErrors && !/^\d{10}$/.test(phoneNumber);
  const otpInvalid   = showErrors && !/^\d{4}$/.test(otp);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>👣</Text>
        </View>
        <Text style={styles.brand}>SURE STEP</Text>

        <View style={styles.formSection}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Enter your phone number and use OTP 0000</Text>

          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <TextInput
            style={[styles.input, phoneInvalid && styles.inputError]}
            placeholder="10-digit number"
            placeholderTextColor={C.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phoneNumber}
            onChangeText={(t) => { setPhoneNumber(t); setAuthError(null); }}
          />
          {phoneInvalid && <Text style={styles.errorText}>Phone number must be 10 digits.</Text>}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>OTP</Text>
          <TextInput
            style={[styles.input, otpInvalid && styles.inputError]}
            placeholder="0000"
            placeholderTextColor={C.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={(t) => { setOtp(t); setAuthError(null); }}
          />
          {otpInvalid && <Text style={styles.errorText}>OTP must be exactly 4 digits.</Text>}

          {authError ? (
            <View style={styles.authErrorBox}>
              <Text style={styles.authErrorText}>⚠ {authError}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              (pressed || loading) && styles.loginButtonPressed,
            ]}
            onPress={() => void handleLogin()}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={C.primaryText} />
              : <Text style={styles.loginText}>Continue</Text>
            }
          </Pressable>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },

  logoBox: {
    alignSelf: 'center', width: 80, height: 80, borderRadius: 22,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.primary, shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, elevation: 4,
  },
  logoIcon: { fontSize: 36 },
  brand: {
    alignSelf: 'center', fontFamily: F.extraBold, fontSize: 16,
    letterSpacing: 3, color: C.textPrimary, marginBottom: 36,
  },

  formSection: { flex: 1 },
  title:       { fontFamily: F.bold, fontSize: 30, color: C.textPrimary, marginBottom: 4 },
  subtitle:    { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, marginBottom: 28 },

  inputLabel: {
    fontFamily: F.semiBold, fontSize: 11, color: C.textSecondary,
    letterSpacing: 1.4, marginBottom: 8,
  },
  input: {
    height: 52, borderRadius: 14, backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16,
    fontFamily: F.medium, fontSize: 16, color: C.textPrimary, marginBottom: 4,
  },
  inputError: { borderColor: C.error },
  errorText:  { fontFamily: F.regular, color: C.error, fontSize: 12, marginBottom: 8, marginLeft: 4 },

  authErrorBox: {
    marginTop: 12, borderRadius: 10, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 14, paddingVertical: 10,
  },
  authErrorText: { fontFamily: F.semiBold, fontSize: 13, color: '#DC2626', lineHeight: 18 },

  loginButton: {
    marginTop: 28, height: 52, borderRadius: 14, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12, elevation: 6,
  },
  loginButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  loginText:          { fontFamily: F.bold, fontSize: 17, color: C.primaryText },

  hint: {
    marginTop: 20, fontFamily: F.regular, fontSize: 12,
    color: C.textMuted, textAlign: 'center', lineHeight: 18,
  },
});
