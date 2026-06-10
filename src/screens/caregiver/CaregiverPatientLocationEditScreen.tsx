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
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { MapErrorBoundary } from '../../components/shared/MapErrorBoundary';
import { MapFallback } from '../../components/shared/MapFallback';
import { isNativeMapDisabled } from '../../utils/mapConfig';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  fetchPatientGeofences,
  saveGeofenceZone,
  fetchLatestPatientLocation,
  type GeofenceZone,
  type Coords,
} from '../../utils/geofenceUtils';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverPatientLocationEditScreen'>;

// Helper to determine theme colors and icons based on zone labels
const getZoneTheme = (label: string) => {
  const normalized = label.toLowerCase();
  if (normalized.includes('home')) {
    return {
      primary: '#2563EB', // Blue
      bg: '#EFF6FF',
      icon: 'home',
      iconType: 'feather',
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
      iconType: 'ionicons',
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
      iconType: 'fontawesome',
      circleFill: 'rgba(139, 92, 246, 0.08)',
      circleStroke: 'rgba(139, 92, 246, 0.4)',
    };
  } else {
    return {
      primary: '#F59E0B', // Amber / Orange
      bg: '#FFFBEB',
      icon: 'map-pin',
      iconType: 'feather',
      circleFill: 'rgba(245, 158, 11, 0.08)',
      circleStroke: 'rgba(245, 158, 11, 0.4)',
    };
  }
};

export const CaregiverPatientLocationEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, patientName } = route.params;

  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientCoords, setPatientCoords] = useState<Coords | null>(null);

  // Reload zones when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      const loadData = async () => {
        try {
          const list = await fetchPatientGeofences(patientId);
          const location = await fetchLatestPatientLocation(patientId);
          if (active) {
            setZones(list);
            if (location) {
              setPatientCoords({ latitude: location.latitude, longitude: location.longitude });
            } else if (list.length > 0) {
              setPatientCoords(list[0].center);
            }
          }
        } catch (err) {
          console.warn('Failed to load geofences in Safe Places screen:', err);
        } finally {
          if (active) setLoading(false);
        }
      };

      void loadData();

      return () => {
        active = false;
      };
    }, [patientId])
  );

  // ─── Event Handlers ────────────────────────────────────────────────────────

  const handleToggleArrival = async (zone: GeofenceZone) => {
    const updatedZone: GeofenceZone = {
      ...zone,
      notifyOnArrival: !zone.notifyOnArrival,
    };
    await saveGeofenceZone(updatedZone);
    setZones(prev => prev.map(z => (z.id === zone.id ? updatedZone : z)));
  };

  const handleToggleDeparture = async (zone: GeofenceZone) => {
    const updatedZone: GeofenceZone = {
      ...zone,
      notifyOnDeparture: !zone.notifyOnDeparture,
    };
    await saveGeofenceZone(updatedZone);
    setZones(prev => prev.map(z => (z.id === zone.id ? updatedZone : z)));
  };

  const handleSetBoundaryType = async (zone: GeofenceZone, type: 'soft' | 'hard') => {
    if (zone.boundaryType === type) return;
    const updatedZone: GeofenceZone = {
      ...zone,
      boundaryType: type,
    };
    await saveGeofenceZone(updatedZone);
    setZones(prev => prev.map(z => (z.id === zone.id ? updatedZone : z)));
  };

  const handleEditZone = (zone: GeofenceZone) => {
    navigation.navigate('CaregiverGeofenceEditorScreen', {
      patientId,
      patientName: patientName || 'Patient',
      existingZone: {
        id: zone.id,
        label: zone.label,
        center: zone.center,
        radiusM: zone.radiusM,
        boundaryType: zone.boundaryType,
      },
    });
  };

  const handleCreateNewZone = () => {
    navigation.navigate('CaregiverGeofenceEditorScreen', {
      patientId,
      patientName: patientName || 'Patient',
      existingZone: null,
    });
  };

  // Determine map region centered on patient location or center of first zone
  const getInitialRegion = () => {
    const defaultCoords = { latitude: 12.9716, longitude: 77.5946 };
    const center = patientCoords || (zones[0]?.center) || defaultCoords;
    return {
      ...center,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
  };

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
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Safe Places</Text>
          <Text style={styles.subTitle}>Geofence management</Text>
        </View>

        {/* Map Preview Card */}
        {loading ? (
          <View style={styles.mapCardPlaceholder}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <View style={styles.mapCard}>
            {isNativeMapDisabled() ? (
              <MapFallback
                latitude={getInitialRegion().latitude}
                longitude={getInitialRegion().longitude}
                patientName="Patient"
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
                  {zones.map(z => {
                    const theme = getZoneTheme(z.label);
                    return (
                      <React.Fragment key={z.id}>
                        <Circle
                          center={z.center}
                          radius={z.radiusM}
                          fillColor={theme.circleFill}
                          strokeColor={theme.circleStroke}
                          strokeWidth={2}
                        />
                        <Marker coordinate={z.center} anchor={{ x: 0.5, y: 0.5 }}>
                          <View style={styles.miniMarkerContainer}>
                            <View style={[styles.miniMarker, { backgroundColor: theme.primary }]}>
                              {theme.iconType === 'feather' && (
                                <Feather name={theme.icon as any} size={10} color="#FFFFFF" />
                              )}
                              {theme.iconType === 'ionicons' && (
                                <Ionicons name={theme.icon as any} size={10} color="#FFFFFF" />
                              )}
                              {theme.iconType === 'fontawesome' && (
                                <FontAwesome5 name={theme.icon as any} size={10} color="#FFFFFF" />
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


            {/* Map Legend overlay */}
            {zones.length > 0 && (
              <View style={styles.legendContainer}>
                {zones.slice(0, 3).map(z => {
                  const theme = getZoneTheme(z.label);
                  return (
                    <View key={z.id} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                      <Text style={styles.legendText} numberOfLines={1}>
                        {z.label.split(' ')[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trusted Places</Text>
          <Text style={styles.placesCount}>{zones.length} places</Text>
        </View>

        {/* Places Card List */}
        {zones.length === 0 && !loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No safe places configured yet.</Text>
          </View>
        ) : (
          zones.map(z => {
            const theme = getZoneTheme(z.label);

            return (
              <View key={z.id} style={styles.placeCard}>
                {/* Card Top Row */}
                <Pressable onPress={() => handleEditZone(z)} style={styles.cardHeaderPressable}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.bg }]}>
                    {theme.iconType === 'feather' && (
                      <Feather name={theme.icon as any} size={20} color={theme.primary} />
                    )}
                    {theme.iconType === 'ionicons' && (
                      <Ionicons name={theme.icon as any} size={20} color={theme.primary} />
                    )}
                    {theme.iconType === 'fontawesome' && (
                      <FontAwesome5 name={theme.icon as any} size={18} color={theme.primary} />
                    )}
                  </View>

                  <View style={styles.metaContainer}>
                    <Text style={styles.placeName}>{z.label}</Text>
                    <Text style={styles.placeRadius}>{z.radiusM}m radius</Text>
                  </View>

                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            );
          })
        )}

        {/* Large Create Geofence Button at Bottom */}
        <Pressable
          onPress={handleCreateNewZone}
          style={({ pressed }) => [styles.createGeofenceBtn, pressed && { opacity: 0.85 }]}
        >
          <Feather name="plus" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.createGeofenceBtnText}>Create New Geofence</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
};

// ─── Styles matching the "Safe Places" reference screenshot ─────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB', // Vibrant blue
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#2563EB',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  addPlaceBtnText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  titleSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  mainTitle: {
    fontFamily: F.bold,
    fontSize: 28,
    color: '#111827',
  },
  subTitle: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Map Card Styling
  mapCard: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 28,
  },
  mapCardPlaceholder: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    marginBottom: 28,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  miniMarkerContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  miniMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  legendContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
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
    fontFamily: F.bold,
    fontSize: 11,
    color: '#374151',
  },

  // Section Heading
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#111827',
  },
  placesCount: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#9CA3AF',
  },

  // Place Cards
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    flex: 1,
    marginLeft: 14,
  },
  placeName: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#111827',
  },
  placeRadius: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#2563EB', // Selected primary blue
  },
  actionBtnInactive: {
    backgroundColor: '#F3F4F6', // Unselected light gray
  },
  actionBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  actionBtnTextActive: {
    color: '#FFFFFF',
  },
  actionBtnTextInactive: {
    color: '#374151',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  boundarySelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  boundaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boundaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  boundaryText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#9CA3AF',
  },
  boundaryTextActive: {
    color: '#374151',
    fontFamily: F.bold,
  },

  // Empty State
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Create Geofence Button
  createGeofenceBtn: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    marginTop: 16,
  },
  createGeofenceBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
