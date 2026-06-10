/**
 * FamilyMapScreen — High-fidelity live tracking map for family members.
 * Read-only views but premium telemetry, emergency states, and maps.
 */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator, Alert, Animated, Linking, Pressable,
  StyleSheet, Text, View, Dimensions, Image,
} from 'react-native';
import MapView, { Circle, Marker, Callout } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { MapErrorBoundary } from '../../components/shared/MapErrorBoundary';
import { MapFallback } from '../../components/shared/MapFallback';
import { isNativeMapDisabled } from '../../utils/mapConfig';
import { MemberMarkerContent } from '../../components/shared/MemberMarkerContent';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { usePatientTracking } from '../../context/PatientTrackingContext';
import { fetchPatientGeofences, fetchBreachHistory, type Coords, type GeofenceZone } from '../../utils/geofenceUtils';
import { connectSocket } from '../../services/socketClient';
import apiClient from '../../services/apiClient';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<FamilyStackParams, 'FamilyMapScreen'>;


function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const FamilyMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const { firebaseUser } = useAuth();
  const { patient, careCircle } = useFamilyContext();
  const patientId = route.params?.patientId ?? patient?.id ?? '';
  const patientName = patient?.name ?? 'Dorothy';

  const [memberLocations, setMemberLocations] = useState<Record<string, {
    id: string;
    role: 'PATIENT' | 'CAREGIVER' | 'FAMILY';
    photo_url: string | null;
    name: string;
    lat: number | null;
    lng: number | null;
    recorded_at: string | null;
  }>>({});

  const {
    activePatientId,
    setActivePatientId,
    coords,
    coordsTs,
    zones,
    patientState,
    accuracyM,
    speedKmh,
    refreshing,
    refreshLocation,
    setZones,
  } = usePatientTracking();

  useFocusEffect(
    useCallback(() => {
      setActivePatientId(patientId);
      let active = true;
      const loadFreshData = async () => {
        try {
          const fetchedZones = await fetchPatientGeofences(patientId);
          if (active && fetchedZones) {
            setZones(fetchedZones);
          }
          const locationsRes = await apiClient.get(`/location/patient/${patientId}/care-circle-map`);
          const { patient: patientData, caregiver, familyMembers } = locationsRes.data?.data ?? {};
          const nextMap: any = {};
          if (patientData && patientData.lat != null && patientData.lng != null) {
            nextMap[patientData.id] = patientData;
          }
          if (caregiver && caregiver.lat != null && caregiver.lng != null) {
            nextMap[caregiver.id] = caregiver;
          }
          if (familyMembers) {
            for (const m of familyMembers) {
              if (m.lat != null && m.lng != null) {
                nextMap[m.id] = m;
              }
            }
          }
          if (active) {
            setMemberLocations(nextMap);
          }
        } catch (err) {
          console.warn('[FamilyMapScreen] Failed to reload geofences/locations:', err);
        }
      };
      void loadFreshData();
      return () => { active = false; };
    }, [patientId, setActivePatientId, setZones])
  );

  const [ageS, setAgeS] = useState(0);
  const [ready, setReady] = useState(false);
  const [tracksView, setTracksView] = useState(true);
  const [breachDuration, setBreachDuration] = useState('00:00:00');
  const [breachAlertId, setBreachAlertId] = useState<string | null>(null);
  const [oldestBreachTime, setOldestBreachTime] = useState<number | null>(null);

  const isEmergency = !!(patientState?.sos_active || patientState?.safety_state === 'BREACH' || patientState?.safety_state === 'CRITICAL');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);
  const ageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerPulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.25, duration: 250, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0,  duration: 350, useNativeDriver: true }),
    ]).start();
  }, [pulseAnim]);

  const getLabelCoordinate = (center: Coords, radiusM: number): Coords => {
    const offsetDegree = (radiusM * 0.75) / 111000;
    return {
      latitude: center.latitude + offsetDegree,
      longitude: center.longitude,
    };
  };

  const distanceText = useMemo(() => {
    if (!coords) return 'N/A';
    const active = zones.filter((z) => z.isActive);
    if (active.length === 0) return 'N/A';
    let minDist = Infinity;
    for (const z of active) {
      const d = haversineMeters(z.center.latitude, z.center.longitude, coords.latitude, coords.longitude);
      if (d < minDist) minDist = d;
    }
    if (minDist === Infinity) return 'N/A';
    return minDist < 1000 ? `${Math.round(minDist)}m` : `${(minDist / 1000).toFixed(1)}km`;
  }, [coords, zones]);

  const computedActiveZone = useMemo(() => {
    if (!coords || !zones.length) return null;
    const insideZones = zones.filter((z) => {
      if (!z.isActive) return false;
      const d = haversineMeters(z.center.latitude, z.center.longitude, coords.latitude, coords.longitude);
      return d <= z.radiusM;
    });
    if (!insideZones.length) return null;
    insideZones.sort((a, b) => a.radiusM - b.radiusM);
    return insideZones[0];
  }, [coords, zones]);

  const gpsLabel  = accuracyM === undefined ? 'Unknown' : accuracyM < 15 ? 'High' : accuracyM < 50 ? 'Med' : 'Low';
  const gpsColor  = accuracyM === undefined ? '#6B7280' : accuracyM < 15 ? '#10B981' : accuracyM < 50 ? '#F59E0B' : '#EF4444';
  const gpsBgColor = accuracyM === undefined ? '#F9FAFB' : accuracyM < 15 ? '#ECFDF5' : accuracyM < 50 ? '#FFFBEB' : '#FEF2F2';

  const activeZoneLabel = patientState?.current_zone_name || computedActiveZone?.label || 'Zone';

  const safetyText  = patientState?.sos_active || patientState?.safety_state === 'CRITICAL'
    ? 'EMERGENCY: SOS Active'
    : patientState?.safety_state === 'BREACH'
    ? 'Out of Safe Zone'
    : patientState?.safety_state === 'APPROACHING'
    ? 'Approaching Boundary'
    : patientState?.safety_state === 'SAFE'
    ? `Safe Inside ${activeZoneLabel}`
    : 'Acquiring Status…';

  const safetyColor = patientState?.sos_active || ['CRITICAL', 'BREACH'].includes(patientState?.safety_state ?? '')
    ? '#EF4444'
    : patientState?.safety_state === 'APPROACHING'
    ? '#F59E0B'
    : '#10B981';

  useEffect(() => {
    ageTimer.current = setInterval(() => {
      if (coordsTs > 0) setAgeS(Math.floor((Date.now() - coordsTs) / 1000));
    }, 1000);
    return () => { if (ageTimer.current) clearInterval(ageTimer.current); };
  }, [coordsTs]);

  const getMapCenter = useCallback((): Coords => {
    if (coords) return coords;
    const active = zones.filter((z) => z.isActive);
    if (active.length > 0 && active[0]) return active[0].center;
    return { latitude: 12.9716, longitude: 77.5946 };
  }, [coords, zones]);

  useEffect(() => {
    if (ready && mapRef.current) {
      mapRef.current.animateToRegion({
        ...getMapCenter(),
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 800);
    }
  }, [ready, getMapCenter]);

  const centerOnPatient = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion({
      ...getMapCenter(),
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }, 500);
  }, [getMapCenter]);

  useEffect(() => {
    if (coords) {
      setTracksView(true);
      triggerPulse();
    }
  }, [coords, triggerPulse]);

  // Real-time WebSocket subscription for care circle location updates
  useEffect(() => {
    if (!firebaseUser || !patientId) return;
    let socketRef: any;

    const setupSocket = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        socketRef = connectSocket(token);
        socketRef.emit('join:patient', patientId);

        const handleCareCircleLocationUpdate = (data: any) => {
          if (data.patient_id !== patientId) return;
          const { member } = data;
          if (member && member.lat != null && member.lng != null) {
            setMemberLocations((prev) => ({
              ...prev,
              [member.id]: member,
            }));
          }
        };

        socketRef.on('care-circle:location-update', handleCareCircleLocationUpdate);

        return () => {
          if (socketRef) {
            socketRef.off('care-circle:location-update', handleCareCircleLocationUpdate);
          }
        };
      } catch (err) {
        console.warn('FamilyMapScreen socket setup failed:', err);
      }
    };

    let cleanupFn: (() => void) | undefined;
    void setupSocket().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [firebaseUser, patientId]);

  const handleRefresh = useCallback(async () => {
    await refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    if (coords && patientState) {
      setReady(true);
    }
  }, [coords, patientState]);

  useEffect(() => {
    if (tracksView) {
      const timer = setTimeout(() => setTracksView(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [tracksView]);

  const checkActiveAlerts = useCallback(async () => {
    try {
      const alertsHistory = await fetchBreachHistory(patientId, 10);
      const openExits = alertsHistory.filter((a: any) => !a.acknowledgedAt);
      if (openExits.length > 0 && openExits[0]) {
        const sorted = [...openExits].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const oldest = sorted[0];
        if (oldest) {
          setOldestBreachTime(new Date(oldest.createdAt).getTime());
          setBreachAlertId(oldest.id);
        }
      } else {
        setOldestBreachTime(patientState?.computed_at ? new Date(patientState.computed_at).getTime() : Date.now());
        setBreachAlertId(null);
      }
    } catch (err) {
      console.warn('Failed to load active alerts:', err);
    }
  }, [patientId, patientState?.computed_at]);

  useEffect(() => {
    if (isEmergency) {
      void checkActiveAlerts();
    }
  }, [isEmergency, checkActiveAlerts]);

  useEffect(() => {
    if (!isEmergency || !oldestBreachTime) return;
    const interval = setInterval(() => {
      const elapsedMs = Date.now() - oldestBreachTime;
      const s = Math.floor(elapsedMs / 1000) % 60;
      const m = Math.floor(elapsedMs / 60000) % 60;
      const h = Math.floor(elapsedMs / 3600000);
      const format = (n: number) => String(n).padStart(2, '0');
      setBreachDuration(`${format(h)}:${format(m)}:${format(s)}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isEmergency, oldestBreachTime]);

  const bearingDirection = useMemo(() => {
    if (!coords) return 'NE Direction';
    const active = zones.filter((z) => z.isActive);
    if (active.length === 0 || !active[0]) return 'NE Direction';

    let closestZone = active[0];
    let minDist = Infinity;
    for (const z of active) {
      const d = haversineMeters(z.center.latitude, z.center.longitude, coords.latitude, coords.longitude);
      if (d < minDist) {
        minDist = d;
        closestZone = z;
      }
    }

    const lat1 = closestZone.center.latitude;
    const lon1 = closestZone.center.longitude;
    const lat2 = coords.latitude;
    const lon2 = coords.longitude;

    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return `${directions[index]} Direction`;
  }, [coords, zones]);

  const guideToPatient = useCallback(() => {
    if (!coords) {
      Alert.alert('No Location Signal', 'Waiting for patient location signal before generating directions.');
      return;
    }
    const url = `https://maps.google.com/maps?daddr=${coords.latitude},${coords.longitude}`;
    void Linking.openURL(url);
  }, [coords]);

  const handleCall = async () => {
    if (!patient?.phone) {
      Alert.alert('Call Failed', 'No phone number available for this patient.');
      return;
    }
    const url = `tel:${patient.phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Call Patient', `Calling ${patientName} (${patient.phone}).`);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const fallbackCoords = zones.length > 0 && zones[0]
    ? zones[0].center
    : { latitude: 12.9716, longitude: 77.5946 };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {!ready ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading patient location...</Text>
        </View>
      ) : (
        <>
          {isNativeMapDisabled() ? (
            <MapFallback
              latitude={coords?.latitude ?? fallbackCoords.latitude}
              longitude={coords?.longitude ?? fallbackCoords.longitude}
              patientName={patientName}
            />
          ) : (
            <View style={styles.mapContainer}>
              <MapErrorBoundary>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  showsUserLocation={false}
                  showsCompass={true}
                  showsMyLocationButton={false}
                  initialRegion={{
                    ...(coords ?? fallbackCoords),
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                  }}
                >
                  {zones.filter((z) => z.isActive).map((zone) => (
                    <Circle
                      key={zone.id}
                      center={zone.center}
                      radius={zone.radiusM}
                      fillColor="rgba(16, 185, 129, 0.08)"
                      strokeColor="#10B981"
                      strokeWidth={2}
                    />
                  ))}

                  {zones.filter((z) => z.isActive).map((zone) => (
                    <Marker
                      key={`label-${zone.id}`}
                      coordinate={getLabelCoordinate(zone.center, zone.radiusM)}
                      anchor={{ x: 0.5, y: 0.5 }}
                      tracksViewChanges={false}
                    >
                      <ZoneLabelContent label={zone.label} radiusM={zone.radiusM} />
                    </Marker>
                  ))}

                  {coords && (
                    <Marker
                      coordinate={coords}
                      anchor={{ x: 0.5, y: 0.5 }}
                      tracksViewChanges={tracksView}
                    >
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <MemberMarkerContent name={patientName} photoUrl={patient?.photo_url ?? null} role="PATIENT" />
                      </Animated.View>
                      <Callout tooltip={false}>
                        <View style={styles.calloutContainer}>
                          <Text style={styles.calloutName}>{patientName}</Text>
                          <Text style={styles.calloutRole}>Patient</Text>
                          <Text style={styles.calloutTime}>Last Update: {coordsTs ? new Date(coordsTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</Text>
                          <Text style={styles.calloutStatus}>Live GPS Tracking</Text>
                        </View>
                      </Callout>
                    </Marker>
                  )}

                  {careCircle.map((member, index) => {
                    const liveLoc = memberLocations[member.id];
                    const hasLiveLocation = liveLoc && liveLoc.lat != null && liveLoc.lng != null;
                    
                    const lat = hasLiveLocation ? Number(liveLoc.lat) : (member.check_in_lat != null ? Number(member.check_in_lat) : null);
                    const lng = hasLiveLocation ? Number(liveLoc.lng) : (member.check_in_lng != null ? Number(member.check_in_lng) : null);
                    
                    const isEstimated = lat == null || lng == null;
                    if (isEstimated && !coords) {
                      return null;
                    }
                    const finalLat = !isEstimated ? lat! : coords!.latitude + 0.0015 * (index + 1) * Math.sin(index * 2.0);
                    const finalLng = !isEstimated ? lng! : coords!.longitude + 0.0015 * (index + 1) * Math.cos(index * 2.0);
                    
                    const roleLabel = member.relationship_type === 'CAREGIVER' 
                      ? 'Primary Caregiver' 
                      : `Family Member (${member.relation_label ?? 'Relative'})`;
                      
                    const lastUpdateText = hasLiveLocation && liveLoc.recorded_at
                      ? `Last Update: ${new Date(liveLoc.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : (member.last_location_update
                          ? `Last Check-in: ${new Date(member.last_location_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Offline');
                      
                    const statusText = hasLiveLocation ? 'Live Location' : (member.check_in_lat != null ? 'Checked-in Location' : 'Estimated Location');
                    const markerRole = member.relationship_type === 'CAREGIVER' ? 'CAREGIVER' : 'FAMILY';

                    return (
                      <Marker
                        key={member.id}
                        coordinate={{ latitude: finalLat, longitude: finalLng }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        tracksViewChanges={tracksView}
                      >
                        <MemberMarkerContent name={member.name} photoUrl={member.photo_url} role={markerRole} />
                        <Callout tooltip={false}>
                          <View style={styles.calloutContainer}>
                            <Text style={styles.calloutName}>{member.name}</Text>
                            <Text style={styles.calloutRole}>{roleLabel}</Text>
                            <Text style={styles.calloutTime}>{lastUpdateText}</Text>
                            <Text style={styles.calloutStatus}>{statusText}</Text>
                          </View>
                        </Callout>
                      </Marker>
                    );
                  })}
                </MapView>
              </MapErrorBoundary>
            </View>
          )}

          {/* Top Floating Header */}
          <View style={styles.topFloatingHeader}>
            <Pressable onPress={() => navigation.goBack()} style={styles.circleButton}>
              <Ionicons name="arrow-back-outline" size={22} color="#1A1C1E" />
            </Pressable>

            <View style={styles.centerPill}>
              <Text style={styles.centerPillText}>{patientName}</Text>
            </View>

            <View style={[styles.gpsPill, { backgroundColor: gpsBgColor }]}>
              <View style={[styles.gpsDot, { backgroundColor: gpsColor }]} />
              <Text style={[styles.gpsText, { color: gpsColor }]}>{gpsLabel} Signal</Text>
            </View>
          </View>

          {/* Right Floating communication button */}
          <View style={styles.rightFloatingStack}>
            <Pressable onPress={handleCall} style={styles.rightCircleBtn}>
              <Feather name="phone" size={20} color="#1A1C1E" />
            </Pressable>
          </View>

          {/* Re-center Button */}
          <Pressable
            onPress={centerOnPatient}
            style={[
              styles.reCenterBtn,
              isEmergency && { bottom: 330 }
            ]}
          >
            <Feather name="crosshair" size={20} color="#1A1C1E" />
          </Pressable>

          {/* Emergency Wandering header overlay */}
          {isEmergency && (
            <View style={styles.emergencyHeader}>
              <Pressable onPress={() => navigation.goBack()} style={styles.emergencyBackBtn}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.emergencyHeaderCenter}>
                <Text style={styles.emergencyHeaderTitle}>Wandering Detected</Text>
                <Text style={styles.emergencyHeaderTimer}>{breachDuration}</Text>
              </View>
              <View style={styles.emergencyGpsBadge}>
                <Text style={styles.emergencyGpsText}>{bearingDirection}</Text>
              </View>
            </View>
          )}

          {/* Bottom sheet */}
          {isEmergency ? (
            <View style={styles.emergencyBottomSheet}>
              <View style={styles.sheetGrabber} />
              <View style={styles.emergencyStatusRow}>
                <View style={styles.emergencyStatusBadge}>
                  <Text style={styles.emergencyStatusText}>CRITICAL SITUATION</Text>
                </View>
                <Text style={styles.emergencyDistanceText}>{distanceText} outside zone</Text>
              </View>

              <View style={styles.caregiverWidget}>
                <View style={styles.caregiverWidgetLeft}>
                  <View style={styles.caregiverAvatar}>
                    <Feather name="shield" size={18} color="#EF4444" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.caregiverWidgetTitle}>Care Circle Alerted</Text>
                    <Text style={styles.caregiverWidgetSub}>Caregivers are coordinating response</Text>
                  </View>
                </View>
              </View>

              {/* Telemetry grid */}
              <View style={styles.emergencyMetricsRow}>
                <View style={styles.emergencyMetricCell}>
                  <Feather name="battery" size={14} color="#EF4444" />
                  <Text style={styles.emergencyMetricVal}>{patientState?.battery_pct ?? '--'}%</Text>
                  <Text style={styles.emergencyMetricLbl}>Battery</Text>
                </View>
                <View style={styles.emergencyMetricCell}>
                  <Ionicons name="wifi" size={14} color="#A5B4FC" />
                  <Text style={styles.emergencyMetricVal}>{patientState?.network_status ?? 'High'}</Text>
                  <Text style={styles.emergencyMetricLbl}>Network</Text>
                </View>
                <View style={styles.emergencyMetricCell}>
                  <Feather name="clock" size={14} color="#A5B4FC" />
                  <Text style={styles.emergencyMetricVal}>
                    {ageS < 60 ? 'Live' : `${Math.floor(ageS / 60)}m ago`}
                  </Text>
                  <Text style={styles.emergencyMetricLbl}>Last Update</Text>
                </View>
              </View>

              <View style={styles.emergencyGrid}>
                <View style={styles.emergencyGridRow}>
                  <Pressable onPress={guideToPatient} style={styles.gridButton}>
                    <Feather name="navigation" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.gridButtonText}>Directions</Text>
                  </Pressable>
                  <Pressable onPress={handleCall} style={styles.gridButtonSecondary}>
                    <Feather name="phone" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.gridButtonSecondaryText}>Call Patient</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.bottomInfoSheet}>
              <View style={styles.sheetGrabber} />

              <View style={styles.patientProfileRow}>
                <View style={styles.profileAvatarContainer}>
                  {patient?.photo_url ? (
                    <Image source={{ uri: patient.photo_url }} style={{ width: 54, height: 54, borderRadius: 27 }} />
                  ) : (
                    <Feather name="user" size={24} color="#3B82F6" />
                  )}
                </View>

                <View style={styles.patientProfileMeta}>
                  <Text style={styles.patientProfileName}>{patientName}</Text>
                  <View style={styles.patientProfileStatusRow}>
                    <View style={[styles.liveStatusDot, { backgroundColor: safetyColor }]} />
                    <Text style={[styles.patientProfileStatusText, { color: safetyColor }]}>{safetyText}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleRefresh}
                  disabled={refreshing}
                  style={({ pressed }) => [
                    styles.refreshBtn,
                    pressed && { opacity: 0.7 },
                    refreshing && { opacity: 0.5 },
                  ]}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Feather name="refresh-cw" size={18} color="#3B82F6" />
                  )}
                </Pressable>
              </View>

              <View style={styles.metricsContainer}>
                <View style={styles.metricCard}>
                  <Feather name="shield" size={18} color="#3B82F6" />
                  <Text style={styles.metricValue}>{distanceText}</Text>
                  <Text style={styles.metricLabel}>to Zone</Text>
                </View>
                <View style={styles.metricCard}>
                  <Ionicons name="speedometer-outline" size={18} color="#3B82F6" />
                  <Text style={styles.metricValue}>{speedKmh !== undefined ? `${speedKmh.toFixed(1)}` : '0.0'} km/h</Text>
                  <Text style={styles.metricLabel}>Speed</Text>
                </View>
                <View style={styles.metricCard}>
                  <Feather name="clock" size={18} color="#3B82F6" />
                  <Text style={styles.metricValue}>
                    {coordsTs > 0 ? new Date(coordsTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                  <Text style={styles.metricLabel}>Updated</Text>
                </View>
              </View>

              <Pressable
                onPress={guideToPatient}
                style={({ pressed }) => [styles.primaryNavBtn, pressed && { opacity: 0.85 }]}
              >
                <Feather name="navigation" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryNavBtnText}>Navigate to {patientName}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

    </ScreenContainer>
  );
};



const ZoneLabelContent = React.memo(({ label, radiusM }: { label: string; radiusM: number }) => {
  return (
    <View style={styles.zoneLabelWrapper}>
      <View style={styles.zoneLabelBubble}>
        <Feather name="shield" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
        <Text style={styles.zoneLabelText} numberOfLines={1}>
          {label} ({radiusM}m)
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  mapContainer: { ...StyleSheet.absoluteFillObject, bottom: 90 }, // Push map above the bottom nav
  map: { ...StyleSheet.absoluteFillObject },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: C.bg },
  loadingText: { fontFamily: F.medium, fontSize: 15, color: C.textSecondary },

  topFloatingHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    flexShrink: 0,
  },
  centerPill: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  centerPillText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#1A1C1E',
  },
  gpsPill: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  gpsText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#4B5563',
  },

  rightFloatingStack: {
    position: 'absolute',
    right: 16,
    top: 120,
    gap: 12,
    zIndex: 10,
  },
  rightCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    flexShrink: 0,
    overflow: 'hidden',
  },

  reCenterBtn: {
    position: 'absolute',
    right: 16,
    bottom: 390, // Raised above standard bottom sheet + bottom nav
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    flexShrink: 0,
    zIndex: 20,
  },

  zoneLabelWrapper: {
    width: 200,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  zoneLabelBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  zoneLabelText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  patientMarkerContainer: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  patientAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'visible',
    borderWidth: 3,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    flexShrink: 0,
  },
  patientAvatarBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  patientNameCapsule: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  patientNameCapsuleText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  bottomInfoSheet: {
    position: 'absolute',
    bottom: 80, // Sits exactly on top of bottom nav bar
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 10,
    zIndex: 10,
  },
  sheetGrabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  patientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  patientProfileMeta: {
    flex: 1,
    marginLeft: 14,
  },
  patientProfileName: {
    fontFamily: F.bold,
    fontSize: 19,
    color: '#1A1C1E',
  },
  patientProfileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 6,
  },
  patientProfileStatusText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#3B82F6',
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#1A1C1E',
    marginTop: 8,
  },
  metricLabel: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  primaryNavBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  primaryNavBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },

  emergencyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    paddingTop: 50,
    paddingHorizontal: 16,
    backgroundColor: '#7F1D1D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyHeaderTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emergencyHeaderTimer: {
    fontFamily: F.bold,
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 2,
  },
  emergencyGpsBadge: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  emergencyGpsText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#FCA5A5',
  },

  emergencyBottomSheet: {
    position: 'absolute',
    bottom: 80, // Sits exactly on top of bottom nav bar
    left: 0,
    right: 0,
    backgroundColor: '#1E1B4B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 12,
    zIndex: 100,
  },
  emergencyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emergencyStatusBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emergencyStatusText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  emergencyDistanceText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FCA5A5',
  },
  caregiverWidget: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 18,
  },
  caregiverWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  caregiverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  caregiverWidgetTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  caregiverWidgetSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  emergencyMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  emergencyMetricCell: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyMetricVal: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  emergencyMetricLbl: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  emergencyGrid: {
    gap: 10,
  },
  emergencyGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  gridButtonText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  gridButtonSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridButtonSecondaryText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#E5E7EB',
  },
  markerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  markerInitials: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  calloutContainer: {
    padding: 8,
    minWidth: 160,
  },
  calloutName: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textPrimary,
    marginBottom: 2,
  },
  calloutRole: {
    fontFamily: F.bold,
    fontSize: 12,
    color: C.primary,
    marginBottom: 4,
  },
  calloutTime: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
  },
  calloutStatus: {
    fontFamily: F.medium,
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },
});
