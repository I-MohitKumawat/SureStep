import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoleEntry'>;

export const RoleEntryScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = React.useState<'caregiver' | 'patient' | null>(null);

  const proceed = () => {
    if (!selectedRole) return;
    navigation.navigate('ProfileSetup', { role: selectedRole });
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <View pointerEvents="none" style={styles.bottomShapeWrap}>
        <View style={styles.bottomShape} />
      </View>

      <View style={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <View style={styles.logoBox}>
          <Text style={styles.logoText}>logo</Text>
        </View>
        <Text style={styles.brand}>SURE STEP</Text>

        <Text style={styles.title}>Choose your role</Text>
        <Text style={styles.subtitle}>to continue.</Text>

        <View style={styles.roleCards}>
          <Pressable
            style={({ pressed }) => [
              styles.roleInput,
              selectedRole === 'caregiver' ? styles.roleInputSelected : null,
              pressed ? styles.roleCardPressed : null
            ]}
            onPress={() => setSelectedRole('caregiver')}
          >
            <Text style={styles.roleInputText}>caregiver</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.roleInput,
              selectedRole === 'patient' ? styles.roleInputSelected : null,
              pressed ? styles.roleCardPressed : null
            ]}
            onPress={() => setSelectedRole('patient')}
          >
            <Text style={styles.roleInputText}>patient</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.proceedButton,
              !selectedRole ? styles.proceedButtonDisabled : null,
              pressed && selectedRole ? { opacity: 0.9 } : null
            ]}
            onPress={proceed}
            disabled={!selectedRole}
          >
            <Text style={styles.proceedText}>Proceed</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F6'
  },
  bottomShapeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
    overflow: 'hidden'
  },
  bottomShape: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -80,
    height: 260,
    transform: [{ rotate: '-8deg' }],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#BFA2DB'
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 2
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B3B3B',
    fontWeight: '600'
  },
  logoBox: {
    marginTop: 16,
    width: 84,
    height: 84,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BFA2DB'
  },
  logoText: { color: 'rgba(17, 24, 39, 0.75)', fontWeight: '700' },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 52
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A31',
    textAlign: 'center',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24
  },
  roleCards: {
    width: '100%',
    maxWidth: 400,
    gap: 16
  },
  roleInput: {
    backgroundColor: '#D0CED0',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  roleInputSelected: { backgroundColor: '#BFA2DB' },
  roleCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  roleInputText: {
    fontSize: 30,
    color: '#3B3B3B'
  },
  proceedButton: {
    marginTop: 16,
    backgroundColor: '#BFA2DB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  proceedButtonDisabled: { opacity: 0.55 },
  proceedText: { color: '#1A1A1A', fontSize: 24, fontWeight: '700' }
});
