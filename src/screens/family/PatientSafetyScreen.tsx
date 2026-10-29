/**
 * SureStep — src/screens/family/PatientSafetyScreen.tsx
 * Safety overview for a specific patient within the active Care Circle.
 * Shows live telemetry status, Safe Zones list, and Recent Safety Incidents.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { listCircleSafeZones, SafeZone } from '../../services/careCircleService';
import {
  listCircleSafetyAlerts,
  fetchPatientTelemetry,
  SafetyAlert,
  PatientTelemetry,
} from '../../services/safetyService';

type Props = NativeStackScreenProps<FamilyStackParams, 'PatientSafetyScreen'>;

export const PatientSafetyScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { patientId, patientName = 'Patient' } = route.params;
  const { activeCircle, isOwner } = useFamilyContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState<PatientTelemetry | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [telemetryRes, alertsRes, zonesRes] = await Promise.all([
        fetchPatientTelemetry(patientId),
        activeCircle ? listCircleSafetyAlerts(activeCircle.id) : Promise.resolve([]),
        activeCircle ? listCircleSafeZones(activeCircle.id) : Promise.resolve([]),
      ]);
      setTelemetry(telemetryRes);
      // Filter alerts for this patient
      const patientAlerts = alertsRes.filter((a) => a.patient_id === patientId);
      setAlerts(patientAlerts);
      setSafeZones(zonesRes);
    } catch (err) {
      console.warn('[PatientSafetyScreen] loadData error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, activeCircle]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Check if there is an active emergency alert
  const activeAlert = alerts.find(
    (a) => a.status === 'TRIGGERED' || a.status === 'ACKNOWLEDGED' || a.status === 'RESPONDED'
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{patientName}’s Safety</Text>
          <Text style={styles.headerSubtitle}>
            {activeCircle?.name ?? 'Care Circle'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E7A67" />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0E7A67" />
          </View>
        ) : (
          <>
            {/* Live Status Banner */}
            {activeAlert ? (
              <TouchableOpacity
                style={styles.emergencyBanner}
                onPress={() =>
                  navigation.navigate('AlertDetailScreen', {
                    alertId: activeAlert.id,
                    circleId: activeCircle?.id,
                    patientId,
                  })
                }
                activeOpacity={0.9}
              >
                <View style={styles.emergencyIconWrap}>
                  <Ionicons name="warning" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.emergencyTextWrap}>
                  <Text style={styles.emergencyTitle}>
                    {activeAlert.alert_type === 'SOS_MANUAL' ? 'SOS Triggered' : 'Left Safe Zone'}
                  </Text>
                  <Text style={styles.emergencyDesc} numberOfLines={2}>
                    {activeAlert.zone_name
                      ? `Patient is outside ${activeAlert.zone_name}. Tap to view location and respond.`
                      : 'Immediate attention requested. Tap to coordinate response.'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C93B2B" />
              </TouchableOpacity>
            ) : (
              <View style={styles.safeBanner}>
                <View style={styles.safeIconWrap}>
                  <Ionicons name="shield-checkmark" size={22} color="#0E7A67" />
                </View>
                <View style={styles.safeTextWrap}>
                  <Text style={styles.safeTitle}>Within Safe Zone</Text>
                  <Text style={styles.safeSubtitle}>
                    {telemetry?.current_zone_name ? `Currently in ${telemetry.current_zone_name}` : 'Location normal'}
                  </Text>
                </View>
                <View style={styles.telemetryPills}>
                  {telemetry?.battery_pct != null && (
                    <View style={styles.telemetryPill}>
                      <Ionicons name="battery-charging-outline" size={14} color="#52605D" />
                      <Text style={styles.telemetryPillText}>{telemetry.battery_pct}%</Text>
                    </View>
                  )}
                  <View style={styles.telemetryPill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.telemetryPillText}>Live</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Safe Zones Section */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Safe Zones</Text>
                <Text style={styles.sectionSubtitle}>
                  {safeZones.length} {safeZones.length === 1 ? 'configured zone' : 'configured zones'}
                </Text>
              </View>
              {isOwner ? (
                <TouchableOpacity
                  style={styles.actionLink}
                  onPress={() =>
                    activeCircle &&
                    navigation.navigate('PatientSafeZonesScreen', {
                      circleId: activeCircle.id,
                      patientId,
                      patientName,
                    })
                  }
                >
                  <Ionicons name="settings-outline" size={16} color="#0E7A67" />
                  <Text style={styles.actionLinkText}>Manage</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.ownerOnlyBadge}>
                  <Text style={styles.ownerOnlyBadgeText}>Owner managed</Text>
                </View>
              )}
            </View>

            {safeZones.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="location-outline" size={32} color="#8A9592" />
                <Text style={styles.emptyCardTitle}>No Safe Zones Created</Text>
                <Text style={styles.emptyCardDesc}>
                  Safe zones send instant alerts if {patientName} wanders outside defined boundaries.
                </Text>
                {isOwner && activeCircle && (
                  <TouchableOpacity
                    style={styles.createZoneBtn}
                    onPress={() =>
                      navigation.navigate('PatientSafeZoneEditorScreen', {
                        circleId: activeCircle.id,
                        patientId,
                        patientName,
                      })
                    }
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.createZoneBtnText}>Add Safe Zone</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              safeZones.map((zone) => (
                <TouchableOpacity
                  key={zone.id}
                  style={styles.zoneCard}
                  onPress={() => {
                    if (activeCircle) {
                      navigation.navigate('PatientSafeZonesScreen', {
                        circleId: activeCircle.id,
                        patientId,
                        patientName,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.zoneIconWrap}>
                    <Ionicons name="shield-outline" size={22} color="#0E7A67" />
                  </View>
                  <View style={styles.zoneInfoWrap}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Text style={styles.zoneDetails}>
                      Radius: {zone.radius_meters}m • {zone.boundary_type ?? 'Soft'} boundary
                    </Text>
                  </View>
                  <View style={styles.activePill}>
                    <View style={styles.activePillDot} />
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Recent Safety Incidents Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
              <View>
                <Text style={styles.sectionTitle}>Recent Safety Incidents</Text>
                <Text style={styles.sectionSubtitle}>Geofence alerts and SOS events</Text>
              </View>
            </View>

            {alerts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#0E7A67" />
                <Text style={styles.emptyCardTitle}>No Safety Incidents</Text>
                <Text style={styles.emptyCardDesc}>
                  No wander alerts or SOS requests recorded recently for {patientName}.
                </Text>
              </View>
            ) : (
              alerts.map((alert) => {
                const isResolved = alert.status === 'RESOLVED';
                return (
                  <TouchableOpacity
                    key={alert.id}
                    style={styles.alertCard}
                    onPress={() =>
                      navigation.navigate('AlertDetailScreen', {
                        alertId: alert.id,
                        circleId: activeCircle?.id,
                        patientId,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.alertTypeDot,
                        { backgroundColor: isResolved ? '#0E7A67' : '#C93B2B' },
                      ]}
                    />
                    <View style={styles.alertInfo}>
                      <View style={styles.alertHeaderRow}>
                        <Text style={styles.alertTitle}>
                          {alert.alert_type === 'SOS_MANUAL' ? 'SOS Triggered' : 'Safe Zone Breach'}
                        </Text>
                        <Text style={styles.alertDate}>
                          {new Date(alert.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.alertSubtitle}>
                        {alert.zone_name ? `Zone: ${alert.zone_name}` : 'Alert logged'}
                      </Text>
                      <View style={styles.alertStatusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            isResolved ? styles.statusBadgeResolved : styles.statusBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isResolved ? styles.statusBadgeTextResolved : styles.statusBadgeTextActive,
                            ]}
                          >
                            {alert.status}
                          </Text>
                        </View>
                        {alert.responders && alert.responders.length > 0 && (
                          <Text style={styles.responderCount}>
                            {alert.responders.length} {alert.responders.length === 1 ? 'responder' : 'responders'}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#8A9592" />
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
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
    borderColor: '#E5E0D8',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: '#161E1C',
  },
  headerSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyBanner: {
    backgroundColor: '#FDF2F1',
    borderWidth: 1,
    borderColor: '#F5C6CB',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  emergencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C93B2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emergencyTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  emergencyTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#C93B2B',
  },
  emergencyDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  safeBanner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  safeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  safeTextWrap: {
    flex: 1,
  },
  safeTitle: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
  },
  safeSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  telemetryPills: {
    flexDirection: 'row',
    gap: 6,
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FAF9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  telemetryPillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#52605D',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E7A67',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#161E1C',
  },
  sectionSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLinkText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#0E7A67',
  },
  ownerOnlyBadge: {
    backgroundColor: '#F0ECE4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ownerOnlyBadgeText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#52605D',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
    marginTop: 8,
  },
  emptyCardDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  createZoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E7A67',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    marginTop: 14,
  },
  createZoneBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  zoneInfoWrap: {
    flex: 1,
  },
  zoneName: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: '#161E1C',
  },
  zoneDetails: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5F3',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E7A67',
  },
  activePillText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#0E7A67',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
    marginRight: 8,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
  },
  alertDate: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#8A9592',
  },
  alertSubtitle: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  alertStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#FDF2F1',
  },
  statusBadgeResolved: {
    backgroundColor: '#EBF5F3',
  },
  statusBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statusBadgeTextActive: {
    color: '#C93B2B',
  },
  statusBadgeTextResolved: {
    color: '#0E7A67',
  },
  responderCount: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#52605D',
  },
});
