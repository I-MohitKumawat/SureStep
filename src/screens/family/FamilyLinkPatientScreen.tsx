/**
 * FamilyLinkPatientScreen
 * Shown when a FAMILY user has no linked patient yet.
 * Supports: Invite Code | Phone Number request.
 */
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { redeemInviteCode, requestAccessByPhone, getAccessStatus } from '../../services/familyService';
import { useFamilyContext } from '../../context/FamilyContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilyLinkPatientScreen'>;
type LinkTab = 'code' | 'phone';

export const FamilyLinkPatientScreen: React.FC<Props> = ({ navigation }) => {
  const { refresh } = useFamilyContext();
  const [activeTab, setActiveTab] = useState<LinkTab>('code');
  const [code,      setCode]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [pending,   setPending]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      try {
        const res = await getAccessStatus();
        if (!active) return;
        const rel = res.data?.data?.status;
        if (rel) {
          if (rel.status === 'PENDING') {
            setPending(true);
            setSuccess(`Request pending for patient ${rel.patient_name}. The caregiver will review and approve.`);
          } else if (rel.status === 'CONFIRMED') {
            await refresh();
            navigation.replace('FamilyFeedScreen');
          }
        }
      } catch (err) {
        console.warn('Failed to fetch family access status:', err);
      }
    };
    void checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [navigation, refresh]);

  const handleRedeemCode = async () => {
    if (code.trim().length < 4) { setError('Enter a valid invite code.'); return; }
    setError(null); setSuccess(null); setLoading(true);
    try {
      await redeemInviteCode(code.trim().toUpperCase());
      await refresh();
      navigation.replace('FamilyFeedScreen');
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Invalid or expired code. Please check and try again.');
    } finally { setLoading(false); }
  };

  const handleRequestByPhone = async () => {
    const clean = phone.trim().replace(/[^\d]/g, '');
    if (clean.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError(null); setSuccess(null); setLoading(true);
    try {
      const fullPhone = `+91${clean}`;
      await requestAccessByPhone(fullPhone);
      setPending(true);
      setSuccess('Request sent! The caregiver will review and approve your access.');
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Could not send request. Check the number and try again.');
    } finally { setLoading(false); }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.hero}>
          <Ionicons name="people-outline" size={60} color={C.primary} style={{ marginBottom: 14 }} />
          <Text style={s.heroTitle}>Join a Care Circle</Text>
          <Text style={s.heroSub}>
            Connect with your loved one's care team to stay informed and offer support.
          </Text>
        </View>

        {/* Tab Selector */}
        {!pending && (
          <View style={s.tabBar}>
            {(['code', 'phone'] as LinkTab[]).map((tab) => (
              <Pressable
                key={tab}
                style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
                onPress={() => { setActiveTab(tab); setError(null); setSuccess(null); }}
              >
                <View style={s.tabInner}>
                  <Ionicons
                    name={tab === 'code' ? 'key-outline' : 'call-outline'}
                    size={16}
                    color={activeTab === tab ? '#fff' : C.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                    {tab === 'code' ? 'Invite Code' : 'Phone Number'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Invite Code Tab */}
        {activeTab === 'code' && !pending && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Enter Invite Code</Text>
            <Text style={s.cardSub}>
              Ask the caregiver to generate a 6-character code and share it with you.
            </Text>
            <TextInput
              style={s.codeInput}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="e.g. AB4K2Z"
              placeholderTextColor={C.textMuted}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Pressable
              style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
              onPress={handleRedeemCode}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnText}>Link with Code</Text>
              }
            </Pressable>
          </View>
        )}

        {/* Phone Search Tab */}
        {activeTab === 'phone' && !pending && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Find by Phone Number</Text>
            <Text style={s.cardSub}>
              Enter the patient's registered phone number. The caregiver will approve your request.
            </Text>
            
            <View style={s.phoneInputContainer}>
              <View style={s.countryPrefix}>
                <Text style={s.countryPrefixText}>+91</Text>
              </View>
              <TextInput
                style={s.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="98765 43210"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            <Pressable
              style={[s.primaryBtn, loading && s.primaryBtnDisabled]}
              onPress={handleRequestByPhone}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnText}>Request Access</Text>
              }
            </Pressable>
          </View>
        )}

        {/* Pending State */}
        {pending && (
          <View style={s.pendingCard}>
            <Ionicons name="time-outline" size={44} color="#92400E" style={{ marginBottom: 12 }} />
            <Text style={s.pendingTitle}>Awaiting Approval</Text>
            <Text style={s.pendingSub}>
              Your request has been sent to the care team. You'll be notified once approved.
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#991B1B" style={{ marginRight: 6 }} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Success */}
        {success && !error && (
          <View style={s.successBanner}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#065F46" style={{ marginRight: 6 }} />
            <Text style={s.successText}>{success}</Text>
          </View>
        )}

        {/* Info footer */}
        <View style={s.infoBox}>
          <View style={s.infoInner}>
            <Ionicons name="lock-closed-outline" size={14} color={C.textMuted} style={{ marginRight: 4 }} />
            <Text style={s.infoText}>
              Your connection is secure. You'll only see information the care team has permitted. Personal contact details are never shared.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen:   { backgroundColor: C.bg },
  scroll:   { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 60 },

  hero: { alignItems: 'center', marginBottom: 28 },
  heroTitle: { fontFamily: F.extraBold, fontSize: 26, color: C.textPrimary, textAlign: 'center', marginBottom: 8 },
  heroSub:   { fontFamily: F.regular, fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },

  tabBar:       { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  tabBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  tabInner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: C.primary },
  tabText:      { fontFamily: F.bold, fontSize: 13, color: C.textSecondary },
  tabTextActive:{ color: '#fff' },

  card:      { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  cardTitle: { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary, marginBottom: 6 },
  cardSub:   { fontFamily: F.regular, fontSize: 13, color: C.textSecondary, marginBottom: 20, lineHeight: 19 },

  codeInput: {
    fontSize: 28, fontFamily: F.extraBold, letterSpacing: 6, textAlign: 'center',
    color: C.textPrimary, borderWidth: 2, borderColor: C.border, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 20, marginBottom: 18,
    backgroundColor: C.bg,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  countryPrefix: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 16,
  },
  countryPrefixText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: F.medium,
    color: C.textPrimary,
    borderWidth: 1.5,
    borderColor: C.border,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: C.bg,
  },

  primaryBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText:     { fontFamily: F.extraBold, fontSize: 16, color: '#fff' },

  pendingCard:  { backgroundColor: '#FFFBEB', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1.5, borderColor: '#FCD34D', marginBottom: 16 },
  pendingTitle: { fontFamily: F.extraBold, fontSize: 20, color: '#92400E', marginBottom: 6 },
  pendingSub:   { fontFamily: F.regular, fontSize: 14, color: '#B45309', textAlign: 'center', lineHeight: 20 },

  errorBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 14 },
  errorText:     { fontFamily: F.medium, fontSize: 13, color: '#991B1B', flex: 1 },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#6EE7B7', marginBottom: 14 },
  successText:   { fontFamily: F.medium, fontSize: 13, color: '#065F46', flex: 1 },

  infoBox:   { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginTop: 8 },
  infoInner: { flexDirection: 'row', alignItems: 'flex-start' },
  infoText:  { fontFamily: F.regular, fontSize: 12, color: C.textMuted, lineHeight: 18, flex: 1 },
});
