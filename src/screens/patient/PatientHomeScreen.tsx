import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';

import { useAuth } from '../../hooks/useAuth';
import { usePatientCareMode } from '../../hooks/usePatientCareMode';
import { useCaregiver } from '../../hooks/useCaregiver';
import { usePatientTracking } from '../../context/PatientTrackingContext';
import { writeLocationPing } from '../../utils/geofenceUtils';
import { getSocket } from '../../services/socketClient';
import apiClient from '../../services/apiClient';
import type { PatientStackParams } from '../../types/navigation.types';
import { startBackgroundTracking, updateBackgroundTrackingMode } from '../../utils/locationTask';
import { getBatteryPercentage, getNetworkStatus } from '../../utils/deviceTelemetry';
import { useTheme } from '../../theme/ThemeContext';

import { HomeHeader } from '../../components/patient/home/HomeHeader';
import { PatientOrientation } from '../../components/patient/home/PatientOrientation';
import {
  CurrentRoutineCard,
  type RoutineOccurrence,
} from '../../components/patient/home/CurrentRoutineCard';
import { TodaySchedule } from '../../components/patient/home/TodaySchedule';
import type { ScheduleItemData } from '../../components/patient/home/ScheduleItem';
import {
  TaskInstructionsModal,
  type TaskInstructionData,
} from '../../components/patient/TaskInstructionsModal';
import { signOffOccurrence } from '../../services/routineService';

type Props = NativeStackScreenProps<PatientStackParams, 'PatientHomeScreen'>;

export const PatientHomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, status, careContext } = useAuth();
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { setActivePatientId } = usePatientTracking();
  const { reloadCaregiver } = useCaregiver();

  const patientId = status === 'authenticated' && user?.id ? user.id : null;
  const displayName = user?.name || 'Friend';
  const photoUrl = (user as any)?.profile_photo_url || (user as any)?.photo_url || null;

  // Patient management mode: self-managed has routine CRUD, assisted does not
  const { isSelfManaged } = usePatientCareMode();

  // Screen State
  const [occurrences, setOccurrences] = useState<RoutineOccurrence[]>([]);
  const [hasNewMemories, setHasNewMemories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [helpOccurrence, setHelpOccurrence] = useState<TaskInstructionData | null>(null);

  // Backward-compatibility redirect if route params include initialTab
  useEffect(() => {
    const initialTab = (route.params as any)?.initialTab;
    if (initialTab === 'Activity') {
      navigation.navigate('PatientTabs', { screen: 'ActivitiesTab' } as any);
    } else if (initialTab === 'Family') {
      navigation.navigate('PatientTabs', { screen: 'FamilyTab' } as any);
    }
  }, [(route.params as any)?.initialTab, navigation]);

  // Format today's date in YYYY-MM-DD for backend queries
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Format HH:MM 12h for schedule list
  const formatTime12h = useCallback((timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    }
    return timeStr;
  }, []);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchHomeData = useCallback(
    async (isManualRefresh = false) => {
      if (!patientId) return;
      if (isManualRefresh) setRefreshing(true);

      try {
        // 1. Fetch Authoritative Routine Occurrences for today
        const occRes = await apiClient
          .get(`/patients/${patientId}/routines/occurrences`, {
            params: { date: todayStr },
          })
          .catch(() => null);

        let rawOccurrences: RoutineOccurrence[] = [];
        if (occRes?.data?.data?.occurrences) {
          rawOccurrences = occRes.data.data.occurrences;
        }

        // 2. Canonical occurrences join the definition description directly.
        const enrichedOccurrences: RoutineOccurrence[] = rawOccurrences.map((occ) => ({
          ...occ,
          photo_url: occ.photo_url || null,
          instructions_md: occ.instructions_md || occ.description || null,
        }));

        setOccurrences(enrichedOccurrences);

        // 3. Check for real memories
        try {
          const memRes = await apiClient
            .get(`/patients/${patientId}/memories`, { params: { limit: 1 } })
            .catch(() => null);
          const memories = memRes?.data?.data?.memories || memRes?.data?.memories || [];
          setHasNewMemories(Array.isArray(memories) && memories.length > 0);
        } catch {
          setHasNewMemories(false);
        }
      } catch (err) {
        console.warn('[PatientHomeScreen] Failed to fetch home data:', err);
      } finally {
        setLoading(false);
        if (isManualRefresh) setRefreshing(false);
      }
    },
    [patientId, todayStr]
  );

  useEffect(() => {
    if (patientId && isFocused) {
      void fetchHomeData();
    }
  }, [patientId, isFocused, fetchHomeData]);

  // Periodic background refresh every 60 seconds
  useEffect(() => {
    if (!patientId || !isFocused) return;
    const interval = setInterval(() => {
      void fetchHomeData();
    }, 60_000);
    return () => clearInterval(interval);
  }, [patientId, isFocused, fetchHomeData]);

  // ─── Current Routine Occurrence ─────────────────────────────────────────────
  // Determine the current actionable routine occurrence:
  // First scheduled/ongoing occurrence, or first non-completed occurrence.
  const currentOccurrence = useMemo(() => {
    if (occurrences.length === 0) return null;
    const ongoing = occurrences.find((o) => o.status === 'ONGOING');
    if (ongoing) return ongoing;
    const scheduled = occurrences.find((o) => o.status === 'SCHEDULED');
    if (scheduled) return scheduled;
    const overdue = occurrences.find((o) => o.status === 'OVERDUE');
    if (overdue) return overdue;
    // If all completed, show the most recently completed occurrence
    return occurrences[occurrences.length - 1];
  }, [occurrences]);

  // ─── Today Schedule Items ───────────────────────────────────────────────────
  const scheduleItems: ScheduleItemData[] = useMemo(() => {
    return occurrences.map((occ) => {
      const isCurrent = currentOccurrence?.id === occ.id;
      const titleLower = occ.title.toLowerCase();
      const isActivity =
        occ.category === 'EXERCISE' ||
        (occ as any).category === 'ACTIVITY' ||
        titleLower.includes('walk') ||
        titleLower.includes('exercise') ||
        titleLower.includes('stretch') ||
        titleLower.includes('puzzle') ||
        titleLower.includes('game');

      return {
        id: occ.id,
        type: isActivity ? 'ACTIVITY' : 'ROUTINE',
        title: occ.title,
        timeStr: formatTime12h(occ.scheduled_time),
        status: occ.status,
        isActive: isCurrent,
        rawItem: occ,
      };
    });
  }, [occurrences, currentOccurrence, formatTime12h]);

  // ─── Routine Sign-Off ("I'VE DONE THIS") ─────────────────────────────────────
  const handleRoutineComplete = useCallback(
    async (occurrenceId: string) => {
      if (!patientId) return;
      setSubmittingId(occurrenceId);
      try {
        // Authoritative occurrence sign-off request
        await signOffOccurrence(occurrenceId, 'Completed by patient');

        // Update local state optimistically then refetch
        setOccurrences((prev) =>
          prev.map((occ) =>
            occ.id === occurrenceId
              ? { ...occ, status: 'COMPLETED', signed_off_at: new Date().toISOString() }
              : occ
          )
        );

        // Authoritative refresh to ensure replacement rules and backend state match
        await fetchHomeData();
      } catch (err: any) {
        console.warn('[PatientHomeScreen] Sign-off error:', err);
        Alert.alert(
          'Notice',
          err?.response?.data?.error?.message ||
            'Could not complete routine. Please check your network connection.'
        );
      } finally {
        setSubmittingId(null);
      }
    },
    [patientId, fetchHomeData]
  );

  // ─── "Ask for Help" Action ──────────────────────────────────────────────────
  const handleAskForHelp = useCallback((occurrence: RoutineOccurrence) => {
    setHelpOccurrence({
      id: occurrence.id,
      title: occurrence.title,
      scheduled_time: occurrence.scheduled_time,
      instructions_md: occurrence.instructions_md || occurrence.description,
      description: occurrence.description,
      photo_url: occurrence.photo_url,
    });
  }, []);

  // ─── Schedule Item Click ────────────────────────────────────────────────────
  const handleScheduleItemPress = useCallback(
    (item: ScheduleItemData) => {
      const occ = item.rawItem as RoutineOccurrence;
      if (item.type === 'ROUTINE') {
        handleAskForHelp(occ);
      } else if (item.type === 'ACTIVITY') {
        if (occ.instructions_md || occ.description) {
          handleAskForHelp(occ);
        } else {
          navigation.navigate('PatientTabs', { screen: 'ActivitiesTab' } as any);
        }
      }
    },
    [handleAskForHelp, navigation]
  );

  // ─── Manage Routine Press (Self-Managed Patient) ─────────────────────────────
  const handleManagePress = useCallback(() => {
    navigation.navigate('PatientRoutinesScreen' as any, {
      patientId: patientId || undefined,
      patientName: displayName,
    });
  }, [navigation, patientId, displayName]);

  // ─── Background Telemetry (Runs silently in background) ─────────────────────
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let active = true;

    const startPublishing = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !active) return;

        const [batteryPct, networkStatus] = await Promise.all([
          getBatteryPercentage(),
          getNetworkStatus(),
        ]);

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) {
          await writeLocationPing({
            patientId,
            coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            accuracyM: loc.coords.accuracy ?? undefined,
            batteryPct,
            networkStatus,
            source: 'foreground',
          });
        }

        locationSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 30_000, distanceInterval: 10 },
          async (l) => {
            if (!active) return;
            try {
              const [bPct, nStatus] = await Promise.all([
                getBatteryPercentage(),
                getNetworkStatus(),
              ]);
              await writeLocationPing({
                patientId,
                coords: { latitude: l.coords.latitude, longitude: l.coords.longitude },
                accuracyM: l.coords.accuracy ?? undefined,
                batteryPct: bPct,
                networkStatus: nStatus,
                source: 'foreground',
              });
            } catch {
              // Silent background failure handling
            }
          }
        );
      } catch {
        // Silent background failure handling
      }
    };

    void startPublishing();
    return () => {
      active = false;
      locationSubRef.current?.remove();
    };
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      void startBackgroundTracking(patientId);
      setActivePatientId(patientId);
    }
  }, [patientId, setActivePatientId]);

  // WebSocket listeners for safety state & refresh
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !patientId) return;

    socket.emit('join:patient', patientId);

    const handleLocationRequest = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await writeLocationPing({
          patientId,
          coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          accuracyM: loc.coords.accuracy ?? undefined,
          source: 'foreground',
        });
      } catch {
        // Silent
      }
    };

    const handleStateChange = (data: any) => {
      const inEmergency =
        data?.safety_status === 'WANDERING' ||
        data?.safety_status === 'CRITICAL' ||
        data?.safety_status === 'UNSAFE' ||
        data?.sos_active === true;
      void updateBackgroundTrackingMode(patientId, inEmergency);
    };

    const handleRelationshipChange = () => {
      void reloadCaregiver(patientId, true);
    };

    const handleRoutineUpdate = () => {
      void fetchHomeData();
    };

    socket.on('location:request', handleLocationRequest);
    socket.on('state:change', handleStateChange);
    socket.on('relationship:change', handleRelationshipChange);
    socket.on('routine:update', handleRoutineUpdate);
    socket.on('task:update', handleRoutineUpdate);

    return () => {
      socket.off('location:request', handleLocationRequest);
      socket.off('state:change', handleStateChange);
      socket.off('relationship:change', handleRelationshipChange);
      socket.off('routine:update', handleRoutineUpdate);
      socket.off('task:update', handleRoutineUpdate);
    };
  }, [patientId, reloadCaregiver, fetchHomeData]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  const screenBg = mode === 'dark' ? '#121816' : '#FAF8F5';

  return (
    <View
      className="flex-1 bg-[#FAF8F5] dark:bg-[#121816]"
      style={{
        paddingTop: Math.max(insets.top, 12),
        backgroundColor: screenBg,
      }}
    >
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={screenBg}
        translucent={false}
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHomeData(true)}
            tintColor="#0E7A67"
            colors={['#0E7A67']}
            progressBackgroundColor={mode === 'dark' ? '#1C2422' : '#FFFFFF'}
          />
        }
      >
        {/* 1. Brand Header & SOS */}
        <HomeHeader patientId={patientId} />

        {/* 2. Patient Orientation (Avatar, Memory Ring, Greeting, Name, Date) */}
        <PatientOrientation
          displayName={displayName}
          photoUrl={photoUrl}
          hasNewMemories={hasNewMemories}
          onPressProfile={() => navigation.navigate('PatientSettingsScreen')}
        />

        {/* 3. Current Routine Card */}
        <CurrentRoutineCard
          occurrence={currentOccurrence}
          onComplete={handleRoutineComplete}
          onAskForHelp={handleAskForHelp}
          isSubmitting={submittingId !== null}
        />

        {/* 4. Today Schedule List */}
        <TodaySchedule
          items={scheduleItems}
          isSelfManaged={isSelfManaged}
          onManagePress={handleManagePress}
          onItemPress={handleScheduleItemPress}
        />
      </ScrollView>

      {/* Task Instructions Modal */}
      <TaskInstructionsModal
        visible={helpOccurrence !== null}
        task={helpOccurrence}
        onClose={() => setHelpOccurrence(null)}
      />
    </View>
  );
};
