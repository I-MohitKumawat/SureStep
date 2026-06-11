/**
 * FamilySettingsScreen — Notification prefs, profile, and leave care circle.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Switch, Text, TextInput, View, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { getFamilyProfile, updateFamilyProfile, type FamilyProfile } from '../../services/familyService';
import { updateMe, uploadProfilePhoto } from '../../services/userService';
import apiClient from '../../services/apiClient';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilySettingsScreen'>;

const RELATION_LABELS = ['Spouse', 'Parent', 'Daughter', 'Son', 'Sibling', 'Grandchild', 'Friend', 'Other'];

export const FamilySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { patient, refresh } = useFamilyContext();

  const [profile,    setProfile]   = useState<FamilyProfile | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [saving,     setSaving]    = useState(false);
  const [whatsapp,   setWhatsapp]  = useState('');
  const [relation,   setRelation]  = useState('');
  const [showRelPicker, setShowRelPicker] = useState(false);

  const [breach,    setBreach]   = useState(true);
  const [sos,       setSos]      = useState(true);
  const [critical,  setCritical] = useState(true);
  const [digest,    setDigest]   = useState(true);
  const [freq,      setFreq]     = useState<'DAILY' | 'WEEKLY'>('DAILY');

  useEffect(() => {
    async function init() {
      try {
        const [profRes, settingsRes] = await Promise.all([
          getFamilyProfile(),
          apiClient.get('/notifications/settings').catch(() => null),
        ]);

        const p = profRes.data?.data?.profile ?? null;
        if (p) {
          setProfile(p);
          setWhatsapp(p.whatsapp_number ?? '');
          setRelation(p.relation_label ?? '');
          setBreach(p.notify_on_breach ?? true);
          setSos(p.notify_on_sos ?? true);
          setCritical(p.notify_on_missed_critical ?? true);
          setDigest(p.notify_on_daily_digest ?? true);
          setFreq(p.digest_frequency ?? 'DAILY');
        }

        if (settingsRes?.data?.settings) {
          const cats = settingsRes.data.settings.alert_categories || [];
          setBreach(cats.includes('GEOFENCE'));
          setSos(cats.includes('SOS'));
          setCritical(cats.includes('ROUTINE'));
          setDigest(cats.includes('DAILY_DIGEST'));
        }
      } catch (err) {
        console.warn('Error loading family settings:', err);
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, []);

  const { updateUser } = useAuth();
  const [photoUri,   setPhotoUri]  = useState<string | null>(null);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to set a profile picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    setPhotoUri(res.assets[0].uri);
  };

  const save = async () => {
    setSaving(true);
    try {
      let remotePhotoUrl = profile?.photo_url;
      if (photoUri && photoUri !== profile?.photo_url) {
        remotePhotoUrl = await uploadProfilePhoto(photoUri);
        await updateMe({ photo_url: remotePhotoUrl });
        updateUser({ photo_url: remotePhotoUrl });
      }

      const cats: string[] = [];
      if (breach) cats.push('GEOFENCE');
      if (sos) cats.push('SOS');
      if (critical) cats.push('ROUTINE');
      if (digest) cats.push('DAILY_DIGEST');

      await Promise.all([
        updateFamilyProfile({
          relation_label:            relation || undefined,
          whatsapp_number:           whatsapp || null,
          notify_on_breach:          breach,
          notify_on_sos:             sos,
          notify_on_missed_critical: critical,
          notify_on_daily_digest:    digest,
          digest_frequency:          freq,
        }),
        apiClient.put('/notifications/settings', {
          alert_categories: cats,
        }),
      ]);

      Alert.alert('Saved', 'Your preferences have been updated.');
      void refresh();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error?.message ?? 'Failed to save changes.');
    } finally { setSaving(false); }
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Care Circle',
      'Are you sure you want to remove yourself from this care circle? You will lose access to all patient data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              if (patient?.id) {
                await apiClient.delete(`/relationships/family/${patient.id}`);
              }
              await refresh();
              navigation.replace('FamilyLinkPatientScreen');
            } catch {
              Alert.alert('Error', 'Could not leave. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const PrefRow = ({
    label, icon, sub, value, onChange,
  }: { label: string; icon: any; sub: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={s.prefRow}>
      <View style={s.prefIconWrap}>
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.prefLabel}>{label}</Text>
        <Text style={s.prefSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.primaryLight }}
        thumbColor={value ? C.primary : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </Pressable>
        <Text style={s.title}>Settings</Text>
        <Pressable onPress={save} disabled={saving} style={s.saveBtn}>
          {saving ? <ActivityIndicator size="small" color={C.primary} /> : <Text style={s.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.profileCard}>
          <Pressable onPress={pickPhoto}>
            {photoUri || profile?.photo_url ? (
              <Image source={{ uri: photoUri || profile?.photo_url || undefined }} style={s.avatarImage} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarText}>{profile?.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.profileName}>{profile?.name ?? 'Family Member'}</Text>
            {patient && (
              <Text style={s.profileSub}>Care circle of {patient.name}</Text>
            )}
          </View>
        </View>

        {/* Relation & WhatsApp */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Profile</Text>
          <Text style={s.fieldLabel}>Relationship to Patient</Text>
          <Pressable style={s.pickerBtn} onPress={() => setShowRelPicker(!showRelPicker)}>
            <Text style={[s.pickerBtnText, !relation && { color: C.textMuted }]}>
              {relation || 'Select relationship…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={C.textMuted} />
          </Pressable>
          {showRelPicker && (
            <View style={s.relOptions}>
              {RELATION_LABELS.map(r => (
                <Pressable key={r} style={[s.relOption, relation === r && s.relOptionActive]} onPress={() => { setRelation(r); setShowRelPicker(false); }}>
                  <Text style={[s.relOptionText, relation === r && s.relOptionTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={[s.fieldLabel, { marginTop: 16 }]}>WhatsApp Number (optional)</Text>
          <TextInput
            style={s.textInput}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+91 98765 43210"
            placeholderTextColor={C.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        {/* Notification Prefs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notification Preferences</Text>
          <PrefRow label="Geofence Breach" icon="exit-outline" sub="Alert when patient leaves safe zone" value={breach} onChange={setBreach} />
          <PrefRow label="SOS Triggered"   icon="alert-circle-outline" sub="Emergency SOS alerts (always critical)"  value={sos}    onChange={setSos} />
          <PrefRow label="Critical Task Missed" icon="medical-outline" sub="When a critical routine task is overdue" value={critical} onChange={setCritical} />
          <PrefRow label="Daily Digest"    icon="document-text-outline" sub="Summary of the day's events" value={digest} onChange={setDigest} />

          {digest && (
            <>
              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Digest Frequency</Text>
              <View style={s.freqRow}>
                {(['DAILY', 'WEEKLY'] as const).map(f => (
                  <Pressable key={f} style={[s.freqBtn, freq === f && s.freqBtnActive]} onPress={() => setFreq(f)}>
                    <Text style={[s.freqText, freq === f && s.freqTextActive]}>{f === 'DAILY' ? 'Every Day' : 'Weekly'}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Care Circle */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Care Circle</Text>
          <Text style={s.fieldLabel}>Linked Patient</Text>
          {patient ? (
            <>
              <View style={s.patientRow}>
                <View style={s.patientDot} />
                <Text style={s.patientName}>{patient.name}</Text>
                <View style={s.linkedBadge}><Text style={s.linkedBadgeText}>Confirmed</Text></View>
              </View>
              <Pressable
                onPress={() => navigation.navigate('PatientProfileScreen', { patientId: patient.id })}
                style={({ pressed }) => [s.pickerBtn, { marginTop: 12 }, pressed && { opacity: 0.82 }]}
              >
                <Text style={s.pickerBtnText}>View Patient Profile</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </Pressable>
            </>
          ) : (
            <Text style={s.noPatient}>No patient linked.</Text>
          )}
        </View>

        {/* Danger Zone */}
        <Pressable style={s.leaveBtn} onPress={handleLeave}>
          <View style={s.leaveInner}>
            <Ionicons name="warning-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={s.leaveBtnText}>Leave Care Circle</Text>
          </View>
        </Pressable>
      </ScrollView>

    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen:   { backgroundColor: C.bg },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  scroll:   { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:  { width: 40, justifyContent: 'center' },
  title:    { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  saveBtn:  { width: 60, alignItems: 'flex-end' },
  saveBtnText: { fontFamily: F.bold, fontSize: 14, color: C.primary },

  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 18, padding: 16, marginTop: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  avatar:      { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primary },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  avatarText:  { fontFamily: F.bold, fontSize: 22, color: C.primary },
  profileName: { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  profileSub:  { fontFamily: F.regular, fontSize: 12, color: C.textMuted, marginTop: 2 },

  section:      { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontFamily: F.bold, fontSize: 15, color: C.textPrimary, marginBottom: 12 },
  fieldLabel:   { fontFamily: F.bold, fontSize: 12, color: C.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 6 },

  pickerBtn:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.bg },
  pickerBtnText: { fontFamily: F.medium, fontSize: 14, color: C.textPrimary },
  relOptions:    { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, marginTop: 6, overflow: 'hidden' },
  relOption:     { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  relOptionActive:     { backgroundColor: C.primaryLight },
  relOptionText:       { fontFamily: F.medium, fontSize: 14, color: C.textPrimary },
  relOptionTextActive: { color: C.primary, fontFamily: F.bold },

  textInput: { fontFamily: F.regular, fontSize: 14, color: C.textPrimary, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.bg },

  prefRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  prefIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  prefLabel: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary },
  prefSub:   { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 2 },

  freqRow:         { flexDirection: 'row', gap: 10, marginTop: 4 },
  freqBtn:         { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.bg },
  freqBtnActive:   { backgroundColor: C.primary, borderColor: C.primary },
  freqText:        { fontFamily: F.bold, fontSize: 13, color: C.textSecondary },
  freqTextActive:  { color: '#fff' },

  patientRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patientDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  patientName: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary, flex: 1 },
  linkedBadge: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  linkedBadgeText: { fontFamily: F.bold, fontSize: 11, color: '#065F46' },
  noPatient:   { fontFamily: F.regular, fontSize: 13, color: C.textMuted },

  leaveBtn:     { backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6, borderWidth: 1.5, borderColor: '#FCA5A5' },
  leaveInner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  leaveBtnText: { fontFamily: F.bold, fontSize: 15, color: '#DC2626' },
});
