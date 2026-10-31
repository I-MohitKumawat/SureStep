/**
 * SureStep — CaregiverPatientAlertsScreen
 *
 * Full alert history and management for a specific patient.
 * Hooks into live APIs and real-time Socket.io subscriptions.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { AlertCard, type AlertSeverity } from '../../components/alerts/AlertCard';
import type { AlertProgressStatus } from '../../components/alerts/StatusProgression';
import { useAlerts } from '../../context/AlertContext';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverPatientAlertsScreen'>;
type FilterTab = 'active' | 'acknowledged' | 'resolved';

export const CaregiverPatientAlertsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, patientName, relationshipType } = route.params as any;

  const [activeTab, setActiveTab] = useState<FilterTab>('active');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    getAlertsForPatient,
    getUnackedCountForPatient,
    respondToAlert,
    fetchPatientAlerts,
  } = useAlerts();

  const alerts = useMemo(() => {
    return getAlertsForPatient(patientId);
  }, [getAlertsForPatient, patientId]);

  const activeAlertsCount = useMemo(() => {
    return getUnackedCountForPatient(patientId);
  }, [getUnackedCountForPatient, patientId]);

  // Load alerts from backend
  const loadAlerts = useCallback(async () => {
    await fetchPatientAlerts(patientId);
  }, [patientId, fetchPatientAlerts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    loadAlerts().finally(() => setLoading(false));
  }, [loadAlerts]);

  // Filter alerts by tab
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (activeTab === 'active') return a.status === 'new';
      if (activeTab === 'acknowledged') return a.status === 'acknowledged' || a.status === 'responding';
      return a.status === 'resolved';
    });
  }, [alerts, activeTab]);

  // Render loader if first-time loading
  if (loading && alerts.length === 0) {
    return (
      <View style={[styles.screen, styles.loadingWrap]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Fetching Alert Log…</Text>
      </View>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Title Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeftWrap}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={15}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="shield-checkmark" size={26} color="#3B82F6" style={styles.shieldIcon} />
              <Text style={styles.headerTitle}>Alerts</Text>
            </View>
            <Text style={styles.headerSub}>Monitoring {patientName}'s safety in real time</Text>
          </View>
        </View>

        {/* Count Indicator */}
        {activeAlertsCount > 0 && (
          <View style={styles.countBadge}>
            <View style={styles.countDot} />
            <Text style={styles.countBadgeText}>{activeAlertsCount} Active</Text>
          </View>
        )}
      </View>

      {/* Tabs Filter Row */}
      <View style={styles.tabContainer}>
        {(['active', 'acknowledged', 'resolved'] as FilterTab[]).map(tab => {
          const isActive = activeTab === tab;
          const displayLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
          let iconName: any = 'alert-circle-outline';
          if (tab === 'acknowledged') iconName = 'time-outline';
          if (tab === 'resolved') iconName = 'checkmark-circle-outline';

          return (
            <Pressable
              key={tab}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={iconName}
                  size={16}
                  color={isActive ? '#3B82F6' : '#6B7280'}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {displayLabel}
                </Text>
              </View>
              {isActive && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {/* Group Title and Count label */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'active' ? 'Active' : activeTab === 'acknowledged' ? 'Acknowledged' : 'Resolved'}
        </Text>
        <Text style={styles.sectionCount}>
          {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
        </Text>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AlertCard
            id={item.id}
            title={item.title}
            description={item.description}
            timestamp={item.timestamp}
            severity={item.severity}
            status={item.status}
            patientName={patientName}
            responderName={item.responderName}
            responderRole={item.responderRole}
            onRespond={respondToAlert}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3B82F6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Alerts Here</Text>
            <Text style={styles.emptyText}>
              All alerts in this category have been processed or cleared.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  headerLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIcon: {
    marginRight: 6,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 24,
    color: '#111827',
  },
  headerSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  countBadgeText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#EF4444',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  tabLabelActive: {
    fontFamily: F.bold,
    color: '#111827',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 24,
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#111827',
  },
  sectionCount: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#9CA3AF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#374151',
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
