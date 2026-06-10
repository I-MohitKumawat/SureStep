/**
 * SureStep — src/components/caregiver/dashboard/DashboardAlertsTab.tsx
 * Redesigned Alerts experience integrated directly into the caregiver dashboard.
 * Consumes the centralized AlertContext store for unified state management.
 */
import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../../theme/colors';
import { F } from '../../../theme/fonts';
import { useAlerts } from '../../../context/AlertContext';
import { AlertCard } from '../../alerts/AlertCard';
import type { AlertProgressStatus } from '../../alerts/StatusProgression';

type FilterTab = 'active' | 'acknowledged' | 'resolved';

type Props = {
  patientId: string;
  patientName: string;
};

export const DashboardAlertsTab: React.FC<Props> = ({ patientId, patientName }) => {
  const {
    getAlertsForPatient,
    getUnackedCountForPatient,
    acknowledgeAlert,
    respondToAlert,
    resolveAlert,
  } = useAlerts();

  const [activeTab, setActiveTab] = useState<FilterTab>('active');

  // Fetch from shared store scoped by patientId
  const allPatientAlerts = useMemo(() => {
    return getAlertsForPatient(patientId);
  }, [getAlertsForPatient, patientId]);

  const activeAlertsCount = useMemo(() => {
    return getUnackedCountForPatient(patientId);
  }, [getUnackedCountForPatient, patientId]);

  // Filter list based on selected tab
  const filteredAlerts = useMemo(() => {
    return allPatientAlerts.filter(a => {
      if (activeTab === 'active') return a.status === 'new';
      if (activeTab === 'acknowledged') return a.status === 'acknowledged' || a.status === 'responding';
      return a.status === 'resolved';
    });
  }, [allPatientAlerts, activeTab]);

  return (
    <View style={styles.container}>
      {/* Title Header Row */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="shield-checkmark" size={24} color="#3B82F6" style={styles.shieldIcon} />
            <Text style={styles.headerTitle}>Safety Alerts</Text>
          </View>
          <Text style={styles.headerSub}>Monitoring {patientName}'s safety in real time</Text>
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

      {/* Alerts List (Mapped inside View to avoid Nested ScrollView warnings) */}
      <View style={styles.listContainer}>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={44} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Alerts Here</Text>
            <Text style={styles.emptyText}>
              All alerts in this category have been processed or cleared.
            </Text>
          </View>
        ) : (
          filteredAlerts.map(item => (
            <AlertCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              timestamp={item.timestamp}
              severity={item.severity}
              status={item.status}
              patientName={patientName}
              onAcknowledge={acknowledgeAlert}
              onRespond={respondToAlert}
              onResolve={resolveAlert}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
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
    fontSize: 20,
    color: '#111827',
  },
  headerSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  countBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#EF4444',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 2,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  tabLabelActive: {
    fontFamily: F.bold,
    color: '#111827',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -2,
    height: 2,
    width: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#374151',
  },
  sectionCount: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#9CA3AF',
  },
  listContainer: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
