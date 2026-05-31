/**
 * GeofenceMapScreen  (v3 — full UX overhaul)
 *
 * What's new over v2:
 *  - Reads PATIENT location from Supabase Realtime (not caregiver's own GPS)
 *  - Friendly state card: "Safe at Home", "Moving Nearby", "Outside Safe Area"
 *  - Pulsing animation on patient marker during live updates
 *  - Breach history slide-up panel
 *  - "+ Add Zone" FAB always visible
 *  - "Navigate to Patient" button when in breach
 *  - Confidence indicator (location age)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../../types/navigation.types';

// Navigation types migrated to src/types/navigation.types.ts
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  haversineMeters,
  checkBreach,
  fetchPatientGeofences,
  fetchLocationTrail,
  fetchLatestPatientLocation,
  fetchBreachHistory,
  subscribeToPatientLocation,
  acknowledgeAlert,
  logBreachAlert,
  type Coords,
  type GeofenceZone,
  type BreachStatus,
  type BreachAlert,
} from '../../utils/geofenceUtils';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverPatientMapScreen'>;

// â”€â”€â”€ State card config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type StateConfig = {
  bg: string; border: string; dot: string;
  emoji: string; title: string; subtitle: string;
  titleColor: string;
};

function getStateConfig(status: BreachStatus['status'], ageS: number): StateConfig {
  if (ageS > 120) return {
    bg: '#1F2937', border: '#374151', dot: '#6B7280',
    emoji: '📵', title: 'No Signal',
    subtitle: `Location lost · last seen ${Math.floor(ageS / 60)} min ago`,
    titleColor: '#D1D5DB',
  };
  switch (status) {
    case 'safe': return {
      bg: '#ECFDF5', border: '#10B981', dot: '#10B981',
      emoji: '🏠', title: 'Safe at Home',
      subtitle: 'Patient is inside the safe zone',
      titleColor: '#065F46',
    };
    case 'approaching': return {
      bg: '#FFFBEB', border: '#F59E0B', dot: '#F59E0B',
      emoji: '🚶', title: 'Moving Nearby',
      subtitle: 'Patient is close to the zone boundary',
      titleColor: '#92400E',
    };
    case 'breach': return {
      bg: '#FEF2F2', border: '#EF4444', dot: '#EF4444',
      emoji: '⚠️', title: 'Outside Safe Area',
      subtitle: 'Patient has left the safe zone',
      titleColor: '#991B1B',
    };
    default: return {
      bg: C.surface, border: C.border, dot: C.textMuted,
      emoji: '📡', title: 'Locating Patient...',
      subtitle: 'Acquiring GPS signal',
      titleColor: C.textSecondary,
    };
  }
}

function formatAge(ageS: number): string {
  if (ageS < 5)  return 'Live · just now';
  if (ageS < 60) return `Updated ${ageS}s ago`;
  return `Updated ${Math.floor(ageS / 60)}m ago`;
}

function formatBreachTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  return `${h}h ${diffMin % 60}m ago`;
}

// â”€â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CaregiverPatientMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, patientName } = route.params;
  const { user } = useAuth();
  const caregiverPhone = user?.phone ?? '';

  // â”€â”€ Core data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [coords,     setCoords]     = useState<Coords | null>(null);
  const [coordsTs,   setCoordsTs]   = useState(0);
  const [ageS,       setAgeS]       = useState(0);
  const [zones,      setZones]      = useState<GeofenceZone[]>([]);
  const [trail,      setTrail]      = useState<Coords[]>([]);
  const [history,    setHistory]    = useState<BreachAlert[]>([]);
  const [ready,      setReady]      = useState(false);

  // â”€â”€ Breach dedup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const [acked,       setAcked]       = useState(false);

  // â”€â”€ Panel state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showHistory, setShowHistory] = useState(false);

  // â”€â”€ Pulse animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const triggerPulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.35, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0,  duration: 300, useNativeDriver: true }),
    ]).start();
  }, [pulseAnim]);

  const mapRef    = useRef<MapView>(null);
  const ageTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // â”€â”€ Age counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    ageTimer.current = setInterval(() => {
      if (coordsTs > 0) setAgeS(Math.floor((Date.now() - coordsTs) / 1000));
    }, 1000);
    return () => { if (ageTimer.current) clearInterval(ageTimer.current); };
  }, [coordsTs]);

  // â”€â”€ Reload zones whenever this screen comes back into focus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // (Fixes stale zones after user edits/deletes in GeofenceEditorScreen)
  useFocusEffect(
    useCallback(() => {
      void fetchPatientGeofences(patientId).then(setZones);
    }, [patientId]),
  );

  // â”€â”€ Initial full data load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const load = async () => {
      const [trailData, latestLoc, histData] = await Promise.all([
        fetchLocationTrail(patientId, 25),
        fetchLatestPatientLocation(patientId),
        fetchBreachHistory(patientId, 10),
      ]);
      setTrail(trailData);
      setHistory(histData);

      if (latestLoc) {
        const c: Coords = { latitude: latestLoc.latitude, longitude: latestLoc.longitude };
        setCoords(c);
        setCoordsTs(latestLoc.recordedAt);
        setAgeS(Math.floor((Date.now() - latestLoc.recordedAt) / 1000));

        // Centre map on patient
        mapRef.current?.animateToRegion({
          ...c, latitudeDelta: 0.018, longitudeDelta: 0.018,
        }, 600);
      }

      setReady(true);
    };
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // â”€â”€ Realtime subscription to new location pings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const unsub = subscribeToPatientLocation(patientId, (loc: Coords & { recordedAt: number }) => {
      const c: Coords = { latitude: loc.latitude, longitude: loc.longitude };
      setCoords(c);
      setCoordsTs(loc.recordedAt);
      setAgeS(0);
      setTrail((prev) => [...prev.slice(-24), c]);
      triggerPulse();
      // Auto-pan map to the new patient position
      mapRef.current?.animateToRegion({
        ...c, latitudeDelta: 0.018, longitudeDelta: 0.018,
      }, 800);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // â”€â”€ Derived: breach status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const breachStatus: BreachStatus = coords && zones.length > 0
    ? checkBreach(coords, zones)
    : { status: 'no_signal' };

  const cfg = getStateConfig(breachStatus.status, ageS);

  // â”€â”€ Derived: distance label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const distLabel = (() => {
    if (!coords || zones.length === 0) return 'Acquiring GPS signalâ€¦';
    const nearest = zones.reduce((best, z) => {
      const d  = haversineMeters(z.center.latitude, z.center.longitude, coords.latitude, coords.longitude);
      const bd = haversineMeters(best.center.latitude, best.center.longitude, coords.latitude, coords.longitude);
      return d < bd ? z : best;
    }, zones[0]);
    const d = haversineMeters(nearest.center.latitude, nearest.center.longitude, coords.latitude, coords.longitude);
    return d <= nearest.radiusM
      ? `${Math.round(nearest.radiusM - d)}m inside "${nearest.label}"`
      : `${Math.round(d - nearest.radiusM)}m beyond "${nearest.label}" boundary`;
  })();

  // â”€â”€ Auto-log breach (deduplicated) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    // Don't log breach if the zone is a fallback (non-real UUID) — tables may not exist yet
    const realZoneId = breachStatus.status === 'breach' &&
      breachStatus.zone?.id && !breachStatus.zone.id.startsWith('fallback-')
        ? breachStatus.zone.id
        : null;

    if (breachStatus.status === 'breach' && coords && !lastAlertId && realZoneId !== undefined) {
      void logBreachAlert({
        patientId,
        geofenceId: realZoneId,
        breachType: 'exit',
        coords,
        distanceM: breachStatus.distanceM,
      }).then((id: string | null) => { if (id) setLastAlertId(id); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breachStatus.status]);

  const handleAck = useCallback(async () => {
    if (!lastAlertId || !caregiverPhone) return;
    await acknowledgeAlert(lastAlertId, caregiverPhone);
    setAcked(true);
    // Refresh history
    const h = await fetchBreachHistory(patientId, 10);
    setHistory(h);
  }, [lastAlertId, caregiverPhone, patientId]);

  const centerOnPatient = useCallback(() => {
    if (!coords || !mapRef.current) return;
    mapRef.current.animateToRegion({
      ...coords, latitudeDelta: 0.012, longitudeDelta: 0.012,
    }, 500);
  }, [coords]);

  const markerColor = breachStatus.status === 'breach'
    ? '#EF4444'
    : breachStatus.status === 'approaching'
      ? '#F59E0B'
      : C.primary;

  // â”€â”€ Guide to patient (open maps app) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const guideToPatient = useCallback(() => {
    if (!coords) return;
    const url = `https://maps.google.com/maps?daddr=${coords.latitude},${coords.longitude}`;
    void Linking.openURL(url);
  }, [coords]);

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={styles.screen}>
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>â€¹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{patientName}'s Location</Text>
          <Text style={[styles.headerSub, ageS > 60 && { color: '#F59E0B' }]}>
            {ageS === 0 && coordsTs === 0 ? 'Loadingâ€¦' : formatAge(ageS)}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowHistory(!showHistory)}
          style={styles.historyBtn}
        >
          <Text style={styles.historyBtnText}>📋</Text>
          {history.filter(h => !h.acknowledgedAt).length > 0 && (
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>
                {history.filter(h => !h.acknowledgedAt).length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* â”€â”€ Map or Loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!ready ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading patient locationâ€¦</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={!coords}  // Show blue dot for caregiver when no patient data
            showsMyLocationButton={!coords}
            initialRegion={{
              ...(coords ?? zones[0]?.center ?? { latitude: 12.9716, longitude: 77.5946 }),
              latitudeDelta:  0.022,
              longitudeDelta: 0.022,
            }}
          >
            {/* Safe zones */}
            {zones.filter((z) => z.isActive).map((zone) => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={zone.center}
                  radius={zone.radiusM}
                  fillColor="rgba(14,122,103,0.09)"
                  strokeColor="rgba(14,122,103,0.50)"
                  strokeWidth={2.5}
                />
                <Marker coordinate={zone.center} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.zoneLabel}>
                    <Text style={styles.zoneLabelText}>🏠 {zone.label}</Text>
                  </View>
                </Marker>
              </React.Fragment>
            ))}

            {/* Approaching ring (80% of radius) */}
            {breachStatus.status === 'approaching' && zones.length > 0 && (
              <Circle
                center={zones[0].center}
                radius={zones[0].radiusM * 0.80}
                fillColor="transparent"
                strokeColor="rgba(245,158,11,0.40)"
                strokeWidth={2}
              />
            )}

            {/* Location trail */}
            {trail.length > 1 && (
              <Polyline
                coordinates={trail}
                strokeColor="rgba(14,122,103,0.35)"
                strokeWidth={3}
                lineDashPattern={[6, 4]}
              />
            )}

            {/* Patient marker — emoji for reliable cross-platform rendering */}
            {coords && (
              <Marker coordinate={coords} title={patientName} description={distLabel}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Text style={[styles.patientMarkerEmoji, { color: markerColor }]}>
                    {breachStatus.status === 'breach' ? '⚠️' : '🧠'}
                  </Text>
                  <Text style={styles.patientMarkerLabel} numberOfLines={1}>
                    {(patientName ?? '').split(' ')[0]}
                  </Text>
                </Animated.View>
              </Marker>
            )}
          </MapView>

          {/* Re-centre button */}
          <Pressable
            onPress={centerOnPatient}
            style={({ pressed }) => [styles.reCentreBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.reCentreIcon}>â—Ž</Text>
          </Pressable>

          {/* + Add / Edit Zone FAB */}
          {(() => {
            // Only treat as existing zone if it has a real DB UUID (not a fallback ID)
            const realZone = zones[0] && !zones[0].id.startsWith('fallback-') ? zones[0] : null;
            return (
              <Pressable
                onPress={() => navigation.navigate('CaregiverGeofenceEditorScreen', {
                  patientId,
                  patientName: patientName ?? '',
                  existingZone: realZone ? {
                    id: realZone.id, label: realZone.label,
                    center: realZone.center, radiusM: realZone.radiusM,
                  } : null,
                })}
                style={({ pressed }) => [styles.editZoneFab, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.editZoneFabText}>
                  {realZone ? 'âŠ™ Zones' : 'ï¼‹ Set Zone'}
                </Text>
              </Pressable>
            );
          })()}

          {/* â”€â”€ Breach History Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {showHistory && (
            <View style={styles.historyPanel}>
              <View style={styles.historyPanelHandle} />
              <Text style={styles.historyPanelTitle}>Recent Alerts</Text>
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {history.length === 0 ? (
                  <Text style={styles.historyEmpty}>No breach alerts recorded.</Text>
                ) : history.map((alert) => (
                  <View key={alert.id} style={styles.historyRow}>
                    <Text style={styles.historyRowIcon}>
                      {alert.breachType === 'exit' ? '🔴' : '🟢'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyRowLabel}>
                        {alert.breachType === 'exit'
                          ? `Left safe zone${alert.distanceM ? ` · ${Math.round(alert.distanceM)}m away` : ''}`
                          : 'Returned to safe zone'}
                      </Text>
                      <Text style={styles.historyRowTime}>{formatBreachTime(alert.createdAt)}</Text>
                    </View>
                    {!alert.acknowledgedAt ? (
                      <View style={styles.historyUnackedDot} />
                    ) : (
                      <Text style={styles.historyAcked}>âœ“</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* â”€â”€ Status Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={[styles.statusCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>

            {/* Top row */}
            <View style={styles.statusTopRow}>
              <Text style={styles.statusEmoji}>{cfg.emoji}</Text>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={[styles.statusTitle, { color: cfg.titleColor }]}>{cfg.title}</Text>
                <Text style={styles.statusSubtitle}>{cfg.subtitle}</Text>
                <Text style={styles.statusDist} numberOfLines={2}>{distLabel}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
            </View>

            {/* Zone pills */}
            {zones.length > 0 && (
              <View style={styles.zonePills}>
                {zones.filter((z) => z.isActive).map((z) => (
                  <View key={z.id} style={styles.zonePill}>
                    <Text style={styles.zonePillText}>🏠 {z.label} · {z.radiusM}m</Text>
                  </View>
                ))}
                {zones.length === 0 && (
                  <Text style={styles.noZoneText}>No safe zones configured</Text>
                )}
              </View>
            )}

            {/* Guide to patient button (breach only) */}
            {breachStatus.status === 'breach' && coords && (
              <Pressable
                onPress={guideToPatient}
                style={({ pressed }) => [styles.guideBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.guideBtnText}>🗺️ Guide Me to {patientName}</Text>
              </Pressable>
            )}

            {/* Acknowledge breach */}
            {breachStatus.status === 'breach' && lastAlertId && !acked && (
              <Pressable
                onPress={() => void handleAck()}
                style={({ pressed }) => [styles.ackBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.ackBtnText}>âœ“  Acknowledge Alert</Text>
              </Pressable>
            )}
            {acked && (
              <Text style={styles.ackedText}>Alert acknowledged âœ“</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 54, paddingBottom: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn:      { width: 40, alignItems: 'flex-start' },
  backIcon:     { fontFamily: F.bold, fontSize: 28, color: C.primary, lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontFamily: F.bold, fontSize: 16, color: C.textPrimary },
  headerSub:    { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },

  historyBtn: {
    width: 40, height: 36, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  historyBtnText: { fontSize: 20 },
  historyBadge: {
    position: 'absolute', top: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },
  historyBadgeText: { fontFamily: F.bold, fontSize: 9, color: '#fff' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontFamily: F.medium, fontSize: 15, color: C.textSecondary },

  map: { flex: 1 },

  zoneLabel: {
    backgroundColor: 'rgba(14,122,103,0.85)', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  zoneLabelText: { fontFamily: F.bold, fontSize: 11, color: '#fff' },

  patientMarkerEmoji: { fontSize: 32, textAlign: 'center' },
  patientMarkerLabel: {
    fontFamily: F.bold, fontSize: 11, color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 1,
    textAlign: 'center', overflow: 'hidden',
  },

  reCentreBtn: {
    position: 'absolute', right: 14, bottom: 230,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 4,
  },
  reCentreIcon: { fontSize: 22, color: C.primary },

  editZoneFab: {
    position: 'absolute', right: 14, bottom: 284,
    backgroundColor: C.primary, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: C.primary, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  editZoneFabText: { fontFamily: F.bold, fontSize: 13, color: '#fff' },

  // Breach history panel
  historyPanel: {
    position: 'absolute', left: 12, right: 12, bottom: 230,
    backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.10, shadowOffset: { width: 0, height: -3 }, shadowRadius: 12, elevation: 8,
  },
  historyPanelHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: C.borderMid,
    alignSelf: 'center', marginBottom: 10,
  },
  historyPanelTitle:  { fontFamily: F.bold, fontSize: 13, color: C.textPrimary, marginBottom: 8 },
  historyEmpty:       { fontFamily: F.regular, fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 16 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  historyRowIcon:   { fontSize: 16, marginRight: 8 },
  historyRowLabel:  { fontFamily: F.medium, fontSize: 13, color: C.textPrimary },
  historyRowTime:   { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },
  historyUnackedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginLeft: 8 },
  historyAcked:     { fontFamily: F.bold, fontSize: 12, color: C.primary, marginLeft: 8 },

  // Status card
  statusCard: {
    marginHorizontal: 12, marginBottom: 14,
    borderRadius: 22, borderWidth: 1.5,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 5,
  },
  statusTopRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  statusEmoji:    { fontSize: 30, lineHeight: 36 },
  statusTitle:    { fontFamily: F.extraBold, fontSize: 16, letterSpacing: 0.2 },
  statusSubtitle: { fontFamily: F.regular, fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusDist:     { fontFamily: F.medium, fontSize: 12, color: '#374151', marginTop: 4 },
  statusDot:      { width: 12, height: 12, borderRadius: 6, marginTop: 6 },

  zonePills:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  zonePill: {
    backgroundColor: 'rgba(14,122,103,0.10)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(14,122,103,0.25)',
  },
  zonePillText: { fontFamily: F.semiBold, fontSize: 11, color: C.primary },
  noZoneText:   { fontFamily: F.medium, fontSize: 12, color: C.textMuted },

  guideBtn: {
    marginTop: 12, borderRadius: 12,
    backgroundColor: C.primary, paddingVertical: 11, alignItems: 'center',
  },
  guideBtnText: { fontFamily: F.bold, fontSize: 14, color: '#fff' },

  ackBtn: {
    marginTop: 8, borderRadius: 12,
    backgroundColor: '#EF4444', paddingVertical: 11, alignItems: 'center',
  },
  ackBtnText: { fontFamily: F.bold, fontSize: 14, color: '#fff' },
  ackedText:  { fontFamily: F.medium, fontSize: 13, color: C.primary, textAlign: 'center', marginTop: 10 },
});
