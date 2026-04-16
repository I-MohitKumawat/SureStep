/**
 * GeofenceMapScreen
 * Full-screen map showing the circular geofence boundary and patient's live
 * location, powered by expo-location (works in Expo Go + production).
 *
 * Tap the back arrow to return to the caregiver dashboard.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '../navigation/RootNavigator';
import { C } from '../theme/colors';
import { F } from '../theme/fonts';
import {
  haversineMeters,
  PATIENT_GEOFENCES,
  DEFAULT_GEOFENCE,
  type Coords,
} from '../utils/geofence';

type Props = NativeStackScreenProps<HomeStackParamList, 'GeofenceMap'>;

// ─── Screen ───────────────────────────────────────────────────────────────────
export const GeofenceMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientName, patientId } = route.params;
  const fence   = PATIENT_GEOFENCES[patientId] ?? DEFAULT_GEOFENCE;

  const [coords, setCoords] = useState<Coords | null>(null);
  const [ready,  setReady]  = useState(false);
  const subRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('permission denied');

      // Initial fix
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      // Live updates
      subRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (l) => setCoords({ latitude: l.coords.latitude, longitude: l.coords.longitude }),
      );
    } catch {
      // Simulator / permission denied — use demo offset from geofence centre
      setCoords({
        latitude:  fence.center.latitude  + 0.0018,
        longitude: fence.center.longitude - 0.0012,
      });
    } finally {
      setReady(true);
    }
  }, [fence.center]);

  useEffect(() => {
    void startTracking();
    return () => { subRef.current?.remove(); };
  }, [startTracking]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const distance = coords
    ? haversineMeters(
        fence.center.latitude, fence.center.longitude,
        coords.latitude,       coords.longitude,
      )
    : null;

  const inZone    = distance !== null && distance <= fence.radiusM;
  const zoneColor = inZone ? C.primary : '#DC2626';
  const zoneBg    = inZone ? C.primaryLight : '#FEE2E2';
  const zoneLabel = inZone ? 'In Safe Zone' : 'Outside Safe Zone';
  const distLabel = distance === null
    ? 'Calculating…'
    : inZone
      ? `${Math.round(fence.radiusM - distance)} m inside boundary`
      : `${Math.round(distance - fence.radiusM)} m from boundary`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {patientName}'s Location
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map or loader */}
      {!ready ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Acquiring location…</Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            showsUserLocation={false}
            initialRegion={{
              ...fence.center,
              latitudeDelta:  0.020,
              longitudeDelta: 0.020,
            }}
          >
            {/* Geofence boundary circle */}
            <Circle
              center={fence.center}
              radius={fence.radiusM}
              fillColor="rgba(14,122,103,0.10)"
              strokeColor="rgba(14,122,103,0.55)"
              strokeWidth={2.5}
            />

            {/* Geofence centre dot */}
            <Marker coordinate={fence.center} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.centrePin} />
            </Marker>

            {/* Patient marker */}
            {coords && (
              <Marker
                coordinate={coords}
                title={patientName}
                description={zoneLabel}
              >
                <View style={[styles.patientMarker, { backgroundColor: zoneColor }]}>
                  <Text style={styles.patientMarkerText}>
                    {patientName[0]?.toUpperCase()}
                  </Text>
                </View>
              </Marker>
            )}
          </MapView>

          {/* Status overlay */}
          <View style={[styles.statusBar, { backgroundColor: zoneBg, borderColor: zoneColor }]}>
            <View style={[styles.statusDot, { backgroundColor: zoneColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: zoneColor }]}>{zoneLabel}</Text>
              <Text style={styles.statusMeta}>{distLabel}</Text>
            </View>
            <Text style={styles.radiusLabel}>⊙ {fence.radiusM} m zone</Text>
          </View>
        </>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn:     { width: 40, alignItems: 'flex-start' },
  backIcon:    { fontFamily: F.bold, fontSize: 28, color: C.primary, lineHeight: 32 },
  headerTitle: { fontFamily: F.bold, fontSize: 17, color: C.textPrimary, flex: 1, textAlign: 'center' },

  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:  { fontFamily: F.medium, fontSize: 15, color: C.textSecondary },

  map: { flex: 1 },

  centrePin: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.primary, borderWidth: 2, borderColor: C.primaryText,
  },
  patientMarker: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: C.surface,
    shadowColor: '#000', shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: 6,
  },
  patientMarkerText: { fontFamily: F.extraBold, fontSize: 16, color: '#fff' },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginVertical: 14,
    borderRadius: 18, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3,
  },
  statusDot:   { width: 10, height: 10, borderRadius: 5 },
  statusTitle: { fontFamily: F.bold, fontSize: 16, marginBottom: 2 },
  statusMeta:  { fontFamily: F.regular, fontSize: 13, color: C.textSecondary },
  radiusLabel: { fontFamily: F.semiBold, fontSize: 12, color: C.textMuted },
});
