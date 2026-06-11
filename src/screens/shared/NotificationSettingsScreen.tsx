/**
 * SureStep — src/screens/shared/NotificationSettingsScreen.tsx
 *
 * Notification preferences for all three roles.
 * Reads current settings from the backend and saves updates.
 *
 * Patient sections:  Reminder sounds, vibration, volume, snooze default
 * Caregiver sections: Alert categories, quiet hours, escalation preference
 * Family sections:   Digest frequency, critical alert preference
 * All roles:         Configurable escalation rule offsets (expandable)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { C, patientC, caregiverC, familyC } from '../../theme/colors';
import { F } from '../../theme/fonts';

const ALERT_CATEGORIES = ['GEOFENCE', 'SOS', 'OFFLINE', 'ROUTINE', 'ASSESSMENT'] as const;
type AlertCategory = typeof ALERT_CATEGORIES[number];

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  GEOFENCE:   'Geofence Alerts',
  SOS:        'SOS Alerts',
  OFFLINE:    'Patient Offline',
  ROUTINE:    'Routine Alerts',
  ASSESSMENT: 'Assessments',
};

const DIGEST_OPTIONS = ['NONE', 'DAILY', 'WEEKLY'] as const;
const CRITICAL_OPTIONS = ['NONE', 'SOS_ONLY', 'ALL'] as const;
const ESCALATION_OPTIONS = ['IMMEDIATE', 'DIGEST'] as const;

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const role = user?.role ?? 'PATIENT';

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [dirty,    setDirty]    = useState(false);

  // ─── Accent color by role ───────────────────────────────────────────────
  const accentColor =
    role === 'CAREGIVER' ? caregiverC.primary :
    role === 'FAMILY'    ? familyC.primary    :
    patientC.primary;

  // ─── Load ───────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchNotificationSettings();
      setSettings(s);
    } catch (err) {
      Alert.alert('Error', 'Could not load notification settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const patch = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  const toggleCategory = (cat: AlertCategory) => {
    if (!settings) return;
    const cats = settings.alert_categories as string[];
    const next = cats.includes(cat) ? cats.filter((c) => c !== cat) : [...cats, cat];
    patch('alert_categories', next);
  };

  // ─── Save ────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!settings || !dirty) return;
    setSaving(true);
    try {
      const updated = await updateNotificationSettings({
        reminder_sounds:    settings.reminder_sounds,
        reminder_vibration: settings.reminder_vibration,
        reminder_volume:    settings.reminder_volume,
        reminder_frequency: settings.reminder_frequency,
        alert_categories:   settings.alert_categories,
        quiet_hours_start:  settings.quiet_hours_start,
        quiet_hours_end:    settings.quiet_hours_end,
        escalation_pref:    settings.escalation_pref,
        digest_frequency:   settings.digest_frequency,
        critical_alert_pref: settings.critical_alert_pref,
      });
      setSettings(updated);
      setDirty(false);
      Alert.alert('Saved', 'Your notification preferences have been saved.');
    } catch {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const renderToggleRow = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
    sublabel?: string,
  ) => (
    <View style={styles.row}>
      <View style={styles.rowLabels}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel && <Text style={styles.rowSubLabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: accentColor + '80' }}
        thumbColor={value ? accentColor : '#FFFFFF'}
      />
    </View>
  );

  const renderChipRow = <T extends string>(
    options: readonly T[],
    labels: Record<T, string> | null,
    selected: T,
    onChange: (v: T) => void,
  ) => (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[styles.chip, selected === opt && { backgroundColor: accentColor, borderColor: accentColor }]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.chipText, selected === opt && { color: '#FFFFFF' }]}>
            {labels ? labels[opt] ?? opt : opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading || !settings) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <Pressable
          onPress={save}
          style={[styles.saveBtn, { backgroundColor: dirty ? accentColor : C.border }]}
          disabled={!dirty || saving}
        >
          <Text style={[styles.saveBtnText, { color: dirty ? '#FFFFFF' : C.textMuted }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient settings */}
        {(role === 'PATIENT') && renderSection('Reminders', (
          <>
            {renderToggleRow(
              'Reminder Sounds', settings.reminder_sounds,
              (v) => patch('reminder_sounds', v),
              'Play a sound when a reminder fires',
            )}
            <View style={styles.divider} />
            {renderToggleRow(
              'Vibration', settings.reminder_vibration,
              (v) => patch('reminder_vibration', v),
            )}
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLabels}>
                <Text style={styles.rowLabel}>Default Snooze</Text>
                <Text style={styles.rowSubLabel}>Minutes to snooze when not specified</Text>
              </View>
              <TextInput
                style={[styles.numberInput, { borderColor: accentColor }]}
                value={String(settings.reminder_frequency)}
                onChangeText={(v) => {
                  const n = parseInt(v, 10);
                  if (!isNaN(n) && n > 0) patch('reminder_frequency', n);
                }}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </>
        ))}

        {/* Caregiver settings */}
        {(role === 'CAREGIVER') && renderSection('Alert Categories', (
          <>
            <Text style={styles.rowSubLabel} numberOfLines={2}>
              Enable alert types you want to receive notifications for
            </Text>
            <View style={styles.categoryGrid}>
              {ALERT_CATEGORIES.map((cat) => {
                const active = (settings.alert_categories as string[]).includes(cat);
                return (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, active && { backgroundColor: accentColor, borderColor: accentColor }]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text style={[styles.catChipText, active && { color: '#FFFFFF' }]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ))}

        {(role === 'CAREGIVER') && renderSection('Quiet Hours', (
          <>
            <Text style={styles.rowSubLabel}>
              Non-critical notifications will be suppressed during quiet hours
            </Text>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={styles.rowLabel}>Start (HH:MM)</Text>
              <TextInput
                style={[styles.timeInput, { borderColor: accentColor }]}
                value={settings.quiet_hours_start ?? ''}
                onChangeText={(v) => patch('quiet_hours_start', v || null)}
                placeholder="22:00"
                maxLength={5}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>End (HH:MM)</Text>
              <TextInput
                style={[styles.timeInput, { borderColor: accentColor }]}
                value={settings.quiet_hours_end ?? ''}
                onChangeText={(v) => patch('quiet_hours_end', v || null)}
                placeholder="07:00"
                maxLength={5}
              />
            </View>
          </>
        ))}

        {(role === 'CAREGIVER') && renderSection('Escalation Preference', (
          <>
            <Text style={[styles.rowSubLabel, { marginBottom: 10 }]}>
              How quickly to alert you when a patient misses a task
            </Text>
            {renderChipRow(ESCALATION_OPTIONS, { IMMEDIATE: 'Immediate', DIGEST: 'Digest' }, settings.escalation_pref as any, (v) => patch('escalation_pref', v))}
          </>
        ))}

        {/* Family settings */}
        {(role === 'FAMILY') && renderSection('Digest Frequency', (
          <>
            <Text style={[styles.rowSubLabel, { marginBottom: 10 }]}>
              How often to receive summary updates
            </Text>
            {renderChipRow(DIGEST_OPTIONS, { NONE: 'None', DAILY: 'Daily', WEEKLY: 'Weekly' }, settings.digest_frequency as any, (v) => patch('digest_frequency', v))}
          </>
        ))}

        {(role === 'FAMILY') && renderSection('Critical Alerts', (
          <>
            <Text style={[styles.rowSubLabel, { marginBottom: 10 }]}>
              Which urgent alerts to receive immediately
            </Text>
            {renderChipRow(CRITICAL_OPTIONS, { NONE: 'None', SOS_ONLY: 'SOS Only', ALL: 'All' }, settings.critical_alert_pref as any, (v) => patch('critical_alert_pref', v))}
          </>
        ))}

        {/* Escalation rules info (all roles) */}
        {renderSection('Escalation Timeline', (
          <View style={styles.rulesContainer}>
            <Text style={styles.rowSubLabel}>
              When a patient misses a reminder, these actions are taken:
            </Text>
            {(settings.escalation_rules ?? []).map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <View style={[styles.ruleIndicator, { backgroundColor: accentColor }]} />
                <View>
                  <Text style={styles.rowLabel}>{rule.offset_minutes} min — {rule.action.replace(/_/g, ' ')}</Text>
                  <Text style={styles.rowSubLabel}>Escalation level {rule.level}</Text>
                </View>
              </View>
            ))}
            <Text style={[styles.rowSubLabel, { marginTop: 8 }]}>
              Contact your admin to modify escalation thresholds.
            </Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: F.bold, color: C.textPrimary },
  saveBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { fontSize: 14, fontFamily: F.semiBold },
  scroll:       { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontFamily: F.semiBold, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowLabels: { flex: 1, marginRight: 12 },
  rowLabel:    { fontSize: 15, fontFamily: F.medium, color: C.textPrimary },
  rowSubLabel: { fontSize: 12, fontFamily: F.regular, color: C.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: -16 },
  numberInput: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 15, fontFamily: F.medium, color: C.textPrimary, width: 64, textAlign: 'center',
  },
  timeInput: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 15, fontFamily: F.medium, color: C.textPrimary, width: 90, textAlign: 'center',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  catChip: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.surface,
  },
  catChipText: { fontSize: 13, fontFamily: F.medium, color: C.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.surface,
  },
  chipText: { fontSize: 13, fontFamily: F.medium, color: C.textPrimary },
  rulesContainer: { gap: 12, paddingVertical: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  ruleIndicator: { width: 10, height: 10, borderRadius: 5, marginTop: 5, flexShrink: 0 },
});
