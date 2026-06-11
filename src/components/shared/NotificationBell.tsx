/**
 * SureStep — src/components/shared/NotificationBell.tsx
 *
 * Reusable notification bell icon with unread badge count.
 * Used in header areas across all three roles.
 * Reads unread count from NotificationContext.
 *
 * Usage:
 *   <NotificationBell />   — navigates to NotificationHistoryScreen on press
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationContext';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';

interface NotificationBellProps {
  color?: string;
  size?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  color = C.textPrimary,
  size = 24,
}) => {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      style={styles.container}
      onPress={() => navigation.navigate('NotificationHistoryScreen')}
      hitSlop={8}
      android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: true, radius: 20 }}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: F.bold,
    color: '#FFFFFF',
    lineHeight: 12,
  },
});
