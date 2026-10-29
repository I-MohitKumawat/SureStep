/**
 * SureStep — src/screens/family/PatientSafeZonesScreen.tsx
 * Safe Zones / Trusted Places list for Family users.
 * PRESERVES the exact visual design of CaregiverPatientLocationEditScreen.
 * Connected to canonical /api/v1/care-circles/:circleId/safe-zones endpoints.
 * Guarded by Circle Owner authority (read-only for non-owners).
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
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
  listCircleSafeZones,
  updateCircleSafeZone,
  SafeZone,
} from '../../services/careCircleService';
import { fetchPatientTelemetry } from '../../services/safetyService';

type Props = NativeStackScreenProps<FamilyStackParams, 'PatientSafeZonesScreen'>;

interface Coords {
  latitude: number;
  longitude: number;
}

// Helper to determine theme colors and icons based on zone labels (matches caregiver UI)
const getZoneTheme = (label: string) => {
  const normalized = label.toLowerCase();
  if (normalized.includes('home')) {
    return {
      primary: '#2563EB', // Blue
      bg: '#EFF6FF',
      icon: 'home',
      iconType: 'feather' as const,
      circleFill: 'rgba(37, 99, 235, 0.08)',
      circleStroke: 'rgba(37, 99, 235, 0.4)',
    };
  } else if (
    normalized.includes('clinic') ||
    normalized.includes('hospital') ||
    normalized.includes('medical') ||
    normalized.includes('pharmacy') ||
    normalized.includes('doctor')
  ) {
    return {
      primary: '#10B981', // Green
      bg: '#ECFDF5',
      icon: 'medical-outline',
      iconType: 'ionicons' as const,
      circleFill: 'rgba(16, 185, 129, 0.08)',
      circleStroke: 'rgba(16, 185, 129, 0.4)',
    };
  } else if (
    normalized.includes('temple') ||
    normalized.includes('church') ||
    normalized.includes('mosque') ||
    normalized.includes('shrine')
  ) {
    return {
      primary: '#8B5CF6', // Purple
      bg: '#F5F3FF',
      icon: 'place-of-worship',
      iconType: 'fontawesome' as const,
      circleFill: 'rgba(139, 92, 246, 0.08)',
      circleStroke: 'rgba(139, 92, 246, 0.4)',
    };
  } else {
    return {
      primary: '#F59E0B', // Amber / Orange
      bg: '#FFFBEB',
      icon: 'map-pin',
      iconType: 'feather' as const,
      circleFill: 'rgba(245, 158, 11, 0.08)',
      circleStroke: 'rgba(245, 158, 11, 0.4)',
    };
  }
};

export const PatientSafeZonesScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { circleId, patientId, patientName = 'Patient' } = route.params;
  const { isOwner, activeCircle } = useFamilyContext();

  const [zones, setZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientCoords, setPatientCoords] = useState<Coords | null>(null);

  // Reload zones when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      const loadData = async () => {
        try {
          const [zonesList, telemetry] = await Promise.all([
            listCircleSafeZones(circleId),
            fetchPatientTelemetry(patientId),
          ]);
          if (active) {
            setZones(zonesList);
            if (telemetry?.latitude && telemetry?.longitude) {
              setPatientCoords({ latitude: telemetry.latitude, longitude: telemetry.longitude });
            } else if (zonesList.length > 0) {
              setPatientCoords({
                latitude: zonesList[0].center_lat,
                longitude: zonesList[0].center_lng,
              });
            }
          }
        } catch (err) {
          console.warn('[PatientSafeZonesScreen] Failed to load safe zones:', err);
        } finally {
          if (active) setLoading(false);
        }
      };

      void loadData();

      return () => {
        active = false;
      };
    }, [circleId, patientId])
  );

  const handleToggleActive = async (zone: SafeZone) => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the Care Circle Owner can toggle safe zones.');
      return;
    }
    const newStatus = !zone.is_active;
    try {
      await updateCircleSafeZone(circleId, zone.id, { isActive: newStatus });
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, is_active: newStatus } : z))
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update zone status.');
    }
  };

  const handleEditZone = (zone: SafeZone) => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the Care Circle Owner can edit safe zones.');
      return;
    }
    navigation.navigate('PatientSafeZoneEditorScreen', {
      circleId,
      patientId,
      patientName,
      existingZone: {
        id: zone.id,
        label: zone.name,
        center: { latitude: zone.center_lat, longitude: zone.center_lng },
        radiusM: zone.radius_meters,
        boundaryType: (zone.boundary_type as any) ?? 'soft',
      },
    });
  };

  const handleCreateNewZone = () => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the Care Circle Owner can create safe zones.');
      return;
    }
    navigation.navigate('PatientSafeZoneEditorScreen', {
      circleId,
      patientId,
      patientName,
      existingZone: null,
    });
  };

  const getInitialRegion = () => {
    const defaultCoords = { latitude: 12.9716, longitude: 77.5946 };
    const center =
      patientCoords ||
      (zones[0] ? { latitude: zones[0].center_lat, longitude: zones[0].center_lng } : defaultCoords);
    return {
      ...center,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Safe Places</Text>
          <Text style={styles.subTitle}>Geofence management for {patientName}</Text>
        </View>

        {/* Non-owner notification banner */}
        {!isOwner && (
          <View style={styles.nonOwnerBanner}>
            <Ionicons name="information-circle-outline" size={18} color="#52605D" />
            <Text style={styles.nonOwnerBannerText}>
              Safe zones are configured by the Care Circle Owner ({activeCircle?.owner_name ?? 'Owner'}).
            </Text>
          </View>
        )}

        {/* Map Preview Card */}
        {loading ? (
          <View style={styles.mapCardPlaceholder}>
            <ActivityIndicator size="small" color="#0E7A67" />
          </View>
        ) : (
          <View style={styles.mapCard}>
            {isNativeMapDisabled() ? (
              <MapFallback
                latitude={getInitialRegion().latitude}
                longitude={getInitialRegion().longitude}
                patientName={patientName}
              />
            ) : (
              <MapErrorBoundary>
                <MapView
                  style={styles.map}
                  showsUserLocation={false}
                  showsCompass={false}
                  showsMyLocationButton={false}
                  region={getInitialRegion()}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={true}
                  rotateEnabled={true}
                >
                  {zones.map((z) => {
                    const theme = getZoneTheme(z.name);
                    const center = { latitude: z.center_lat, longitude: z.center_lng };
                    return (
                      <React.Fragment key={z.id}>
                        <Circle
                          center={center}
                          radius={z.radius_meters}
                          fillColor={theme.circleFill}
                          strokeColor={theme.circleStroke}
                          strokeWidth={2}
                        />
                        <Marker coordinate={center} anchor={{ x: 0.5, y: 0.5 }}>
                          <View style={styles.miniMarkerContainer}>
                            <View style={[styles.miniMarker, { backgroundColor: theme.primary }]}>
                              {theme.iconType === 'feather' && (
                                <Feather name={theme.icon as any} size={10} color="#FFFFFF" />
                              )}
                              {theme.iconType === 'ionicons' && (
                                <Ionicons name={theme.icon as any} size={10} color="#FFFFFF" />
                              )}
                              {theme.iconType === 'fontawesome' && (
                                <FontAwesome5 name={theme.icon as any} size={9} color="#FFFFFF" />
                              )}
                            </View>
                          </View>
                        </Marker>
                      </React.Fragment>
                    );
                  })}
                </MapView>
              </MapErrorBoundary>
            )}

            {/* Map Legend */}
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.legendText}>Home</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Medical</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.legendText}>Community</Text>
              </View>
            </View>
          </View>
        )}

        {/* Section Heading */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Trusted Places</Text>
          <Text style={styles.sectionCount}>{zones.length} active</Text>
        </View>

        {/* Places List */}
        {zones.map((zone) => {
          const theme = getZoneTheme(zone.name);
          const isHard = zone.boundary_type === 'hard';

          return (
            <View key={zone.id} style={styles.placeCard}>
              {/* Place Card Header */}
              <View style={styles.placeHeader}>
                <View style={[styles.placeIconWrap, { backgroundColor: theme.bg }]}>
                  {theme.iconType === 'feather' && (
                    <Feather name={theme.icon as any} size={18} color={theme.primary} />
                  )}
                  {theme.iconType === 'ionicons' && (
                    <Ionicons name={theme.icon as any} size={18} color={theme.primary} />
                  )}
                  {theme.iconType === 'fontawesome' && (
                    <FontAwesome5 name={theme.icon as any} size={16} color={theme.primary} />
                  )}
                </View>

                <View style={styles.placeTitleGroup}>
                  <Text style={styles.placeName}>{zone.name}</Text>
                  <Text style={styles.placeRadius}>Radius: {zone.radius_meters}m</Text>
                </View>

                {isOwner && (
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => handleEditZone(zone)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="edit-2" size={14} color="#6B7280" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </Pressable>
                )}
              </View>

              {/* Status and Active Pill */}
              <View style={styles.boundaryPillRow}>
                <View style={[styles.typeBadge, isHard ? styles.typeBadgeHard : styles.typeBadgeSoft]}>
                  <Text style={[styles.typeBadgeText, isHard ? styles.typeBadgeTextHard : styles.typeBadgeTextSoft]}>
                    {isHard ? 'Strict Boundary' : 'Soft Boundary'}
                  </Text>
                </View>
                {isOwner ? (
                  <Pressable
                    style={[styles.statusToggle, zone.is_active && styles.statusToggleActive]}
                    onPress={() => handleToggleActive(zone)}
                  >
                    <View style={[styles.statusDot, zone.is_active && styles.statusDotActive]} />
                    <Text style={[styles.statusToggleText, zone.is_active && styles.statusToggleTextActive]}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={[styles.statusToggle, zone.is_active && styles.statusToggleActive]}>
                    <View style={[styles.statusDot, zone.is_active && styles.statusDotActive]} />
                    <Text style={[styles.statusToggleText, zone.is_active && styles.statusToggleTextActive]}>
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Add Place Button (Owner Only) */}
        {isOwner && (
          <Pressable
            style={({ pressed }) => [styles.addPlaceBtn, pressed && { opacity: 0.85 }]}
            onPress={handleCreateNewZone}
          >
            <Feather name="plus" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addPlaceBtnText}>Add Place</Text>
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
    paddingVertical: 10,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  titleSection: {
    marginBottom: 16,
  },
  mainTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    color: '#111827',
  },
  subTitle: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  nonOwnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0ECE4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  nonOwnerBannerText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
    flex: 1,
  },
  mapCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapCardPlaceholder: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  miniMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#374151',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#111827',
  },
  sectionCount: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeTitleGroup: {
    flex: 1,
  },
  placeName: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#111827',
  },
  placeRadius: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#374151',
  },
  boundaryPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeSoft: {
    backgroundColor: '#EFF6FF',
  },
  typeBadgeHard: {
    backgroundColor: '#FEF3C7',
  },
  typeBadgeText: {
    fontFamily: F.medium,
    fontSize: 11,
  },
  typeBadgeTextSoft: {
    color: '#2563EB',
  },
  typeBadgeTextHard: {
    color: '#D97706',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  statusToggleActive: {
    backgroundColor: '#ECFDF5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusToggleText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  statusToggleTextActive: {
    color: '#059669',
  },
  addPlaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E7A67',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  addPlaceBtnText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
