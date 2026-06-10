import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  Image,
} from 'react-native';
import MapView, { Circle, Marker, Callout } from 'react-native-maps';
import { Feather, Ionicons } from '@expo/vector-icons';
import { MapErrorBoundary } from '../../components/shared/MapErrorBoundary';
import { MapFallback } from '../../components/shared/MapFallback';
import { isNativeMapDisabled } from '../../utils/mapConfig';
import { MemberMarkerContent } from '../../components/shared/MemberMarkerContent';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { useAuth } from '../../context/AuthContext';
import { usePatientTracking } from '../../context/PatientTrackingContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  haversineMeters,
  fetchBreachHistory,
  acknowledgeAlert,
  fetchPatientGeofences,
  type Coords,
  type GeofenceZone,
} from '../../utils/geofenceUtils';
import { resolveActiveIncident, fetchPatientCareCircle, type CareCircleMember } from '../../services/geofenceService';
import { connectSocket } from '../../services/socketClient';
import apiClient from '../../services/apiClient';


type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverPatientMapScreen'>;

export const CaregiverPatientMapScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, patientName } = route.params;
  const { firebaseUser } = useAuth();
  const [careCircle, setCareCircle] = useState<CareCircleMember[]>([]);
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

  // Reload fresh geofence data from backend when screen focuses
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setActivePatientId(patientId);

      const loadFreshData = async () => {
        try {
          const fetchedZones = await fetchPatientGeofences(patientId);
          if (active && fetchedZones) {
            setZones(fetchedZones);
          }
          const circleMembers = await fetchPatientCareCircle(patientId);
          if (active && circleMembers) {
            setCareCircle(circleMembers);
          }
          const locationsRes = await apiClient.get(`/location/patient/${patientId}/care-circle-map`);
          const { patient, caregiver, familyMembers } = locationsRes.data?.data ?? {};
          const nextMap: any = {};
          if (patient && patient.lat != null && patient.lng != null) {
            nextMap[patient.id] = patient;
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
          console.warn('[MapScreen] Failed to reload geofences/careCircle/locations on focus:', err);
        }
      };

      void loadFreshData();

      return () => {
        active = false;
      };
    }, [patientId, setActivePatientId, setZones])
  );


  const [ageS, setAgeS] = useState(0);
  const [ready, setReady] = useState(false);
  const [tracksView, setTracksView] = useState(true);

  // ─── Responding & breach state ──────────────────────────────────────────
  const [responding, setResponding] = useState(false);
  const [breachDuration, setBreachDuration] = useState('00:00:00');
  const [breachAlertId, setBreachAlertId] = useState<string | null>(null);
  const [oldestBreachTime, setOldestBreachTime] = useState<number | null>(null);

  const isEmergency = !!(patientState?.sos_active || patientState?.safety_state === 'BREACH' || patientState?.safety_state === 'CRITICAL');

  // ─── Pulse animation on patient marker ──────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const triggerPulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.25, duration: 250, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.0,  duration: 350, useNativeDriver: true }),
    ]).start();
  }, [pulseAnim]);

  const mapRef = useRef<MapView>(null);
  const ageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Dynamic Safe Zones ────────────────────────────────────────────────────────
  const activeZones = zones;


  // Helper to offset the zone label slightly North so it does not overlap the patient marker
  const getLabelCoordinate = (center: Coords, radiusM: number): Coords => {
    const offsetDegree = (radiusM * 0.75) / 111000;
    return {
      latitude: center.latitude + offsetDegree,
      longitude: center.longitude,
    };
  };

  // ─── Distance to nearest safe zone ──────────────────────────────────────────────
  const distanceText = useMemo(() => {
    if (!coords) return 'N/A';
    const active = activeZones.filter((z) => z.isActive);
    if (active.length === 0) return 'N/A';
    let minDist = Infinity;
    for (const z of active) {
      const d = haversineMeters(z.center.latitude, z.center.longitude, coords.latitude, coords.longitude);
      if (d < minDist) minDist = d;
    }
    if (minDist === Infinity) return 'N/A';
    return minDist < 1000 ? `${Math.round(minDist)}m` : `${(minDist / 1000).toFixed(1)}km`;
  }, [coords, activeZones]);

  const computedActiveZone = useMemo(() => {
    if (!coords || !zones.length) return null;
    const insideZones = zones.filter((z) => {
      if (!z.isActive) return false;
      const d = haversineMeters(z.center.latitude, z.center.longitude, coords.latitude, coords.longitude);
      return d <= z.radiusM;
    });
    if (!insideZones.length) return null;
    // Overlapping priority rule: smallest radius (most specific zone) first
    insideZones.sort((a, b) => a.radiusM - b.radiusM);
    return insideZones[0];
  }, [coords, zones]);

  // ─── GPS quality label & color ───────────────────────────────────────────────────
  const gpsLabel  = accuracyM === undefined ? 'Unknown' : accuracyM < 15 ? 'High' : accuracyM < 50 ? 'Med' : 'Low';
  const gpsColor  = accuracyM === undefined ? '#6B7280' : accuracyM < 15 ? '#10B981' : accuracyM < 50 ? '#F59E0B' : '#EF4444';
  const gpsBgColor = accuracyM === undefined ? '#F9FAFB' : accuracyM < 15 ? '#ECFDF5' : accuracyM < 50 ? '#FFFBEB' : '#FEF2F2';

  // ─── Safety status text ─────────────────────────────────────────────────────────
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

  // ─── Age counter ────────────────────────────────────────────────────────────────
  useEffect(() => {
    ageTimer.current = setInterval(() => {
      if (coordsTs > 0) setAgeS(Math.floor((Date.now() - coordsTs) / 1000));
    }, 1000);
    return () => { if (ageTimer.current) clearInterval(ageTimer.current); };
  }, [coordsTs]);

  // Helper to resolve map centering coordinates safely
  const getMapCenter = useCallback((): Coords => {
    if (coords) return coords;
    const active = activeZones.filter((z) => z.isActive);
    if (active.length > 0 && active[0]) return active[0].center;
    return { latitude: 12.9716, longitude: 77.5946 };
  }, [coords, activeZones]);

  // Trigger pulse and tracksView when coords updates from context
  useEffect(() => {
    if (coords) {
      setTracksView(true);
      triggerPulse();
    }
  }, [coords, triggerPulse]);

  // Manual location and state refresh action calling unified context
  const handleRefresh = useCallback(async () => {
    await refreshLocation();
  }, [refreshLocation]);

  // Set map ready state when tracking coords and state are available
  useEffect(() => {
    if (coords && patientState) {
      setReady(true);
    }
  }, [coords, patientState]);

  // Real-time WebSocket subscription for alert acknowledgment only
  useEffect(() => {
    if (!firebaseUser) return;
    let socketRef: any;

    const setupSocket = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        socketRef = connectSocket(token);
        socketRef.emit('join:patient', patientId);

        const handleAlertAcknowledged = (ackData: any) => {
          if (ackData.alert_id === breachAlertId) {
            setResponding(true);
          }
        };

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

        socketRef.on('alert:acknowledged', handleAlertAcknowledged);
        socketRef.on('care-circle:location-update', handleCareCircleLocationUpdate);

        return () => {
          if (socketRef) {
            socketRef.off('alert:acknowledged', handleAlertAcknowledged);
            socketRef.off('care-circle:location-update', handleCareCircleLocationUpdate);
          }
        };
      } catch (err) {
        console.warn('Map socket setup failed:', err);
      }
    };

    let cleanupFn: (() => void) | undefined;
    void setupSocket().then((cleanup) => {
      cleanupFn = cleanup;
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [firebaseUser, patientId, breachAlertId]);

  // Turn off tracksViewChanges after it has been enabled to freeze marker rendering and save battery
  useEffect(() => {
    if (tracksView) {
      const timer = setTimeout(() => setTracksView(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [tracksView]);

  // ─── Emergency breach alerts loader & tick up timer ──────────────────────────────
  const checkActiveAlerts = useCallback(async () => {
    try {
      const alertsHistory = await fetchBreachHistory(patientId, 10);
      // Find oldest unacknowledged EXIT or enter/alert
      const openExits = alertsHistory.filter((a) => !a.acknowledgedAt);
      if (openExits.length > 0 && openExits[0]) {
        const sorted = [...openExits].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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

  // ─── Bearing direction calculations ──────────────────────────────────────────────
  const bearingDirection = useMemo(() => {
    if (!coords) return 'NE Direction';
    const active = activeZones.filter((z) => z.isActive);
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
  }, [coords, activeZones]);

  // Auto-pan/animate map when coordinates are initialized or updated
  useEffect(() => {
    if (ready && mapRef.current) {
      mapRef.current.animateToRegion({
        ...getMapCenter(),
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 800);
    }
  }, [ready, getMapCenter]);

  // Centre map on patient
  const centerOnPatient = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion({
      ...getMapCenter(),
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }, 500);
  }, [getMapCenter]);

  // ─── Trigger Native Google Maps for Directions ────────────────────────────────
  const guideToPatient = useCallback(() => {
    if (!coords) {
      Alert.alert('No Location Signal', 'Waiting for patient location signal before generating directions.');
      return;
    }
    const url = `https://maps.google.com/maps?daddr=${coords.latitude},${coords.longitude}`;
    void Linking.openURL(url);
  }, [coords]);

  // ─── VoIP Phone Dialer launcher ────────────────────────────────────────────────
  const handleCall = async () => {
    const patientPhone = '+919874563211';
    const url = `tel:${patientPhone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Call Patient', `Calling ${patientName || 'Dorothy'} (${patientPhone}). tel: scheme not supported on this device.`);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleChat = () => {
    Alert.alert('Message Patient', 'Message flow placeholder');
  };

  const handleAcknowledge = async () => {
    if (responding) return;
    try {
      if (breachAlertId) {
        await acknowledgeAlert(breachAlertId, '');
      }
      setResponding(true);
      Alert.alert('Responding', 'You are marked as responding. Other caregivers have been notified.');
    } catch (e) {
      console.warn('Failed to acknowledge:', e);
      setResponding(true);
    }
  };

  const handleResolve = () => {
    Alert.alert(
      'Resolve Incident',
      'Are you sure the patient is safe and you want to resolve this wandering incident?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          style: 'destructive',
          onPress: async () => {
            try {
              await resolveActiveIncident(patientId);
              setResponding(false);
              Alert.alert('Resolved', 'Incident resolved successfully.');
            } catch (err) {
              console.warn('Failed to resolve incident:', err);
              Alert.alert('Error', 'Failed to resolve incident. Please try again.');
            }
          }
        }
      ]
    );
  };

  const fallbackCoords = activeZones.length > 0 && activeZones[0]
    ? activeZones[0].center
    : { latitude: 12.9716, longitude: 77.5946 };

  return (
    <View style={styles.screen}>
      {/* ─── Map or Loader ────────────────────────────────────────────────────────── */}
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
              patientName={patientName || 'Dorothy'}
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
                  {/* Dynamic Geofence Zones */}
                  {activeZones.filter((z) => z.isActive).map((zone) => (
                    <React.Fragment key={`${zone.id}-${zone.label}-${zone.radiusM}`}>
                      <Circle
                        center={zone.center}
                        radius={zone.radiusM}
                        fillColor="rgba(16, 185, 129, 0.08)"
                        strokeColor="rgba(16, 185, 129, 0.4)"
                        strokeWidth={2.5}
                      />

                      {/* Boundary Label Marker (positioned north to prevent overlap) */}
                      <Marker
                        coordinate={getLabelCoordinate(zone.center, zone.radiusM)}
                        anchor={{ x: 0.5, y: 0.5 }}
                        tracksViewChanges={true}
                      >
                        <ZoneLabelContent label={zone.label} radiusM={zone.radiusM} />
                      </Marker>
                    </React.Fragment>
                  ))}

                  {/* Primary Patient Marker */}
                  {coords && (
                    <Marker
                      coordinate={coords}
                      anchor={{ x: 0.5, y: 0.5 }}
                      tracksViewChanges={tracksView}
                    >
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <MemberMarkerContent
                          name={patientName || 'Dorothy'}
                          photoUrl={patientState?.photo_url ?? null}
                          role="PATIENT"
                        />
                      </Animated.View>
                      <Callout tooltip={false}>
                        <View style={styles.calloutContainer}>
                          <Text style={styles.calloutName}>{patientName || 'Dorothy'}</Text>
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
                      : `Family Member (${member.role ?? member.relation_label ?? 'Relative'})`;
                      
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
                        <MemberMarkerContent name={member.name} photoUrl={member.photo_url ?? null} role={markerRole} />
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

          {/* ─── Top Floating Header / Emergency Banner ─────────────────────────────── */}
          {isEmergency ? (
            <View style={styles.emergencyHeader}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.emergencyBackBtn, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
              
              <View style={styles.emergencyHeaderCenter}>
                <Text style={styles.emergencyHeaderTitle}>Wandering Detected</Text>
                <Text style={styles.emergencyHeaderTimer}>{breachDuration}</Text>
              </View>

              <View style={styles.emergencyGpsBadge}>
                <View style={[styles.gpsDot, { backgroundColor: '#F87171' }]} />
                <Text style={styles.emergencyGpsText}>GPS Active</Text>
              </View>
            </View>
          ) : (
            <View style={styles.topFloatingHeader}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.circleButton, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="arrow-back" size={22} color="#1A1C1E" />
              </Pressable>

              <View style={styles.centerPill}>
                <Text style={styles.centerPillText}>Live Location</Text>
              </View>

              <View style={[styles.gpsPill, { backgroundColor: gpsBgColor }]}>
                <View style={[styles.gpsDot, { backgroundColor: gpsColor }]} />
                <Text style={[styles.gpsText, { color: gpsColor }]}>GPS: {gpsLabel}</Text>
              </View>
            </View>
          )}

          {/* ─── Direction Badge Overlay ───────────────────────────────────────────── */}
          {isEmergency && (
            <View style={styles.directionPillOverlay}>
              <Feather name="trending-up" size={16} color="#991B1B" style={{ marginRight: 6 }} />
              <Text style={styles.directionPillText}>Moving Away - {bearingDirection}</Text>
            </View>
          )}

          {/* ─── Right Side Floating Action Buttons (Only in normal state) ─────────── */}
          {!isEmergency && (
            <View style={styles.rightFloatingStack}>
              <Pressable
                onPress={handleCall}
                style={({ pressed }) => [styles.rightCircleBtn, pressed && { opacity: 0.85 }]}
              >
                <Feather name="phone" size={20} color="#1A1C1E" />
              </Pressable>

              <Pressable
                onPress={handleChat}
                style={({ pressed }) => [styles.rightCircleBtn, pressed && { opacity: 0.85 }]}
              >
                <Feather name="message-square" size={20} color="#1A1C1E" />
              </Pressable>
            </View>
          )}

          {/* ─── Pencil/Edit Location settings button ──────────────────────────────── */}
          <Pressable
            onPress={() => navigation.navigate('CaregiverPatientLocationEditScreen', { patientId, patientName })}
            style={({ pressed }) => [
              styles.editBtn,
              pressed && { opacity: 0.85 },
              isEmergency && { bottom: 330 }
            ]}
          >
            <Feather name="edit-2" size={20} color="#1A1C1E" />
          </Pressable>

          {/* ─── Current-Location Re-center Button ──────────────────────────────────── */}
          <Pressable
            onPress={centerOnPatient}
            style={({ pressed }) => [
              styles.reCenterBtn,
              pressed && { opacity: 0.85 },
              isEmergency && { bottom: 270 }
            ]}
          >
            <Ionicons name="navigate-outline" size={22} color="#1A1C1E" />
          </Pressable>

          {/* ─── Bottom Information Sheet / Card ──────────────────────────────────── */}
          {isEmergency ? (
            <View style={styles.emergencyBottomSheet}>
              <View style={styles.sheetGrabber} />

              <View style={styles.emergencyStatusRow}>
                <View style={styles.emergencyStatusBadge}>
                  <Text style={styles.emergencyStatusText}>CRITICAL BREACH</Text>
                </View>
                <Text style={styles.emergencyDistanceText}>{distanceText} from safe zone</Text>
              </View>

              <View style={styles.caregiverWidget}>
                <View style={styles.caregiverWidgetLeft}>
                  <View style={styles.caregiverAvatar}>
                    <Feather name="user" size={18} color="#991B1B" />
                    <View style={styles.caregiverOnlineDot} />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.caregiverWidgetTitle}>Nearest Responder</Text>
                    <Text style={styles.caregiverWidgetSub}>
                      {responding ? 'You are responding • Active' : `${patientName || 'Dorothy'}'s Caregiver • Alerted`}
                    </Text>
                  </View>
                </View>
                <View style={styles.caregiverWidgetRight}>
                  <Text style={styles.caregiverWidgetDist}>0.4 km</Text>
                </View>
              </View>

              <View style={styles.emergencyMetricsRow}>
                <View style={styles.emergencyMetricCell}>
                  <Feather name="battery" size={14} color="#6B7280" />
                  <Text style={styles.emergencyMetricVal}>{patientState?.battery_pct ?? 82}%</Text>
                  <Text style={styles.emergencyMetricLbl}>Battery</Text>
                </View>
                <View style={styles.emergencyMetricCell}>
                  <Ionicons name="speedometer-outline" size={14} color="#6B7280" />
                  <Text style={styles.emergencyMetricVal}>{speedKmh !== undefined ? `${speedKmh.toFixed(1)}` : '0.0'} km/h</Text>
                  <Text style={styles.emergencyMetricLbl}>Speed</Text>
                </View>
                <View style={styles.emergencyMetricCell}>
                  <Feather name="clock" size={14} color="#6B7280" />
                  <Text style={styles.emergencyMetricVal}>
                    {coordsTs > 0 ? new Date(coordsTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                  <Text style={styles.emergencyMetricLbl}>Updated</Text>
                </View>
              </View>

              <View style={styles.emergencyGrid}>
                <View style={styles.emergencyGridRow}>
                  <Pressable
                    onPress={guideToPatient}
                    style={({ pressed }) => [styles.gridButton, pressed && { opacity: 0.85 }]}
                  >
                    <Feather name="navigation" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.gridButtonText}>Navigate</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCall}
                    style={({ pressed }) => [styles.gridButton, pressed && { opacity: 0.85 }]}
                  >
                    <Feather name="phone" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.gridButtonText}>Call</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleChat}
                    style={({ pressed }) => [styles.gridButton, pressed && { opacity: 0.85 }]}
                  >
                    <Feather name="message-square" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.gridButtonText}>Message</Text>
                  </Pressable>
                </View>

                <View style={styles.emergencyGridRow}>
                  <Pressable
                    onPress={handleAcknowledge}
                    style={({ pressed }) => [
                      styles.gridButtonSecondary,
                      responding && styles.gridButtonActive,
                      pressed && { opacity: 0.85 }
                    ]}
                  >
                    <Feather name={responding ? "check" : "bell"} size={18} color={responding ? "#10B981" : "#E5E7EB"} style={{ marginRight: 6 }} />
                    <Text style={[styles.gridButtonSecondaryText, responding && styles.gridButtonActiveText]}>
                      {responding ? 'Responding' : "I'm Responding"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleResolve}
                    style={({ pressed }) => [styles.gridButtonResolve, pressed && { opacity: 0.85 }]}
                  >
                    <Feather name="check-circle" size={18} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.gridButtonResolveText}>Resolve Incident</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.bottomInfoSheet}>
              {/* Grabber Indicator */}
              <View style={styles.sheetGrabber} />

              {/* Profile Info Row */}
              <View style={styles.patientProfileRow}>
                <View style={styles.profileAvatarContainer}>
                  <Feather name="user" size={24} color="#3B82F6" />
                </View>

                <View style={styles.patientProfileMeta}>
                  <Text style={styles.patientProfileName}>{patientName || 'Dorothy'}</Text>

                  {/* Dynamic live status from backend */}
                  <View style={styles.patientProfileStatusRow}>
                    <View style={[styles.liveStatusDot, { backgroundColor: safetyColor }]} />
                    <Text style={[styles.patientProfileStatusText, { color: safetyColor }]}>{safetyText}</Text>
                  </View>
                </View>

                {/* Manual Location Refresh Button */}
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


              {/* Metrics cards row */}
              <View style={styles.metricsContainer}>
                {/* Card 1: Distance to safe zone */}
                <View style={styles.metricCard}>
                  <Feather name="shield" size={18} color="#3B82F6" />
                  <Text style={styles.metricValue}>{distanceText}</Text>
                  <Text style={styles.metricLabel}>to Zone</Text>
                </View>

                {/* Card 2: Speed */}
                <View style={styles.metricCard}>
                  <Ionicons name="speedometer-outline" size={18} color="#3B82F6" />
                  <Text style={styles.metricValue}>{speedKmh !== undefined ? `${speedKmh.toFixed(1)}` : '0.0'} km/h</Text>
                  <Text style={styles.metricLabel}>Speed</Text>
                </View>

                {/* Card 3: Last Updated Time */}
                <View style={styles.metricCard}>
                  <Feather name="clock" size={18} color="#3B82F6" />
                  <Text style={styles.metricValue}>
                    {coordsTs > 0 ? new Date(coordsTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                  <Text style={styles.metricLabel}>Updated</Text>
                </View>
              </View>

              {/* Primary Action Button */}
              <Pressable
                onPress={guideToPatient}
                style={({ pressed }) => [styles.primaryNavBtn, pressed && { opacity: 0.85 }]}
              >
                <Feather name="navigation" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryNavBtnText}>Navigate to {patientName || 'Dorothy'}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
};

// ─── Memoized Sub-components to Prevent Flickering & Layout Recalculations ──


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

// ─── Styling conforming exactly to reference design ──────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontFamily: F.medium, fontSize: 15, color: C.textSecondary },

  // Top Floating Header Layout
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

  // Right Side Stack (Communication options)
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

  editBtn: {
    position: 'absolute',
    right: 16,
    bottom: 390,
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

  // Current-Location Button (Bottom-Right, floats exactly above the bottom card)
  reCenterBtn: {
    position: 'absolute',
    right: 16,
    bottom: 330, // Positioned safely above the bottom info card (~280px tall) to prevent coverage
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
    zIndex: 20, // Set to higher z-index to guarantee paint order on top of bottom sheet
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

  // Patient Marker Wrapper (strict bounds to prevent clipping)
  patientMarkerContainer: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  patientMarkerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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

  // Bottom Sheet
  bottomInfoSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
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


  // Metrics Grid Row
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

  // Primary Action Button
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

  // ─── Emergency Wandering Styles ──────────────────────────────────────────────
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
  directionPillOverlay: {
    position: 'absolute',
    top: 130,
    alignSelf: 'center',
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7F1D1D',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    zIndex: 90,
  },
  directionPillText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#991B1B',
  },
  emergencyBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1B4B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
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
  caregiverOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E1B4B',
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
  caregiverWidgetRight: {
    alignItems: 'flex-end',
  },
  caregiverWidgetDist: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#10B981',
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
    flex: 1.2,
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
  gridButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  gridButtonActiveText: {
    color: '#10B981',
  },
  gridButtonResolve: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  gridButtonResolveText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#059669',
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

