/**
 * SureStep — src/screens/shared/NotificationHistoryScreen.tsx
 *
 * Notification center for all roles.
 * Enhanced from the original stub with:
 *   - Date grouping (Today / Yesterday / Earlier)
 *   - Type-based icons and accent colors
 *   - Unread badge count reset on screen open
 *   - Notification settings shortcut in header
 *   - Real-time WebSocket new notification insertion
 *   - Mark single + mark all read
 *   - Deep-link navigation from payload
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer }   from '../../components/shared/ScreenContainer';
import { fetchNotificationHistory, markNotificationRead, markAllNotificationsRead, type NotificationLog } from '../../services/notificationService';
import { getSocket }         from '../../services/socketClient';
import { useNotifications }  from '../../context/NotificationContext';
import { C, SOS_RED }        from '../../theme/colors';
import { F }                 from '../../theme/fonts';

// ─── Type icon + color ────────────────────────────────────────────────────────

function getTypeStyle(notifType: string | null): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const t = (notifType ?? '').toUpperCase();
  if (t.includes('SOS'))                                     return { icon: 'alert-circle',      color: SOS_RED };
  if (t.includes('GEOFENCE') || t.includes('ZONE') || t.includes('BREACH'))
                                                             return { icon: 'map',               color: '#7C3AED' };
  if (t.includes('ROUTINE') || t.includes('TASK') || t.includes('MISSED'))
                                                             return { icon: 'checkmark-circle',  color: '#F59E0B' };
  if (t.includes('REMINDER'))                                return { icon: 'alarm',             color: '#0E7A67' };
  if (t.includes('RELATIONSHIP') || t.includes('ACCEPTED') || t.includes('JOINED'))
                                                             return { icon: 'people',            color: '#0E7A67' };
  if (t.includes('ALERT'))                                   return { icon: 'warning',           color: '#DC2626' };
  if (t.includes('TEST'))                                    return { icon: 'flask',             color: '#6B7280' };
  return                                                            { icon: 'notifications',     color: C.primary };
}

// ─── Date grouping ────────────────────────────────────────────────────────────

function groupByDate(notifications: NotificationLog[]): Array<{ title: string; data: NotificationLog[] }> {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const todayItems:     NotificationLog[] = [];
  const yesterdayItems: NotificationLog[] = [];
  const earlierItems:   NotificationLog[] = [];

  for (const n of notifications) {
    const d = new Date(n.created_at).toDateString();
    if (d === today)     todayItems.push(n);
    else if (d === yesterday) yesterdayItems.push(n);
    else                 earlierItems.push(n);
  }

  const sections: Array<{ title: string; data: NotificationLog[] }> = [];
  if (todayItems.length)     sections.push({ title: 'Today',     data: todayItems });
  if (yesterdayItems.length) sections.push({ title: 'Yesterday', data: yesterdayItems });
  if (earlierItems.length)   sections.push({ title: 'Earlier',   data: earlierItems });
  return sections;
}

// ─── Time formatting ──────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 0)   return 'Just now';
  if (seconds < 60)  return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)    return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const NotificationHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { resetUnread } = useNotifications();

  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading,       setLoading]        = useState(true);
  const [refreshing,    setRefreshing]     = useState(false);

  // Reset unread badge when screen opens
  useEffect(() => {
    resetUnread();
  }, [resetUnread]);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const list = await fetchNotificationHistory();
      setNotifications(list);
    } catch (err) {
      console.error('[NotificationHistory] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  // Real-time new notification insertion
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (notif: any) => {
      const payload = typeof notif.payload === 'string'
        ? (() => { try { return JSON.parse(notif.payload); } catch { return {}; } })()
        : (notif.payload ?? {});
      const parsed: NotificationLog = { ...notif, payload };
      setNotifications((prev) => {
        if (prev.some((n) => n.id === parsed.id)) return prev;
        return [parsed, ...prev];
      });
    };

    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchNotifications(true);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch {
      Alert.alert('Error', 'Failed to mark notifications as read.');
    }
  };

  const handlePress = async (item: NotificationLog) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => n.id === item.id ? { ...n, is_read: true } : n)
        );
      } catch { /* non-fatal */ }
    }

    const payload = item.payload as Record<string, any>;
    if (payload?.route) {
      try { navigation.navigate(payload.route, payload.params ?? {}); }
      catch { /* fallback: stay on history */ }
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);
  const sections  = groupByDate(notifications);

  // ─── Render item ────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: NotificationLog }) => {
    const { icon, color } = getTypeStyle(item.notification_type);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          !item.is_read && styles.cardUnread,
          pressed && { opacity: 0.93 },
        ]}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.iconBubble, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              {!item.is_read && <View style={[styles.dot, { backgroundColor: color }]} />}
              <Text style={[styles.cardTitle, !item.is_read && styles.cardTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.cardBody2} numberOfLines={2}>{item.body}</Text>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {hasUnread && (
            <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>All read</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => navigation.navigate('NotificationSettingsScreen')}
            style={styles.settingsBtn}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={22} color={C.textSecondary} />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No notifications yet.</Text>
            </View>
          }
          ListFooterComponent={
            notifications.length > 0 ? (
              <Pressable
                onPress={() => navigation.navigate('NotificationTestScreen')}
                style={styles.testLink}
              >
                <Ionicons name="flask-outline" size={14} color={C.textMuted} />
                <Text style={styles.testLinkText}>Open Notification Testing Panel</Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 0, paddingVertical: 0 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  backButton:     { padding: 4 },
  headerTitle:    { flex: 1, fontSize: 18, fontWeight: '700', color: '#111827', fontFamily: F.bold },
  headerActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markReadBtn:    { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: C.primaryLight },
  markReadText:   { fontSize: 12, fontWeight: '600', color: C.primary, fontFamily: F.semiBold },
  settingsBtn:    { padding: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent:    { padding: 16, paddingBottom: 32, gap: 4 },
  sectionHeader:  { paddingVertical: 8, paddingTop: 16 },
  sectionHeaderText: { fontSize: 12, fontFamily: F.semiBold, color: C.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardUnread:     { borderColor: C.primaryLight, backgroundColor: '#F0FDF4' },
  iconBubble:     { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:       { flex: 1 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  titleRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  dot:            { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardTitle:      { fontSize: 14, fontFamily: F.semiBold, color: '#374151', flex: 1 },
  cardTitleUnread: { color: '#111827', fontFamily: F.bold },
  timeText:       { fontSize: 11, color: '#9CA3AF', fontFamily: F.regular, flexShrink: 0 },
  cardBody2:      { fontSize: 13, color: '#4B5563', fontFamily: F.regular, lineHeight: 18 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: '#374151', fontFamily: F.bold, marginTop: 12 },
  emptySubtitle:  { fontSize: 13, color: '#6B7280', fontFamily: F.regular, marginTop: 4 },
  testLink:       { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingTop: 16, paddingBottom: 8 },
  testLinkText:   { fontSize: 12, fontFamily: F.regular, color: C.textMuted },
});
