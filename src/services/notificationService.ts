/**
 * SureStep — src/services/notificationService.ts
 *
 * Frontend API wrapper for all notification, reminder, and settings endpoints.
 * Single import point for all notification-related API calls.
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

export interface ReminderLog {
  id: string;
  patient_id: string;
  reference_id: string | null;
  reference_type: 'ROUTINE' | 'MEDICATION' | 'APPOINTMENT' | 'CUSTOM';
  title: string;
  body: string | null;
  scheduled_at: string;
  state: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'SNOOZED' | 'MISSED' | 'SKIPPED';
  snooze_count: number;
  snoozed_until: string | null;
  escalation_level: number;
  history: Array<Record<string, any>>;
  created_at: string;
  updated_at: string;
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

// ─── Reminders ────────────────────────────────────────────────────────────────

export async function fetchActiveReminders(patientId?: string): Promise<ReminderLog[]> {
  const params = patientId ? { patientId } : {};
  const res = await apiClient.get('/alerts/reminders/active', { params });
  return res.data?.data?.reminders ?? res.data?.reminders ?? [];
}

export type ReminderAction = 'COMPLETE' | 'SNOOZE' | 'SKIP';

export async function performReminderAction(
  reminderId: string,
  action: ReminderAction,
  snoozeMinutes?: number,
): Promise<ReminderLog> {
  const body: Record<string, any> = { action };
  if (action === 'SNOOZE' && snoozeMinutes) {
    body.snooze_minutes = snoozeMinutes;
  }
  const res = await apiClient.post(`/alerts/reminders/${reminderId}/action`, body);
  return res.data?.data?.reminder ?? res.data?.reminder;
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

export async function triggerTestReminder(): Promise<ReminderLog> {
  const res = await apiClient.post('/alerts/test/reminder');
  return res.data?.data?.reminder ?? res.data?.reminder;
}

export async function triggerTestEscalation(): Promise<ReminderLog> {
  const res = await apiClient.post('/alerts/test/escalation');
  return res.data?.data?.reminder ?? res.data?.reminder;
}
