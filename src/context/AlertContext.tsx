/**
 * SureStep — src/context/AlertContext.tsx
 * Canonical safety-alert store for caregivers and family.
 *
 * Alert lifecycle: TRIGGERED -> ACTIVE/VIEWED -> RESOLVED.
 * Responding records a responder action and never resolves an incident.
 * Resolution is Circle Owner-only and is enforced by the API.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getSocket } from '../services/socketClient';
import {
  listPatientSafetyAlerts,
  listCircleSafetyAlerts,
  respondToAlert as respondToAlertApi,
  resolveAlert as resolveAlertApi,
  type SafetyAlert,
} from '../services/safetyService';
import { resolveCircleIdForPatient } from '../services/careCircleService';

export type AlertSeverity = 'URGENT' | 'WARNING' | 'INFO';
export type AlertProgressStatus = 'new' | 'acknowledged' | 'responding' | 'resolved';

export interface PatientAlert {
  id: string;
  patientId: string;
  circleId: string;
  title: string;
  description: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertProgressStatus;
  zoneName?: string | null;
  escalationLevel?: number;
  responderName?: string | null;
  responderRole?: string | null;
}

type AlertContextValue = {
  alerts: PatientAlert[];
  getAlertsForPatient: (patientId: string) => PatientAlert[];
  getUnackedCountForPatient: (patientId: string) => number;
  /** Records "I'm Responding"; it does not resolve the alert. */
  acknowledgeAlert: (alertId: string) => Promise<void>;
  respondToAlert: (alertId: string) => Promise<void>;
  /** Circle Owner only. Rejected by the API for non-Owners. */
  resolveAlert: (alertId: string) => Promise<void>;
  addAlert: (alert: Omit<PatientAlert, 'id' | 'timestamp' | 'status'>) => void;
  unreadCount: number;
  feed: PatientAlert[];
  acknowledge: (alertId: string) => Promise<void>;
  fetchPatientAlerts: (patientId: string) => Promise<void>;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const formatTimestamp = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (_) {
    return dateStr;
  }
};

const mapApiAlertToPatientAlert = (alert: SafetyAlert): PatientAlert => {
  const patientName = alert.patient_name || 'Patient';

  const title = alert.alert_type === 'SOS_MANUAL'
    ? 'Emergency – SOS Triggered'
    : 'Left Safe Zone';

  const description = alert.alert_type === 'SOS_MANUAL'
    ? `${patientName} triggered an SOS emergency signal. Help is required immediately.`
    : `${patientName} moved outside the designated ${alert.zone_name || 'safe zone'}.`;

  let severity: AlertSeverity = 'INFO';
  if (alert.severity === 'CRITICAL') severity = 'URGENT';
  else if (alert.severity === 'WARNING') severity = 'WARNING';

  let status: AlertProgressStatus = 'new';
  if (alert.status === 'RESOLVED') status = 'resolved';
  else if (alert.status === 'ACTIVE' || alert.status === 'VIEWED') {
    status = alert.responders && alert.responders.length > 0 ? 'responding' : 'acknowledged';
  }

  const latestResponder = alert.responders?.[alert.responders.length - 1];

  return {
    id: alert.id,
    patientId: alert.patient_id,
    circleId: alert.circle_id ?? '',
    title,
    description,
    timestamp: formatTimestamp(alert.created_at),
    severity,
    status,
    zoneName: alert.zone_name ?? null,
    responderName: latestResponder?.responder_name ?? null,
    responderRole: latestResponder?.responder_role ?? null,
  };
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);

  const getAlertsForPatient = useCallback((patientId: string) => {
    return alerts.filter(a => a.patientId === patientId);
  }, [alerts]);

  const getUnackedCountForPatient = useCallback((patientId: string) => {
    return alerts.filter(a => a.patientId === patientId && a.status !== 'resolved').length;
  }, [alerts]);

  const fetchPatientAlerts = useCallback(async (patientId: string) => {
    try {
      const rows = await listPatientSafetyAlerts(patientId);
      const mapped = rows.map(mapApiAlertToPatientAlert);
      setAlerts((prev) => {
        const otherPatientsAlerts = prev.filter((a) => a.patientId !== patientId);
        return [...mapped, ...otherPatientsAlerts];
      });
    } catch (err) {
      console.warn('[AlertContext] Failed to fetch alerts:', err);
    }
  }, []);

  const respondToAlert = useCallback(async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    const circleId = alert.circleId || await resolveCircleIdForPatient(alert.patientId);
    if (!circleId) throw new Error('No active Care Circle for this alert');
    await respondToAlertApi(circleId, alertId);
    await fetchPatientAlerts(alert.patientId);
  }, [alerts, fetchPatientAlerts]);

  const resolveAlert = useCallback(async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    const circleId = alert.circleId || await resolveCircleIdForPatient(alert.patientId);
    if (!circleId) throw new Error('No active Care Circle for this alert');
    await resolveAlertApi(circleId, alertId);
    await fetchPatientAlerts(alert.patientId);
  }, [alerts, fetchPatientAlerts]);

  const addAlert = useCallback((newAlert: Omit<PatientAlert, 'id' | 'timestamp' | 'status'>) => {
    const alert: PatientAlert = {
      ...newAlert,
      id: Math.random().toString(36).substring(7),
      timestamp: 'Just now',
      status: 'new',
    };
    setAlerts(prev => [alert, ...prev]);
  }, []);

  const unreadCount = useMemo(() => {
    return alerts.filter(a => a.status === 'new').length;
  }, [alerts]);

  // WebSocket subscriptions for real-time alert updates.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const upsertAlert = (apiAlert: any) => {
      if (!apiAlert?.id || !apiAlert?.patient_id) return;
      const mapped = mapApiAlertToPatientAlert({
        ...apiAlert,
        alert_type: apiAlert.alert_type ?? 'ZONE_BREACH',
        severity: apiAlert.severity ?? (apiAlert.alert_type === 'SOS_MANUAL' ? 'CRITICAL' : 'WARNING'),
        status: apiAlert.status ?? 'TRIGGERED',
        created_at: apiAlert.created_at ?? apiAlert.triggered_at ?? new Date().toISOString(),
        responders: apiAlert.responders ?? [],
      });
      setAlerts((prev) => {
        const exists = prev.some((a) => a.id === mapped.id);
        return exists ? prev.map((a) => (a.id === mapped.id ? mapped : a)) : [mapped, ...prev];
      });
    };

    const handleAlertNewOrUpdated = (data: any) => {
      const apiAlert = data?.alert;
      if (apiAlert) upsertAlert(apiAlert);
    };

    const handleAlertResponse = (data: any) => {
      const alertId = data?.alertId || data?.alert_id;
      if (!alertId) return;
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                status: 'responding',
                responderName: data?.responderName || data?.responder_name || a.responderName,
                responderRole: data?.responderRole || data?.responder_role || a.responderRole,
              }
            : a
        )
      );
    };

    const handleAlertResolved = (data: any) => {
      const alertId = data?.alertId || data?.alert_id;
      if (!alertId) return;
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' } : a)));
    };

    socket.on('alert:new', handleAlertNewOrUpdated);
    socket.on('alert:updated', handleAlertNewOrUpdated);
    socket.on('alert:response', handleAlertResponse);
    socket.on('alert:resolved', handleAlertResolved);
    socket.on('sos:triggered', handleAlertNewOrUpdated);

    return () => {
      socket.off('alert:new', handleAlertNewOrUpdated);
      socket.off('alert:updated', handleAlertNewOrUpdated);
      socket.off('alert:response', handleAlertResponse);
      socket.off('alert:resolved', handleAlertResolved);
      socket.off('sos:triggered', handleAlertNewOrUpdated);
    };
  }, []);

  const value = useMemo<AlertContextValue>(() => ({
    alerts,
    getAlertsForPatient,
    getUnackedCountForPatient,
    acknowledgeAlert: respondToAlert,
    respondToAlert,
    resolveAlert,
    addAlert,
    unreadCount,
    feed: alerts,
    acknowledge: respondToAlert,
    fetchPatientAlerts,
  }), [
    alerts,
    getAlertsForPatient,
    getUnackedCountForPatient,
    respondToAlert,
    resolveAlert,
    addAlert,
    unreadCount,
    fetchPatientAlerts,
  ]);

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};

export const useAlerts = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
};
