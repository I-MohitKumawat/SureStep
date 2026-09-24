/**
 * FamilyFeedScreen — Home dashboard for family members.
 * Reads patient data from FamilyContext (no self-GPS tracking).
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { MapErrorBoundary } from '../../components/shared/MapErrorBoundary';
import { isNativeMapDisabled } from '../../utils/mapConfig';
import { MemberMarkerContent } from '../../components/shared/MemberMarkerContent';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { usePatientTracking } from '../../context/PatientTrackingContext';
import { fetchPatientGeofences, type GeofenceZone } from '../../utils/geofenceUtils';
import { fetchPatientCareCircle, type CareCircleMember } from '../../services/geofenceService';
import { RoutineCapsule, type RoutineItemData } from '../../components/shared/RoutineCapsule';
import { getSocket } from '../../services/socketClient';
import apiClient from '../../services/apiClient';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { relativeTime } from '../../utils/dateUtils';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';


type Props = NativeStackScreenProps<FamilyStackParams, 'FamilyFeedScreen'>;

function safetyConfig(state: string | null, sos: boolean) {
  if (sos) return { bg: '#FEF2F2', border: '#FCA5A5', icon: 'alert-circle' as const, badge: 'SOS ACTIVE', badgeBg: '#EF4444', text: 'Emergency SOS has been triggered.', textColor: '#991B1B' };
  switch (state) {
    case 'SAFE':       return { bg: '#ECFDF5', border: '#6EE7B7', icon: 'checkmark-circle' as const, badge: 'SAFE',          badgeBg: '#10B981', text: 'Inside their safe zone.',              textColor: '#065F46' };
    case 'APPROACHING':return { bg: '#FFFBEB', border: '#FCD34D', icon: 'warning' as const, badge: 'NEAR BOUNDARY', badgeBg: '#F59E0B', text: 'Approaching the edge of safe zone.',   textColor: '#92400E' };
    case 'BREACH':     return { bg: '#FEF2F2', border: '#FCA5A5', icon: 'alert-circle' as const, badge: 'OUTSIDE ZONE',  badgeBg: '#EF4444', text: 'Left the safe zone. Caregiver alerted.', textColor: '#991B1B' };
    case 'CRITICAL':   return { bg: '#FEF2F2', border: '#DC2626', icon: 'alert-circle' as const, badge: 'CRITICAL',       badgeBg: '#DC2626', text: 'Outside zone and stationary. Check immediately.', textColor: '#7F1D1D' };
    default:           return { bg: C.surface, border: C.border,  icon: 'locate' as const, badge: 'LOCATING...',   badgeBg: C.textMuted, text: 'Acquiring location...', textColor: C.textSecondary };
  }
}

const formatAge = (iso: string) => {
  return relativeTime(iso);
};


export const FamilyFeedScreen: React.FC<Props> = ({ navigation }) => {
  const { firebaseUser } = useAuth();
  const { patient, isLoading, hasPatient } = useFamilyContext();
  const { tasks, loadTasksForPatient } = useTasks();
  const { setActivePatientId, coords, zones: trackingZones, setZones: setTrackingZones, patientState } = usePatientTracking();
  const [zones,  setZones]  = useState<GeofenceZone[]>([]);
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'done' | 'pending' | 'missed'>('all');

  useEffect(() => {
    if (!patient?.id) return;
    setActivePatientId(patient.id);
    void loadTasksForPatient(patient.id);
    void fetchPatientGeofences(patient.id).then((zs) => {
      setZones(zs);
      setTrackingZones(zs);
    });
    void fetchPatientCareCircle(patient.id).then((members) => {
      if (members) setCareCircle(members);
    });

    const loadLocations = async () => {
      try {
        const locationsRes = await apiClient.get(`/location/patient/${patient.id}/care-circle-map`);
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
        setMemberLocations(nextMap);
      } catch (err) {
        console.warn('[FamilyFeedScreen] Failed to load care circle locations:', err);
      }
    };
    void loadLocations();
  }, [patient?.id, loadTasksForPatient, setActivePatientId, setTrackingZones]);

  // Real-time WebSocket subscription for care circle location updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !patient?.id) return;

    socket.emit('join:patient', patient.id);

    const handleCareCircleLocationUpdate = (data: any) => {
      if (data.patient_id !== patient.id) return;
      const { member } = data;
      if (member && member.lat != null && member.lng != null) {
        setMemberLocations((prev) => ({
          ...prev,
          [member.id]: member,
        }));
      }
    };

    socket.on('care-circle:location-update', handleCareCircleLocationUpdate);

    return () => {
      socket.off('care-circle:location-update', handleCareCircleLocationUpdate);
    };
  }, [patient?.id]);


  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!hasPatient) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: 24 }}>
        <Ionicons name="link-outline" size={64} color={C.textMuted} style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: F.extraBold, fontSize: 22, color: C.textPrimary, marginBottom: 8, textAlign: 'center' }}>Not Linked Yet</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 24 }}>You haven't joined a care circle yet.</Text>
        <Pressable style={{ backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 }} onPress={() => navigation.navigate('FamilyLinkPatientScreen')}>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: '#fff' }}>Join a Care Circle</Text>
        </Pressable>
      </View>
    );
  }

  const p = patient!;
  // Read safety/telemetry from patientState (PatientTrackingContext) falling back to local family patient state
  const safetyState = patientState?.safety_state ?? p.safety_state;
  const sosActive = patientState?.sos_active ?? p.sos_active;
  const currentZoneName = patientState?.current_zone_name ?? p.current_zone_name;
  const batteryPct = patientState?.battery_pct ?? p.battery_pct;
  const networkStatus = patientState?.network_status ?? p.network_status;
  const computedAt = patientState?.computed_at ?? p.computed_at;

  const cfg = safetyConfig(safetyState, sosActive);
  const patientTasks = tasks.filter((t: any) => t.patientId === p.id);
  const doneCount = patientTasks.filter((t: any) => t.status === 'done').length;
  const pct = patientTasks.length > 0 ? Math.round((doneCount / patientTasks.length) * 100) : 0;

  const mapCenter = coords ?? zones[0]?.center ?? { latitude: 12.9716, longitude: 77.5946 };

  const filteredTasks = patientTasks.filter((t: any) => {
    if (activeFilter === 'done') return t.status === 'done';
    if (activeFilter === 'missed') return t.status === 'missed' || t.status === 'overdue';
    if (activeFilter === 'pending') return t.status !== 'done' && t.status !== 'missed' && t.status !== 'overdue';
    return true;
  });

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          {p.photo_url ? (
            <Image source={{ uri: p.photo_url }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarText}>{p.name[0]?.toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.headerLabel}>FAMILY VIEW</Text>
          <Text style={s.headerName}>{p.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.navigate('NotificationHistoryScreen')} style={[s.settingsBtn, { marginRight: 4 }]}>
            <Ionicons name="notifications-outline" size={22} color={C.textSecondary} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('FamilySettingsScreen')} style={s.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color={C.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Safety Card */}
        <View style={[s.safetyCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <View style={[s.badge, { backgroundColor: cfg.badgeBg, flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name={cfg.icon} size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.badgeText}>{cfg.badge}</Text>
          </View>
          <Text style={[s.safetyText, { color: cfg.textColor }]}>{cfg.text}</Text>
          {currentZoneName && (
            <View style={s.zoneLabelRow}>
              <Ionicons name="location-outline" size={14} color={C.textMuted} style={{ marginRight: 4 }} />
              <Text style={s.zoneLabel}>{currentZoneName}</Text>
            </View>
          )}
          {/* Telemetry */}
          <View style={s.telemetryRow}>
            {batteryPct != null && (
              <View style={s.chip}>
                <Ionicons name="battery-full-outline" size={12} color={C.textSecondary} style={{ marginRight: 4 }} />
                <Text style={s.chipText}>{batteryPct}%</Text>
              </View>
            )}
            {networkStatus && (
              <View style={s.chip}>
                <Ionicons name="cellular-outline" size={12} color={C.textSecondary} style={{ marginRight: 4 }} />
                <Text style={s.chipText}>{networkStatus}</Text>
              </View>
            )}
            {computedAt && (
              <View style={s.chip}>
                <Ionicons name="time-outline" size={12} color={C.textSecondary} style={{ marginRight: 4 }} />
                <Text style={s.chipText}>{formatAge(computedAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mini Map */}
        <View style={s.mapWrap}>
          {isNativeMapDisabled() ? (
            <Pressable
              style={s.mapFallback}
              onPress={() => navigation.navigate('FamilyMapScreen', { patientId: p.id })}
            >
              <Ionicons name="map-outline" size={36} color={C.textMuted} style={{ marginBottom: 6 }} />
              <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.textPrimary }}>Tap to open map</Text>
            </Pressable>
          ) : (
            <MapErrorBoundary>
              <Pressable
                style={s.expandBtn}
                onPress={() => navigation.navigate('FamilyMapScreen', { patientId: p.id })}
              >
                <Ionicons name="expand-outline" size={18} color={C.primary} />
              </Pressable>
              <MapView
                style={s.map}
                scrollEnabled={true} zoomEnabled={true} rotateEnabled={true}
                pitchEnabled={true}
                initialRegion={{ ...mapCenter, latitudeDelta: 0.018, longitudeDelta: 0.018 }}
              >
                {zones.filter(z => z.isActive).map(z => (
                  <Circle key={z.id} center={z.center} radius={z.radiusM}
                    fillColor="rgba(14,122,103,0.10)" strokeColor="rgba(14,122,103,0.45)" strokeWidth={2} />
                ))}
                {coords && (
                  <Marker coordinate={coords}>
                    <MemberMarkerContent name={p.name} photoUrl={p.photo_url} role="PATIENT" />
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
                  
                  const isCaregiver = member.relationship_type === 'CAREGIVER';
                  const markerRole = isCaregiver ? 'CAREGIVER' : 'FAMILY';

                  return (
                    <Marker key={member.id} coordinate={{ latitude: finalLat, longitude: finalLng }}>
                      <MemberMarkerContent name={member.name} photoUrl={member.photo_url ?? null} role={markerRole} />
                    </Marker>
                  );
                })}

              </MapView>
            </MapErrorBoundary>
          )}
          <View style={s.mapOverlay}>
            <Text style={s.mapTap}>Pan & Zoom Map • Expand in Corner</Text>
          </View>
        </View>

        {/* Care Discovery Entry Point Card */}
        {p && (
          <View style={s.careDiscoveryCard}>
            <View style={s.careDiscoveryHeader}>
              <View style={s.careDiscoveryIconWrap}>
                <Ionicons name="medical" size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.careDiscoveryTitle}>Need professional care for {p.name}?</Text>
                <Text style={s.careDiscoverySub}>
                  Find dementia specialists, clinical nurses, and day aides near you.
                </Text>
              </View>
            </View>
            <View style={s.careDiscoveryBtnRow}>
              <Pressable
                style={({ pressed }) => [s.careDiscoveryBtn, pressed && { opacity: 0.85 }]}
                onPress={() =>
                  navigation.navigate('CareDiscoveryScreen', {
                    targetPatientId: p.id,
                    targetPatientName: p.name,
                  })
                }
              >
                <Ionicons name="search" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={s.careDiscoveryBtnText}>Find Caregivers</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [s.careRequestsBtn, pressed && { opacity: 0.85 }]}
                onPress={() =>
                  navigation.navigate('CareRequestsListScreen', {
                    targetPatientId: p.id,
                    targetPatientName: p.name,
                  })
                }
              >
                <Ionicons name="document-text-outline" size={15} color={C.primary} style={{ marginRight: 6 }} />
                <Text style={s.careRequestsBtnText}>Care Requests</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Routine Card */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Ionicons name="clipboard-outline" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={s.sectionTitle}>Today's Routine</Text>
          </View>

          {/* Progress row */}
          <View style={s.progressRow}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${pct}%` as `${number}%` }]} />
            </View>
            <Text style={s.progressText}>{doneCount}/{patientTasks.length}</Text>
          </View>

          {/* Status filters */}
          {patientTasks.length > 0 && (
            <View style={s.filterRow}>
              {([
                { key: 'all', label: 'All', count: patientTasks.length, activeBg: '#E2E8F0', activeText: '#1A1C1E', color: C.textMuted },
                { key: 'done', label: 'Completed', count: patientTasks.filter(t => t.status === 'done').length, activeBg: '#DCFCE7', activeText: '#166534', color: '#22C55E' },
                { key: 'pending', label: 'Pending', count: patientTasks.filter(t => t.status !== 'done' && t.status !== 'missed' && t.status !== 'overdue').length, activeBg: '#FFFBEB', activeText: '#92400E', color: '#F59E0B' },
                { key: 'missed', label: 'Missed', count: patientTasks.filter(t => t.status === 'missed' || t.status === 'overdue').length, activeBg: '#FEE2E2', activeText: '#991B1B', color: '#EF4444' },
              ] as const).map(f => {
                const isActive = activeFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    style={[s.filterBtn, isActive && { backgroundColor: f.activeBg }]}
                    onPress={() => setActiveFilter(f.key)}
                  >
                    <Text style={[s.filterText, isActive && { color: f.activeText }]}>
                      {f.label} ({f.count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Capsules */}
          {filteredTasks.length === 0 ? (
            <Text style={s.emptyText}>No routines found.</Text>
          ) : (
            filteredTasks.map((t: any) => {
              const item: RoutineItemData = {
                key: t.id,
                title: t.title,
                category: t.category ?? 'custom',
                status: t.status === 'done' ? 'completed' : (t.status === 'missed' || t.status === 'overdue' ? 'missed' : 'upcoming'),
                meta: t.time,
              };
              return (
                <RoutineCapsule
                  key={t.id}
                  item={item}
                  readOnly={true}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const s = StyleSheet.create({
  screen:  { backgroundColor: C.bg },
  scroll:  { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110 },
  header:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar:  { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryLight, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarText: { fontFamily: F.bold, fontSize: 18, color: C.primary },
  headerLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.1, color: C.primary },
  headerName:  { fontFamily: F.extraBold, fontSize: 18, color: C.textPrimary },
  settingsBtn: { padding: 8 },

  safetyCard: { borderRadius: 20, borderWidth: 2, padding: 18, marginTop: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3 },
  badge:      { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText:  { fontFamily: F.extraBold, fontSize: 12, color: '#fff', letterSpacing: 0.8 },
  safetyText: { fontFamily: F.bold, fontSize: 15, lineHeight: 20, marginBottom: 4 },
  zoneLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  zoneLabel:  { fontFamily: F.medium, fontSize: 13, color: C.textMuted },
  telemetryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText:   { fontFamily: F.medium, fontSize: 11, color: C.textSecondary },

  mapWrap:    { height: 170, borderRadius: 16, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: C.border, position: 'relative' },
  map:        { flex: 1 },
  expandBtn:  { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFFFFF', borderRadius: 8, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3, zIndex: 10 },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  mapOverlay: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  mapTap:     { fontFamily: F.bold, fontSize: 11, color: C.primary },
  miniMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  miniMarkerBreach: { backgroundColor: '#EF4444' },
  miniMarkerText: { fontFamily: F.extraBold, fontSize: 11, color: '#fff' },

  card: { backgroundColor: C.surface, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: F.extraBold, fontSize: 17, color: C.textPrimary },
  
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginRight: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 3 },
  progressText: { fontFamily: F.bold, fontSize: 13, color: C.textSecondary },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterText: { fontFamily: F.bold, fontSize: 11, color: C.textSecondary },

  routineCapsule: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, padding: 12, marginBottom: 10 },
  routineIconCircle: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  routineInfo: { flex: 1, marginLeft: 12 },
  routineTitle: { fontFamily: F.bold, fontSize: 14, color: C.textPrimary },
  textCrossed: { textDecorationLine: 'line-through', opacity: 0.6 },
  routineMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  routineTimeText: { fontFamily: F.medium, fontSize: 11 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 6 },
  statusLabel: { fontFamily: F.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  emptyText: { fontFamily: F.medium, fontSize: 13, color: C.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 14 },

  careDiscoveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  careDiscoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  careDiscoveryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  careDiscoveryTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  careDiscoverySub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  careDiscoveryBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  careDiscoveryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 11,
    borderRadius: 12,
  },
  careDiscoveryBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  careRequestsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 11,
    borderRadius: 12,
  },
  careRequestsBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: C.primary,
  },
});
