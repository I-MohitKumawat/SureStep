/**
 * SureStep — src/context/AlertContext.tsx
 * Unread alert count and feed for caregiver and family.
 * Single source of truth for all safety and telemetry-related alerts.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getSocket } from '../services/socketClient';
import {
  fetchAlerts as fetchAlertsApi,
  acknowledgeAlert as acknowledgeAlertApi,
  respondAlert as respondAlertApi,
  resolveActiveIncident,
  type ApiAlert,
} from '../services/geofenceService';

export type AlertSeverity = 'URGENT' | 'WARNING' | 'INFO';
export type AlertProgressStatus = 'new' | 'acknowledged' | 'responding' | 'resolved';

export interface PatientAlert {
  id: string;
  patientId: string;
  title: string;
  description: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertProgressStatus;
  geofenceId?: string;
  escalationLevel?: number;
  responderName?: string | null;
  responderRole?: string | null;
}

type AlertContextValue = {
  alerts: PatientAlert[];
  getAlertsForPatient: (patientId: string) => PatientAlert[];
  getUnackedCountForPatient: (patientId: string) => number;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  respondToAlert: (alertId: string) => Promise<void>;
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

const mapApiAlertToPatientAlert = (alert: ApiAlert): PatientAlert => {
  const patientName = alert.patient_name || 'Patient';
  
  let title = 'Safety Alert';
  if (alert.alert_type === 'SOS_TRIGGERED') title = 'Emergency – SOS Triggered';
  else if (alert.alert_type === 'GEOFENCE_BREACH' || alert.alert_type === 'ZONE_EXIT') title = 'Geofence Breach – Left Safe Zone';
  else if (alert.alert_type === 'ZONE_ENTER') title = 'Returned to Safe Zone';
  else if (alert.alert_type === 'BATTERY_LOW') title = 'Battery Low';

  let description = `An alert of type ${alert.alert_type} was generated.`;
  if (alert.alert_type === 'SOS_TRIGGERED') {
    description = `${patientName} triggered an SOS emergency signal. Help is required immediately.`;
  } else if (alert.alert_type === 'GEOFENCE_BREACH' || alert.alert_type === 'ZONE_EXIT') {
    const dist = alert.distance_from_zone_m ? `${Math.round(alert.distance_from_zone_m)}m` : '';
    description = `${patientName} has exited the safe boundary ${dist ? `and is ${dist} away` : ''}.`;
  } else if (alert.alert_type === 'ZONE_ENTER') {
    description = `${patientName} has returned to the safe zone.`;
  } else if (alert.alert_type === 'BATTERY_LOW') {
    description = `${patientName}'s device battery is critically low.`;
  }

  let severity: AlertSeverity = 'INFO';
  if (alert.severity === 'CRITICAL' || (alert.severity as string) === 'URGENT') severity = 'URGENT';
  else if (alert.severity === 'WARNING') severity = 'WARNING';

  let status: AlertProgressStatus = 'new';
  if (alert.status === 'ACKNOWLEDGED') status = 'acknowledged';
  else if (alert.status === 'RESPONDING') status = 'responding';
  else if (alert.status === 'RESOLVED') status = 'resolved';

  return {
    id: alert.id,
    patientId: alert.patient_id,
    title,
    description,
    timestamp: formatTimestamp(alert.created_at),
    severity,
    status,
    responderName: alert.responder_name || alert.acknowledged_by_name || null,
    responderRole: alert.responder_role || alert.acknowledged_by_role || null,
  };
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);

  const getAlertsForPatient = useCallback((patientId: string) => {
    return alerts.filter(a => a.patientId === patientId);
  }, [alerts]);

  const getUnackedCountForPatient = useCallback((patientId: string) => {
    return alerts.filter(a => a.patientId === patientId && a.status === 'new').length;
  }, [alerts]);

  const fetchPatientAlerts = useCallback(async (patientId: string) => {
    try {
      const data = await fetchAlertsApi(patientId);
      if (data && data.alerts) {
        const mapped = data.alerts.map(mapApiAlertToPatientAlert);
        setAlerts((prev) => {
          const otherPatientsAlerts = prev.filter((a) => a.patientId !== patientId);
          return [...mapped, ...otherPatientsAlerts];
        });
      }
    } catch (err) {
      console.warn('[AlertContext] Failed to fetch alerts:', err);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (id: string) => {
    try {
      const updated = await acknowledgeAlertApi(id);
      const mapped = mapApiAlertToPatientAlert(updated);
      setAlerts((prev) => prev.map(a => a.id === id ? mapped : a));
    } catch (err) {
      console.warn('[AlertContext] Acknowledge error:', err);
    }
  }, []);

  const respondToAlert = useCallback(async (id: string) => {
    try {
      const updated = await respondAlertApi(id);
      const mapped = mapApiAlertToPatientAlert(updated);
      setAlerts((prev) => prev.map(a => a.id === id ? mapped : a));
    } catch (err) {
      console.warn('[AlertContext] Respond error:', err);
    }
  }, []);

  const resolveAlert = useCallback(async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;
    try {
      await resolveActiveIncident(alert.patientId);
      await fetchPatientAlerts(alert.patientId);
    } catch (err) {
      console.warn('[AlertContext] Resolve error:', err);
    }
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

  // Compute total unread/new count across all patients for the root badge
  const unreadCount = useMemo(() => {
    return alerts.filter(a => a.status === 'new').length;
  }, [alerts]);

  // WebSocket subscriptions for real-time alert updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAlertNewOrUpdated = (data: any) => {
      const apiAlert = data?.alert;
      if (!apiAlert) return;
      console.log('[AlertContext] WebSocket alert update received:', apiAlert);
      setAlerts((prev) => {
        const mapped = mapApiAlertToPatientAlert(apiAlert);
        const exists = prev.some((a) => a.id === mapped.id);
        if (exists) {
          return prev.map((a) => (a.id === mapped.id ? mapped : a));
        } else {
          return [mapped, ...prev];
        }
      });
    };

    const handleAlertAcknowledged = (data: any) => {
      console.log('[AlertContext] WebSocket alert acknowledged received:', data);
      const alertId = data?.alert_id || data?.alert?.id;
      if (!alertId) return;
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id === alertId) {
            return {
              ...a,
              status: 'acknowledged',
              responderName: data?.acknowledged_by_name || data?.responder_name || a.responderName,
              responderRole: data?.acknowledged_by_role || data?.responder_role || a.responderRole,
            };
          }
          return a;
        })
      );
    };

    socket.on('alert:new', handleAlertNewOrUpdated);
    socket.on('alert:updated', handleAlertNewOrUpdated);
    socket.on('alert:acknowledged', handleAlertAcknowledged);
    socket.on('sos:triggered', handleAlertNewOrUpdated);

    return () => {
      socket.off('alert:new', handleAlertNewOrUpdated);
      socket.off('alert:updated', handleAlertNewOrUpdated);
      socket.off('alert:acknowledged', handleAlertAcknowledged);
      socket.off('sos:triggered', handleAlertNewOrUpdated);
    };
  }, []);

  const value = useMemo<AlertContextValue>(() => ({
    alerts,
    getAlertsForPatient,
    getUnackedCountForPatient,
    acknowledgeAlert,
    respondToAlert,
    resolveAlert,
    addAlert,
    unreadCount,
    feed: alerts,
    acknowledge: acknowledgeAlert,
    fetchPatientAlerts,
  }), [
    alerts,
    getAlertsForPatient,
    getUnackedCountForPatient,
    acknowledgeAlert,
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
