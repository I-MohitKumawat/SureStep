import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import apiClient from '../../services/apiClient';

export const CaregiverSettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({
    alert_categories: ['GEOFENCE', 'SOS', 'OFFLINE', 'ROUTINE', 'ASSESSMENT'],
    quiet_hours_start: '',
    quiet_hours_end: '',
    escalation_pref: 'IMMEDIATE',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiClient.get('/notifications/settings');
        if (res.data?.settings) {
          // Format times for display (e.g. "22:00:00" -> "22:00")
          const cleanTime = (t: string | null) => t ? t.slice(0, 5) : '';
          setSettings({
            ...res.data.settings,
            quiet_hours_start: cleanTime(res.data.settings.quiet_hours_start),
            quiet_hours_end: cleanTime(res.data.settings.quiet_hours_end),
          });
        }
      } catch (err) {
        console.warn('Failed to load caregiver settings:', err);
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
      // Validate quiet hours format if modified
      if (key === 'quiet_hours_start' || key === 'quiet_hours_end') {
        if (value !== '' && !/^\d{2}:\d{2}$/.test(value)) {
          // don't submit invalid formats to DB
          return;
        }
      }
      
      const payloadVal = (key === 'quiet_hours_start' || key === 'quiet_hours_end') && value === '' ? null : value;
      await apiClient.put('/notifications/settings', { [key]: payloadVal });
    } catch (err) {
      console.error('Failed to save caregiver setting:', err);
    }
  };

  const toggleCategory = (cat: string) => {
    const current = settings.alert_categories || [];
    const next = current.includes(cat)
      ? current.filter((c: string) => c !== cat)
      : [...current, cat];
    updateSetting('alert_categories', next);
  };

  const escalationOptions = [
    { id: 'IMMEDIATE', label: 'Immediate' },
    { id: '10_MIN_LATE', label: '10m Delay' },
    { id: '20_MIN_LATE', label: '20m Delay' },
    { id: '30_MIN_LATE', label: '30m Delay' }
  ];

  if (loading) {
    return (
      <ScreenContainer>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={s.heading}>Caregiver Settings</Text>
        <Text style={s.body}>
          Configure alerts, quiet hours, and escalation rules for your assigned care recipients.
        </Text>

        {/* 🔔 Alert categories */}
        <View style={s.section}>
          <Text style={s.label}>Subscribed Alerts</Text>
          <View style={s.settingsGroup}>
            {[
              { id: 'SOS', title: 'SOS Triggers', desc: 'Critical fall or SOS panic press' },
              { id: 'GEOFENCE', title: 'Geofence Breaches', desc: 'Wandering outside safety zones' },
              { id: 'OFFLINE', title: 'No Signal Alert', desc: 'Device offline for > 15 minutes' },
              { id: 'ROUTINE', title: 'Missed Routines', desc: 'Unacknowledged daily tasks' },
              { id: 'ASSESSMENT', title: 'Assessments Done', desc: 'Cognitive game completion alerts' },
            ].map((item, idx) => {
              const enabled = settings.alert_categories?.includes(item.id);
              return (
                <View key={item.id}>
                  {idx > 0 && <View style={s.divider} />}
                  <View style={s.switchRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.settingTitle}>{item.title}</Text>
                      <Text style={s.settingDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={enabled}
                      onValueChange={() => toggleCategory(item.id)}
                      trackColor={{ false: '#D1D5DB', true: C.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ⏰ Quiet hours */}
        <View style={s.section}>
          <Text style={s.label}>Quiet Hours (HH:MM)</Text>
          <View style={s.settingsGroup}>
            <Text style={s.settingDesc}>Suppress non-SOS push notifications during this timeframe.</Text>
            <View style={s.timeInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Starts At</Text>
                <TextInput
                  placeholder="e.g. 22:00"
                  value={settings.quiet_hours_start}
                  onChangeText={(val) => updateSetting('quiet_hours_start', val)}
                  style={s.textInput}
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Ends At</Text>
                <TextInput
                  placeholder="e.g. 07:00"
                  value={settings.quiet_hours_end}
                  onChangeText={(val) => updateSetting('quiet_hours_end', val)}
                  style={s.textInput}
                  maxLength={5}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ⚡ Escalation delay */}
        <View style={s.section}>
          <Text style={s.label}>Escalation Speed</Text>
          <View style={s.settingsGroup}>
            <Text style={[s.settingDesc, { marginBottom: 8 }]}>
              Wait time before routing missed tasks to close contacts
            </Text>
            <View style={s.row}>
              {escalationOptions.map((opt) => {
                const selected = settings.escalation_pref === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => updateSetting('escalation_pref', opt.id)}
                    style={[s.pill, selected && s.pillActive]}
                  >
                    <Text style={[s.pillText, selected && s.pillTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, marginBottom: 6 },
  body: { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 20, marginBottom: 10 },
  section: { marginTop: 24 },
  label: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary, marginBottom: 10 },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    padding: 16,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingTitle: { fontFamily: F.semiBold, fontSize: 15, color: C.textPrimary },
  settingDesc: { fontFamily: F.regular, fontSize: 12, color: C.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  timeInputRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  inputLabel: { fontFamily: F.medium, fontSize: 12, color: C.textPrimary, marginBottom: 4 },
  textInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  pillActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  pillText: { fontFamily: F.medium, fontSize: 12, color: C.textPrimary },
  pillTextActive: { fontFamily: F.bold, color: C.primary },
});
