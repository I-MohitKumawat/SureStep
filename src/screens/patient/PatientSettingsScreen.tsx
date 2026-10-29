import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import { triggerSOS } from '../../services/geofenceService';
import type { PatientStackParams } from '../../types/navigation.types';
import {
  IconUser,
  IconGlobe,
  IconFamily,
  IconLocationPin,
  IconSignOut,
  IconTrash,
} from '../../assets/icons/NavIcons';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientSettingsScreen'>;

const SosPhoneIcon = ({ color = '#DC2626', size = 16 }: { color?: string; size?: number }) => (
  <Ionicons name="call" size={size} color={color} style={{ marginRight: 6 }} />
);

export const PatientSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user, logout } = useAuth();

  const [triggeringSos, setTriggeringSos] = useState(false);
  const [locationAvailable, setLocationAvailable] = useState<boolean>(true);

  // Modal states for reliable web & mobile execution
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isDark = mode === 'dark';
  const patientId = user?.id || null;
  const displayName = user?.name || 'Ramesh';
  const currentLanguage = user?.preferred_language || (user as any)?.language || 'English';
  const photoUrl = (user as any)?.profile_photo_url || (user as any)?.photo_url || null;

  const initials = displayName
    .split(' ')
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  // Check location permission state whenever Settings is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      Location.getForegroundPermissionsAsync()
        .then((perm) => {
          if (isMounted) {
            setLocationAvailable(perm.granted);
          }
        })
        .catch(() => {
          if (isMounted) setLocationAvailable(false);
        });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleSosPress = () => {
    if (!patientId) {
      Alert.alert('Unable to send SOS', 'Please ensure you are signed in.');
      return;
    }

    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to send an emergency alert to your emergency contacts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setTriggeringSos(true);
            try {
              await triggerSOS(patientId);
              Alert.alert('SOS Sent', 'Your emergency alert has been sent.');
            } catch (err: any) {
              console.warn('[PatientSettingsScreen] SOS trigger failed:', err);
              Alert.alert(
                'SOS Notice',
                'SOS signal could not be sent to server. Please dial emergency services directly.'
              );
            } finally {
              setTriggeringSos(false);
            }
          },
        },
      ]
    );
  };

  const handlePersonalDetails = () => {
    navigation.navigate('PatientPersonalDetailsScreen');
  };

  const handleLanguagePress = () => {
    navigation.navigate('PatientLanguageScreen');
  };

  const handleConnectWithFamily = () => {
    navigation.navigate('PatientConnectFamilyScreen');
  };

  const handleLocationPress = () => {
    navigation.navigate('PatientLocationScreen');
  };

  const confirmSignOut = async () => {
    setShowSignOutModal(false);
    try {
      await logout();
    } catch (err) {
      console.warn('[PatientSettingsScreen] Logout error:', err);
    }
  };

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await apiClient.delete('/users/me');
      setShowDeleteModal(false);
      await logout();
    } catch (err: any) {
      console.error('[PatientSettingsScreen] Delete account failed:', err);
      setDeleteError(
        err?.response?.data?.error?.message ||
          'Could not delete account. If you are an active circle owner, please transfer management first.'
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSignOutPress = () => {
    if (Platform.OS === 'web') {
      setShowSignOutModal(true);
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: confirmSignOut },
    ]);
  };

  const handleDeleteAccountPress = () => {
    if (Platform.OS === 'web') {
      setDeleteError(null);
      setShowDeleteModal(true);
      return;
    }
    Alert.alert(
      'Delete Account',
      'Delete your account? Your account and associated access will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  };

  // Deep teal icon color matching the approved visual wireframe
  const rowIconColor = '#0E5A4A';

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Back navigation + SureStep Branding + SOS */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            {navigation.canGoBack() && (
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              >
                <Ionicons
                  name="chevron-back"
                  size={26}
                  color={isDark ? '#F5F7F6' : '#0E5A4A'}
                />
              </Pressable>
            )}
            <Text
              style={[
                styles.brandText,
                {
                  color: isDark ? '#FFFFFF' : '#0E5A4A',
                  fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
                },
              ]}
            >
              SureStep
            </Text>
          </View>

          <Pressable
            onPress={handleSosPress}
            disabled={triggeringSos}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS"
            style={({ pressed }) => [
              styles.sosButton,
              {
                backgroundColor: isDark ? '#3D1414' : '#FCECE9',
                borderColor: isDark ? '#5A2020' : '#FECACA',
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            {triggeringSos ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <SosPhoneIcon color="#DC2626" size={16} />
                <Text style={styles.sosText}>SOS</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Heading: Settings (Large Serif) */}
        <View style={styles.titleSection}>
          <Text
            style={[
              styles.pageTitle,
              {
                color: isDark ? '#F5F7F6' : '#111827',
                fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
              },
            ]}
          >
            Settings
          </Text>
        </View>

        {/* Profile Section: 96px Avatar, Large Serif Name, Subtitle */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.profileName,
                {
                  color: isDark ? '#F5F7F6' : '#111827',
                  fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
                },
              ]}
            >
              {displayName}
            </Text>
            <Text style={[styles.profileSub, { color: isDark ? '#9EABA7' : '#6B7280' }]}>
              {currentLanguage}
            </Text>
          </View>
        </View>

        {/* 6 Full-Width Options with Deep Teal Outline Icons & Thin Dividers */}
        <View style={styles.menuContainer}>
          {/* Row 1: Personal Details */}
          <Pressable
            onPress={handlePersonalDetails}
            accessibilityRole="button"
            accessibilityLabel="Personal Details"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.iconContainer}>
                <IconUser size={22} color={rowIconColor} strokeWidth={1.8} />
              </View>
              <Text style={[styles.menuLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Personal Details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9EABA7" />
          </Pressable>

          <View style={styles.divider} />

          {/* Row 2: Language */}
          <Pressable
            onPress={handleLanguagePress}
            accessibilityRole="button"
            accessibilityLabel="Language"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.iconContainer}>
                <IconGlobe size={22} color={rowIconColor} strokeWidth={1.8} />
              </View>
              <Text style={[styles.menuLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Language
              </Text>
            </View>
            <View style={styles.menuRowRight}>
              <Text style={styles.rightValueText}>{currentLanguage}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9EABA7" />
            </View>
          </Pressable>

          <View style={styles.divider} />

          {/* Row 3: Connect with Family */}
          <Pressable
            onPress={handleConnectWithFamily}
            accessibilityRole="button"
            accessibilityLabel="Connect with Family"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.iconContainer}>
                <IconFamily size={22} color={rowIconColor} strokeWidth={1.8} />
              </View>
              <Text style={[styles.menuLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Connect with Family
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9EABA7" />
          </Pressable>

          <View style={styles.divider} />

          {/* Row 4: Location */}
          <Pressable
            onPress={handleLocationPress}
            accessibilityRole="button"
            accessibilityLabel="Location Status"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.iconContainer}>
                <IconLocationPin size={22} color={rowIconColor} strokeWidth={1.8} />
              </View>
              <Text style={[styles.menuLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Location
              </Text>
            </View>
            <View style={styles.menuRowRight}>
              <View style={locationAvailable ? styles.locationBadge : styles.locationBadgeWarning}>
                <Ionicons
                  name={locationAvailable ? 'checkmark-circle' : 'alert-circle'}
                  size={16}
                  color={locationAvailable ? '#0E7A67' : '#B45309'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={
                    locationAvailable
                      ? styles.locationBadgeText
                      : styles.locationBadgeWarningText
                  }
                >
                  {locationAvailable ? 'Location available' : 'Check status'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9EABA7" style={{ marginLeft: 6 }} />
            </View>
          </Pressable>

          <View style={styles.divider} />

          {/* Row 5: Sign Out */}
          <Pressable
            onPress={handleSignOutPress}
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.iconContainer}>
                <IconSignOut size={22} color={rowIconColor} strokeWidth={1.8} />
              </View>
              <Text style={[styles.menuLabel, { color: isDark ? '#F5F7F6' : '#111827' }]}>
                Sign Out
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9EABA7" />
          </Pressable>

          <View style={styles.divider} />

          {/* Row 6: Delete Account */}
          <Pressable
            onPress={handleDeleteAccountPress}
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.iconContainer}>
                <IconTrash size={22} color="#DC2626" strokeWidth={1.8} />
              </View>
              <Text style={[styles.menuLabel, { color: '#DC2626' }]}>
                Delete Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9EABA7" />
          </Pressable>
        </View>
      </ScrollView>

      {/* ─── Sign Out Confirmation Modal ────────────────────────────────────── */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out of your account?
            </Text>
            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => setShowSignOutModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmSignOut}
                style={styles.modalActionBtn}
              >
                <Text style={styles.modalActionText}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Delete Account Confirmation Modal ──────────────────────────────── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingAccount && setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.deleteHeaderRow}>
              <View style={styles.deleteIconBadge}>
                <IconTrash size={22} color="#DC2626" strokeWidth={2} />
              </View>
              <Text style={styles.modalTitle}>Delete Account</Text>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to delete your account? Your account, profile, and access will be permanently removed. This action cannot be undone.
            </Text>

            {deleteError ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{deleteError}</Text>
              </View>
            ) : null}

            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
                style={[styles.modalDeleteBtn, deletingAccount && { opacity: 0.7 }]}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete Forever</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 6,
    padding: 4,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  sosText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  titleSection: {
    marginTop: 14,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#E5E0D8',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontFamily: F.bold,
    fontSize: 32,
    color: '#0E5A4A',
  },
  profileInfo: {
    marginLeft: 18,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  profileSub: {
    fontFamily: F.regular,
    fontSize: 15,
  },
  menuContainer: {
    marginTop: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 2,
    minHeight: 64,
  },
  menuRowPressed: {
    opacity: 0.7,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontFamily: F.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightValueText: {
    fontFamily: F.regular,
    fontSize: 15,
    color: '#6B7280',
    marginRight: 6,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F0',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
  },
  locationBadgeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#0E7A67',
  },
  locationBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
  },
  locationBadgeWarningText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#B45309',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EDE8DF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  deleteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#111827',
  },
  modalMessage: {
    fontFamily: F.regular,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  modalErrorText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#DC2626',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#4B5563',
  },
  modalActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0E5A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
