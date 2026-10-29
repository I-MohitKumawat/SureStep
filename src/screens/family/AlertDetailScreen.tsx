/**
 * SureStep — src/screens/family/AlertDetailScreen.tsx
 * Safety Incident Detail & Responder Ledger screen.
 * Aligns with "Safety Alert_ Left Safe Zone.png".
 *
 * Backend endpoints:
 *   POST /notifications/alerts/:id/respond (I'm Responding)
 *   POST /notifications/alerts/:id/resolve (Circle Owner Only)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  listCircleSafetyAlerts,
  respondToAlert,
  resolveAlert,
  SafetyAlert,
} from '../../services/safetyService';

type Props = NativeStackScreenProps<FamilyStackParams, 'AlertDetailScreen'>;

export const AlertDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { alertId, circleId: routeCircleId, patientId } = route.params;
  const { activeCircle, isOwner } = useFamilyContext();
  const { user } = useAuth();

  const circleId = routeCircleId || activeCircle?.id;

  const [loading, setLoading] = useState(true);
  const [alertData, setAlertData] = useState<SafetyAlert | null>(null);
  const [responding, setResponding] = useState(false);
  const [resolving, setResolving] = useState(false);

  const loadAlert = useCallback(async () => {
    if (!circleId) return;
    try {
      const alerts = await listCircleSafetyAlerts(circleId);
      const found = alerts.find((a) => a.id === alertId);
      if (found) {
        setAlertData(found);
      }
    } catch (err) {
      console.warn('[AlertDetailScreen] loadAlert error:', err);
    } finally {
      setLoading(false);
    }
  }, [circleId, alertId]);

  useEffect(() => {
    loadAlert();
  }, [loadAlert]);

  // Check if current user is already in responders
  const myResponse = alertData?.responders?.find(
    (r) => r.responder_id === user?.id || r.responder_name === user?.name
  );

  const handleRespond = async () => {
    try {
      setResponding(true);
      await respondToAlert(alertId, 'Responding to alert');
      Alert.alert('Response Recorded', 'Your care circle has been notified that you are responding.');
      await loadAlert();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record response.');
    } finally {
      setResponding(false);
    }
  };

  const handleResolve = () => {
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the Care Circle Owner can resolve safety incidents.');
      return;
    }
    Alert.alert(
      'Resolve Incident',
      'Confirm that the patient is safe and this incident is resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve Alert',
          style: 'default',
          onPress: async () => {
            try {
              setResolving(true);
              await resolveAlert(alertId, 'Patient located and confirmed safe.');
              Alert.alert('Resolved', 'This safety incident is now closed.');
              await loadAlert();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to resolve incident.');
            } finally {
              setResolving(false);
            }
          },
        },
      ]
    );
  };

  const openMapsDirections = () => {
    if (alertData?.lat && alertData?.lng) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${alertData.lat},${alertData.lng}`;
      const label = encodeURIComponent(alertData.patient_name ?? 'Patient Location');
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });
      if (url) Linking.openURL(url);
    } else {
      Alert.alert('Location unavailable', 'Exact coordinates were not included in this alert.');
    }
  };

  const isResolved = alertData?.status === 'RESOLVED';

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
          <Text style={styles.headerTitle}>Incident Detail</Text>
          <Text style={styles.headerSubtitle}>
            {alertData?.alert_type === 'SOS_MANUAL' ? 'Emergency SOS' : 'Safe Zone Breach'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0E7A67" />
        </View>
      ) : !alertData ? (
        <View style={styles.centerBox}>
          <Text style={styles.notFoundText}>Alert not found or expired.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Alert Status Card */}
          <View style={[styles.statusCard, isResolved && styles.statusCardResolved]}>
            <View style={styles.statusCardHeader}>
              <View
                style={[
                  styles.statusIconWrap,
                  { backgroundColor: isResolved ? '#0E7A67' : '#C93B2B' },
                ]}
              >
                <Ionicons
                  name={isResolved ? 'checkmark' : 'warning'}
                  size={22}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.statusTitleWrap}>
                <Text style={[styles.statusBannerTitle, isResolved && { color: '#0E7A67' }]}>
                  {isResolved
                    ? 'INCIDENT RESOLVED'
                    : alertData.alert_type === 'SOS_MANUAL'
                    ? 'EMERGENCY SOS TRIGGERED'
                    : 'LEFT SAFE ZONE'}
                </Text>
                <Text style={styles.statusBannerTime}>
                  Triggered {new Date(alertData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>

            <Text style={styles.statusDescription}>
              {alertData.alert_type === 'SOS_MANUAL'
                ? `${alertData.patient_name ?? 'Patient'} pressed the emergency SOS button.`
                : `${alertData.patient_name ?? 'Patient'} moved outside the designated ${alertData.zone_name ?? 'safe zone'}.`}
            </Text>

            {/* Quick Action Buttons */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={openMapsDirections}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-outline" size={18} color="#0E7A67" />
                <Text style={styles.quickActionBtnText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Responder Ledger Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionCardTitle}>Responder Ledger</Text>
              <Text style={styles.sectionCardCount}>
                {alertData.responders?.length ?? 0} responding
              </Text>
            </View>

            {(!alertData.responders || alertData.responders.length === 0) ? (
              <View style={styles.noRespondersBox}>
                <Ionicons name="people-outline" size={28} color="#8A9592" />
                <Text style={styles.noRespondersText}>No one has acknowledged response yet.</Text>
                <Text style={styles.noRespondersSub}>Tap below to let the care circle know you are on your way.</Text>
              </View>
            ) : (
              alertData.responders.map((resp, idx) => (
                <View key={resp.id ?? idx} style={styles.responderRow}>
                  <View style={styles.responderAvatar}>
                    <Text style={styles.responderAvatarText}>
                      {resp.responder_name ? resp.responder_name.charAt(0).toUpperCase() : 'R'}
                    </Text>
                  </View>
                  <View style={styles.responderInfo}>
                    <Text style={styles.responderName}>{resp.responder_name}</Text>
                    <Text style={styles.responderRole}>
                      {resp.responder_role} • {new Date(resp.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {resp.notes && <Text style={styles.responderNote}>"{resp.notes}"</Text>}
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#0E7A67" />
                </View>
              ))
            )}
          </View>

          {/* Incident Resolution Section */}
          {isResolved ? (
            <View style={styles.resolvedInfoBox}>
              <Ionicons name="checkmark-done" size={20} color="#0E7A67" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.resolvedInfoTitle}>
                  Resolved by {alertData.resolved_by_name ?? 'Circle Owner'}
                </Text>
                {alertData.resolved_at && (
                  <Text style={styles.resolvedInfoTime}>
                    at {new Date(alertData.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
                {alertData.resolution_notes && (
                  <Text style={styles.resolvedInfoNote}>"{alertData.resolution_notes}"</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              {/* "I'm Responding" Primary Action */}
              {!myResponse ? (
                <TouchableOpacity
                  style={[styles.primaryRespondBtn, responding && { opacity: 0.7 }]}
                  onPress={handleRespond}
                  disabled={responding || resolving}
                  activeOpacity={0.8}
                >
                  {responding ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="hand-right-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.primaryRespondBtnText}>I’m Responding</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.myRespondedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#0E7A67" />
                  <Text style={styles.myRespondedText}>You are marked as responding</Text>
                </View>
              )}

              {/* Owner Resolution Action */}
              {isOwner ? (
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={handleResolve}
                  disabled={responding || resolving}
                  activeOpacity={0.7}
                >
                  {resolving ? (
                    <ActivityIndicator size="small" color="#0E7A67" />
                  ) : (
                    <Text style={styles.resolveBtnText}>Mark Incident Resolved</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.nonOwnerNote}>
                  Only the Circle Owner can officially close and resolve this incident.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  notFoundText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: '#52605D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusCard: {
    backgroundColor: '#FDF2F1',
    borderWidth: 1,
    borderColor: '#F5C6CB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  statusCardResolved: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E0D8',
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statusTitleWrap: {
    flex: 1,
  },
  statusBannerTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#C93B2B',
    letterSpacing: 0.5,
  },
  statusBannerTime: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  statusDescription: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#161E1C',
    lineHeight: 20,
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  quickActionBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#0E7A67',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionCardTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#161E1C',
  },
  sectionCardCount: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#52605D',
  },
  noRespondersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noRespondersText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#161E1C',
    marginTop: 8,
  },
  noRespondersSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    textAlign: 'center',
    marginTop: 4,
  },
  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  responderAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EBF5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  responderAvatarText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#0E7A67',
  },
  responderInfo: {
    flex: 1,
  },
  responderName: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#161E1C',
  },
  responderRole: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  responderNote: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#161E1C',
    fontStyle: 'italic',
    marginTop: 2,
  },
  resolvedInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF5F3',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  resolvedInfoTitle: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
  },
  resolvedInfoTime: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#52605D',
    marginTop: 2,
  },
  resolvedInfoNote: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#161E1C',
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 10,
    gap: 12,
  },
  primaryRespondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E7A67',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  primaryRespondBtnText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  myRespondedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5F3',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  myRespondedText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
  },
  resolveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0E7A67',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  resolveBtnText: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#0E7A67',
  },
  nonOwnerNote: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#8A9592',
    textAlign: 'center',
    marginTop: 4,
  },
});
