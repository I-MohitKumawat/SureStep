import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoleEntry'>;

export const RoleEntryScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = React.useState<'caregiver' | 'patient' | null>(null);

  const proceed = () => {
    if (!selectedRole) return;
    navigation.navigate('ProfileSetup', { role: selectedRole });
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      {/* Teal angled accent at bottom */}
      <View pointerEvents="none" style={styles.bottomShapeWrap}>
        <View style={styles.bottomShape} />
      </View>

      <View style={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>👣</Text>
        </View>
        <Text style={styles.brand}>SURE STEP</Text>

        <Text style={styles.title}>Who are you?</Text>
        <Text style={styles.subtitle}>Select your role to continue.</Text>

        <View style={styles.roleCards}>
          <Pressable
            style={({ pressed }) => [
              styles.roleCard,
              selectedRole === 'caregiver' && styles.roleCardSelected,
              pressed && styles.roleCardPressed,
            ]}
            onPress={() => setSelectedRole('caregiver')}
          >
            <Text style={styles.roleEmoji}>🧑‍⚕️</Text>
            <View style={styles.roleTextWrap}>
              <Text style={[styles.roleTitle, selectedRole === 'caregiver' && styles.roleTitleSelected]}>
                Caregiver
              </Text>
              <Text style={styles.roleDesc}>Monitor and manage patient care</Text>
            </View>
            <View style={[styles.radioOuter, selectedRole === 'caregiver' && styles.radioOuterSelected]}>
              {selectedRole === 'caregiver' && <View style={styles.radioInner} />}
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.roleCard,
              selectedRole === 'patient' && styles.roleCardSelected,
              pressed && styles.roleCardPressed,
            ]}
            onPress={() => setSelectedRole('patient')}
          >
            <Text style={styles.roleEmoji}>🧓</Text>
            <View style={styles.roleTextWrap}>
              <Text style={[styles.roleTitle, selectedRole === 'patient' && styles.roleTitleSelected]}>
                Patient
              </Text>
              <Text style={styles.roleDesc}>Track your daily routine</Text>
            </View>
            <View style={[styles.radioOuter, selectedRole === 'patient' && styles.radioOuterSelected]}>
              {selectedRole === 'patient' && <View style={styles.radioInner} />}
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.proceedButton,
              !selectedRole && styles.proceedButtonDisabled,
              pressed && selectedRole ? styles.proceedButtonPressed : null,
            ]}
            onPress={proceed}
            disabled={!selectedRole}
          >
            <Text style={styles.proceedText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  bottomShapeWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 220,
    overflow: 'hidden',
  },
  bottomShape: {
    position: 'absolute',
    left: -40, right: -40, bottom: -80,
    height: 220,
    transform: [{ rotate: '-7deg' }],
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: C.primaryLight,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  backButtonText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.textSecondary,
  },

  logoBox: {
    marginTop: 12,
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoIcon: { fontSize: 30 },
  brand: {
    fontFamily: F.extraBold,
    fontSize: 15,
    color: C.textPrimary,
    letterSpacing: 2.8,
    marginBottom: 32,
  },

  title: {
    fontFamily: F.bold,
    fontSize: 26,
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },

  roleCards: { width: '100%', maxWidth: 400, gap: 14 },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 14,
  },
  roleCardSelected: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  roleCardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },

  roleEmoji: { fontSize: 28 },
  roleTextWrap: { flex: 1 },
  roleTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.textPrimary,
  },
  roleTitleSelected: { color: C.primary },
  roleDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: C.primary },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: C.primary,
  },

  proceedButton: {
    marginTop: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  proceedButtonDisabled: { opacity: 0.45, shadowOpacity: 0 },
  proceedButtonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  proceedText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.primaryText,
  },
});
