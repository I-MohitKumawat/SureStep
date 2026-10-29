import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';
import apiClient from '../../services/apiClient';
import { fetchMyFamily, type FamilyMemberItem } from '../../services/relationshipService';
import type { PatientStackParams } from '../../types/navigation.types';
import { HomeHeader } from '../../components/patient/home/HomeHeader';
import { IconFamily } from '../../assets/icons/NavIcons';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientConnectFamilyScreen'>;

interface ValidatedInvitation {
  id: string;
  circleId: string;
  circleName: string;
  ownerName: string;
  expiresAt: string;
}

export const PatientConnectFamilyScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  const patientId = user?.id || null;

  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<ValidatedInvitation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Existing family check
  const [connectedFamily, setConnectedFamily] = useState<FamilyMemberItem[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(true);

  const loadFamily = useCallback(async () => {
    setLoadingFamily(true);
    try {
      const family = await fetchMyFamily();
      setConnectedFamily(family);
    } catch {
      setConnectedFamily([]);
    } finally {
      setLoadingFamily(false);
    }
  }, []);

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  const handleValidateCode = async (inputCode = code) => {
    const clean = inputCode.trim();
    if (!/^[0-9]{6}$/.test(clean)) {
      setErrorMsg('Please enter a 6-digit connection code.');
      setInvitation(null);
      return;
    }

    setErrorMsg(null);
    setValidating(true);
    try {
      const res = await apiClient.get(`/care-circles/invitations/${clean}`);
      const data = res.data?.data || res.data;
      if (data) {
        setInvitation({
          id: data.id,
          circleId: data.circleId || data.circle_id,
          circleName: data.circleName || data.circle_name || 'Family Network',
          ownerName: data.ownerName || data.owner_name || 'Family Organizer',
          expiresAt: data.expiresAt || data.expires_at,
        });
      }
    } catch (err: any) {
      console.warn('[PatientConnectFamilyScreen] Code validation failed:', err);
      const backendMsg =
        err?.response?.data?.error?.message ||
        'Invitation code not found or expired. Please check the 6-digit code with your family.';
      setErrorMsg(backendMsg);
      setInvitation(null);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!invitation || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await apiClient.post(`/care-circles/invitations/${code.trim()}/join`);
      setIsSuccess(true);
    } catch (err: any) {
      console.warn('[PatientConnectFamilyScreen] Join request failed:', err);
      const codeType = err?.response?.data?.error?.code;
      if (codeType === 'ALREADY_IN_CIRCLE') {
        setErrorMsg('You are already connected to this care network.');
      } else if (codeType === 'ALREADY_REQUESTED') {
        setErrorMsg('You already have a pending connection request for this network.');
      } else {
        const msg = err?.response?.data?.error?.message || 'Could not complete connection. Please try again.';
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(numeric);
    setErrorMsg(null);
    if (numeric.length === 6) {
      void handleValidateCode(numeric);
    } else {
      setInvitation(null);
    }
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header + SOS */}
        <HomeHeader patientId={patientId} showSettings={false} />

        {/* Back Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to Settings"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? '#F5F7F6' : '#161E1C'}
            />
            <Text style={[styles.backBtnText, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Settings
            </Text>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            Connect with Family
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
            Join your family care network with a 6-digit connection code
          </Text>
        </View>

        {/* Already Connected Family Section (if present) */}
        {connectedFamily.length > 0 && !isSuccess && (
          <View
            style={[
              styles.connectedCard,
              {
                backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                borderColor: isDark ? '#2C3835' : '#E5E0D8',
              },
            ]}
          >
            <View style={styles.connectedHeader}>
              <View style={styles.badgePill}>
                <Ionicons name="checkmark-circle" size={14} color="#065F46" />
                <Text style={styles.badgePillText}>Currently Connected</Text>
              </View>
            </View>

            <Text style={[styles.connectedFamilyTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Your Connected Family
            </Text>

            <View style={styles.familyMembersList}>
              {connectedFamily.map((fm) => (
                <View key={fm.id} style={styles.familyRow}>
                  <View style={styles.familyAvatarWrap}>
                    {fm.photo_url ? (
                      <Image source={{ uri: fm.photo_url }} style={styles.familyAvatarImg} />
                    ) : (
                      <Ionicons name="person" size={18} color={C.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.familyName, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
                      {fm.name}
                    </Text>
                    <Text style={[styles.familyRole, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                      {fm.relationship_type.replace('_', ' ').toLowerCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Connection Form or Success */}
        {isSuccess ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                borderColor: isDark ? '#2C3835' : '#E5E0D8',
              },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={36} color="#059669" />
            </View>

            <Text style={[styles.cardTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Connection Request Sent
            </Text>

            <Text style={[styles.cardDescription, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Your request to join {invitation?.circleName || 'your family network'} has been submitted.
              Your family organizer will confirm the connection shortly.
            </Text>

            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Return to Settings"
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.actionBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                borderColor: isDark ? '#2C3835' : '#E5E0D8',
              },
            ]}
          >
            <View style={styles.iconCircle}>
              <IconFamily size={32} color={C.primary} strokeWidth={2} />
            </View>

            <Text style={[styles.cardTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Enter 6-Digit Code
            </Text>

            <Text style={[styles.cardDescription, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Ask your family member for the 6-digit connection code generated from their SureStep app.
            </Text>

            {/* 6-Digit Code Input */}
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: isDark ? '#121816' : '#F9FAFB',
                  borderColor: errorMsg
                    ? '#DC2626'
                    : isDark
                    ? '#2C3835'
                    : '#D1D5DB',
                },
              ]}
            >
              <TextInput
                value={code}
                onChangeText={handleCodeChange}
                placeholder="123456"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="numeric"
                maxLength={6}
                accessibilityLabel="6-digit invitation code"
                style={[
                  styles.codeInput,
                  { color: isDark ? '#F5F7F6' : '#161E1C' },
                ]}
              />
            </View>

            {validating && (
              <View style={styles.validatingRow}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={[styles.validatingText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                  Checking connection code...
                </Text>
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Validated Invitation Preview */}
            {invitation && !validating && (
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: isDark ? '#16221F' : '#F0FDF4',
                    borderColor: isDark ? '#1E3B33' : '#BBF7D0',
                  },
                ]}
              >
                <View style={styles.previewHeader}>
                  <Ionicons name="people" size={18} color="#059669" />
                  <Text style={[styles.previewCircleName, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                    {invitation.circleName}
                  </Text>
                </View>
                <Text style={[styles.previewInviter, { color: isDark ? '#9EABA7' : '#52605D' }]}>
                  Organized by {invitation.ownerName}
                </Text>

                <Pressable
                  onPress={handleConfirmJoin}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm & Connect"
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { marginTop: 14 },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionBtnText}>Confirm & Connect</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    fontFamily: F.medium,
    fontSize: 16,
    marginLeft: 2,
  },
  titleSection: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  connectedCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  connectedHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F7F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgePillText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#065F46',
  },
  connectedFamilyTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    marginBottom: 12,
  },
  familyMembersList: {
    gap: 10,
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  familyAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  familyAvatarImg: {
    width: 36,
    height: 36,
  },
  familyName: {
    fontFamily: F.semiBold,
    fontSize: 15,
  },
  familyRole: {
    fontFamily: F.regular,
    fontSize: 13,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E6F7F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputWrap: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  codeInput: {
    fontFamily: F.bold,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
  },
  validatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  validatingText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  errorText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    textAlign: 'center',
  },
  previewBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  previewCircleName: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  previewInviter: {
    fontFamily: F.regular,
    fontSize: 13,
  },
  actionBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
