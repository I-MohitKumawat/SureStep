/**
 * SureStep — src/services/localAlarmService.ts
 *
 * Schedules and cancels local Expo Notifications for patient reminders.
 * Works in foreground and background (Android kills excluded — FCM handles those).
 *
 * Usage:
 *   import { scheduleLocalReminder, cancelLocalReminder } from './localAlarmService';
 *   await scheduleLocalReminder(reminder);   // called when ReminderContext receives a new reminder
 *   await cancelLocalReminder(reminderId);   // called on complete/skip/snooze
 */
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderLog } from './notificationService';

// ─── Notification Channel Setup (Android) ────────────────────────────────────

/**
 * Must be called once at app startup (before any notifications are shown).
 * Sets the Android channel and iOS foreground behaviour.
 */
export async function bootstrapLocalNotifications(): Promise<void> {
  // Set foreground display behaviour
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0E7A67',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#DC2626',
      sound: 'default',
      bypassDnd: true,
    });
  }
}

/**
 * Register the three action categories (Complete / Snooze / Skip).
 * Must be called once at startup.
 */
export async function registerNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('reminder_actions', [
    {
      identifier: 'COMPLETE',
      buttonTitle: '✅ Complete',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'SNOOZE',
      buttonTitle: '⏰ Snooze 5 min',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'VIEW_INSTRUCTIONS',
      buttonTitle: '📖 View Instructions',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
}

// ─── Schedule / Cancel ────────────────────────────────────────────────────────

/** Maps reminder ID → local notification identifier for cancellation. */
const localNotifIds = new Map<string, string>();

/**
 * Schedule a local notification for a reminder.
 * If the reminder is already due (scheduledAt <= now), fires immediately.
 * Silently no-ops if already scheduled.
 */
export async function scheduleLocalReminder(reminder: ReminderLog): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Don't double-schedule
    if (localNotifIds.has(reminder.id)) return;

    const scheduledAt = new Date(reminder.scheduled_at);
    const now = new Date();

    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body ?? 'Time for your scheduled reminder.',
        sound: 'default',
        categoryIdentifier: 'reminder_actions',
        data: {
          reminderId: reminder.id,
          referenceId: reminder.reference_id,
          referenceType: reminder.reference_type,
        },
      },
      // null trigger = fire immediately; date trigger = fire at scheduled_at
      trigger: scheduledAt > now
        ? ({ type: SchedulableTriggerInputTypes.DATE, date: scheduledAt } as Notifications.DateTriggerInput)
        : null,
    });

    localNotifIds.set(reminder.id, identifier);
  } catch (err) {
    console.warn('[LocalAlarm] Failed to schedule:', err);
  }
}

/**
 * Cancel a previously scheduled local notification for a reminder.
 */
export async function cancelLocalReminder(reminderId: string): Promise<void> {
  try {
    const identifier = localNotifIds.get(reminderId);
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      localNotifIds.delete(reminderId);
    }
  } catch (err) {
    console.warn('[LocalAlarm] Failed to cancel:', err);
  }
}

/**
 * Schedule a one-shot test alarm in N seconds from now.
 * Returns the local notification identifier.
 */
export async function scheduleTestAlarm(delaySeconds = 5): Promise<string> {
  const trigger = {
    type: SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: delaySeconds,
    repeats: false,
  } as const;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Test Alarm',
      body: `This is a test alarm triggered ${delaySeconds}s ago.`,
      sound: 'default',
      categoryIdentifier: 'reminder_actions',
      data: { isTest: true },
    },
    trigger,
  });
}

/**
 * Handle a notification action response (Complete / Snooze / Skip tap).
 * Wire this to Notifications.addNotificationResponseReceivedListener in the context.
 */
export function buildReminderActionFromResponse(
  response: Notifications.NotificationResponse,
): { reminderId: string; action: 'COMPLETE' | 'SNOOZE' | 'SKIP' | 'OPEN' | 'VIEW_INSTRUCTIONS'; snoozeMinutes?: number } | null {
  const data = response.notification.request.content.data as any;
  const reminderId = data?.reminderId;
  if (!reminderId) return null;

  const actionId = response.actionIdentifier;
  if (actionId === 'COMPLETE') return { reminderId, action: 'COMPLETE' };
  if (actionId === 'SNOOZE')   return { reminderId, action: 'SNOOZE', snoozeMinutes: 5 };
  if (actionId === 'SKIP')     return { reminderId, action: 'SKIP' };
  if (actionId === 'VIEW_INSTRUCTIONS') return { reminderId, action: 'VIEW_INSTRUCTIONS' };

  // User tapped the notification body (no action button) — treat as open
  return { reminderId, action: 'OPEN' };
}
