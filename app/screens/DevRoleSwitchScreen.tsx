import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UserRole } from '../../packages/core/auth/AuthContext';
import { useAuth } from '../../packages/core/auth/AuthContext';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTheme } from '../../packages/ui/theme/ThemeProvider';

const roles: Array<{ id: UserRole; label: string }> = [
  { id: 'PATIENT', label: 'Patient' },
  { id: 'CAREGIVER', label: 'Caregiver' },
  { id: 'DOCTOR', label: 'Doctor' }
];

export const DevRoleSwitchScreen: React.FC = () => {
  const theme = useTheme();
  const { auth, login, logout } = useAuth();

  const currentRole = auth.status === 'authenticated' ? auth.user.role : null;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Dev role switch</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Development-only screen to simulate different role-based flows.
      </Text>

      <View style={[styles.card, { borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Current</Text>
        <Text style={[styles.value, { color: theme.colors.textSecondary }]}>
          {auth.status === 'authenticated' ? `${auth.user.email} (${auth.user.role})` : 'Unauthenticated'}
        </Text>
      </View>

      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Switch to</Text>
      <View style={styles.row}>
        {roles.map((r) => {
          const selected = currentRole === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() =>
                login(
                  { id: 'dev-user', email: 'dev@surestep.local', role: r.id },
                  'dev-access-token'
                )
              }
              style={[
                styles.pill,
                {
                  borderColor: theme.colors.borderSubtle,
                  backgroundColor: selected ? theme.colors.surface : 'transparent'
                }
              ]}
            >
              <Text style={{ color: theme.colors.textPrimary }}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={logout}
        style={[styles.logout, { borderColor: theme.colors.borderSubtle }]}
      >
        <Text style={{ color: theme.colors.textPrimary }}>Logout</Text>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  value: {
    fontSize: 14
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999
  },
  logout: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10
  }
});

