/**
 * SureStep — src/services/localAlarmService.ts
 *
 * Local Expo notification channel bootstrap and diagnostic test alarms.
 * Routine progress is tracked exclusively through canonical routine
 * occurrences; this service does not own reminder state.
 */
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

/** Must be called once at app startup before any notifications are shown. */
export async function bootstrapLocalNotifications(): Promise<void> {
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

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Safety alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#DC2626',
      sound: 'default',
      bypassDnd: true,
    });
  }
}

/** Schedule a one-shot diagnostic alarm in N seconds. */
export async function scheduleTestAlarm(delaySeconds = 5): Promise<string> {
  const trigger = {
    type: SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: delaySeconds,
    repeats: false,
  } as const;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test alarm',
      body: `This is a test alarm triggered ${delaySeconds}s ago.`,
      sound: 'default',
      data: { isTest: true },
    },
    trigger,
  });
}
