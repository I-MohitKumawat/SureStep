/**
 * SureStep — src/context/AlertContext.tsx
 * Unread alert count and feed for caregiver and family.
 * Single source of truth for all safety and telemetry-related alerts.
 */
import React, { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';

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
}

type AlertContextValue = {
  alerts: PatientAlert[];
  getAlertsForPatient: (patientId: string) => PatientAlert[];
  getUnackedCountForPatient: (patientId: string) => number;
  acknowledgeAlert: (alertId: string) => void;
  respondToAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  addAlert: (alert: Omit<PatientAlert, 'id' | 'timestamp' | 'status'>) => void;
  // Existing fields for backward compatibility
  unreadCount: number;
  feed: PatientAlert[];
  acknowledge: (alertId: string) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<PatientAlert[]>([
    {
      id: '1',
      title: 'Geofence Breach – Left Home Zone',
      description: 'Dorothy Hargrove has moved 320m beyond the safe Home Zone boundary.',
      timestamp: 'Today, 11:42 PM',
      severity: 'URGENT',
      status: 'new',
      patientId: 'bb3f9b85-6822-4778-a8af-c550cd4416c3', // Dorothy's patient ID
    },
    {
      id: '2',
      title: 'Unusual Night Movement',
      description: 'Activity detected at an unusual hour. Possible wandering.',
      timestamp: 'Today, 02:18 AM',
      severity: 'WARNING',
      status: 'new',
      patientId: 'bb3f9b85-6822-4778-a8af-c550cd4416c3',
    },
    {
      id: '3',
      title: 'Stationary Too Long – Park Bench',
      description: 'Mary acknowledged and is en route to the location.',
      timestamp: 'Today, 09:05 PM',
      severity: 'WARNING',
      status: 'responding',
      patientId: 'bb3f9b85-6822-4778-a8af-c550cd4416c3',
    },
    {
      id: '4',
      title: 'Geofence Breach – School Rd',
      description: 'Resolved: Patient returned to safe zone.',
      timestamp: 'Yesterday',
      severity: 'INFO',
      status: 'resolved',
      patientId: 'bb3f9b85-6822-4778-a8af-c550cd4416c3',
    },
    {
      id: '5',
      title: 'Fall Detected – Living Room',
      description: 'Resolved: Caregiver assisted patient and verified safety.',
      timestamp: '2 days ago',
      severity: 'URGENT',
      status: 'resolved',
      patientId: 'bb3f9b85-6822-4778-a8af-c550cd4416c3',
    },
  ]);

  const getAlertsForPatient = useCallback((patientId: string) => {
    return alerts.filter(a => a.patientId === patientId);
  }, [alerts]);

  const getUnackedCountForPatient = useCallback((patientId: string) => {
    return alerts.filter(a => a.patientId === patientId && a.status === 'new').length;
  }, [alerts]);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  }, []);

  const respondToAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'responding' } : a));
  }, []);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  }, []);

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
  }), [
    alerts,
    getAlertsForPatient,
    getUnackedCountForPatient,
    acknowledgeAlert,
    respondToAlert,
    resolveAlert,
    addAlert,
    unreadCount,
  ]);

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};

export const useAlerts = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
};
