/**
 * SureStep — src/screens/family/FamilyAlertsScreen.tsx
 * Canonical Alerts Tab screen for Family members.
 * Shows safety incidents, wander alerts, and emergency SOS events for the Care Circle.
 *
 * Connected to:
 *   GET /care-circles/:circleId/alerts
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FamilyStackParams } from '../../types/navigation.types';
import { useFamilyContext } from '../../context/FamilyContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import {
  listCircleSafetyAlerts,
  SafetyAlert,
} from '../../services/safetyService';

type NavigationProp = NativeStackNavigationProp<FamilyStackParams>;
type AlertFilter = 'ALL' | 'ACTIVE' | 'RESOLVED';

export const FamilyAlertsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { activeCircle, activePatient, isOwner } = useFamilyContext();

  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<AlertFilter>('ALL');

  const loadAlerts = useCallback(async (isRefresh = false) => {
    if (!activeCircle) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await listCircleSafetyAlerts(activeCircle.id);
      setAlerts(list || []);
    } catch (err) {
      console.warn('[FamilyAlertsScreen] loadAlerts error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCircle]);

  useEffect(() => {
    if (isFocused) {
      void loadAlerts();
    }
  }, [isFocused, loadAlerts]);

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ACTIVE') return a.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return a.status === 'RESOLVED';
    return true;
  });

  const activeCount = alerts.filter((a) => a.status !== 'RESOLVED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        {activeCircle && (
          <View style={styles.circleBadge}>
            <Text style={styles.circleBadgeText}>{activeCircle.name}</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'ALL' && styles.filterTabActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterTabText, filter === 'ALL' && styles.filterTabTextActive]}>
            All ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'ACTIVE' && styles.filterTabActive]}
          onPress={() => setFilter('ACTIVE')}
        >
          <Text style={[styles.filterTabText, filter === 'ACTIVE' && styles.filterTabTextActive]}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'RESOLVED' && styles.filterTabActive]}
          onPress={() => setFilter('RESOLVED')}
        >
          <Text style={[styles.filterTabText, filter === 'RESOLVED' && styles.filterTabTextActive]}>
            Resolved ({resolvedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0E7A67" />
        </View>
      ) : !activeCircle ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={36} color="#8A9592" />
          <Text style={styles.emptyTitle}>No Care Circle Selected</Text>
          <Text style={styles.emptyDesc}>
            Join or create a Care Circle from the Home screen to receive safety and wander alerts.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadAlerts(true)} tintColor="#0E7A67" />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={36} color="#0E7A67" />
              <Text style={styles.emptyTitle}>All Calm</Text>
              <Text style={styles.emptyDesc}>
                {filter === 'ACTIVE'
                  ? 'No active emergency alerts or perimeter breaches.'
                  : 'No safety incidents recorded for this care circle.'}
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => {
              const isResolved = alert.status === 'RESOLVED';
              const isSOS = alert.alert_type === 'SOS_MANUAL';

              return (
                <TouchableOpacity
                  key={alert.id}
                  style={[styles.alertCard, !isResolved && styles.alertCardActive]}
                  onPress={() =>
                    navigation.navigate('AlertDetailScreen', {
                      alertId: alert.id,
                      circleId: activeCircle.id,
                      patientId: alert.patient_id,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.alertIconWrap,
                      { backgroundColor: isResolved ? '#EBF5F3' : '#FDF2F1' },
                    ]}
                  >
                    <Ionicons
                      name={isResolved ? 'checkmark' : isSOS ? 'alert-circle' : 'warning'}
                      size={20}
                      color={isResolved ? '#0E7A67' : '#C93B2B'}
                    />
                  </View>

                  <View style={styles.alertContent}>
                    <View style={styles.alertHeaderRow}>
                      <Text style={styles.alertTitle}>
                        {isSOS ? 'Emergency SOS' : 'Safe Zone Breach'}
                      </Text>
                      <Text style={styles.alertTime}>
                        {new Date(alert.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <Text style={styles.patientName}>
                      {alert.patient_name ?? 'Patient'} • {alert.zone_name ?? 'Outside zone'}
                    </Text>

                    <View style={styles.badgeRow}>
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
                        <View style={styles.responderPill}>
                          <Ionicons name="people" size={12} color="#0E7A67" />
                          <Text style={styles.responderPillText}>
                            {alert.responders.length} {alert.responders.length === 1 ? 'responder' : 'responders'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#8A9592" />
                </TouchableOpacity>
              );
            })
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0D8',
    backgroundColor: '#FAF8F5',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    color: '#161E1C',
  },
  circleBadge: {
    backgroundColor: '#EBF5F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  circleBadgeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#0E7A67',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
    backgroundColor: '#FAF8F5',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  filterTabActive: {
    backgroundColor: '#0E7A67',
    borderColor: '#0E7A67',
  },
  filterTabText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#52605D',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontFamily: F.semiBold,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    marginTop: 24,
  },
  emptyTitle: {
    fontFamily: F.semiBold,
    fontSize: 16,
    color: '#161E1C',
    marginTop: 10,
  },
  emptyDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#52605D',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertCardActive: {
    borderColor: '#F5C6CB',
    backgroundColor: '#FFFAFA',
  },
  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    marginRight: 8,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#161E1C',
  },
  alertTime: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#8A9592',
  },
  patientName: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#52605D',
    marginTop: 2,
  },
  badgeRow: {
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
  responderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF5F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  responderPillText: {
    fontFamily: F.medium,
    fontSize: 10,
    color: '#0E7A67',
  },
});
