import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTheme, useThemePreference } from '../../packages/ui/theme/ThemeProvider';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';

type Props = NativeStackScreenProps<HomeStackParamList, 'Settings'>;

export const MoreScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { modePreference, setModePreference } = useThemePreference();

  const options: Array<{ id: 'system' | 'light' | 'dark'; label: string }> = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' }
  ];

  return (
    <ScreenContainer>
      <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>More</Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        Placeholder screen for future settings and utilities.
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          {options.map((opt) => {
            const selected = modePreference === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setModePreference(opt.id)}
                style={[styles.pill, selected && styles.pillActive]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Profile</Text>
        <Pressable
          onPress={() => navigation.navigate('ProfileView')}
          style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.profileButtonText}>View & edit profile</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontFamily: F.extraBold,
    fontSize: 22,
    marginBottom: 6,
    color: C.textPrimary,
  },
  body: {
    fontFamily: F.regular,
    fontSize: 14,
    lineHeight: 20,
    color: C.textSecondary,
  },
  section: { marginTop: 20 },
  label: {
    fontFamily: F.bold,
    fontSize: 13,
    marginBottom: 10,
    color: C.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.surface,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  pillActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  pillText: { fontFamily: F.medium, fontSize: 14, color: C.textPrimary },
  pillTextActive: { fontFamily: F.bold, color: C.primary },
  profileButton: {
    minHeight: 50,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 14,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  profileButtonText: { fontFamily: F.semiBold, color: C.textPrimary },
});

