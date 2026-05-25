/**
 * FamilyDashboardScreen
 * Read-only view for family members linked to a patient.
 * Shows:
 *  - Live safety status (large, glanceable)
 *  - Embedded mini-map (tapable for full map)
 *  - Today's routine progress
 *  - Recent geofence alerts feed
 *  - Bottom nav: Home | Map | Alerts
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import type { HomeStackParamList } from '../navigation/RootNavigator';
import { useTasks } from '../context/taskContext';
import { supabase } from '../utils/supabaseClient';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import {
  checkBreach,
  fetchPatientGeofences,
  writeLocationPing,
  type Coords,
  type GeofenceZone,
  type BreachStatus,
} from '../utils/geofence';
import type { GeofenceAlert } from '../context/geofenceContext';

type Props = NativeStackScreenProps<HomeStackParamList, 'FamilyDashboard'>;
type FamilyTab = 'Home' | 'Map' | 'Alerts';

// ─── Safety status config ─────────────────────────────────────────────────────
function safetyCard(status: BreachStatus['status'], coordsAgeS: number) {
  if (coordsAgeS > 120 || status === 'no_signal') return {
    bg: '#1F2937', border: '#374151', labelColor: '#D1D5DB',
    badge: 'NO SIGNAL', badgeBg: '#374151', icon: '📵',
    description: 'Cannot reach device. Please call the caregiver.',
  };
  switch (status) {
    case 'safe': return {
      bg: '#ECFDF5', border: '#6EE7B7', labelColor: '#065F46',
      badge: 'SAFE', badgeBg: '#10B981', icon: '✅',
      description: 'Patient is within their safe zone.',
    };
    case 'approaching': return {
      bg: '#FFFBEB', border: '#FCD34D', labelColor: '#92400E',
      badge: 'NEAR BOUNDARY', badgeBg: '#F59E0B', icon: '⚠️',
      description: 'Patient is approaching the edge of their safe zone.',
    };
    case 'breach': return {
      bg: '#FEF2F2', border: '#FCA5A5', labelColor: '#991B1B',
      badge: 'OUTSIDE ZONE', badgeBg: '#EF4444', icon: '🚨',
      description: 'Patient has left the safe zone. Caregiver has been alerted.',
    };
    default: return {
      bg: C.surface, border: C.border, labelColor: C.textSecondary,
      badge: 'LOCATING…', badgeBg: C.textMuted, icon: '📡',
      description: 'Acquiring patient location…',
    };
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const FamilyDashboardScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientPhone, patientName, familyPhone } = route.params;

  const [activeTab,   setActiveTab]   = useState<FamilyTab>('Home');
  const [coords,      setCoords]      = useState<Coords | null>(null);
  const [coordsTs,    setCoordsTs]    = useState(0);
  const [coordsAgeS,  setCoordsAgeS]  = useState(0);
  const [zones,       setZones]       = useState<GeofenceZone[]>([]);
  const [alerts,      setAlerts]      = useState<GeofenceAlert[]>([]);
  const [mapReady,    setMapReady]    = useState(false);

  const { tasks } = useTasks();
  const fgSubRef    = useRef<Location.LocationSubscription | null>(null);
  const ageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Patient tasks for routine progress
  const patientTasks = useMemo(
    () => tasks.filter((t) => t.patientId === patientPhone),
    [tasks, patientPhone],
  );
  const completedCount = patientTasks.filter((t) => t.status === 'done').length;
  const totalTasks     = patientTasks.length;
  const routinePercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Breach status
  const breachStatus: BreachStatus = coords && zones.length > 0
    ? checkBreach(coords, zones)
    : { status: 'no_signal' };
  const card = safetyCard(breachStatus.status, coordsAgeS);

  // ── Load zones & alerts ────────────────────────────────────────────────────
  useEffect(() => {
    void fetchPatientGeofences(patientPhone).then(setZones);

    // REMOVED: Supabase migration to Express/PostgreSQL
    console.warn('[FamilyDashboard] Load geofence alerts: Supabase removed, setting to empty array');
    setAlerts([]);
  }, [patientPhone]);

  // ── Age counter ────────────────────────────────────────────────────────────
  useEffect(() => {
    ageTimerRef.current = setInterval(() => {
      if (coordsTs > 0) setCoordsAgeS(Math.floor((Date.now() - coordsTs) / 1000));
    }, 1000);
    return () => { if (ageTimerRef.current) clearInterval(ageTimerRef.current); };
  }, [coordsTs]);

  // ── Foreground location ────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('denied');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c: Coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(c); setCoordsTs(Date.now());
      void writeLocationPing({ patientId: patientPhone, coords: c, source: 'foreground' });

      fgSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 20_000, distanceInterval: 10 },
        (l) => {
          const c2: Coords = { latitude: l.coords.latitude, longitude: l.coords.longitude };
          setCoords(c2); setCoordsTs(Date.now());
          void writeLocationPing({ patientId: patientPhone, coords: c2, source: 'foreground' });
        },
      );
    } catch {
      const fb = zones[0]?.center ?? { latitude: 12.9716, longitude: 77.5946 };
      setCoords({ latitude: fb.latitude + 0.001, longitude: fb.longitude - 0.001 });
      setCoordsTs(Date.now());
    } finally {
      setMapReady(true);
    }
  }, [patientPhone, zones]);

  useEffect(() => {
    void startTracking();
    return () => { fgSubRef.current?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime alerts ────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel(`family_alerts_${patientPhone}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'geofence_alerts',
        filter: `patient_id=eq.${patientPhone}`,
      }, (payload) => {
        const r = payload.new as {
          id: string; patient_id: string; geofence_id: string | null;
          breach_type: 'exit' | 'enter'; distance_m: number;
          created_at: string; acknowledged_at: string | null;
        };
        setAlerts((prev) => [{
          id: r.id, patientId: r.patient_id, geofenceId: r.geofence_id,
          breachType: r.breach_type, distanceM: Number(r.distance_m),
          createdAt: r.created_at, acknowledgedAt: r.acknowledged_at,
        }, ...prev]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [patientPhone]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatAge = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)} hr ago`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{patientName[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerLabel}>FAMILY VIEW</Text>
          <Text style={styles.headerName}>{patientName}</Text>
        </View>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.signOutBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.signOutText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'Home' && (
          <>
            {/* ── Large safety card ──────────────────────────────────── */}
            <View style={[styles.safetyCard, { backgroundColor: card.bg, borderColor: card.border }]}>
              <Text style={styles.safetyIcon}>{card.icon}</Text>
              <View style={[styles.safetyBadge, { backgroundColor: card.badgeBg }]}>
                <Text style={styles.safetyBadgeText}>{card.badge}</Text>
              </View>
              <Text style={[styles.safetyDescription, { color: card.labelColor }]}>
                {card.description}
              </Text>
              {coordsAgeS > 0 && (
                <Text style={styles.safetyAge}>Last updated {coordsAgeS}s ago</Text>
              )}
            </View>

            {/* ── Mini map ───────────────────────────────────────────── */}
            <Pressable
              onPress={() => navigation.navigate('GeofenceMap', { patientId: patientPhone, patientName, caregiverPhone: familyPhone })}
              style={styles.miniMapWrap}
            >
              {!mapReady ? (
                <View style={styles.miniMapLoading}>
                  <ActivityIndicator color={C.primary} />
                </View>
              ) : (
                <MapView
                  style={styles.miniMap}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  pointerEvents="none"
                  initialRegion={{
                    ...(coords ?? zones[0]?.center ?? { latitude: 12.9716, longitude: 77.5946 }),
                    latitudeDelta: 0.018, longitudeDelta: 0.018,
                  }}
                >
                  {zones.filter((z) => z.isActive).map((z) => (
                    <Circle
                      key={z.id}
                      center={z.center}
                      radius={z.radiusM}
                      fillColor="rgba(14,122,103,0.10)"
                      strokeColor="rgba(14,122,103,0.45)"
                      strokeWidth={2}
                    />
                  ))}
                  {coords && (
                    <Marker coordinate={coords}>
                      <View style={[styles.miniMarker, { backgroundColor: breachStatus.status === 'breach' ? '#EF4444' : C.primary }]}>
                        <Text style={styles.miniMarkerText}>{patientName[0]?.toUpperCase()}</Text>
                      </View>
                    </Marker>
                  )}
                </MapView>
              )}
              <View style={styles.miniMapOverlay}>
                <Text style={styles.miniMapTap}>Tap to open full map ›</Text>
              </View>
            </Pressable>

            {/* ── Routine Progress ────────────────────────────────────── */}
            <View style={styles.routineCard}>
              <Text style={styles.sectionTitle}>📋  Today's Routine</Text>
              <View style={styles.routineProgressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${routinePercent}%` as `${number}%` }]} />
                </View>
                <Text style={styles.progressText}>{completedCount}/{totalTasks}</Text>
              </View>
              {patientTasks.slice(0, 4).map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <View style={[
                    styles.taskDot,
                    task.status === 'done' ? styles.taskDotDone
                    : task.status === 'missed' ? styles.taskDotMissed
                    : styles.taskDotPending,
                  ]} />
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                  <Text style={styles.taskTime}>{task.time}</Text>
                </View>
              ))}
              {patientTasks.length === 0 && (
                <Text style={styles.emptyText}>No routines set yet.</Text>
              )}
            </View>
          </>
        )}

        {activeTab === 'Map' && (
          <Pressable
            style={styles.fullMapBtn}
            onPress={() => navigation.navigate('GeofenceMap', {
              patientId: patientPhone, patientName, caregiverPhone: familyPhone,
            })}
          >
            <Text style={styles.fullMapBtnText}>Open Full Map</Text>
          </Pressable>
        )}

        {activeTab === 'Alerts' && (
          <View style={styles.alertsList}>
            <Text style={styles.sectionTitle}>🔔  Recent Alerts</Text>
            {alerts.length === 0 ? (
              <Text style={styles.emptyText}>No alerts — all clear! ✅</Text>
            ) : (
              alerts.map((alert) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertRow,
                    alert.breachType === 'exit' ? styles.alertRowBreach : styles.alertRowEntry,
                  ]}
                >
                  <Text style={styles.alertIcon}>
                    {alert.breachType === 'exit' ? '🚨' : '✅'}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.alertTitle}>
                      {alert.breachType === 'exit' ? 'Left safe zone' : 'Returned to safe zone'}
                    </Text>
                    {alert.breachType === 'exit' && (
                      <Text style={styles.alertMeta}>{Math.round(alert.distanceM)} m beyond boundary</Text>
                    )}
                    <Text style={styles.alertTime}>{formatAge(alert.createdAt)}</Text>
                  </View>
                  {alert.acknowledgedAt && (
                    <Text style={styles.alertAcked}>✓ Acked</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {(['Home', 'Map', 'Alerts'] as FamilyTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const icons: Record<FamilyTab, string> = { Home: '🏠', Map: '🗺️', Alerts: '🔔' };
          return (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.bottomTab}>
              <Text style={[styles.bottomTabIcon, isActive && { opacity: 1 }]}>{icons[tab]}</Text>
              <Text style={[styles.bottomLabel, isActive && styles.bottomLabelActive]}>{tab}</Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { backgroundColor: C.bg, paddingHorizontal: 0, paddingVertical: 0 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: F.bold, fontSize: 18, color: C.primary },
  headerLabel:   { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.1, color: C.primary },
  headerName:    { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary, marginTop: 1 },
  signOutBtn:    { paddingHorizontal: 10, paddingVertical: 6 },
  signOutText:   { fontFamily: F.bold, fontSize: 13, color: C.textSecondary },

  // Safety card
  safetyCard: {
    borderRadius: 24, borderWidth: 2,
    paddingHorizontal: 20, paddingVertical: 22,
    alignItems: 'center', marginTop: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
  },
  safetyIcon:        { fontSize: 54, marginBottom: 10 },
  safetyBadge:       { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 6, marginBottom: 10 },
  safetyBadgeText:   { fontFamily: F.extraBold, fontSize: 14, color: '#fff', letterSpacing: 1.2 },
  safetyDescription: { fontFamily: F.medium, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  safetyAge:         { fontFamily: F.regular, fontSize: 11, color: '#9CA3AF', marginTop: 8 },

  // Mini map
  miniMapWrap: {
    height: 180, borderRadius: 18, overflow: 'hidden',
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
  },
  miniMapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  miniMap:        { flex: 1 },
  miniMapOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', paddingVertical: 7, alignItems: 'center',
  },
  miniMapTap: { fontFamily: F.bold, fontSize: 12, color: '#fff' },
  miniMarker: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  miniMarkerText: { fontFamily: F.extraBold, fontSize: 14, color: '#fff' },

  // Routine card
  routineCard:       { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  sectionTitle:      { fontFamily: F.bold, fontSize: 16, color: C.textPrimary, marginBottom: 12 },
  routineProgressRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressBar:       { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.border },
  progressFill:      { height: 8, borderRadius: 4, backgroundColor: C.primary },
  progressText:      { fontFamily: F.bold, fontSize: 13, color: C.primary },
  taskRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  taskDot:           { width: 10, height: 10, borderRadius: 5 },
  taskDotDone:       { backgroundColor: C.primary },
  taskDotMissed:     { backgroundColor: '#EF4444' },
  taskDotPending:    { backgroundColor: C.border },
  taskTitle:         { flex: 1, fontFamily: F.medium, fontSize: 14, color: C.textPrimary },
  taskTime:          { fontFamily: F.regular, fontSize: 12, color: C.textMuted },

  // Full map button
  fullMapBtn: {
    borderRadius: 16, backgroundColor: C.primary, marginTop: 20,
    paddingVertical: 16, alignItems: 'center',
  },
  fullMapBtnText: { fontFamily: F.bold, fontSize: 16, color: '#fff' },

  // Alerts
  alertsList:  { marginTop: 4 },
  alertRow:    {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1,
  },
  alertRowBreach: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  alertRowEntry:  { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  alertIcon:      { fontSize: 22 },
  alertTitle:     { fontFamily: F.bold, fontSize: 14, color: C.textPrimary },
  alertMeta:      { fontFamily: F.regular, fontSize: 12, color: '#EF4444', marginTop: 2 },
  alertTime:      { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 3 },
  alertAcked:     { fontFamily: F.bold, fontSize: 11, color: C.primary },

  emptyText: { fontFamily: F.regular, fontSize: 14, color: C.textMuted, textAlign: 'center', paddingVertical: 20 },

  // Bottom nav
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 76,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row', alignItems: 'center',
  },
  bottomTab:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, position: 'relative' },
  bottomTabIcon:      { fontSize: 22, opacity: 0.55 },
  bottomLabel:        { fontFamily: F.medium, fontSize: 10, color: C.textMuted, letterSpacing: 0.3, marginTop: 2 },
  bottomLabelActive:  { fontFamily: F.bold, color: C.primary },
  activeIndicator:    { position: 'absolute', bottom: 0, width: 18, height: 2.5, borderRadius: 2, backgroundColor: C.primary },
});
