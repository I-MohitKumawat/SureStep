/**
 * SureStep — src/components/shared/NotificationBanner.tsx
 *
 * Foreground in-app notification toast that slides in from the top.
 * Rendered at AppShell level (above NavigationContainer) so it overlays
 * all screens. Controlled by NotificationContext.
 *
 * Props:
 *   visible    — whether the banner is showing
 *   title      — notification title
 *   body       — notification body
 *   type       — notification type drives the accent color/icon
 *   onPress    — called when the user taps the banner (for deep-link)
 *   onDismiss  — called when the banner auto-dismisses or user swipes up
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, SOS_RED } from '../../theme/colors';
import { F } from '../../theme/fonts';

export type NotificationBannerType =
  | 'SOS'
  | 'GEOFENCE'
  | 'ROUTINE'
  | 'REMINDER'
  | 'RELATIONSHIP'
  | 'GENERAL';

interface NotificationBannerProps {
  visible: boolean;
  title: string;
  body: string;
  type?: NotificationBannerType;
  onPress?: () => void;
  onDismiss?: () => void;
  /** Auto-dismiss after ms. Default 4000. Set to 0 to disable. */
  autoDismissMs?: number;
}

function getTypeConfig(type: NotificationBannerType = 'GENERAL') {
  switch (type) {
    case 'SOS':          return { color: SOS_RED,        icon: 'alert-circle' as const };
    case 'GEOFENCE':     return { color: '#7C3AED',       icon: 'map' as const };
    case 'ROUTINE':      return { color: C.primary,       icon: 'checkmark-circle' as const };
    case 'REMINDER':     return { color: '#F59E0B',       icon: 'alarm' as const };
    case 'RELATIONSHIP': return { color: C.primary,       icon: 'people' as const };
    default:             return { color: C.primary,       icon: 'notifications' as const };
  }
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  title,
  body,
  type = 'GENERAL',
  onPress,
  onDismiss,
  autoDismissMs = 4000,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { color, icon } = getTypeConfig(type);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,    duration: 280, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      if (autoDismissMs > 0) {
        timerRef.current = setTimeout(dismiss, autoDismissMs);
      }
    } else {
      dismiss();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  const topOffset = insets.top + (Platform.OS === 'android' ? 8 : 0);

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topOffset, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[styles.banner, { borderLeftColor: color }]}
        onPress={() => {
          dismiss();
          onPress?.();
        }}
        android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
      >
        <View style={[styles.iconBubble, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
          <Text style={styles.bodyText} numberOfLines={2}>{body}</Text>
        </View>

        <Pressable hitSlop={12} onPress={dismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={C.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
    gap: 12,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 14,
    fontFamily: F.bold,
    color: C.textPrimary,
  },
  bodyText: {
    fontSize: 12,
    fontFamily: F.regular,
    color: C.textSecondary,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
    flexShrink: 0,
  },
});
