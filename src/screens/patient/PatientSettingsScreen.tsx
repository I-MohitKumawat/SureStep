import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Switch, ActivityIndicator, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PatientStackParams } from '../../types/navigation.types';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme, useThemePreference } from '../../theme/ThemeContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import apiClient from '../../services/apiClient';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientSettingsScreen'>;

export const PatientSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { modePreference, setModePreference } = useThemePreference();
  
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({
    reminder_sounds: true,
    reminder_vibration: true,
    reminder_volume: 1.0,
    reminder_frequency: 5,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiClient.get('/notifications/settings');
        if (res.data?.settings) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        console.warn('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    try {
      await apiClient.put('/notifications/settings', { [key]: value });
    } catch (err) {
      console.error('Failed to update setting:', err);
      Alert.alert('Error', 'Failed to save preference to server.');
      // rollback
      setSettings(settings);
    }
  };

  const themeOptions: Array<{ id: 'system' | 'light' | 'dark'; label: string }> = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' }
  ];

  const freqOptions = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' }
  ];

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>Settings</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Configure your personal application behavior and alarm alerts.
        </Text>

        {/* 🔔 Reminder Alarms preferences */}
        <View style={styles.section}>
          <Text style={styles.label}>Reminder Alarms</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Play Sounds</Text>
                <Text style={styles.settingDesc}>Play audio alert when a routine task is due</Text>
              </View>
              <Switch
                value={settings.reminder_sounds}
                onValueChange={(val) => updateSetting('reminder_sounds', val)}
                trackColor={{ false: '#D1D5DB', true: C.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Vibration</Text>
                <Text style={styles.settingDesc}>Vibrate device when a routine task is due</Text>
              </View>
              <Switch
                value={settings.reminder_vibration}
                onValueChange={(val) => updateSetting('reminder_vibration', val)}
                trackColor={{ false: '#D1D5DB', true: C.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.snoozeSection}>
              <Text style={styles.settingTitle}>Default Snooze Duration</Text>
              <Text style={[styles.settingDesc, { marginBottom: 8 }]}>Repeat interval for active alarms</Text>
              <View style={styles.row}>
                {freqOptions.map((opt) => {
                  const selected = settings.reminder_frequency === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => updateSetting('reminder_frequency', opt.value)}
                      style={[styles.pill, selected && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* 🎨 Theme preference */}
        <View style={styles.section}>
          <Text style={styles.label}>Theme</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.row}>
              {themeOptions.map((opt) => {
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
        </View>

        {/* 👤 Patient Profile */}
        <View style={styles.section}>
          <Text style={styles.label}>My Patient Profile</Text>
          <Pressable
            onPress={() => navigation.navigate('PatientProfileScreen')}
            style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.profileButtonText}>View My Profile Information</Text>
          </Pressable>
        </View>

        {/* 👤 Profile preference */}
        <View style={styles.section}>
          <Text style={styles.label}>Care Circle Connection</Text>
          <Pressable
            onPress={() => navigation.navigate('PatientHomeScreen', { initialTab: 'Search' })}
            style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.profileButtonText}>Manage connected caregiver</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    marginBottom: 10,
  },
  section: { marginTop: 24 },
  label: {
    fontFamily: F.bold,
    fontSize: 14,
    marginBottom: 10,
    color: C.textPrimary,
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    padding: 16,
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: C.textPrimary,
  },
  settingDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 4,
  },
  snoozeSection: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  pillActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  pillText: { fontFamily: F.medium, fontSize: 13, color: C.textPrimary },
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
  profileButtonText: { fontFamily: F.semiBold, color: C.textPrimary, textAlign: 'center' },
});
