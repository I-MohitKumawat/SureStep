import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../theme/ThemeContext';
import { F } from '../../theme/fonts';
import { C } from '../../theme/colors';
import type { PatientStackParams } from '../../types/navigation.types';
import { HomeHeader } from '../../components/patient/home/HomeHeader';
import { IconLocationPin } from '../../assets/icons/NavIcons';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientLocationScreen'>;

type PermissionState = 'CHECKING' | 'AVAILABLE' | 'UNAVAILABLE' | 'DENIED';

export const PatientLocationScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode } = useTheme();
  const { user } = useAuth();
  const isDark = mode === 'dark';

  const patientId = user?.id || null;

  const [permState, setPermState] = useState<PermissionState>('CHECKING');
  const [servicesEnabled, setServicesEnabled] = useState<boolean>(true);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const checkPermissions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setPermState('CHECKING');

    try {
      const [services, perm] = await Promise.all([
        Location.hasServicesEnabledAsync().catch(() => true),
        Location.getForegroundPermissionsAsync().catch(() => null),
      ]);

      setServicesEnabled(services);

      if (!perm) {
        setPermState('UNAVAILABLE');
        return;
      }

      if (perm.granted) {
        setPermState(services ? 'AVAILABLE' : 'UNAVAILABLE');
      } else if (!perm.canAskAgain) {
        setPermState('DENIED');
      } else {
        setPermState('UNAVAILABLE');
      }
    } catch (err) {
      console.warn('[PatientLocationScreen] Error checking location status:', err);
      setPermState('UNAVAILABLE');
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void checkPermissions();
  }, [checkPermissions]);

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      if (res.granted) {
        setPermState('AVAILABLE');
      } else if (!res.canAskAgain) {
        setPermState('DENIED');
      } else {
        setPermState('UNAVAILABLE');
      }
    } catch (err) {
      console.warn('[PatientLocationScreen] Permission request error:', err);
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => checkPermissions(true)}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
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

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
            Location
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9EABA7' : '#52605D' }]}>
            Device safety & location availability
          </Text>
        </View>

        {/* Main Status Card */}
        {permState === 'CHECKING' ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                borderColor: isDark ? '#2C3835' : '#E5E0D8',
              },
            ]}
          >
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={[styles.checkingText, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Checking location availability...
            </Text>
          </View>
        ) : permState === 'AVAILABLE' ? (
          /* Available State */
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                borderColor: isDark ? '#2C3835' : '#E5E0D8',
              },
            ]}
          >
            {/* Status Pill Badge */}
            <View style={styles.pillRow}>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: isDark ? '#14382B' : '#E6F7F0' },
                ]}
              >
                <Ionicons name="checkmark-circle" size={16} color="#065F46" />
                <Text style={styles.statusPillText}>Location available</Text>
              </View>
            </View>

            <View style={styles.iconCircle}>
              <IconLocationPin size={32} color={C.primary} strokeWidth={2} />
            </View>

            <Text style={[styles.cardTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Location Access Active
            </Text>

            <Text style={[styles.cardDescription, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Your device location is securely available. In the event of an alert or emergency SOS,
              your location helps emergency contacts and responders find and assist you quickly.
            </Text>

            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: isDark ? '#16221F' : '#F0FDF4',
                  borderColor: isDark ? '#1E3B33' : '#BBF7D0',
                },
              ]}
            >
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={[styles.infoBoxText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                Only authorized emergency contacts and care responders can view your location.
              </Text>
            </View>
          </View>
        ) : permState === 'UNAVAILABLE' ? (
          /* Unavailable State */
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                borderColor: isDark ? '#2C3835' : '#E5E0D8',
              },
            ]}
          >
            <View style={styles.pillRow}>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: isDark ? '#3D2F14' : '#FEF3C7' },
                ]}
              >
                <Ionicons name="alert-circle" size={16} color="#D97706" />
                <Text style={[styles.statusPillText, { color: '#B45309' }]}>
                  Location disabled
                </Text>
              </View>
            </View>

            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#2D2719' : '#FEF9C3' }]}>
              <IconLocationPin size={32} color="#D97706" strokeWidth={2} />
            </View>

            <Text style={[styles.cardTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Location Access Needed
            </Text>

            <Text style={[styles.cardDescription, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Location access is currently turned off. Enabling location allows your family and emergency contacts to check your safety if you need help.
            </Text>

            <Pressable
              onPress={handleRequestPermission}
              disabled={requesting}
              accessibilityRole="button"
              accessibilityLabel="Enable Location Access"
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              {requesting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>Enable Location</Text>
              )}
            </Pressable>
          </View>
        ) : (
          /* Denied / Blocked in System Settings */
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C2422' : '#FFFFFF',
                borderColor: isDark ? '#2C3835' : '#E5E0D8',
              },
            ]}
          >
            <View style={styles.pillRow}>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: isDark ? '#3D1414' : '#FEE2E2' },
                ]}
              >
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text style={[styles.statusPillText, { color: '#B91C1C' }]}>
                  Permission denied
                </Text>
              </View>
            </View>

            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3D1C1C' : '#FEE2E2' }]}>
              <IconLocationPin size={32} color="#DC2626" strokeWidth={2} />
            </View>

            <Text style={[styles.cardTitle, { color: isDark ? '#F5F7F6' : '#161E1C' }]}>
              Permission Denied in Settings
            </Text>

            <Text style={[styles.cardDescription, { color: isDark ? '#9EABA7' : '#52605D' }]}>
              Location access was blocked in your device settings. To protect your safety during an emergency, please allow location access in your device settings.
            </Text>

            <Pressable
              onPress={handleOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Open Device Settings"
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.actionBtnText}>Open Device Settings</Text>
            </Pressable>
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
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  checkingText: {
    fontFamily: F.medium,
    fontSize: 14,
    marginTop: 12,
  },
  pillRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#065F46',
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
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  cardDescription: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  infoBoxText: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 13,
    lineHeight: 18,
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
