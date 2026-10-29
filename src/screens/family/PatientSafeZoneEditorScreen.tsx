/**
 * SureStep — src/screens/family/PatientSafeZoneEditorScreen.tsx
 * Safe Zone / Geofence Editor for Family Care Circles.
 * PRESERVES the exact visual design of CaregiverGeofenceEditorScreen.
 * Connected to canonical /api/v1/care-circles/:circleId/safe-zones endpoints.
 * Circle Owner Only.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { MapErrorBoundary } from '../../components/shared/MapErrorBoundary';
import { MapFallback } from '../../components/shared/MapFallback';
import { isNativeMapDisabled } from '../../utils/mapConfig';
import {
  createCircleSafeZone,
  updateCircleSafeZone,
  deleteCircleSafeZone,
} from '../../services/careCircleService';
import { fetchPatientTelemetry } from '../../services/safetyService';

type Props = NativeStackScreenProps<FamilyStackParams, 'PatientSafeZoneEditorScreen'>;

interface Coords {
  latitude: number;
  longitude: number;
}

const RADIUS_MIN = 50;
const RADIUS_MAX = 2000;
const RADIUS_STEPS = [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000];

const ZONE_PRESETS = [
  { label: 'Home', icon: 'home' },
  { label: 'Clinic', icon: 'activity' },
  { label: 'Park', icon: 'map' },
  { label: 'Pharmacy', icon: 'heart' },
  { label: 'Temple', icon: 'compass' },
  { label: 'Market', icon: 'shopping-cart' },
  { label: 'Other', icon: 'map-pin' },
];

const DEFAULT_CENTER: Coords = { latitude: 12.9716, longitude: 77.5946 };

const getPresetColor = (label: string) => {
  const norm = label.toLowerCase();
  if (norm.includes('home')) return '#2563EB';
  if (norm.includes('clinic') || norm.includes('park') || norm.includes('pharmacy')) return '#10B981';
  if (norm.includes('temple')) return '#8B5CF6';
  return '#F59E0B';
};

const getPresetBg = (label: string) => {
  const norm = label.toLowerCase();
  if (norm.includes('home')) return '#EFF6FF';
  if (norm.includes('clinic') || norm.includes('park') || norm.includes('pharmacy')) return '#ECFDF5';
  if (norm.includes('temple')) return '#F5F3FF';
  return '#FFFBEB';
};

export const PatientSafeZoneEditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { circleId, patientId, patientName = 'Patient', existingZone } = route.params;
  const { isOwner } = useFamilyContext();

  const isEditing = Boolean(existingZone?.id);

  const [center, setCenter] = useState<Coords>(existingZone?.center ?? DEFAULT_CENTER);
  const [radiusM, setRadiusM] = useState(existingZone?.radiusM ?? 300);
  const [label, setLabel] = useState(existingZone?.label ?? 'Home');
  const [boundaryType, setBoundaryType] = useState<'soft' | 'hard'>(
    existingZone?.boundaryType ?? 'soft'
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (existingZone?.center) {
      setCenter(existingZone.center);
      return;
    }

    let active = true;
    const fetchInitialLocation = async () => {
      setLocLoading(true);
      try {
        const telemetry = await fetchPatientTelemetry(patientId);
        if (active && telemetry?.latitude && telemetry?.longitude) {
          const ptCoords: Coords = { latitude: telemetry.latitude, longitude: telemetry.longitude };
          setCenter(ptCoords);
          mapRef.current?.animateToRegion({
            ...ptCoords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (active) {
            const userCoords: Coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setCenter(userCoords);
            mapRef.current?.animateToRegion({
              ...userCoords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      } catch (err) {
        console.warn('[PatientSafeZoneEditorScreen] location fetch error:', err);
      } finally {
        if (active) setLocLoading(false);
      }
    };

    fetchInitialLocation();
    return () => {
      active = false;
    };
  }, [existingZone, patientId]);

  const stepRadius = (direction: 'up' | 'down') => {
    const curIdx = RADIUS_STEPS.indexOf(radiusM);
    if (direction === 'up') {
      if (curIdx === -1) {
        const next = RADIUS_STEPS.find((r) => r > radiusM) ?? RADIUS_MAX;
        setRadiusM(next);
      } else if (curIdx < RADIUS_STEPS.length - 1) {
        setRadiusM(RADIUS_STEPS[curIdx + 1]);
      }
    } else {
      if (curIdx === -1) {
        const prev = [...RADIUS_STEPS].reverse().find((r) => r < radiusM) ?? RADIUS_MIN;
        setRadiusM(prev);
      } else if (curIdx > 0) {
        setRadiusM(RADIUS_STEPS[curIdx - 1]);
      }
    }
  };

  const handleSave = async () => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the Circle Owner can configure safe zones.');
      return;
    }
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      Alert.alert('Label Required', 'Please enter a name for this safe zone.');
      return;
    }

    try {
      setSaving(true);
      if (isEditing && existingZone?.id) {
        await updateCircleSafeZone(circleId, existingZone.id, {
          name: trimmedLabel,
          centerLat: center.latitude,
          centerLng: center.longitude,
          radiusMeters: radiusM,
        });
        Alert.alert('Safe Zone Updated', `"${trimmedLabel}" has been saved.`);
      } else {
        await createCircleSafeZone(circleId, {
          name: trimmedLabel,
          centerLat: center.latitude,
          centerLng: center.longitude,
          radiusMeters: radiusM,
          monitoredPatientIds: [patientId],
        });
        Alert.alert('Safe Zone Created', `"${trimmedLabel}" is now protecting ${patientName}.`);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save safe zone.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existingZone?.id) return;
    Alert.alert(
      'Delete Safe Place',
      `Are you sure you want to delete "${existingZone.label}"? Alerts will no longer trigger for this area.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteCircleSafeZone(circleId, existingZone.id);
              Alert.alert('Deleted', 'Safe zone has been removed.');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete safe zone.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const currentColor = getPresetColor(label);
  const currentBg = getPresetBg(label);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Safe Place' : 'New Safe Place'}
        </Text>
        <Pressable
          style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0E7A67" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Map Preview Card */}
        <View style={styles.mapCard}>
          {isNativeMapDisabled() ? (
            <MapFallback
              latitude={center.latitude}
              longitude={center.longitude}
              patientName={patientName}
            />
          ) : (
            <MapErrorBoundary>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  ...center,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(e) => {
                  const coords = e.nativeEvent.coordinate;
                  setCenter({ latitude: coords.latitude, longitude: coords.longitude });
                }}
              >
                <Circle
                  center={center}
                  radius={radiusM}
                  fillColor={`${currentColor}1A`}
                  strokeColor={currentColor}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={center}
                  draggable
                  onDragEnd={(e) => setCenter(e.nativeEvent.coordinate)}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={[styles.pinMarker, { backgroundColor: currentColor }]}>
                    <Feather name="map-pin" size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              </MapView>
            </MapErrorBoundary>
          )}

          {locLoading && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="small" color="#0E7A67" />
            </View>
          )}

          <View style={styles.mapHelpBadge}>
            <Text style={styles.mapHelpText}>Tap or drag pin to position zone</Text>
          </View>
        </View>

        {/* Preset Category Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Place Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
            {ZONE_PRESETS.map((preset) => {
              const isSelected = label.toLowerCase() === preset.label.toLowerCase();
              return (
                <Pressable
                  key={preset.label}
                  style={[
                    styles.presetChip,
                    isSelected && { backgroundColor: currentColor, borderColor: currentColor },
                  ]}
                  onPress={() => setLabel(preset.label)}
                >
                  <Feather
                    name={preset.icon as any}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && { color: '#FFFFFF', fontFamily: F.semiBold },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Custom Place Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Place Name</Text>
          <TextInput
            style={styles.textInput}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Home, Sunshine Day Center"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Radius Stepper */}
        <View style={styles.section}>
          <View style={styles.radiusHeaderRow}>
            <Text style={styles.sectionLabel}>Safety Radius</Text>
            <Text style={[styles.radiusValueText, { color: currentColor }]}>
              {radiusM} meters
            </Text>
          </View>

          <View style={styles.stepperContainer}>
            <Pressable
              style={[styles.stepperBtn, radiusM <= RADIUS_MIN && styles.stepperBtnDisabled]}
              onPress={() => stepRadius('down')}
              disabled={radiusM <= RADIUS_MIN}
            >
              <Feather name="minus" size={18} color={radiusM <= RADIUS_MIN ? '#D1D5DB' : '#374151'} />
            </Pressable>

            <View style={styles.radiusPillRow}>
              {[100, 200, 300, 500, 1000].map((step) => {
                const isSelected = radiusM === step;
                return (
                  <Pressable
                    key={step}
                    style={[
                      styles.radiusStepPill,
                      isSelected && { backgroundColor: currentColor, borderColor: currentColor },
                    ]}
                    onPress={() => setRadiusM(step)}
                  >
                    <Text
                      style={[
                        styles.radiusStepText,
                        isSelected && { color: '#FFFFFF', fontFamily: F.bold },
                      ]}
                    >
                      {step >= 1000 ? `${step / 1000}km` : `${step}m`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.stepperBtn, radiusM >= RADIUS_MAX && styles.stepperBtnDisabled]}
              onPress={() => stepRadius('up')}
              disabled={radiusM >= RADIUS_MAX}
            >
              <Feather name="plus" size={18} color={radiusM >= RADIUS_MAX ? '#D1D5DB' : '#374151'} />
            </Pressable>
          </View>
        </View>

        {/* Boundary Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Boundary Type</Text>
          <View style={styles.boundaryToggleContainer}>
            <Pressable
              style={[
                styles.boundaryOption,
                boundaryType === 'soft' && styles.boundaryOptionSelected,
              ]}
              onPress={() => setBoundaryType('soft')}
            >
              <Text
                style={[
                  styles.boundaryOptionTitle,
                  boundaryType === 'soft' && styles.boundaryOptionTitleSelected,
                ]}
              >
                Soft Boundary
              </Text>
              <Text style={styles.boundaryOptionSub}>
                Allows brief buffer before alerting. Best for walks.
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.boundaryOption,
                boundaryType === 'hard' && styles.boundaryOptionSelected,
              ]}
              onPress={() => setBoundaryType('hard')}
            >
              <Text
                style={[
                  styles.boundaryOptionTitle,
                  boundaryType === 'hard' && styles.boundaryOptionTitleSelected,
                ]}
              >
                Strict Boundary
              </Text>
              <Text style={styles.boundaryOptionSub}>
                Instant alert immediately upon crossing perimeter.
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Primary Save Button */}
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Save Changes' : 'Create Safe Place'}
            </Text>
          )}
        </Pressable>

        {/* Delete Button (Editing Only) */}
        {isEditing && (
          <Pressable
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text style={styles.deleteBtnText}>Delete Safe Place</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAF8F5',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#111827',
  },
  saveHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  saveHeaderText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#0E7A67',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mapCard: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHelpBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapHelpText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#374151',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  presetChipText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: F.regular,
    color: '#111827',
  },
  radiusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  radiusValueText: {
    fontFamily: F.bold,
    fontSize: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  radiusPillRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  radiusStepPill: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  radiusStepText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#374151',
  },
  boundaryToggleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  boundaryOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  boundaryOptionSelected: {
    borderColor: '#0E7A67',
    backgroundColor: '#EBF5F3',
  },
  boundaryOptionTitle: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#111827',
    marginBottom: 4,
  },
  boundaryOptionTitleSelected: {
    color: '#0E7A67',
  },
  boundaryOptionSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  saveBtn: {
    backgroundColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  deleteBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deleteBtnText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#EF4444',
  },
});
