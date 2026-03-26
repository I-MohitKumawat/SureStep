import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTheme } from '../../../packages/ui/theme/ThemeProvider';
import { useAuth } from '../../../packages/core/auth/AuthContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoleEntry'>;

export const RoleEntryScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { login } = useAuth();

  const handleSelectPatient = () => {
    login({ id: 'self-monitoring', email: 'patient@surestep.local', role: 'PATIENT' }, 'dev-token');
  };

  const handleSelectCaregiver = () => {
    login({ id: 'caregiver', email: 'caregiver@surestep.local', role: 'CAREGIVER' }, 'dev-token');
  };

  return (
    <ScreenContainer>
      <View style={styles.centerContent}>
        <View style={styles.header}>
          <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>SureStep</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Continue as:</Text>
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={handleSelectPatient}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: pressed ? theme.colors.accent : theme.colors.accent,
                opacity: pressed ? 0.85 : 1
              }
            ]}
          >
            <Text style={styles.primaryButtonText}>Self monitoring</Text>
          </Pressable>

          <Pressable
            onPress={handleSelectCaregiver}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: pressed ? theme.colors.accent : theme.colors.accent,
                opacity: pressed ? 0.85 : 1
              }
            ]}
          >
            <Text style={styles.primaryButtonText}>Caregiver</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center'
  },
  buttons: {
    gap: 12,
    alignItems: 'center'
  },
  primaryButton: {
    width: 320,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {},
  secondaryButtonText: {}
});

