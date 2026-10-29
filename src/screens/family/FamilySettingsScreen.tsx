/**
 * SureStep — src/screens/family/FamilySettingsScreen.tsx
 * Notification preferences, Profile editing, Care Circle overview, and Account sign out.
 */
import React, { useEffect, useState } from 'react';
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
  Image,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { getFamilyProfile, updateFamilyProfile, type FamilyProfile } from '../../services/familyService';
import { updateMe, uploadProfilePhoto } from '../../services/userService';
import { leaveCareCircle } from '../../services/careCircleService';
import apiClient from '../../services/apiClient';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilySettingsScreen'>;

const RELATION_LABELS = ['Spouse', 'Parent', 'Daughter', 'Son', 'Sibling', 'Grandchild', 'Friend', 'Other'];

export const FamilySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { activeCircle, activePatient, isOwner, reloadFamilyData } = useFamilyContext();
  const { updateUser, logout } = useAuth();

  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [relation, setRelation] = useState('');
  const [showRelPicker, setShowRelPicker] = useState(false);

  const [breach, setBreach] = useState(true);
  const [sos, setSos] = useState(true);
  const [critical, setCritical] = useState(true);
  const [digest, setDigest] = useState(true);
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
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
          relation_label: relation || undefined,
          whatsapp_number: whatsapp || null,
          notify_on_breach: breach,
          notify_on_sos: sos,
          notify_on_missed_critical: critical,
          notify_on_daily_digest: digest,
          digest_frequency: freq,
        }),
        apiClient.put('/notifications/settings', {
          alert_categories: cats,
        }),
      ]);

      Alert.alert('Saved', 'Your preferences have been updated.');
      await reloadFamilyData();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error?.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = () => {
    if (!activeCircle) {
      Alert.alert('No Circle', 'You are not currently in an active care circle.');
      return;
    }

    if (isOwner) {
      Alert.alert(
        'Owner Notice',
        'As Care Circle Owner, you cannot leave the circle directly. You must either transfer ownership or delete the circle from Circle Management.',
        [
          { text: 'OK' },
          {
            text: 'Manage Circle',
            onPress: () => navigation.navigate('CareCircleManageScreen', { circleId: activeCircle.id }),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Leave Care Circle',
      `Are you sure you want to leave "${activeCircle.name}"? You will lose access to member data and safety alerts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCareCircle(activeCircle.id);
              await reloadFamilyData();
              Alert.alert('Left Circle', 'You have left the care circle.');
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not leave. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0E7A67" />
      </View>
    );
  }

  const PrefRow = ({
    label,
    icon,
    sub,
    value,
    onChange,
  }: {
    label: string;
    icon: any;
    sub: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={s.prefRow}>
      <View style={s.prefIconWrap}>
        <Ionicons name={icon} size={18} color="#0E7A67" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.prefLabel}>{label}</Text>
        <Text style={s.prefSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5E0D8', true: '#0E7A67' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#161E1C" />
        </Pressable>
        <Text style={s.title}>Settings</Text>
        <Pressable onPress={save} disabled={saving} style={s.saveBtn}>
          {saving ? (
            <ActivityIndicator size="small" color="#0E7A67" />
          ) : (
            <Text style={s.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.profileCard}>
          <Pressable onPress={pickPhoto}>
            {photoUri || profile?.photo_url ? (
              <Image source={{ uri: photoUri || profile?.photo_url || undefined }} style={s.avatarImage} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarText}>{profile?.name?.[0]?.toUpperCase() ?? 'F'}</Text>
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.profileName}>{profile?.name ?? 'Family Member'}</Text>
            {activeCircle && (
              <Text style={s.profileSub}>
                {isOwner ? 'Owner of ' : 'Member of '}
                {activeCircle.name}
              </Text>
            )}
          </View>
        </View>

        {/* Relation & WhatsApp */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Profile</Text>
          <Text style={s.fieldLabel}>Relationship to Patient</Text>
          <Pressable style={s.pickerBtn} onPress={() => setShowRelPicker(!showRelPicker)}>
            <Text style={[s.pickerBtnText, !relation && { color: '#8A9592' }]}>
              {relation || 'Select relationship…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#8A9592" />
          </Pressable>
          {showRelPicker && (
            <View style={s.relOptions}>
              {RELATION_LABELS.map((r) => (
                <Pressable
                  key={r}
                  style={[s.relOption, relation === r && s.relOptionActive]}
                  onPress={() => {
                    setRelation(r);
                    setShowRelPicker(false);
                  }}
                >
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
            placeholderTextColor="#8A9592"
            keyboardType="phone-pad"
          />
        </View>

        {/* Notification Prefs */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notification Preferences</Text>
          <PrefRow
            label="Geofence Breach"
            icon="exit-outline"
            sub="Alert when patient leaves safe zone"
            value={breach}
            onChange={setBreach}
          />
          <PrefRow
            label="SOS Triggered"
            icon="alert-circle-outline"
            sub="Emergency SOS alerts (always critical)"
            value={sos}
            onChange={setSos}
          />
          <PrefRow
            label="Critical Task Missed"
            icon="medical-outline"
            sub="When a critical routine task is overdue"
            value={critical}
            onChange={setCritical}
          />
          <PrefRow
            label="Daily Digest"
            icon="document-text-outline"
            sub="Summary of the day's care events"
            value={digest}
            onChange={setDigest}
          />

          {digest && (
            <>
              <Text style={[s.fieldLabel, { marginTop: 14 }]}>Digest Frequency</Text>
              <View style={s.freqRow}>
                {(['DAILY', 'WEEKLY'] as const).map((f) => (
                  <Pressable
                    key={f}
                    style={[s.freqBtn, freq === f && s.freqBtnActive]}
                    onPress={() => setFreq(f)}
                  >
                    <Text style={[s.freqText, freq === f && s.freqTextActive]}>
                      {f === 'DAILY' ? 'Every Day' : 'Weekly'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Care Circle Management */}
        {activeCircle && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Active Care Circle</Text>
            <View style={s.patientRow}>
              <View style={s.patientDot} />
              <Text style={s.patientName}>{activeCircle.name}</Text>
              <View style={s.linkedBadge}>
                <Text style={s.linkedBadgeText}>{isOwner ? 'Owner' : 'Member'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={s.manageCircleBtn}
              onPress={() => navigation.navigate('CareCircleManageScreen', { circleId: activeCircle.id })}
            >
              <Text style={s.manageCircleBtnText}>Manage Care Circle & Members</Text>
              <Ionicons name="chevron-forward" size={16} color="#0E7A67" />
            </TouchableOpacity>
          </View>
        )}

        {/* Danger Zone: Leave Circle */}
        {activeCircle && !isOwner && (
          <Pressable style={s.leaveBtn} onPress={handleLeave}>
            <View style={s.leaveInner}>
              <Ionicons name="warning-outline" size={18} color="#C93B2B" style={{ marginRight: 6 }} />
              <Text style={s.leaveBtnText}>Leave Care Circle</Text>
            </View>
          </Pressable>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#52605D" />
          <Text style={s.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F5' },
  scroll: { paddingHorizontal: 20, paddingTop: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
  },
  backBtn: { width: 40, justifyContent: 'center' },
  title: { fontFamily: F.bold, fontSize: 18, color: '#161E1C' },
  saveBtn: { width: 60, alignItems: 'flex-end' },
  saveBtnText: { fontFamily: F.bold, fontSize: 15, color: '#0E7A67' },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0E7A67',
  },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { fontFamily: F.bold, fontSize: 22, color: '#0E7A67' },
  profileName: { fontFamily: F.bold, fontSize: 18, color: '#161E1C' },
  profileSub: { fontFamily: F.regular, fontSize: 12, color: '#52605D', marginTop: 2 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  sectionTitle: { fontFamily: F.bold, fontSize: 15, color: '#161E1C', marginBottom: 12 },
  fieldLabel: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: '#52605D',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAF8F5',
  },
  pickerBtnText: { fontFamily: F.medium, fontSize: 14, color: '#161E1C' },
  relOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    marginTop: 6,
    overflow: 'hidden',
  },
  relOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  relOptionActive: { backgroundColor: '#EBF5F3' },
  relOptionText: { fontFamily: F.medium, fontSize: 14, color: '#161E1C' },
  relOptionTextActive: { color: '#0E7A67', fontFamily: F.bold },

  textInput: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#161E1C',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAF8F5',
  },

  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
  },
  prefIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefLabel: { fontFamily: F.bold, fontSize: 14, color: '#161E1C' },
  prefSub: { fontFamily: F.regular, fontSize: 11, color: '#52605D', marginTop: 2 },

  freqRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  freqBtnActive: { backgroundColor: '#0E7A67', borderColor: '#0E7A67' },
  freqText: { fontFamily: F.bold, fontSize: 13, color: '#52605D' },
  freqTextActive: { color: '#FFFFFF' },

  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patientDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0E7A67' },
  patientName: { fontFamily: F.bold, fontSize: 14, color: '#161E1C', flex: 1 },
  linkedBadge: { backgroundColor: '#EBF5F3', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  linkedBadgeText: { fontFamily: F.semiBold, fontSize: 11, color: '#0E7A67' },
  manageCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  manageCircleBtnText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#0E7A67',
  },

  leaveBtn: {
    backgroundColor: '#FFF8F8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F5C6CB',
    marginBottom: 12,
  },
  leaveInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  leaveBtnText: { fontFamily: F.semiBold, fontSize: 14, color: '#C93B2B' },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    gap: 6,
    marginTop: 4,
  },
  signOutBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#52605D',
  },
});
