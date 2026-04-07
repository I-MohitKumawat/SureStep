import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'PhoneAuth'>;

export const PhoneAuthScreen: React.FC<Props> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const handleLogin = () => {
    const phoneValid = /^\d{10}$/.test(phoneNumber);
    const otpValid = /^\d{4}$/.test(otp);
    if (!phoneValid || !otpValid) {
      setShowErrors(true);
      return;
    }
    navigation.navigate('RoleEntry');
  };

  const phoneInvalid = showErrors && !/^\d{10}$/.test(phoneNumber);
  const otpInvalid = showErrors && !/^\d{4}$/.test(otp);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>logo</Text>
        </View>
        <Text style={styles.brand}>SURE STEP</Text>

        <View style={styles.formSection}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Sign in to continue.</Text>

          <Text style={styles.inputLabel}>PHONE NUMBER</Text>
          <TextInput
            style={[styles.input, phoneInvalid ? styles.inputError : null]}
            placeholder=""
            placeholderTextColor="#656565"
            keyboardType="phone-pad"
            maxLength={10}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <Text style={[styles.inputLabel, styles.otpLabel]}>OTP</Text>
          <TextInput
            style={[styles.input, otpInvalid ? styles.inputError : null]}
            placeholder=""
            placeholderTextColor="#656565"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />

          {phoneInvalid ? <Text style={styles.errorText}>Phone number must be 10 digits.</Text> : null}
          {otpInvalid ? <Text style={styles.errorText}>OTP must be exactly 4 digits.</Text> : null}

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F6'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 42,
    paddingBottom: 28
  },
  logoBox: {
    alignSelf: 'center',
    width: 104,
    height: 104,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BFA2DB'
  },
  logoText: { color: 'rgba(17, 24, 39, 0.75)', fontWeight: '700' },
  brand: {
    alignSelf: 'center',
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#111827'
  },
  formSection: {
    marginTop: 44
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#232A2D',
    textAlign: 'center',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    marginBottom: 22
  },
  inputLabel: {
    fontSize: 12,
    color: '#8B8B8B',
    letterSpacing: 1.8,
    marginBottom: 6
  },
  otpLabel: { marginTop: 10 },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#D0CED0',
    borderWidth: 1,
    borderColor: '#D0CED0',
    paddingHorizontal: 22,
    fontSize: 28,
    color: '#3B3B3B',
    marginBottom: 6
  },
  inputError: {
    borderColor: '#DC2626'
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 2
  },
  loginButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#BFA2DB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loginText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F25'
  }
});
