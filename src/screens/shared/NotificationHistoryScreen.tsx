import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import apiClient from '../../services/apiClient';
import { getSocket } from '../../services/socketClient';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

export interface NotificationLog {
  id: string;
  user_id: string;
  alert_id: string | null;
  channel: string;
  title: string;
  body: string;
  payload: Record<string, any> | string;
  delivered: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const NotificationHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await apiClient.get('/notifications/history');
      const list = res.data?.data?.notifications || res.data?.notifications || [];
      
      // Parse payload JSON strings if returned as string
      const parsedList = list.map((item: any) => {
        let parsedPayload = item.payload;
        if (typeof item.payload === 'string') {
          try {
            parsedPayload = JSON.parse(item.payload);
          } catch {
            parsedPayload = {};
          }
        }
        return { ...item, payload: parsedPayload };
      });

      setNotifications(parsedList);
    } catch (err) {
      console.error('[NotificationHistory] Fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notif: any) => {
        let parsedPayload = notif.payload;
        if (typeof notif.payload === 'string') {
          try {
            parsedPayload = JSON.parse(notif.payload);
          } catch {
            parsedPayload = {};
          }
        }
        const parsedNotif = { ...notif, payload: parsedPayload };
        setNotifications((prev) => {
          // Prevent duplicates
          if (prev.some(n => n.id === parsedNotif.id)) return prev;
          return [parsedNotif, ...prev];
        });
      };

      socket.on('notification:new', handleNewNotification);
      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('[NotificationHistory] Mark all read failed:', err);
      Alert.alert('Error', 'Failed to mark notifications as read.');
    }
  };

  const handleNotificationPress = async (item: NotificationLog) => {
    // 1. Mark as read in backend and local state
    if (!item.is_read) {
      try {
        await apiClient.post(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error('[NotificationHistory] Mark read failed:', err);
      }
    }

    // 2. Perform deep-link navigation if payload specifies route
    const payload = item.payload as Record<string, any>;
    if (payload && payload.route) {
      try {
        navigation.navigate(payload.route, payload.params || {});
      } catch (navErr) {
        console.warn('[NotificationHistory] Deep-link navigation failed:', navErr);
      }
    }
  };

  const timeAgo = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 0) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderItem = ({ item }: { item: NotificationLog }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          !item.is_read && styles.cardUnread,
          pressed && { opacity: 0.95 },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            {!item.is_read && <View style={styles.unreadDot} />}
            <Text style={[styles.title, !item.is_read && styles.titleUnread]}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={styles.bodyText}>{item.body}</Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some((n) => !n.is_read) ? (
          <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptySubtitle}>
                No notifications to display at the moment.
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: F.bold,
  },
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
    fontFamily: F.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardUnread: {
    borderColor: C.primaryLight,
    backgroundColor: '#F0FDF4', // very soft green/primary tint for unread
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    fontFamily: F.semiBold,
  },
  titleUnread: {
    color: '#111827',
    fontWeight: '700',
    fontFamily: F.bold,
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: F.regular,
  },
  bodyText: {
    fontSize: 13,
    color: '#4B5563',
    fontFamily: F.regular,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    fontFamily: F.bold,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: F.regular,
    marginTop: 4,
    textAlign: 'center',
  },
});
