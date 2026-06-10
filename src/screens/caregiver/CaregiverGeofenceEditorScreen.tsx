/**
 * GeofenceEditorScreen (Modernized Premium UI)
 *
 * Implements a high-fidelity editor interface centering on the patient's location
 * or caregiver's location. Presets, radius steps, boundary options, and save/delete
 * buttons are styled to match the "Safe Places" design reference.
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
import { Feather, Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { MapErrorBoundary } from '../../components/shared/MapErrorBoundary';
import { MapFallback } from '../../components/shared/MapFallback';
import { isNativeMapDisabled } from '../../utils/mapConfig';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  saveGeofenceZone,
  deleteGeofenceZone,
  fetchLatestPatientLocation,
  type GeofenceZone,
  type Coords,
} from '../../utils/geofenceUtils';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverGeofenceEditorScreen'>;

// ─── Constants ───────────────────────────────────────────────────────────────

const RADIUS_MIN = 50;
const RADIUS_MAX = 2000;
const RADIUS_STEPS = [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];

const ZONE_PRESETS = [
  { label: 'Home', icon: '🏠' },
  { label: 'Clinic', icon: '🏥' },
  { label: 'Park', icon: '🌳' },
  { label: 'Pharmacy', icon: '💊' },
  { label: 'Temple', icon: '🛕' },
  { label: 'Market', icon: '🛒' },
  { label: 'Other', icon: '📍' },
];

const DEFAULT_CENTER: Coords = { latitude: 12.9716, longitude: 77.5946 };

// Helper to get colors based on current label selection
const getPresetColor = (label: string) => {
  const norm = label.toLowerCase();
  if (norm.includes('home')) return '#2563EB'; // Blue
  if (norm.includes('clinic') || norm.includes('park') || norm.includes('pharmacy')) return '#10B981'; // Green
  if (norm.includes('temple')) return '#8B5CF6'; // Purple
  return '#F59E0B'; // Orange/Amber
};

const getPresetBg = (label: string) => {
  const norm = label.toLowerCase();
  if (norm.includes('home')) return '#EFF6FF';
  if (norm.includes('clinic') || norm.includes('park') || norm.includes('pharmacy')) return '#ECFDF5';
  if (norm.includes('temple')) return '#F5F3FF';
  return '#FFFBEB';
};

export const CaregiverGeofenceEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, patientName, existingZone } = route.params;

  const safeExistingZone = existingZone?.id && !existingZone.id.startsWith('fallback-')
    ? existingZone
    : null;

  // ─── States ─────────────────────────────────────────────────────────────────
  const [center, setCenter] = useState<Coords>(safeExistingZone?.center ?? DEFAULT_CENTER);
  const [radiusM, setRadiusM] = useState(safeExistingZone?.radiusM ?? 300);
  const [label, setLabel] = useState(safeExistingZone?.label ?? 'Home');
  const [boundaryType, setBoundaryType] = useState<'soft' | 'hard'>(
    (safeExistingZone as any)?.boundaryType ?? 'soft'
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<MapView>(null);

  // ─── Initial Center Load ────────────────────────────────────────────────────
  useEffect(() => {
    if (safeExistingZone) return;

    // Center map on patient's latest location or default
    void fetchLatestPatientLocation(patientId).then(async (loc) => {
      if (loc) {
        setCenter({ latitude: loc.latitude, longitude: loc.longitude });
      } else {
        // Fall back to caregiver GPS location
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const own = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setCenter({ latitude: own.coords.latitude, longitude: own.coords.longitude });
          }
        } catch {
          // keep DEFAULT_CENTER
        }
      }
    });
  }, [patientId, safeExistingZone]);

  // Animate map when coordinates change
  useEffect(() => {
    if (mapReady && center) {
      mapRef.current?.animateToRegion({
        ...center,
        latitudeDelta: Math.max(0.01, (radiusM / 111_320) * 3),
        longitudeDelta: Math.max(0.01, (radiusM / 111_320) * 3),
      }, 500);
    }
  }, [mapReady, center, radiusM]);

  // ─── Use my current location shortcut ──────────────────────────────────────
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
    } catch {
      setError('Could not access current location.');
    } finally {
      setLocLoading(false);
    }
  }, []);

  // ─── Action Handlers ────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await saveGeofenceZone({
        id: safeExistingZone?.id, // undefined = INSERT, UUID = UPDATE
        patientId,
        label,
        center,
        radiusM,
        isActive: true,
        boundaryType,
      });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save zone.');
    } finally {
      setSaving(false);
    }
  }, [center, safeExistingZone?.id, label, navigation, patientId, radiusM, boundaryType]);

  const handleDelete = useCallback(() => {
    if (!safeExistingZone?.id) return;
    Alert.alert(
      'Delete Safe Zone',
      `Are you sure you want to remove "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const ok = await deleteGeofenceZone(safeExistingZone.id);
            if (ok) {
              navigation.goBack();
            } else {
              setError('Failed to delete zone.');
            }
            setDeleting(false);
          },
        },
      ]
    );
  }, [safeExistingZone?.id, label, navigation]);

  const radiusPct = ((radiusM - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100;
  const currentThemeColor = getPresetColor(label);
  const currentThemeBg = getPresetBg(label);

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {safeExistingZone ? 'Edit Safe Zone' : 'Add Safe Zone'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {patientName}
          </Text>
        </View>

        <Pressable
          onPress={useMyLocation}
          style={({ pressed }) => [styles.myLocationBtn, pressed && { opacity: 0.8 }]}
          disabled={locLoading}
        >
          {locLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <>
              <Ionicons name="location-outline" size={14} color="#2563EB" style={{ marginRight: 2 }} />
              <Text style={styles.myLocationText}>Me</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Map View Card */}
      <View style={styles.mapCard}>
        {isNativeMapDisabled() ? (
          <MapFallback
            latitude={center.latitude}
            longitude={center.longitude}
            patientName="Patient"
          />
        ) : (
          <MapErrorBoundary>
            <MapView
              ref={mapRef}
              style={styles.map}
              onMapReady={() => setMapReady(true)}
              initialRegion={{
                ...center,
                latitudeDelta: Math.max(0.015, (radiusM / 111_320) * 4),
                longitudeDelta: Math.max(0.015, (radiusM / 111_320) * 4),
              }}
            >
              {/* Dynamic Styled Circle boundary */}
              <Circle
                center={center}
                radius={radiusM}
                fillColor={currentThemeBg + 'CC'} // Add alpha transparency
                strokeColor={currentThemeColor}
                strokeWidth={2}
              />

              {/* Draggable PIN */}
              <Marker
                coordinate={center}
                draggable
                onDragEnd={(e) => setCenter(e.nativeEvent.coordinate)}
              >
                <View style={[styles.markerPin, { backgroundColor: currentThemeColor }]}>
                  <Feather name="map-pin" size={16} color="#FFFFFF" />
                </View>
              </Marker>
            </MapView>
          </MapErrorBoundary>
        )}

        <View style={styles.mapInstructionBadge}>
          <Text style={styles.mapInstructionText}>📍 Drag pin to reposition zone</Text>
        </View>
      </View>

      {/* Editor Controls Scroll View */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Card: Zone details */}
        <View style={styles.controlCard}>
          <Text style={styles.sectionLabel}>ZONE TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
            {ZONE_PRESETS.map((p) => {
              const active = label.toLowerCase() === p.label.toLowerCase();
              const themeColor = getPresetColor(p.label);
              const themeBg = getPresetBg(p.label);

              return (
                <Pressable
                  key={p.label}
                  onPress={() => setLabel(p.label)}
                  style={[
                    styles.presetChip,
                    active
                      ? { backgroundColor: themeBg, borderColor: themeColor }
                      : { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
                  ]}
                >
                  <Text style={styles.presetIcon}>{p.icon}</Text>
                  <Text
                    style={[
                      styles.presetChipText,
                      active ? { color: themeColor, fontFamily: F.bold } : { color: '#4B5563' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            style={styles.textInput}
            value={label}
            onChangeText={setLabel}
            placeholder="Or type a custom name..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Card: Radius Selection */}
        <View style={styles.controlCard}>
          <View style={styles.radiusHeaderRow}>
            <Text style={styles.sectionLabel}>SAFE ZONE RADIUS</Text>
            <View style={styles.radiusBadge}>
              <Text style={styles.radiusBadgeText}>{radiusM} m</Text>
            </View>
          </View>

          {/* Visual progress bar slider */}
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderProgress,
                { width: `${radiusPct}%`, backgroundColor: currentThemeColor },
              ]}
            />
          </View>

          <View style={styles.radiusStepsContainer}>
            {RADIUS_STEPS.map((step) => {
              const active = radiusM === step;
              return (
                <Pressable
                  key={step}
                  onPress={() => setRadiusM(step)}
                  style={[
                    styles.stepBtn,
                    active
                      ? { backgroundColor: '#2563EB', borderColor: '#2563EB' }
                      : { backgroundColor: '#FFFFFF', borderColor: '#F3F4F6' },
                  ]}
                >
                  <Text style={[styles.stepBtnText, active ? { color: '#FFFFFF' } : { color: '#4B5563' }]}>
                    {step >= 1000 ? `${step / 1000}km` : `${step}m`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Card: Boundary Selection */}
        <View style={styles.controlCard}>
          <Text style={styles.sectionLabel}>BOUNDARY TYPE</Text>
          <View style={styles.boundaryRow}>
            {/* Soft Boundary */}
            <Pressable
              onPress={() => setBoundaryType('soft')}
              style={[
                styles.boundaryOptionBtn,
                boundaryType === 'soft' && { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
              ]}
            >
              <Text style={styles.boundaryOptionIcon}>🔔</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={[
                    styles.boundaryOptionTitle,
                    boundaryType === 'soft' && { color: '#065F46' },
                  ]}
                >
                  Soft Boundary
                </Text>
                <Text style={styles.boundaryOptionSub}>Notify caregiver only</Text>
              </View>
              {boundaryType === 'soft' && <Ionicons name="checkmark" size={16} color="#10B981" />}
            </Pressable>

            {/* Hard Boundary */}
            <Pressable
              onPress={() => setBoundaryType('hard')}
              style={[
                styles.boundaryOptionBtn,
                boundaryType === 'hard' && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
              ]}
            >
              <Text style={styles.boundaryOptionIcon}>🚨</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={[
                    styles.boundaryOptionTitle,
                    boundaryType === 'hard' && { color: '#991B1B' },
                  ]}
                >
                  Hard Boundary
                </Text>
                <Text style={styles.boundaryOptionSub}>Emergency escalation</Text>
              </View>
              {boundaryType === 'hard' && <Ionicons name="checkmark" size={16} color="#EF4444" />}
            </Pressable>
          </View>
        </View>

        {/* Error Info if any */}
        {!!error && <Text style={styles.errorLabel}>{error}</Text>}

        {/* Action Save CTA */}
        <Pressable
          onPress={handleSave}
          disabled={saving || success}
          style={({ pressed }) => [
            styles.saveBtn,
            (saving || success) && { opacity: 0.7 },
            pressed && { opacity: 0.85 },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>
              {success ? '✓ Saved!' : safeExistingZone ? 'Save Changes' : 'Create Geofence'}
            </Text>
          )}
        </Pressable>

        {/* Delete CTA (only if editing existing) */}
        {safeExistingZone && (
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.deleteBtn,
              deleting && { opacity: 0.7 },
              pressed && { opacity: 0.85 },
            ]}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.deleteBtnText}>Delete Safe Zone</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

// ─── Premium Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#111827',
  },
  headerSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  myLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myLocationText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#2563EB',
  },

  // Map Card Styling
  mapCard: {
    height: 240,
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    marginTop: 10,
    marginBottom: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  mapInstructionBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.85)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mapInstructionText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // Presets Row
  presetsScroll: {
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  presetIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  presetChipText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: F.regular,
    fontSize: 14,
    color: '#111827',
  },

  // Radius Selector Card
  radiusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radiusBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  radiusBadgeText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#2563EB',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    position: 'relative',
    marginBottom: 16,
    overflow: 'hidden',
  },
  sliderProgress: {
    height: '100%',
    borderRadius: 3,
  },
  radiusStepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepBtnText: {
    fontFamily: F.bold,
    fontSize: 11,
  },

  // Boundary Option Selection
  boundaryRow: {
    gap: 10,
  },
  boundaryOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  boundaryOptionIcon: {
    fontSize: 20,
  },
  boundaryOptionTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#111827',
  },
  boundaryOptionSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  errorLabel: {
    color: '#EF4444',
    fontFamily: F.bold,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },

  // Buttons CTA
  saveBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
    marginBottom: 12,
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  deleteBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#DC2626',
  },
});
