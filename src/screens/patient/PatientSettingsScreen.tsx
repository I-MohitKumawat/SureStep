import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
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
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import { triggerSOS } from '../../services/geofenceService';
import { getLanguageDisplayName } from '../../constants/languages';
import type { PatientStackParams } from '../../types/navigation.types';
type Props = NativeStackScreenProps<PatientStackParams, 'PatientSettingsScreen'>;

export const PatientSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user, logout } = useAuth();

  const [triggeringSos, setTriggeringSos] = useState(false);
  const [locationAvailable, setLocationAvailable] = useState<boolean | null>(null);

  // Modal states for reliable web & mobile execution
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isDark = mode === 'dark';
  const patientId = user?.id || null;
  const displayName = user?.name || 'Ramesh';
  const currentLanguage = getLanguageDisplayName(user?.preferred_language || (user as any)?.language);
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

  const handleSignOutPress = () => setShowSignOutModal(true);
  const handleDeleteAccountPress = () => {
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const surface = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-950/10';
  const primary = isDark ? 'text-slate-100' : 'text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const iconColor = isDark ? '#6EE7B7' : '#0E6650';
  const separator = isDark ? 'border-slate-800' : 'border-slate-100';
  const locationLabel = locationAvailable === null ? 'Checking permission…' : locationAvailable ? 'Permission granted' : 'Check location permission';

  const renderRow = (
    title: string,
    subtitle: string,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    onPress: () => void,
    last = false,
    danger = false,
    statusColor?: string,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      onPress={onPress}
      className={`min-h-[76px] flex-row items-center px-4 py-3 active:opacity-70 ${last ? '' : `border-b ${separator}`}`}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${danger ? (isDark ? 'bg-red-950' : 'bg-red-50') : (isDark ? 'bg-emerald-950' : 'bg-emerald-50')}`}>
        <Ionicons name={icon} size={23} color={danger ? (isDark ? '#FCA5A5' : '#DC2626') : iconColor} />
      </View>
      <View className="ml-3 flex-1 pr-2">
        <Text className={`text-base font-semibold ${danger ? (isDark ? 'text-red-300' : 'text-red-700') : primary}`}>{title}</Text>
        <Text className={`mt-1 text-sm ${statusColor || muted}`}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={danger ? '#DC2626' : '#94A3B8'} />
    </Pressable>
  );

  const sectionTitle = (title: string) => (
    <Text className={`mb-2 ml-1 mt-6 text-xs font-bold tracking-widest ${muted}`}>{title}</Text>
  );

  const renderConfirmation = (deleting: boolean) => {
    const busy = deleting && deletingAccount;
    const close = () => {
      if (!busy) deleting ? setShowDeleteModal(false) : setShowSignOutModal(false);
    };
    return (
      <Modal visible={deleting ? showDeleteModal : showSignOutModal} transparent animationType="fade" onRequestClose={close}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View accessibilityViewIsModal className={`w-full max-w-[420px] rounded-3xl border p-6 ${surface}`}>
            <View className={`mb-4 h-14 w-14 items-center justify-center rounded-2xl ${deleting ? (isDark ? 'bg-red-950' : 'bg-red-50') : (isDark ? 'bg-emerald-950' : 'bg-emerald-50')}`}>
              <Ionicons name={deleting ? 'trash-outline' : 'log-out-outline'} size={28} color={deleting ? '#DC2626' : iconColor} />
            </View>
            <Text className={`text-2xl font-bold ${primary}`}>{deleting ? 'Delete Account' : 'Sign Out'}</Text>
            <Text className={`mb-6 mt-3 text-base leading-6 ${muted}`}>
              {deleting ? 'Your account, profile and associated access will be permanently removed. This action cannot be undone.' : 'Are you sure you want to sign out of your account?'}
            </Text>
            {deleting && deleteError ? <View className={`mb-4 rounded-xl p-3 ${isDark ? 'bg-red-950' : 'bg-red-50'}`}><Text accessibilityRole="alert" className={isDark ? 'text-red-300' : 'text-red-700'}>{deleteError}</Text></View> : null}
            <View className="flex-row gap-3">
              <Pressable accessibilityRole="button" disabled={busy} onPress={close} className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border ${separator} active:opacity-70`}><Text className={`font-semibold ${primary}`}>Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={busy} onPress={deleting ? confirmDeleteAccount : confirmSignOut} className={`min-h-[48px] flex-1 items-center justify-center rounded-xl px-2 ${deleting ? 'bg-red-700' : 'bg-emerald-800'} ${busy ? 'opacity-60' : 'active:opacity-80'}`}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-center font-bold text-white">{deleting ? 'Delete Forever' : 'Sign Out'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#F7F9F8' }}>
      <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-[#F7F9F8]'}`}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-[640px] self-center px-5 pt-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {navigation.canGoBack() && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} className={`h-11 w-11 items-center justify-center rounded-xl border ${surface} active:opacity-70`}><Ionicons name="chevron-back" size={23} color={iconColor} /></Pressable>}
                <Text className={`text-2xl font-bold tracking-tight ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>SureStep</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Emergency SOS" disabled={triggeringSos} onPress={handleSosPress} className={`min-h-[44px] flex-row items-center justify-center gap-2 rounded-full border px-4 ${isDark ? 'border-red-900 bg-red-950' : 'border-red-200 bg-red-50'} active:opacity-70`}>
                {triggeringSos ? <ActivityIndicator color="#DC2626" /> : <><Ionicons name="call" size={17} color={isDark ? '#FCA5A5' : '#DC2626'} /><Text className={`font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>SOS</Text></>}
              </Pressable>
            </View>
            <Text className={`mt-7 text-4xl font-bold tracking-tight ${primary}`}>Settings</Text>
            <Text className={`mb-6 mt-2 text-base ${muted}`}>Manage your account and preferences</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="View personal details" onPress={handlePersonalDetails} className="overflow-hidden rounded-3xl bg-[#105C49] p-5 active:opacity-90">
              <View className="flex-row items-center">
                {photoUrl ? <Image source={{ uri: photoUrl }} className="h-16 w-16 rounded-full bg-emerald-100" /> : <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-100"><Text className="text-2xl font-bold text-emerald-900">{initials}</Text></View>}
                <View className="ml-4 flex-1">
                  <Text className="text-xs font-semibold tracking-widest text-emerald-200">YOUR PROFILE</Text>
                  <Text className="mt-1 text-2xl font-bold text-white">{displayName}</Text>
                  <Text className="mt-1 text-sm text-emerald-100">Patient account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </View>
              <View className="mt-5 flex-row items-center border-t border-white/20 pt-4">
                <Ionicons name="person-outline" size={18} color="#D1FAE5" />
                <Text className="ml-2 flex-1 font-medium text-white">View personal details</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </Pressable>
            {sectionTitle('ACCOUNT & PREFERENCES')}
            <View className={`overflow-hidden rounded-3xl border ${surface}`}>
              {renderRow('Personal Details', 'Manage your profile', 'person-outline', handlePersonalDetails)}
              {renderRow('Language', currentLanguage, 'globe-outline', handleLanguagePress)}
              {renderRow('Connect with Family', 'Manage your care circle', 'people-outline', handleConnectWithFamily, true)}
            </View>
            {sectionTitle('SAFETY & PRIVACY')}
            <View className={`overflow-hidden rounded-3xl border ${surface}`}>
              {renderRow('Location', locationLabel, 'location-outline', handleLocationPress, true, false, locationAvailable === null ? muted : locationAvailable ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-amber-300' : 'text-amber-700'))}
            </View>
            {sectionTitle('ACCOUNT ACTIONS')}
            <View className={`overflow-hidden rounded-3xl border ${surface}`}>
              {renderRow('Sign Out', 'End your current session', 'log-out-outline', handleSignOutPress)}
              {renderRow('Delete Account', 'Permanently remove your account', 'trash-outline', handleDeleteAccountPress, true, true)}
            </View>
            <View className="my-7 flex-row items-center justify-center gap-2">
              <Ionicons name="heart-outline" size={15} color="#94A3B8" />
              <Text className={`text-xs ${muted}`}>SureStep · Care that stays connected</Text>
            </View>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </View>
        </ScrollView>
      </View>
      {renderConfirmation(false)}
      {renderConfirmation(true)}
    </ScreenContainer>
  );
};
