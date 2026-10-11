/**
 * SureStep — src/screens/shared/CareRequestsListScreen.tsx
 *
 * Dedicated List View for Care Requests.
 * Supports:
 *  - PATIENT / FAMILY: Outgoing care proposals (Pending & Full History)
 *  - CAREGIVER: Incoming care inquiries (Pending triage & Full History)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { CareRequest } from '../../types/care.types';
import { SHIFT_OPTIONS } from '../../types/care.types';
import {
  getIncomingCareRequests,
  getOutgoingCareRequests,
} from '../../services/careRequestService';
import { getSocket } from '../../services/socketClient';

type Props = NativeStackScreenProps<any, 'CareRequestsListScreen'>;

export const CareRequestsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { initialTab = 'PENDING', targetPatientId, targetPatientName } = route.params || {};
  const { user } = useAuth();

  const isCaregiver = user?.role === 'CAREGIVER';

  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>(initialTab);
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setError(null);
      if (isCaregiver) {
        const data = await getIncomingCareRequests(activeTab);
        setRequests(data);
      } else {
        const data = await getOutgoingCareRequests(targetPatientId, activeTab);
        setRequests(data);
      }
    } catch (err: any) {
      console.warn('[CareRequestsListScreen] Error loading requests:', err);
      setError(err?.message || 'Failed to load care requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isCaregiver, activeTab, targetPatientId]);

  useEffect(() => {
    setLoading(true);
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleCareRequestEvent = (data: any) => {
      console.log('[CareRequestsListScreen] Socket event received, refreshing:', data);
      void loadRequests();
    };

    socket.on('care_request:created', handleCareRequestEvent);
    socket.on('care_request:accepted', handleCareRequestEvent);
    socket.on('care_request:declined', handleCareRequestEvent);
    socket.on('care_request:withdrawn', handleCareRequestEvent);
    socket.on('care_request:expired', handleCareRequestEvent);
    socket.on('relationship:change', handleCareRequestEvent);

    return () => {
      socket.off('care_request:created', handleCareRequestEvent);
      socket.off('care_request:accepted', handleCareRequestEvent);
      socket.off('care_request:declined', handleCareRequestEvent);
      socket.off('care_request:withdrawn', handleCareRequestEvent);
      socket.off('care_request:expired', handleCareRequestEvent);
      socket.off('relationship:change', handleCareRequestEvent);
    };
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadRequests();
  }, [loadRequests]);

  const handleOpenDetail = (req: CareRequest) => {
    navigation.navigate('CareRequestDetailScreen', {
      requestId: req.id,
      isCaregiverViewer: isCaregiver,
      onUpdated: loadRequests,
    });
  };

  const handleGoToDiscovery = () => {
    navigation.navigate('CareDiscoveryScreen', {
      targetPatientId,
      targetPatientName,
    });
  };

  const renderItem = ({ item }: { item: CareRequest }) => {
    const isPending = item.status === 'PENDING';
    const isAccepted = item.status === 'ACCEPTED';
    const isDeclined = item.status === 'DECLINED';
    const isWithdrawn = item.status === 'WITHDRAWN';
    const isExpired = item.status === 'EXPIRED';

    const shiftText = (item.requestedShifts || [])
      .map((s) => SHIFT_OPTIONS.find((opt) => opt.id === s)?.label || s)
      .join(', ');

    return (
      <Pressable
        style={({ pressed }) => [styles.requestCard, pressed && styles.requestCardPressed]}
        onPress={() => handleOpenDetail(item)}
      >
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardRecipient}>
              {isCaregiver
                ? `Patient: ${item.patient?.firstName || 'A patient'}`
                : `Caregiver: ${item.caregiver?.name || 'Caregiver'}`}
            </Text>
            <Text style={styles.cardSub}>
              {isCaregiver
                ? `${item.patient?.approximateAge ? `${item.patient.approximateAge} yrs · ` : ''}${item.patient?.city || 'Location unspecified'}`
                : item.caregiver?.professionalRole || 'Professional Caregiver'}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isPending && styles.statusBadgePending,
              isAccepted && styles.statusBadgeAccepted,
              isDeclined && styles.statusBadgeDeclined,
              isWithdrawn && styles.statusBadgeWithdrawn,
              isExpired && styles.statusBadgeExpired,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isPending && { color: '#92400E' },
                isAccepted && { color: '#065F46' },
                isDeclined && { color: '#991B1B' },
                isWithdrawn && { color: '#334155' },
                isExpired && { color: '#475569' },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Schedule & Terms */}
        <View style={styles.cardDetailsBox}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={C.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.detailText}>
              {item.scheduleType.replace(/_/g, ' ')} · {item.startDate}
              {item.endDate ? ` to ${item.endDate}` : ''}
            </Text>
          </View>

          {shiftText ? (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={13} color={C.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.detailText} numberOfLines={1}>
                {shiftText}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={13} color={C.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.detailRateText}>
              ₹{item.proposedRateInr} {item.proposedRateType === 'HOURLY' ? '/ hr' : '/ day'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterDate}>
            Created {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <View style={styles.chevronWrap}>
            <Text style={styles.viewDetailText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={C.primary} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Top Header */}
      <View style={styles.headerNav}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle}>
            {isCaregiver ? 'Care Inquiries' : 'Care Proposals'}
          </Text>
          <Text style={styles.headerSub}>
            {isCaregiver ? 'Incoming patient requests' : 'Submitted care proposals'}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'PENDING' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
            Pending ({activeTab === 'PENDING' ? requests.length : '...'})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            All History
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={loadRequests}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={36} color={C.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'PENDING' ? 'No Pending Requests' : 'No Request History'}
          </Text>
          <Text style={styles.emptySub}>
            {isCaregiver
              ? 'New patient care proposals will appear here for your review and acceptance.'
              : 'You have no care proposals in this tab. You can discover and request care from professional caregivers.'}
          </Text>
          {isCaregiver ? (
            <Pressable style={styles.discoverBtn} onPress={() => navigation.navigate('CaregiverProfileEditScreen')}>
              <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.discoverBtnText}>Manage Profile & Visibility</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.discoverBtn} onPress={handleGoToDiscovery}>
              <Ionicons name="search" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.discoverBtnText}>Explore Care Discovery</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
  },
  headerSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: C.primary,
  },
  tabText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  tabTextActive: {
    fontFamily: F.bold,
    color: C.primary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  discoverBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  requestCardPressed: {
    backgroundColor: '#F8FAFC',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardRecipient: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  cardSub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusBadgeAccepted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  statusBadgeDeclined: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusBadgeWithdrawn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusBadgeExpired: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  statusBadgeText: {
    fontFamily: F.bold,
    fontSize: 11,
  },
  cardDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  detailText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textPrimary,
    flex: 1,
  },
  detailRateText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterDate: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
  },
  chevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.primary,
    marginRight: 2,
  },
});
