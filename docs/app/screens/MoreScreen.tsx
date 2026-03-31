import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTheme, useThemePreference } from '../../../packages/ui/theme/ThemeProvider';

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
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Theme</Text>
        <View style={[styles.row, { borderColor: theme.colors.borderSubtle }]}>
          {options.map((opt) => {
            const selected = modePreference === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setModePreference(opt.id)}
                style={[
                  styles.pill,
                  {
                    borderColor: theme.colors.borderSubtle,
                    backgroundColor: selected ? theme.colors.surface : 'transparent'
                  }
                ]}
              >
                <Text style={{ color: theme.colors.textPrimary }}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Profile</Text>
        <Pressable
          onPress={() => navigation.navigate('ProfileView')}
          style={({ pressed }) => [
            styles.profileButton,
            {
              borderColor: theme.colors.borderSubtle,
              backgroundColor: pressed ? theme.colors.surface : theme.colors.surface
            }
          ]}
        >
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>View & edit profile</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827'
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563'
  },
  section: {
    marginTop: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999
  },
  profileButton: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12
  }
});

