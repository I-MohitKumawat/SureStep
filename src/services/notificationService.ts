/**
 * SureStep — src/services/notificationService.ts
 *
 * Notification history, read state, preferences, and diagnostic notifications.
 * Routine reminders are not a V1 entity; routine progress is represented by
 * canonical routine occurrences.
 */
import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationLog {
  id: string;
  user_id: string;
  alert_id: string | null;
  channel: string;
  title: string;
  body: string;
  payload: Record<string, any>;
  delivered: boolean;
  is_read: boolean;
  read_at: string | null;
  notification_type: string | null;
  priority: string | null;
  action_link: string | null;
  created_at: string;
  is_test?: boolean;
}

export interface NotificationSettings {
  user_id: string;
  role: string;
  reminder_sounds: boolean;
  reminder_vibration: boolean;
  reminder_volume: number;
  reminder_frequency: number;
  alert_categories: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  escalation_pref: string;
  escalation_rules: Array<{
    level: number;
    offset_minutes: number;
    action: string;
  }>;
  digest_frequency: string;
  critical_alert_pref: string;
}

// ─── Notification History ─────────────────────────────────────────────────────

export async function fetchNotificationHistory(): Promise<NotificationLog[]> {
  const res = await apiClient.get('/alerts/history');
  const list: any[] = res.data?.data?.notifications ?? res.data?.notifications ?? [];
  return list.map((item) => ({
    ...item,
    payload: typeof item.payload === 'string'
      ? (() => { try { return JSON.parse(item.payload); } catch { return {}; } })()
      : (item.payload ?? {}),
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/alerts/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/alerts/read-all');
}

// ─── Notification Settings ────────────────────────────────────────────────────

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const res = await apiClient.get('/alerts/settings');
  return res.data?.data?.settings ?? res.data?.settings;
}

export async function updateNotificationSettings(
  patch: Partial<Omit<NotificationSettings, 'user_id' | 'role'>>,
): Promise<NotificationSettings> {
  const res = await apiClient.put('/alerts/settings', patch);
  return res.data?.data?.settings ?? res.data?.settings;
}

// ─── Test / Validation Endpoints ──────────────────────────────────────────────

export async function triggerTestNotification(): Promise<NotificationLog> {
  const res = await apiClient.post('/alerts/test/notification');
  return res.data?.data?.notification ?? res.data?.notification;
}
