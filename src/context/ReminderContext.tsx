/**
 * SureStep — src/context/ReminderContext.tsx
 *
 * Reminder engine for the PATIENT role.
 * Mounted inside PatientNavigator (not globally — Caregiver/Family don't need it).
 *
 * Responsibilities:
 *  1. On mount: fetch active reminders from backend, schedule local alarms for each
 *  2. WebSocket listener for reminder:active  → show ReminderOverlay
 *  3. WebSocket listener for reminder:snoozed → dismiss overlay
 *  4. WebSocket listener for reminder:completed / reminder:missed → dismiss overlay
 *  5. Expo Notifications listener → handle Complete/Snooze/Skip taps from notification tray
 *  6. Exposes completeReminder / snoozeReminder / skipReminder to ReminderOverlay
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import { connectSocket } from '../services/socketClient';
import {
  fetchActiveReminders,
  performReminderAction,
  type ReminderLog,
} from '../services/notificationService';
import {
  scheduleLocalReminder,
  cancelLocalReminder,
  buildReminderActionFromResponse,
} from '../services/localAlarmService';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReminderContextValue = {
  activeReminder:    ReminderLog | null;
  allReminders:      ReminderLog[];
  isLoading:         boolean;
  completeReminder:  (reminderId: string) => Promise<void>;
  snoozeReminder:    (reminderId: string, minutes: number) => Promise<void>;
  skipReminder:      (reminderId: string) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ReminderContext = createContext<ReminderContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ReminderProvider = ({ children }: { children: ReactNode }) => {
  const { user, firebaseUser } = useAuth();
  const [allReminders,   setAllReminders]   = useState<ReminderLog[]>([]);
  const [activeReminder, setActiveReminder] = useState<ReminderLog | null>(null);
  const [isLoading,      setIsLoading]      = useState(false);

  const patientId = user?.role === 'PATIENT' ? user.id : null;

  // ─── Load active reminders on mount ────────────────────────────────────

  const loadReminders = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const reminders = await fetchActiveReminders(patientId);
      setAllReminders(reminders);

      // Schedule local alarms for each
      for (const r of reminders) {
        await scheduleLocalReminder(r);
        // If any are already ACTIVE, show overlay immediately
        if (r.state === 'ACTIVE') {
          setActiveReminder(r);
        }
      }
    } catch (err) {
      console.warn('[ReminderContext] Load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  // ─── WebSocket subscriptions ────────────────────────────────────────────

  useEffect(() => {
    if (!firebaseUser || !patientId) return;

    let socketRef: any;
    let cleanupFn: (() => void) | undefined;

    const setup = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        socketRef = connectSocket(token);

        const onActive = ({ reminder }: { reminder: ReminderLog }) => {
          setActiveReminder(reminder);
          setAllReminders((prev) => {
            const exists = prev.some((r) => r.id === reminder.id);
            return exists
              ? prev.map((r) => r.id === reminder.id ? reminder : r)
              : [...prev, reminder];
          });
        };

        const onSnoozed = ({ reminderId }: { reminderId: string }) => {
          setActiveReminder((prev) => prev?.id === reminderId ? null : prev);
          setAllReminders((prev) =>
            prev.map((r) => r.id === reminderId ? { ...r, state: 'SNOOZED' as const } : r)
          );
          void cancelLocalReminder(reminderId);
        };

        const onCompleted = ({ reminderId }: { reminderId: string }) => {
          setActiveReminder((prev) => prev?.id === reminderId ? null : prev);
          setAllReminders((prev) =>
            prev.map((r) => r.id === reminderId ? { ...r, state: 'COMPLETED' as const } : r)
          );
          void cancelLocalReminder(reminderId);
        };

        const onSkipped = ({ reminderId }: { reminderId: string }) => {
          setActiveReminder((prev) => prev?.id === reminderId ? null : prev);
          setAllReminders((prev) =>
            prev.map((r) => r.id === reminderId ? { ...r, state: 'SKIPPED' as const } : r)
          );
          void cancelLocalReminder(reminderId);
        };

        const onMissed = ({ reminderId }: { reminderId: string }) => {
          setActiveReminder((prev) => prev?.id === reminderId ? null : prev);
          setAllReminders((prev) =>
            prev.map((r) => r.id === reminderId ? { ...r, state: 'MISSED' as const } : r)
          );
        };

        socketRef.on('reminder:active',    onActive);
        socketRef.on('reminder:snoozed',   onSnoozed);
        socketRef.on('reminder:completed', onCompleted);
        socketRef.on('reminder:skipped',   onSkipped);
        socketRef.on('reminder:missed',    onMissed);

        cleanupFn = () => {
          socketRef.off('reminder:active',    onActive);
          socketRef.off('reminder:snoozed',   onSnoozed);
          socketRef.off('reminder:completed', onCompleted);
          socketRef.off('reminder:skipped',   onSkipped);
          socketRef.off('reminder:missed',    onMissed);
        };
      } catch (err) {
        console.warn('[ReminderContext] WebSocket setup failed:', err);
      }
    };

    void setup();
    return () => cleanupFn?.();
  }, [firebaseUser, patientId]);

  // ─── Expo Notifications action listener (notification tray taps) ────────

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(async (response: Notifications.NotificationResponse) => {
      const parsed = buildReminderActionFromResponse(response);
      if (!parsed) return;

      const { reminderId, action, snoozeMinutes } = parsed;
      try {
        if (action === 'COMPLETE') {
          await completeReminder(reminderId);
        } else if (action === 'SNOOZE') {
          await snoozeReminder(reminderId, snoozeMinutes ?? 10);
        } else {
          await skipReminder(reminderId);
        }
      } catch (err) {
        console.warn('[ReminderContext] Notification action failed:', err);
      }
    });

    return () => sub.remove();
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────

  const completeReminder = useCallback(async (reminderId: string) => {
    try {
      await performReminderAction(reminderId, 'COMPLETE');
      setActiveReminder((prev) => prev?.id === reminderId ? null : prev);
      setAllReminders((prev) =>
        prev.map((r) => r.id === reminderId ? { ...r, state: 'COMPLETED' as const } : r)
      );
      await cancelLocalReminder(reminderId);
    } catch (err) {
      console.error('[ReminderContext] completeReminder failed:', err);
      throw err;
    }
  }, []);

  const snoozeReminder = useCallback(async (reminderId: string, minutes: number) => {
    try {
      await performReminderAction(reminderId, 'SNOOZE', minutes);
      setActiveReminder((prev) => prev?.id === reminderId ? null : prev);
      setAllReminders((prev) =>
        prev.map((r) => r.id === reminderId ? { ...r, state: 'SNOOZED' as const } : r)
      );
      await cancelLocalReminder(reminderId);
    } catch (err) {
      console.error('[ReminderContext] snoozeReminder failed:', err);
      throw err;
    }
  }, []);

  const skipReminder = useCallback(async (reminderId: string) => {
    try {
      await performReminderAction(reminderId, 'SKIP');
      setActiveReminder((prev) => prev?.id === reminderId ? null : prev);
      setAllReminders((prev) =>
        prev.map((r) => r.id === reminderId ? { ...r, state: 'SKIPPED' as const } : r)
      );
      await cancelLocalReminder(reminderId);
    } catch (err) {
      console.error('[ReminderContext] skipReminder failed:', err);
      throw err;
    }
  }, []);

  // ─── Value ──────────────────────────────────────────────────────────────

  const value = useMemo<ReminderContextValue>(
    () => ({
      activeReminder,
      allReminders,
      isLoading,
      completeReminder,
      snoozeReminder,
      skipReminder,
    }),
    [activeReminder, allReminders, isLoading, completeReminder, snoozeReminder, skipReminder],
  );

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useReminders = (): ReminderContextValue => {
  const ctx = useContext(ReminderContext);
  if (!ctx) throw new Error('useReminders must be used within ReminderProvider');
  return ctx;
};
