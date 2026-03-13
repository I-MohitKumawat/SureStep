import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../../packages/core/auth/AuthContext';
import { useTheme } from '../../packages/ui/theme/ThemeProvider';

export const PatientRoleScreen: React.FC = () => {
  const { logout } = useAuth();
  const theme = useTheme();

  return (
    <ScreenContainer>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Patient mode</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        This is the patient-facing home shell. Patient-specific dashboards, routines, games, and
        calming experiences will be wired here in dedicated tasks.
      </Text>

      <View style={styles.footer}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.backButton,
            {
              borderColor: theme.colors.borderSubtle,
              backgroundColor: pressed ? theme.colors.surface : 'transparent'
            }
          ]}
        >
          <Text style={{ color: theme.colors.textPrimary }}>Back to main app</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827'
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563'
  },
  footer: {
    marginTop: 24
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10
  }
});

