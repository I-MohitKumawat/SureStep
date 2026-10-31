/**
 * SureStep — CaregiverAlertFeedScreen
 *
 * Cross-patient alert feed for a caregiver, backed by the canonical
 * Care Circle safety-alert API. Responding never resolves an alert; resolution
 * is Circle Owner-only.
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
import {
  listMySafetyAlerts,
  respondToAlert,
  type SafetyAlert,
} from '../../services/safetyService';
import { getSocket } from '../../services/socketClient';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<CaregiverStackParams, 'CaregiverAlertFeedScreen'>;

const ALERT_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  SOS_MANUAL:   { icon: 'warning-outline',    label: '🆘 SOS Emergency', color: '#DC2626', bg: '#FEF2F2' },
  ZONE_BREACH:  { icon: 'log-out-outline',    label: 'Left Safe Zone',   color: '#EF4444', bg: '#FEF2F2' },
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

export const CaregiverAlertFeedScreen: React.FC<Props> = ({ navigation }) => {
  const { firebaseUser } = useAuth();

  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await listMySafetyAlerts();
      setAlerts(rows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewOrUpdated = (data: any) => {
      if (data?.alert) void load();
    };
    const onResponse = () => { void load(); };
    const onResolved = () => { void load(); };

    socket.on('alert:new', onNewOrUpdated);
    socket.on('alert:updated', onNewOrUpdated);
    socket.on('alert:response', onResponse);
    socket.on('alert:resolved', onResolved);
    return () => {
      socket.off('alert:new', onNewOrUpdated);
      socket.off('alert:updated', onNewOrUpdated);
      socket.off('alert:response', onResponse);
      socket.off('alert:resolved', onResolved);
    };
  }, [load]);

  const handleRespond = async (alert: SafetyAlert) => {
    if (!alert.circle_id) return;
    setRespondingId(alert.id);
    try {
      await respondToAlert(alert.circle_id, alert.id);
      await load();
    } finally {
      setRespondingId(null);
    }
  };

  const goToMap = (alert: SafetyAlert) => {
    if (alert.patient_id && alert.patient_name) {
      navigation.navigate('CaregiverPatientMapScreen', {
        patientId: alert.patient_id,
        patientName: alert.patient_name,
      });
    }
  };

  const renderItem = ({ item }: { item: SafetyAlert }) => {
    const cfg = ALERT_CONFIG[item.alert_type] ?? DEFAULT_ALERT_CFG;
    const sevClr = SEVERITY_COLOR[item.severity] ?? '#6B7280';
    const isSOS = item.alert_type === 'SOS_MANUAL';
    const isResolved = item.status === 'RESOLVED';
    const latestResponder = item.responders?.[item.responders.length - 1];

    return (
      <Pressable
        onPress={() => goToMap(item)}
        style={({ pressed }) => [
          styles.card,
          isSOS && styles.cardSOS,
          isResolved && styles.cardAcked,
          pressed && { opacity: 0.85 },
        ]}
      >
        <View style={[styles.severityBar, { backgroundColor: sevClr }]} />

        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.rowBetween}>
            <Text style={[styles.patientName, isSOS && { color: '#DC2626' }]}>
              {item.patient_name ?? 'Patient'}
            </Text>
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>

          <Text style={styles.alertType}>{cfg.label}</Text>

          {item.zone_name && (
            <Text style={styles.meta}>{item.zone_name}</Text>
          )}

          {isResolved ? (
            <View style={styles.ackedRow}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" />
              <Text style={styles.ackedText}>Resolved</Text>
            </View>
          ) : latestResponder ? (
            <View style={styles.ackedRow}>
              <Ionicons name="time-outline" size={13} color="#D97706" />
              <Text style={[styles.ackedText, { color: '#D97706' }]}>
                Responding — {latestResponder.responder_name}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={(e) => { e.stopPropagation(); void handleRespond(item); }}
              disabled={respondingId === item.id}
              style={({ pressed }) => [styles.ackBtn, pressed && { opacity: 0.7 }]}
            >
              {respondingId === item.id
                ? <ActivityIndicator size="small" color="#2563EB" />
                : <Text style={styles.ackBtnText}>I'm Responding</Text>}
            </Pressable>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </Pressable>
    );
  };

  const openCount = alerts.filter((a) => a.status !== 'RESOLVED').length;

  return (
    <ScreenContainer edges={['top', 'left', 'right']} style={styles.screen}>
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
          {openCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{openCount} open</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => { setRefreshing(true); void load(); }}
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
            When your patients trigger safety alerts, they appear here.
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
              onRefresh={() => { setRefreshing(true); void load(); }}
              tintColor="#2563EB"
            />
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

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontFamily: F.medium, fontSize: 14, color: '#6B7280', marginTop: 12 },
  emptyEmoji:  { fontSize: 40, marginBottom: 12 },
  emptyTitle:  { fontFamily: F.bold, fontSize: 18, color: '#111827', marginBottom: 8 },
  emptySub:    { fontFamily: F.regular, fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
