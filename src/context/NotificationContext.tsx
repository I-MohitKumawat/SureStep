/**
 * SureStep — src/context/NotificationContext.tsx
 *
 * Global notification context. Mounted at AppShell level (outside role navigators).
 *
 * Responsibilities:
 *  1. FCM token is registered by AuthContext → bootstrapFcmToken() (already wired)
 *  2. Foreground FCM messages  → shows NotificationBanner (in-app toast)
 *  3. Background FCM tap       → deep-links via onNotificationOpenedApp
 *  4. Cold-start FCM tap       → deep-links via getInitialNotification
 *  5. WebSocket notification:new → increments unreadCount
 *  6. Provides unreadCount + fcmToken + banner state to all consumers
 *
 * Deep-link routing:
 *   FCM data payload must include `notification_type` to drive navigation.
 *   Navigation ref is read lazily (after NavigationContainer mounts).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { useAuth } from './AuthContext';
import type { NotificationBannerType } from '../components/shared/NotificationBanner';
import { getSocket } from '../services/socketClient';
import { bootstrapLocalNotifications, registerNotificationCategories } from '../services/localAlarmService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BannerState {
  visible: boolean;
  title:   string;
  body:    string;
  type:    NotificationBannerType;
  route?:  string;
  params?: Record<string, any>;
}

type NotificationContextValue = {
  fcmToken:    string | null;
  unreadCount: number;
  banner:      BannerState;
  dismissBanner:                  () => void;
  incrementUnread:                () => void;
  resetUnread:                    () => void;
  navigationRef:                  React.RefObject<any>;
  checkNotificationPermissions:   () => Promise<Notifications.PermissionStatus>;
  requestNotificationPermissions: () => Promise<boolean>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Derive banner type from FCM notification_type data field. */
function inferBannerType(notificationType?: string): NotificationBannerType {
  if (!notificationType) return 'GENERAL';
  const t = notificationType.toUpperCase();
  if (t.includes('SOS')) return 'SOS';
  if (t.includes('GEOFENCE') || t.includes('ZONE') || t.includes('BREACH')) return 'GEOFENCE';
  if (t.includes('ROUTINE') || t.includes('TASK')) return 'ROUTINE';
  if (t.includes('REMINDER')) return 'REMINDER';
  if (t.includes('RELATIONSHIP') || t.includes('REQUEST') || t.includes('JOINED') || t.includes('ACCEPTED')) return 'RELATIONSHIP';
  return 'GENERAL';
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const role = user?.role;

  const [fcmToken,    setFcmToken]    = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [banner, setBanner]           = useState<BannerState>({
    visible: false, title: '', body: '', type: 'GENERAL',
  });

  // Navigation ref — injected lazily after NavigationContainer is ready
  const navigationRef = useRef<any>(null);

  // ─── Show banner helper ───────────────────────────────────────────────────

  const showBanner = useCallback((
    title: string,
    body: string,
    type: NotificationBannerType,
    route?: string,
    params?: Record<string, any>,
  ) => {
    setBanner({ visible: true, title, body, type, route, params });
    setUnreadCount((c) => c + 1);
  }, []);

  const dismissBanner = useCallback(() => {
    setBanner((prev) => ({ ...prev, visible: false }));
  }, []);

  // ─── Navigate from notification payload ───────────────────────────────────

  const navigateFromPayload = useCallback((data?: Record<string, any>) => {
    if (!data?.notification_type) return;
    const ref = navigationRef.current;
    if (!ref?.isReady?.()) return;

    const type = data.notification_type as string;
    const t = type.toUpperCase();

    try {
      if (role === 'PATIENT') {
        // Patients should be routed to PatientHomeScreen where the active reminder overlay is displayed
        ref.navigate('PatientHomeScreen');
      } else {
        if (t.includes('SOS') || t.includes('GEOFENCE') || t.includes('BREACH')) {
          ref.navigate('CaregiverAlertFeedScreen');
        } else if (t.includes('REMINDER') || t.includes('ROUTINE')) {
          ref.navigate('NotificationHistoryScreen');
        } else if (t.includes('RELATIONSHIP') || t.includes('REQUEST')) {
          ref.navigate('NotificationHistoryScreen');
        } else {
          ref.navigate('NotificationHistoryScreen');
        }
      }
    } catch (err) {
      console.warn('[NotificationContext] Navigation from payload failed:', err);
    }
  }, [role]);

  // ─── Bootstrap local notifications ───────────────────────────────────────

  useEffect(() => {
    void (async () => {
      try {
        await bootstrapLocalNotifications();
        await registerNotificationCategories();
      } catch (err) {
        console.warn('[NotificationContext] Local notification bootstrap failed:', err);
      }
    })();
  }, []);

  // ─── FCM token listener ───────────────────────────────────────────────────

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await messaging().getToken();
        setFcmToken(token);
      } catch (err) {
        console.warn('[NotificationContext] Could not get FCM token:', err);
      }
    };
    void getToken();

    const unsubRefresh = messaging().onTokenRefresh((token) => setFcmToken(token));
    return () => unsubRefresh();
  }, []);

  // ─── Foreground FCM messages ──────────────────────────────────────────────

  useEffect(() => {
    const unsubForeground = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const title  = remoteMessage.notification?.title ?? '';
        const body   = remoteMessage.notification?.body  ?? '';
        const data   = remoteMessage.data as Record<string, any> | undefined;
        const type   = inferBannerType(data?.notification_type);
        showBanner(title, body, type, data?.route, data?.params ? JSON.parse(data.params) : undefined);
      },
    );
    return () => unsubForeground();
  }, [showBanner]);

  // ─── Background FCM tap (app in background / recents) ────────────────────

  useEffect(() => {
    const unsubBackground = messaging().onNotificationOpenedApp((remoteMessage) => {
      const data = remoteMessage.data as Record<string, any> | undefined;
      setUnreadCount((c) => c + 1);
      // Delay navigate so NavigationContainer is ready
      setTimeout(() => navigateFromPayload(data), 500);
    });
    return () => unsubBackground();
  }, [navigateFromPayload]);

  // ─── Cold-start FCM tap (app was closed) ─────────────────────────────────

  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (!remoteMessage) return;
        const data = remoteMessage.data as Record<string, any> | undefined;
        setUnreadCount((c) => c + 1);
        setTimeout(() => navigateFromPayload(data), 1000);
      })
      .catch(() => {});
  }, [navigateFromPayload]);

  // ─── WebSocket notification:new ───────────────────────────────────────────

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const trySubscribe = () => {
      const socket = getSocket();
      if (!socket) return;

      const handler = (_notif: any) => {
        setUnreadCount((c) => c + 1);
      };

      socket.on('notification:new', handler);
      return () => socket.off('notification:new', handler);
    };

    // Poll until socket is available (socket connects after auth)
    let cleanup: (() => void) | undefined;
    interval = setInterval(() => {
      const result = trySubscribe();
      if (result) {
        cleanup = result;
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      cleanup?.();
    };
  }, []);

  // ─── Notification Permission Helpers ─────────────────────────────────────

  const checkNotificationPermissions = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }, []);

  const requestNotificationPermissions = useCallback(async () => {
    const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      return true;
    }

    if (status === 'denied' && !canAskAgain) {
      Alert.alert(
        'Notifications Disabled',
        'Notification permissions are permanently denied. Please enable them in system settings to receive vital health reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }

    if (status === 'denied') {
      Alert.alert(
        'Permissions Required',
        'SureStep requires notification permissions to alert you of routine reminders and safety events.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => void requestNotificationPermissions() },
        ],
      );
      return false;
    }

    return false;
  }, []);

  // Auto-prompt patients and caregivers on startup if permission is not granted
  useEffect(() => {
    if (!user) return;
    if (user.role === 'PATIENT' || user.role === 'CAREGIVER') {
      void (async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      })();
    }
  }, [user]);

  // ─── Context value ────────────────────────────────────────────────────────

  const incrementUnread = useCallback(() => setUnreadCount((c) => c + 1), []);
  const resetUnread     = useCallback(() => setUnreadCount(0), []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      fcmToken,
      unreadCount,
      banner,
      dismissBanner,
      incrementUnread,
      resetUnread,
      navigationRef,
      checkNotificationPermissions,
      requestNotificationPermissions,
    }),
    [
      fcmToken,
      unreadCount,
      banner,
      dismissBanner,
      incrementUnread,
      resetUnread,
      navigationRef,
      checkNotificationPermissions,
      requestNotificationPermissions,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useNotifications = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
