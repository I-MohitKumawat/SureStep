/**
 * SureStep — CaregiverAlertFeedScreen
 *
 * Cross-patient alert feed for a caregiver. Shows all alerts across all
 * the caregiver's linked patients in reverse-chronological order.
 * Powered by GET /alerts/caregiver/feed + WebSocket real-time push.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParams } from '../../types/navigation.types';
import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import { fetchCaregiverAlertFeed, acknowledgeAlert, type ApiAlert } from '../../services/geofenceService';
import { connectSocket } from '../../services/socketClient';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverAlertFeedScreen'>;

// ─── Alert display config ─────────────────────────────────────────────────────

const ALERT_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  ZONE_EXIT:            { icon: 'log-out-outline',      label: 'Left Safe Zone',      color: '#EF4444', bg: '#FEF2F2' },
  ZONE_ENTER:           { icon: 'checkmark-circle-outline', label: 'Returned Safely', color: '#10B981', bg: '#ECFDF5' },
  APPROACHING_BOUNDARY: { icon: 'alert-circle-outline', label: 'Near Boundary',       color: '#F59E0B', bg: '#FFFBEB' },
  STATIONARY_UNKNOWN:   { icon: 'pause-circle-outline', label: 'Stationary Outside',  color: '#F97316', bg: '#FFF7ED' },
  NO_SIGNAL:            { icon: 'wifi-outline',          label: 'Signal Lost',         color: '#6B7280', bg: '#F9FAFB' },
  SOS_TRIGGERED:        { icon: 'warning-outline',       label: '🆘 SOS Emergency',   color: '#DC2626', bg: '#FEF2F2' },
  WANDERING:            { icon: 'footsteps-outline',     label: 'Wandering Detected',  color: '#7C3AED', bg: '#EDE9FE' },
};

const DEFAULT_ALERT_CFG = { icon: 'information-circle-outline', label: 'Alert', color: '#6B7280', bg: '#F9FAFB' };

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#DC2626',
  WARNING:  '#D97706',
  INFO:     '#3B82F6',
};

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CaregiverAlertFeedScreen: React.FC<Props> = ({ navigation }) => {
  const { firebaseUser } = useAuth();

  const [alerts,      setAlerts]      = useState<ApiAlert[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [cursor,      setCursor]      = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ackingId,    setAckingId]    = useState<string | null>(null);

  const load = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); setCursor(null); }
    try {
      const { alerts: rows, has_more, next_cursor } = await fetchCaregiverAlertFeed({
        limit: 30,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      setAlerts((prev) => reset ? rows : [...prev, ...rows]);
      setHasMore(has_more);
      setCursor(next_cursor);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [cursor]);

  useEffect(() => { void load(true); }, []);

  // ── WebSocket — listen for any patient alert in this caregiver's rooms ────
  useEffect(() => {
    if (!firebaseUser) return;
    void firebaseUser.getIdToken().then((t) => {
      const socket = connectSocket(t);
      const onNew = (data: any) => {
        if (data.alert) {
          setAlerts((prev) => [data.alert, ...prev.filter((a) => a.id !== data.alert.id)]);
        }
      };
      const onAck = (data: any) => {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === data.alert_id
              ? { ...a, acknowledged_at: data.ts, acknowledged_by: data.acknowledged_by }
              : a,
          ),
        );
      };
      socket.on('alert:new',          onNew);
      socket.on('alert:acknowledged', onAck);
      return () => {
        socket.off('alert:new',          onNew);
        socket.off('alert:acknowledged', onAck);
      };
    });
  }, [firebaseUser]);

  const handleAck = async (alertId: string) => {
    setAckingId(alertId);
    try {
      const updated = await acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map((a) => a.id === alertId ? updated : a));
    } finally {
      setAckingId(null);
    }
  };

  // ── Navigate to patient map ────────────────────────────────────────────────
  const goToMap = (alert: ApiAlert) => {
    if (alert.patient_id && alert.patient_name) {
      navigation.navigate('CaregiverPatientMapScreen', {
        patientId:   alert.patient_id,
        patientName: alert.patient_name,
      });
    }
  };

  const renderItem = ({ item }: { item: ApiAlert }) => {
    const cfg    = ALERT_CONFIG[item.alert_type] ?? DEFAULT_ALERT_CFG;
    const sevClr = SEVERITY_COLOR[item.severity] ?? '#6B7280';
    const isAcked = !!item.acknowledged_at;
    const isSOS   = item.alert_type === 'SOS_TRIGGERED';

    return (
      <Pressable
        onPress={() => goToMap(item)}
        style={({ pressed }) => [
          styles.card,
          isSOS && styles.cardSOS,
          isAcked && styles.cardAcked,
          pressed && { opacity: 0.85 },
        ]}
      >
        {/* Severity indicator bar */}
        <View style={[styles.severityBar, { backgroundColor: sevClr }]} />

        {/* Alert type icon */}
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.rowBetween}>
            <Text style={[styles.patientName, isSOS && { color: '#DC2626' }]}>
              {item.patient_name ?? 'Patient'}
            </Text>
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>

          <Text style={styles.alertType}>{cfg.label}</Text>

          {item.distance_from_zone_m != null && (
            <Text style={styles.meta}>{item.distance_from_zone_m}m from safe zone</Text>
          )}

          {!isAcked ? (
            <Pressable
              onPress={(e) => { e.stopPropagation(); void handleAck(item.id); }}
              disabled={ackingId === item.id}
              style={({ pressed }) => [styles.ackBtn, pressed && { opacity: 0.7 }]}
            >
              {ackingId === item.id
                ? <ActivityIndicator size="small" color="#2563EB" />
                : <Text style={styles.ackBtnText}>Acknowledge</Text>}
            </Pressable>
          ) : (
            <View style={styles.ackedRow}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              <Text style={styles.ackedText}>Acknowledged {timeAgo(item.acknowledged_at!)}</Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </Pressable>
    );
  };

  const unreadCount = alerts.filter((a) => !a.acknowledged_at).length;

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Alert Feed</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount} open</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => { setRefreshing(true); void load(true); }}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="refresh" size={20} color="#2563EB" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No alerts</Text>
          <Text style={styles.emptySub}>
            When your patients trigger geofence alerts, they appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void load(true); }}
              tintColor="#2563EB"
            />
          }
          ListFooterComponent={() =>
            hasMore ? (
              <Pressable
                style={styles.loadMoreBtn}
                onPress={() => { setLoadingMore(true); void load(false); }}
                disabled={loadingMore}
              >
                {loadingMore
                  ? <ActivityIndicator size="small" color="#2563EB" />
                  : <Text style={styles.loadMoreText}>Load more</Text>}
              </Pressable>
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  backBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  headerTitle: { fontFamily: F.bold, fontSize: 17, color: '#111827' },
  unreadBadge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  unreadText:  { fontFamily: F.bold, fontSize: 11, color: '#FFFFFF' },

  list: { padding: 16, gap: 10, paddingBottom: 40 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardSOS:   { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  cardAcked: { opacity: 0.65 },

  severityBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 4,
  },

  content: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  patientName: { fontFamily: F.bold, fontSize: 14, color: '#111827' },
  timeText:    { fontFamily: F.regular, fontSize: 11, color: '#9CA3AF' },
  alertType:   { fontFamily: F.medium, fontSize: 12, color: '#374151', marginBottom: 4 },
  meta:        { fontFamily: F.regular, fontSize: 11, color: '#9CA3AF', marginBottom: 6 },

  ackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ackBtnText: { fontFamily: F.bold, fontSize: 11, color: '#2563EB' },

  ackedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ackedText: { fontFamily: F.medium, fontSize: 11, color: '#10B981' },

  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontFamily: F.medium, fontSize: 14, color: '#2563EB' },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontFamily: F.medium, fontSize: 14, color: '#6B7280', marginTop: 12 },
  emptyEmoji:  { fontSize: 40, marginBottom: 12 },
  emptyTitle:  { fontFamily: F.bold, fontSize: 18, color: '#111827', marginBottom: 8 },
  emptySub:    { fontFamily: F.regular, fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
