/**
 * SureStep — src/hooks/useCaregiverDashboard.ts
 * State, API fetching, WebSocket subscriptions, and derived data for the Caregiver Dashboard.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { getIncomingCareRequests } from '../services/careRequestService';
import { fetchOccurrences } from '../services/routineService';
import {
  listMySafetyAlerts,
  type SafetyAlert,
} from '../services/safetyService';
import { getSocket } from '../services/socketClient';
import { getCaregiverProfile } from '../services/userService';
import type {
  CaregiverTab,
  IconName,
  Patient,
} from '../types/caregiverDashboard.types';
import {
  comparePatientsByPriority,
  formatRole,
  hasUrgentSafetyState,
  isUnresolvedAlert,
} from '../utils/caregiverDashboardUtils';
import { relativeTime } from '../utils/dateUtils';

export const useCaregiverDashboard = () => {
  const { status, user } = useAuth();

  const userId = status === 'authenticated' ? user?.id : undefined;

  const caregiverPhone = user?.phone || '';

  const [activeTab, setActiveTab] = useState<CaregiverTab>('Home');

  const [patients, setPatients] = useState<Patient[]>([]);

  const [alertsFeed, setAlertsFeed] = useState<SafetyAlert[]>([]);

  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const [caregiverProfile, setCaregiverProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [alertsAvailable, setAlertsAvailable] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);

  const [requestsLoading, setRequestsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [searchVisible, setSearchVisible] = useState(false);

  const patientRequestId = useRef(0);
  const profileRequestId = useRef(0);
  const inquiryRequestId = useRef(0);

  /* ===================================================
     PATIENT DATA
     Existing API logic retained.
  =================================================== */

  const loadPatients = useCallback(async () => {
    if (!userId) return;

    const requestId = ++patientRequestId.current;

    setError(null);

    try {
      const { data } = await apiClient.get('/relationships/my-patients');

      const rows: any[] = data?.data?.patients ?? [];

      const assignedIds = new Set(rows.map((r) => r.id));

      const alertsPromise = listMySafetyAlerts()
        .then((feed) => {
          if (requestId === patientRequestId.current) {
            setAlertsFeed(feed.filter((a) => assignedIds.has(a.patient_id)));
            setAlertsAvailable(true);
          }
        })
        .catch((err) => {
          console.warn('[CaregiverTriage] Safety feed failed', err);

          if (requestId === patientRequestId.current) {
            setAlertsAvailable(false);
          }
        });

      const mappedPatients = await Promise.all(
        rows.map(async (p): Promise<Patient> => {
          let completedTasks = 0;
          let totalTasks = 0;
          let overdueTasks = 0;
          let ongoingTasks = 0;

          let lastActivity = 'No activity yet';

          let tasksAvailable = false;

          try {
            const occurrences = await fetchOccurrences(p.id);

            const normalized = occurrences.map((item) => ({
              status: item.status.toLowerCase(),

              completedAt: item.signed_off_at ?? item.completed_at ?? null,
            }));

            completedTasks = normalized.filter(
              (item) => item.status === 'completed'
            ).length;

            totalTasks = normalized.length;

            overdueTasks = normalized.filter(
              (item) => item.status === 'overdue'
            ).length;

            ongoingTasks = normalized.filter(
              (item) => item.status === 'ongoing'
            ).length;

            const completionTimes = normalized
              .filter((item) => !!item.completedAt)
              .map((item) => new Date(item.completedAt!).getTime())
              .filter(Number.isFinite);

            if (completionTimes.length > 0) {
              lastActivity = relativeTime(Math.max(...completionTimes));
            }

            tasksAvailable = true;
          } catch (err) {
            console.warn('[CaregiverTriage] Routine data unavailable', err);

            lastActivity = 'Activity unavailable';
          }

          const battery =
            p.battery_pct != null ? Number(p.battery_pct) : null;

          return {
            id: p.id,
            name: p.name || 'Patient',
            photoUrl: p.photo_url || null,
            city: p.city || null,
            phone: p.phone || '',
            dateOfBirth: p.date_of_birth || null,

            locationState: p.location_state ?? null,

            safetyState: p.safety_state ?? null,

            currentZoneName: p.current_zone_name ?? null,
            lastKnownZoneName: p.last_known_zone_name ?? p.current_zone_name ?? null,

            lastPingAt: p.last_ping_at ?? null,
            accuracyM: p.accuracy_m != null ? Number(p.accuracy_m) : null,
            locationFreshness: p.location_freshness ?? 'UNAVAILABLE',
            isBoundaryUncertain: Boolean(p.is_boundary_uncertain),
            monitoredZoneCount: Number(p.monitored_zone_count ?? 0),
            hasActiveSafeZone:
              typeof p.has_active_safe_zone === 'boolean'
                ? p.has_active_safe_zone
                : Number(p.monitored_zone_count ?? 0) > 0,

            sosActive: p.sos_active === true,

            batteryPct:
              battery !== null &&
              Number.isFinite(battery) &&
              battery >= 0 &&
              battery <= 100
                ? battery
                : null,

            networkStatus: p.network_status ?? null,

            completedTasks,
            totalTasks,
            overdueTasks,
            ongoingTasks,
            lastActivity,
            tasksAvailable,
          };
        })
      );

      await alertsPromise;

      if (requestId !== patientRequestId.current) {
        return;
      }

      setPatients(mappedPatients);
    } catch (err: any) {
      if (requestId !== patientRequestId.current) {
        return;
      }

      const httpStatus = err?.response?.status;
      if (httpStatus === 401 || httpStatus === 403) {
        // Clear protected patient/alert caches immediately on access revocation
        setPatients([]);
        setAlertsFeed([]);
      }

      setError(err?.message || 'Unable to load patients.');

      setAlertsAvailable(false);
    } finally {
      if (requestId === patientRequestId.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  /* ===================================================
     CARE REQUESTS
  =================================================== */

  const loadPendingRequests = useCallback(async () => {
    if (!userId) return;

    const requestId = ++inquiryRequestId.current;

    setRequestsLoading(true);

    try {
      const requests = await getIncomingCareRequests('PENDING');

      if (requestId === inquiryRequestId.current) {
        setPendingCount(requests.length);
      }
    } catch (err) {
      console.warn('[CaregiverTriage] Requests unavailable', err);

      if (requestId === inquiryRequestId.current) {
        setPendingCount(null);
      }
    } finally {
      if (requestId === inquiryRequestId.current) {
        setRequestsLoading(false);
      }
    }
  }, [userId]);

  /* ===================================================
     CAREGIVER PROFILE
  =================================================== */

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    const requestId = ++profileRequestId.current;

    setProfileLoading(true);

    try {
      const response = await getCaregiverProfile(userId);

      if (requestId === profileRequestId.current) {
        setCaregiverProfile(
          response.data?.data ?? response.data ?? null
        );
      }
    } catch (err) {
      console.warn('[CaregiverTriage] Profile unavailable', err);

      if (requestId === profileRequestId.current) {
        setCaregiverProfile(null);
      }
    } finally {
      if (requestId === profileRequestId.current) {
        setProfileLoading(false);
      }
    }
  }, [userId]);

  /* ===================================================
     REFRESH
  =================================================== */

  const refreshAll = useCallback(async () => {
    if (!userId) return;

    await Promise.all([
      loadPatients(),
      loadPendingRequests(),
      loadProfile(),
    ]);
  }, [userId, loadPatients, loadPendingRequests, loadProfile]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  /* Clear previous account data */

  useEffect(() => {
    setPatients([]);
    setAlertsFeed([]);
    setCaregiverProfile(null);
    setPendingCount(null);
    setAlertsAvailable(false);
    setError(null);

    setLoading(Boolean(userId));
    setProfileLoading(Boolean(userId));
    setRequestsLoading(Boolean(userId));

    return () => {
      patientRequestId.current++;
      profileRequestId.current++;
      inquiryRequestId.current++;
    };
  }, [userId]);

  /* Refresh when screen receives focus */

  useFocusEffect(
    useCallback(() => {
      void refreshAll();
    }, [refreshAll])
  );

  /* ===================================================
     REALTIME SOCKETS
     Existing subscription logic retained.
  =================================================== */

  const patientIds = useMemo(
    () =>
      patients
        .map((patient) => patient.id)
        .sort()
        .join(','),
    [patients]
  );

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();

    if (!socket) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const joinPatientRooms = () => {
      patientIds
        .split(',')
        .filter(Boolean)
        .forEach((patientId) => {
          socket.emit('join:patient', patientId);
        });
    };

    const refreshPatientData = () => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        void loadPatients();
      }, 150);
    };

    const refreshRelationships = () => {
      refreshPatientData();

      void loadPendingRequests();
    };

    const handleReconnect = () => {
      joinPatientRooms();
      refreshRelationships();
    };

    joinPatientRooms();

    socket.on('connect', handleReconnect);
    socket.on('state:change', refreshPatientData);
    socket.on('sos:triggered', refreshPatientData);
    socket.on('alert:new', refreshPatientData);
    socket.on('alert:updated', refreshPatientData);
    socket.on('alert:acknowledged', refreshPatientData);
    socket.on('alert:response', refreshPatientData);
    socket.on('alert:resolved', refreshPatientData);
    socket.on('geofences:change', refreshPatientData);
    socket.on('task:change', refreshPatientData);
    socket.on('relationship:change', refreshRelationships);
    socket.on('circle:member_removed', refreshRelationships);
    socket.on('circle:member_left', refreshRelationships);
    socket.on('circle:membership_changed', refreshRelationships);
    socket.on('circle:permissions_changed', refreshRelationships);
    socket.on('circle:ownership_transferred', refreshRelationships);
    socket.on('circle:terminated', refreshRelationships);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      socket.off('connect', handleReconnect);
      socket.off('state:change', refreshPatientData);
      socket.off('sos:triggered', refreshPatientData);
      socket.off('alert:new', refreshPatientData);
      socket.off('alert:updated', refreshPatientData);
      socket.off('alert:acknowledged', refreshPatientData);
      socket.off('alert:response', refreshPatientData);
      socket.off('alert:resolved', refreshPatientData);
      socket.off('geofences:change', refreshPatientData);
      socket.off('task:change', refreshPatientData);
      socket.off('relationship:change', refreshRelationships);
      socket.off('circle:member_removed', refreshRelationships);
      socket.off('circle:member_left', refreshRelationships);
      socket.off('circle:membership_changed', refreshRelationships);
      socket.off('circle:permissions_changed', refreshRelationships);
      socket.off('circle:ownership_transferred', refreshRelationships);
      socket.off('circle:terminated', refreshRelationships);
    };
  }, [userId, patientIds, loadPatients, loadPendingRequests]);

  /* ===================================================
     DERIVED DATA
  =================================================== */

  const activeAlerts = useMemo(
    () => alertsFeed.filter(isUnresolvedAlert),
    [alertsFeed]
  );

  const sortedPatients = useMemo(
    () =>
      [...patients].sort((a, b) =>
        comparePatientsByPriority(a, b, activeAlerts)
      ),
    [patients, activeAlerts]
  );

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return sortedPatients;
    }

    return sortedPatients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        patient.phone.includes(query)
    );
  }, [sortedPatients, searchQuery]);

  const urgentPatientCount = patients.filter((p) =>
    hasUrgentSafetyState(p, activeAlerts)
  ).length;

  const notificationCount = activeAlerts.length + (pendingCount ?? 0);

  const caregiverName =
    user?.name || caregiverProfile?.name || 'Caregiver';

  const firstName = caregiverName.trim().split(/\s+/)[0];

  const caregiverPhoto =
    user?.photo_url || caregiverProfile?.photo_url || null;

  const professionalRole = formatRole(
    caregiverProfile?.professionalRole ||
      caregiverProfile?.professional_role
  );

  const discoverability =
    caregiverProfile?.isDiscoverable ??
    caregiverProfile?.is_discoverable;

  const visibilityLabel =
    discoverability === true
      ? 'Discoverable profile'
      : discoverability === false
        ? 'Private profile'
        : profileLoading
          ? 'Loading profile'
          : 'Visibility unavailable';

  const visibilityIcon: IconName =
    discoverability === true
      ? 'globe-outline'
      : discoverability === false
        ? 'lock-closed-outline'
        : 'help-circle-outline';

  const requestSubtitle =
    requestsLoading && pendingCount === null
      ? 'Checking requests...'
      : pendingCount === null
        ? 'Request count unavailable'
        : pendingCount > 0
          ? `${pendingCount} pending ${
              pendingCount === 1 ? 'request' : 'requests'
            }`
          : 'No pending requests';

  const toggleSearch = useCallback(() => {
    setSearchVisible((previous) => {
      if (previous) {
        setSearchQuery('');
      }
      return !previous;
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    activeTab,
    setActiveTab,
    patients,
    sortedPatients,
    filteredPatients,
    activeAlerts,
    pendingCount,
    loading,
    refreshing,
    error,
    alertsAvailable,
    urgentPatientCount,
    notificationCount,
    caregiverName,
    firstName,
    caregiverPhoto,
    caregiverPhone,
    professionalRole,
    visibilityLabel,
    visibilityIcon,
    requestSubtitle,
    searchQuery,
    setSearchQuery,
    searchVisible,
    toggleSearch,
    clearSearch,
    refreshAll,
    handleRefresh,
  };
};
