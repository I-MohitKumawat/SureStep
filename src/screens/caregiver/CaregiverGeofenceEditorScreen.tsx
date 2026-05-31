/**
 * GeofenceEditorScreen  (v3 — full UX overhaul)
 *
 * Improvements over v2:
 *  - Opens centred on the patient's LAST KNOWN LOCATION (not hardcoded Bangalore)
 *  - "Use My Location" shortcut for caregivers standing at patient's home
 *  - Cleaner radius selector with a visual progress bar
 *  - Zone type icons next to preset labels
 *  - List of all existing zones at the bottom with per-zone delete
 *  - Ability to add new zones without replacing existing ones
 *  - Preview label on map circle showing radius
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Navigation types migrated to src/types/navigation.types.ts
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  saveGeofenceZone,
  fetchPatientGeofences,
  deleteGeofenceZone,
  fetchLatestPatientLocation,
  type GeofenceZone,
  type Coords,
} from '../../utils/geofenceUtils';
import type { CaregiverStackParams } from '../../types/navigation.types';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverGeofenceEditorScreen'>;

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RADIUS_MIN  = 50;
const RADIUS_MAX  = 2000;
const RADIUS_STEPS = [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];

const ZONE_PRESETS = [
  { label: 'Home',      icon: '🏠' },
  { label: 'Clinic',    icon: '🏥' },
  { label: 'Park',      icon: '🌳' },
  { label: 'Pharmacy',  icon: '💊' },
  { label: 'Temple',    icon: '🛕' },
  { label: 'Market',    icon: '🛒' },
  { label: 'Other',     icon: '📍' },
];

const DEFAULT_CENTER: Coords = { latitude: 12.9716, longitude: 77.5946 };

// â”€â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CaregiverGeofenceEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, patientName, existingZone } = route.params;

  // Strip fallback in-memory zones — they have no real DB UUID
  const safeExistingZone = existingZone?.id && !existingZone.id.startsWith('fallback-')
    ? existingZone
    : null;

  // ─── Editing state ─────────────────────────────────────────────────────
  const [center,       setCenter]       = useState<Coords>(safeExistingZone?.center ?? DEFAULT_CENTER);
  const [radiusM,      setRadiusM]      = useState(safeExistingZone?.radiusM ?? 300);
  const [label,        setLabel]        = useState(safeExistingZone?.label ?? 'Home');
  const [boundaryType, setBoundaryType] = useState<'soft' | 'hard'>(
    (safeExistingZone as any)?.boundaryType ?? 'soft'
  );

  // ─── All zones for this patient ────────────────────────────────────
  const [allZones,    setAllZones]    = useState<GeofenceZone[]>([]);
  const [zonesLoaded, setZonesLoaded] = useState(false);

  // ─── UI state ──────────────────────────────────────────────────────────
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [locLoading,  setLocLoading]  = useState(false);
  const [mapReady,    setMapReady]    = useState(false);

  const mapRef = useRef<MapView>(null);

  // ─── Load all zones + centre map on patient location (or caregiver GPS) ───
  useEffect(() => {
    // 1. Load existing zones
    void fetchPatientGeofences(patientId).then((zones: GeofenceZone[]) => {
      const real = zones.filter((z: GeofenceZone) => !z.id.startsWith('fallback-'));
      setAllZones(real);
      setZonesLoaded(true);
    });

    // 2. Try patient's last known location first
    void fetchLatestPatientLocation(patientId).then(async (loc: Coords | null) => {
      if (loc) {
        // Patient has published pings — center there
        setCenter({ latitude: loc.latitude, longitude: loc.longitude });
      } else if (!safeExistingZone) {
        // No patient pings yet — fall back to caregiver's own GPS
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const own = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setCenter({ latitude: own.coords.latitude, longitude: own.coords.longitude });
          }
        } catch {
          // permission denied — keep DEFAULT_CENTER
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Animate map once we know the real center
  useEffect(() => {
    if (mapReady && center) {
      mapRef.current?.animateToRegion({
        ...center,
        latitudeDelta: Math.max(0.01, (radiusM / 111_320) * 3),
        longitudeDelta: Math.max(0.01, (radiusM / 111_320) * 3),
      }, 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, center]);

  // â”€â”€ Use my current location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const useMyLocation = useCallback(async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c: Coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCenter(c);
      mapRef.current?.animateToRegion({
        ...c,
        latitudeDelta: Math.max(0.01, (radiusM / 111_320) * 3),
        longitudeDelta: Math.max(0.01, (radiusM / 111_320) * 3),
      }, 500);
    } catch {
      setError('Could not get your location.');
    } finally {
      setLocLoading(false);
    }
  }, [radiusM]);

  // â”€â”€ Save / Add zone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // saveGeofenceZone now throws with the real Supabase error if it fails
      await saveGeofenceZone({
        id:           safeExistingZone?.id,  // undefined = INSERT, real UUID = UPDATE
        patientId,
        label,
        center,
        radiusM,
        isActive:     true,
        boundaryType,
      });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown save error');
    } finally {
      setSaving(false);
    }
  }, [center, safeExistingZone?.id, label, navigation, patientId, radiusM, boundaryType]);

  // â”€â”€ Delete a zone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = useCallback((zoneId: string, zoneLabel: string) => {
    Alert.alert(
      'Delete Zone',
      `Remove "${zoneLabel}" safe zone? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(zoneId);
            const ok = await deleteGeofenceZone(zoneId);
            if (ok) {
              setAllZones((prev) => prev.filter((z) => z.id !== zoneId));
              if (safeExistingZone?.id === zoneId) navigation.goBack();
            } else {
              setError('Delete failed — check Supabase connection');
            }
            setDeleting(null);
          },
        },
      ],
    );
  }, [safeExistingZone?.id, navigation]);

  // â”€â”€ Radius helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const radiusPct = ((radiusM - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100;

  const saveBtnLabel = (() => {
    if (success) return 'âœ“ Zone Saved!';
    if (safeExistingZone) return `Save Changes for ${patientName}`;
    return `Add Zone for ${patientName}`;
  })();

  const mapDelta = Math.max(0.015, (radiusM / 111_320) * 4.5);

  return (
    <View style={styles.screen}>
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backIcon}>â€¹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {safeExistingZone ? 'Edit Safe Zone' : 'Add Safe Zone'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>{patientName}</Text>
        </View>
        {/* Use-my-location shortcut */}
        <Pressable
          onPress={() => void useMyLocation()}
          style={({ pressed }) => [styles.myLocBtn, pressed && { opacity: 0.75 }]}
          disabled={locLoading}
        >
          {locLoading
            ? <ActivityIndicator size="small" color={C.primary} />
            : <Text style={styles.myLocText}>📍 Me</Text>
          }
        </Pressable>
      </View>

      {/* â”€â”€ Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <MapView
        ref={mapRef}
        style={styles.map}
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          ...center,
          latitudeDelta:  mapDelta,
          longitudeDelta: mapDelta,
        }}
      >
        {/* Safe-zone preview circle */}
        <Circle
          center={center}
          radius={radiusM}
          fillColor="rgba(14,122,103,0.10)"
          strokeColor="rgba(14,122,103,0.55)"
          strokeWidth={2.5}
        />

        {/* All other existing zones (dimmed) */}
        {allZones
          .filter((z) => z.id !== existingZone?.id)
          .map((z) => (
            <Circle
              key={z.id}
              center={z.center}
              radius={z.radiusM}
              fillColor="rgba(100,100,100,0.05)"
              strokeColor="rgba(100,100,100,0.30)"
              strokeWidth={1.5}
            />
          ))}

        {/* Draggable centre marker — simple emoji for cross-platform compatibility */}
        <Marker
          coordinate={center}
          draggable
          onDragEnd={(e) => setCenter(e.nativeEvent.coordinate)}
        >
          <Text style={styles.dragPinEmoji}>📍</Text>
        </Marker>
      </MapView>

      {/* Radius overlay badge on map */}
      <View style={styles.radiusOverlayBadge} pointerEvents="none">
        <Text style={styles.radiusOverlayText}>{radiusM}m safe zone</Text>
      </View>

      {/* â”€â”€ Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <ScrollView style={styles.controls} contentContainerStyle={styles.controlsContent}>

        {/* â”€â”€ Boundary type toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Text style={styles.fieldLabel}>BOUNDARY TYPE</Text>
        <View style={styles.boundaryRow}>
          <Pressable
            onPress={() => setBoundaryType('soft')}
            style={[styles.boundaryBtn, boundaryType === 'soft' && styles.boundaryBtnSoft]}
          >
            <Text style={styles.boundaryIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.boundaryLabel, boundaryType === 'soft' && { color: '#065F46' }]}>
                Soft Boundary
              </Text>
              <Text style={styles.boundarySub}>Notify caregiver only</Text>
            </View>
            {boundaryType === 'soft' && <Text style={styles.boundaryCheck}>âœ“</Text>}
          </Pressable>
          <Pressable
            onPress={() => setBoundaryType('hard')}
            style={[styles.boundaryBtn, boundaryType === 'hard' && styles.boundaryBtnHard]}
          >
            <Text style={styles.boundaryIcon}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.boundaryLabel, boundaryType === 'hard' && { color: '#991B1B' }]}>
                Hard Boundary
              </Text>
              <Text style={styles.boundarySub}>Emergency escalation</Text>
            </View>
            {boundaryType === 'hard' && <Text style={[styles.boundaryCheck, { color: '#DC2626' }]}>âœ“</Text>}
          </Pressable>
        </View>

        {/* Drag hint */}
        <View style={styles.hintRow}>
          <Text style={styles.hintText}>
            📍 Drag the pin to position the zone centre · Expand radius below
          </Text>
        </View>

        {/* â”€â”€ Zone label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Text style={styles.fieldLabel}>ZONE TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
          {ZONE_PRESETS.map((p) => {
            const active = label === p.label;
            return (
              <Pressable
                key={p.label}
                onPress={() => setLabel(p.label)}
                style={[styles.presetChip, active && styles.presetChipActive]}
              >
                <Text style={styles.presetIcon}>{p.icon}</Text>
                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <TextInput
          style={styles.input}
          placeholder="Or type a custom name…"
          placeholderTextColor={C.textMuted}
          value={label}
          onChangeText={setLabel}
        />

        {/* ——— Radius selector —————————————————————————————————————————————————————— */}
        <View style={styles.radiusHeaderRow}>
          <Text style={styles.fieldLabel}>SAFE ZONE RADIUS</Text>
          <View style={styles.radiusValueBadge}>
            <Text style={styles.radiusValueText}>{radiusM} m</Text>
          </View>
        </View>

        {/* Visual progress bar */}
        <View style={styles.radiusBar}>
          <View style={[styles.radiusBarFill, { width: `${radiusPct}%` as `${number}%` }]} />
        </View>
        <View style={styles.radiusStepRow}>
          {RADIUS_STEPS.map((step) => {
            const active = radiusM === step;
            return (
              <Pressable
                key={step}
                onPress={() => setRadiusM(step)}
                style={[styles.radiusStepBtn, active && styles.radiusStepBtnActive]}
              >
                <Text style={[styles.radiusStepText, active && styles.radiusStepTextActive]}>
                  {step >= 1000 ? `${step / 1000}km` : `${step}m`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.radiusHints}>
          <Text style={styles.radiusHintSmall}>50m  — small apartment / care home</Text>
          <Text style={styles.radiusHintSmall}>300m — typical neighbourhood</Text>
          <Text style={styles.radiusHintSmall}>2km  — large area / village</Text>
        </View>

        {/* Coords */}
        <Text style={styles.coordsLabel}>
          📌 {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
        </Text>

        {/* Error */}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            (saving || success) && { opacity: 0.7 },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void handleSave()}
          disabled={saving || success}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{saveBtnLabel}</Text>
          }
        </Pressable>

        {/* â”€â”€ All existing zones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {zonesLoaded && allZones.length > 0 && (
          <View style={styles.existingSection}>
            <Text style={styles.existingSectionTitle}>EXISTING SAFE ZONES</Text>
            {allZones.map((z) => {
              const preset = ZONE_PRESETS.find((p) => p.label === z.label);
              const icon = preset?.icon ?? '📍';
              const isEditing = z.id === safeExistingZone?.id;
              return (
                <View key={z.id} style={[styles.existingCard, isEditing && styles.existingCardActive]}>
                  <Text style={styles.existingIcon}>{icon}</Text>
                  <View style={styles.existingCardBody}>
                    <Text style={styles.existingCardLabel}>{z.label}</Text>
                    <Text style={styles.existingCardMeta}>
                      âŠ™ {z.radiusM}m · {z.center.latitude.toFixed(4)}, {z.center.longitude.toFixed(4)}
                    </Text>
                  </View>
                  <View style={styles.existingCardActions}>
                    {!isEditing && (
                      <Pressable
                        onPress={() => navigation.replace('CaregiverGeofenceEditorScreen', {
                          patientId,
                          patientName,
                          existingZone: { id: z.id, label: z.label, center: z.center, radiusM: z.radiusM },
                        })}
                        style={({ pressed }) => [styles.existingEditBtn, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={styles.existingEditBtnText}>Edit</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleDelete(z.id, z.label)}
                      style={({ pressed }) => [styles.existingDeleteBtn, pressed && { opacity: 0.7 }]}
                      disabled={deleting === z.id}
                    >
                      {deleting === z.id
                        ? <ActivityIndicator size="small" color="#DC2626" />
                        : <Text style={styles.existingDeleteBtnText}>🗑️</Text>
                      }
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {/* Add another zone shortcut */}
            <Pressable
              onPress={() => navigation.replace('CaregiverGeofenceEditorScreen', {
                patientId,
                patientName,
                existingZone: null,
              })}
              style={({ pressed }) => [styles.addAnotherBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.addAnotherText}>ï¼‹ Add Another Zone</Text>
            </Pressable>
          </View>
        )}

        {/* Empty state: show hint when no DB zones exist yet */}
        {zonesLoaded && allZones.length === 0 && (
          <View style={[styles.existingSection, { paddingBottom: 4 }]}>
            <Text style={styles.existingSectionTitle}>SAFE ZONES</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.textMuted, lineHeight: 20 }}>
              No zones saved yet. Fill in the details above and tap the save button.
              {`\n\n`}If saving fails, make sure you have run{' '}
              <Text style={{ fontFamily: F.bold, color: C.textPrimary }}>supabase_geofence_schema.sql</Text>
              {' '}in Supabase SQL Editor.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn:     { width: 44, alignItems: 'flex-start' },
  backIcon:    { fontFamily: F.bold, fontSize: 28, color: C.primary, lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: F.bold, fontSize: 17, color: C.textPrimary },
  headerSub:   { fontFamily: F.regular, fontSize: 12, color: C.textSecondary, marginTop: 1 },

  myLocBtn: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.primaryLight, minWidth: 54, alignItems: 'center',
  },
  myLocText: { fontFamily: F.bold, fontSize: 12, color: C.primary },

  map: { height: 260 },

  // Radius overlay badge on map
  radiusOverlayBadge: {
    position: 'absolute', top: 118 + 54, alignSelf: 'center',
    backgroundColor: 'rgba(14,122,103,0.82)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  radiusOverlayText: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  dragPinEmoji:   { fontSize: 36, textAlign: 'center' },

  controls:        { flex: 1 },
  controlsContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  hintRow:  { backgroundColor: C.primaryLight, borderRadius: 12, padding: 10, marginBottom: 16 },
  hintText: { fontFamily: F.medium, fontSize: 13, color: C.primary },

  fieldLabel: {
    fontFamily: F.bold, fontSize: 11, color: C.textMuted,
    letterSpacing: 0.8, marginBottom: 8,
  },

  // Zone preset chips
  presetRow: { marginBottom: 8 },
  presetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, marginRight: 8,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  presetChipActive:  { backgroundColor: C.primary, borderColor: C.primary },
  presetIcon:        { fontSize: 14 },
  presetText:        { fontFamily: F.semiBold, fontSize: 13, color: C.textSecondary },
  presetTextActive:  { color: '#fff' },

  input: {
    borderRadius: 12, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: F.regular, fontSize: 14, color: C.textPrimary, marginBottom: 18,
  },

  // Radius
  radiusHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  radiusValueBadge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  radiusValueText:  { fontFamily: F.extraBold, fontSize: 15, color: C.primary },

  radiusBar:      { height: 6, borderRadius: 999, backgroundColor: C.border, marginBottom: 10, overflow: 'hidden' },
  radiusBarFill:  { height: '100%', borderRadius: 999, backgroundColor: C.primary },

  radiusStepRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  radiusStepBtn:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  radiusStepBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  radiusStepText:    { fontFamily: F.semiBold, fontSize: 12, color: C.textSecondary },
  radiusStepTextActive: { color: '#fff' },

  radiusHints:    { marginBottom: 12 },
  radiusHintSmall: { fontFamily: F.regular, fontSize: 11, color: C.textMuted, lineHeight: 18 },

  coordsLabel: { fontFamily: F.medium, fontSize: 12, color: C.textMuted, marginBottom: 16, textAlign: 'center' },

  errorText: { fontFamily: F.medium, fontSize: 13, color: C.error, marginBottom: 12, textAlign: 'center' },

  saveBtn: {
    borderRadius: 16, backgroundColor: C.primary,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 5 }, shadowRadius: 12, elevation: 6,
    marginBottom: 24,
  },
  saveBtnText: { fontFamily: F.bold, fontSize: 16, color: '#fff' },

  // Existing zones list
  existingSection:      { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 },
  existingSectionTitle: { fontFamily: F.bold, fontSize: 11, color: C.textMuted, letterSpacing: 0.8, marginBottom: 12 },

  existingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1,
  },
  existingCardActive: { borderColor: C.primary, borderWidth: 1.5 },
  existingIcon:       { fontSize: 22, marginRight: 10 },
  existingCardBody:   { flex: 1 },
  existingCardLabel:  { fontFamily: F.bold, fontSize: 15, color: C.textPrimary },
  existingCardMeta:   { fontFamily: F.regular, fontSize: 11, color: C.textMuted, marginTop: 1 },
  existingCardActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },

  existingEditBtn:     { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.primaryLight },
  existingEditBtnText: { fontFamily: F.bold, fontSize: 12, color: C.primary },
  existingDeleteBtn:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEE2E2' },
  existingDeleteBtnText: { fontSize: 14 },

  addAnotherBtn: {
    marginTop: 4, borderRadius: 12, borderWidth: 1.5, borderColor: C.primary,
    borderStyle: 'dashed', paddingVertical: 12, alignItems: 'center',
  },
  addAnotherText: { fontFamily: F.bold, fontSize: 14, color: C.primary },

  // Boundary type toggle
  boundaryRow:     { gap: 8, marginBottom: 16 },
  boundaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 12,
  },
  boundaryBtnSoft: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  boundaryBtnHard: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  boundaryIcon:    { fontSize: 20 },
  boundaryLabel:   { fontFamily: F.bold, fontSize: 14, color: C.textPrimary },
  boundarySub:     { fontFamily: F.regular, fontSize: 11, color: C.textSecondary, marginTop: 1 },
  boundaryCheck:   { fontFamily: F.extraBold, fontSize: 16, color: '#10B981' },
});
