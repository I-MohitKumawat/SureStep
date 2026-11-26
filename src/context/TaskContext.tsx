/**
 * SureStep — src/context/TaskContext.tsx
 *
 * Patient routine agenda backed exclusively by canonical routine occurrences.
 *
 * There is no standalone task instance model in V1. A "task" in this context
 * is a display projection of one `routine_occurrence`; the only mutation is
 * occurrence sign-off, which records a `routine_completions` row.
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
import {
  fetchOccurrences,
  signOffOccurrence,
  type RoutineCategory,
  type RoutineOccurrence,
} from '../services/routineService';
import type { TaskCategory, TaskPriority } from '../types/enums';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socketClient';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Display status projection. Canonical persisted states are
 * SCHEDULED / ONGOING / COMPLETED / OVERDUE / CANCELLED; the UI historically
 * consumed pending/done/overdue so those names are retained as a view model.
 */
export type TaskStatus = 'pending' | 'done' | 'overdue' | 'cancelled';

export type { TaskCategory, TaskPriority };

export type Task = {
  id: string;
  patientId: string;
  routineId: string;
  title: string;
  instructionsMd?: string;
  description?: string;
  category: TaskCategory;
  /** Display-only default: canonical routine definitions have no priority. */
  priority: TaskPriority;
  iconName?: string;
  icon?: string;
  time: string;
  scheduledTimestamp?: string;
  scheduledDate: string;
  status: TaskStatus;
  canonicalStatus: RoutineOccurrence['status'];
  completedAt?: string;
  completedBy?: string;
  completionSource?: RoutineOccurrence['completion_source'];
  signedOffAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskDraft = {
  patientId: string;
  title: string;
  description?: string;
  category: RoutineCategory;
  schedulePattern: { frequency?: string; time?: string; daysOfWeek?: number[]; times?: string[] };
};

type TaskContextValue = {
  tasks: Task[];
  loading: boolean;
  loadTasksForPatient: (patientId: string, forceRefresh?: boolean, date?: string) => Promise<void>;
  /** Sign off an occurrence. Only the 'done' view status is a valid mutation. */
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  getTasksForPatient: (patientId: string) => Task[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<RoutineCategory, TaskCategory> = {
  MEDICATION: 'medication',
  MEAL: 'meal',
  EXERCISE: 'exercise',
  HYGIENE: 'hygiene',
  APPOINTMENT: 'appointment',
};

const CANONICAL_STATUS_MAP: Record<RoutineOccurrence['status'], TaskStatus> = {
  SCHEDULED: 'pending',
  ONGOING: 'pending',
  COMPLETED: 'done',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

function displayTime(time?: string): string {
  if (!time) return '';
  const [hRaw, mRaw] = time.split(':');
  const h = parseInt(hRaw, 10);
  const m = parseInt(mRaw, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function mapOccurrenceToTask(row: RoutineOccurrence): Task {
  const category = CATEGORY_MAP[row.category] ?? 'custom';
  return {
    id: row.id,
    patientId: row.patient_id,
    routineId: row.routine_id,
    title: row.title ?? '',
    instructionsMd: row.description ?? '',
    description: row.description ?? '',
    category,
    priority: 'medium',
    iconName: category,
    icon: category,
    time: displayTime(row.scheduled_time),
    scheduledTimestamp: `${row.scheduled_date}T${row.scheduled_time}`,
    scheduledDate: row.scheduled_date,
    status: CANONICAL_STATUS_MAP[row.status] ?? 'pending',
    canonicalStatus: row.status,
    completedAt: row.completed_at ?? undefined,
    completedBy: row.completed_by ?? undefined,
    completionSource: row.completion_source ?? undefined,
    signedOffAt: row.signed_off_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.signed_off_at ?? row.created_at,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TaskContext = createContext<TaskContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const tasksRef = useRef<Task[]>([]);
  const lastFetchedRef = useRef<Record<string, number>>({});
  const inFlightRef = useRef<Record<string, Promise<void>>>({});
  const sessionSeqRef = useRef(0);

  const { firebaseUser, status, user } = useAuth();
  const authUserId = status === 'authenticated' ? user?.id : undefined;

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Clear all cached patient routine occurrences immediately when user signs out or switches accounts
  useEffect(() => {
    sessionSeqRef.current++;
    tasksRef.current = [];
    lastFetchedRef.current = {};
    inFlightRef.current = {};
    setTasks([]);
    setLoading(false);
  }, [authUserId]);

  // Canonical occurrence updates & access-revocation clearing
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !firebaseUser || !authUserId) return;

    const sessionSeq = sessionSeqRef.current;
    const refreshPatient = (data: any) => {
      const patientId = data?.patientId ?? data?.patient_id;
      if (!patientId) return;
      lastFetchedRef.current[patientId] = 0;
      void (async () => {
        try {
          const rows = await fetchOccurrences(patientId);
          if (sessionSeq !== sessionSeqRef.current) return;
          const mapped = rows.map(mapOccurrenceToTask);
          setTasks((prev) => [...prev.filter((t) => t.patientId !== patientId), ...mapped]);
          lastFetchedRef.current[patientId] = Date.now();
        } catch (err: any) {
          if (sessionSeq !== sessionSeqRef.current) return;
          const httpStatus = err?.response?.status;
          if (httpStatus === 401 || httpStatus === 403) {
            setTasks((prev) => prev.filter((t) => t.patientId !== patientId));
            delete lastFetchedRef.current[`${patientId}:today`];
          }
        }
      })();
    };

    const handleAccessRevoked = (data: any) => {
      const revokedPatientId = data?.patientId ?? data?.patient_id;
      lastFetchedRef.current = {};
      if (revokedPatientId) {
        setTasks((prev) => prev.filter((t) => t.patientId !== revokedPatientId));
      } else {
        sessionSeqRef.current++;
        setTasks([]);
      }
    };

    socket.on('routine:occurrence:updated', refreshPatient);
    socket.on('routine:occurrence:created', refreshPatient);
    socket.on('relationship:change', handleAccessRevoked);
    socket.on('circle:member_removed', handleAccessRevoked);
    socket.on('circle:member_left', handleAccessRevoked);
    socket.on('circle:terminated', handleAccessRevoked);

    return () => {
      socket.off('routine:occurrence:updated', refreshPatient);
      socket.off('routine:occurrence:created', refreshPatient);
      socket.off('relationship:change', handleAccessRevoked);
      socket.off('circle:member_removed', handleAccessRevoked);
      socket.off('circle:member_left', handleAccessRevoked);
      socket.off('circle:terminated', handleAccessRevoked);
    };
  }, [firebaseUser, authUserId]);

  const loadTasksForPatient = useCallback(
    async (patientId: string, forceRefresh = false, date?: string) => {
      if (!authUserId) return;
      const socket = getSocket();
      if (socket) socket.emit('join:patient', patientId);

      const cacheKey = `${patientId}:${date ?? 'today'}`;
      const now = Date.now();
      const lastFetched = lastFetchedRef.current[cacheKey] || 0;
      const isStale = now - lastFetched > 60_000;
      const hasCached = tasksRef.current.some((t) => t.patientId === patientId);

      if (hasCached && !isStale && !forceRefresh) return;

      if (inFlightRef.current[cacheKey] !== undefined) {
        return inFlightRef.current[cacheKey];
      }

      const expectedSession = sessionSeqRef.current;
      const promise = (async () => {
        setLoading(true);
        try {
          const rows = await fetchOccurrences(patientId, date);
          if (expectedSession !== sessionSeqRef.current) return;
          const mapped = rows.map(mapOccurrenceToTask);
          setTasks((prev) => [...prev.filter((t) => t.patientId !== patientId), ...mapped]);
          lastFetchedRef.current[cacheKey] = Date.now();
        } catch (e: any) {
          if (expectedSession !== sessionSeqRef.current) return;
          const httpStatus = e?.response?.status;
          if (httpStatus === 401 || httpStatus === 403) {
            setTasks((prev) => prev.filter((t) => t.patientId !== patientId));
            delete lastFetchedRef.current[cacheKey];
          }
          console.warn('[TaskContext] loadTasksForPatient failed:', e);
        } finally {
          if (expectedSession === sessionSeqRef.current) {
            setLoading(false);
          }
          delete inFlightRef.current[cacheKey];
        }
      })();

      inFlightRef.current[cacheKey] = promise;
      return promise;
    },
    [authUserId]
  );

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    if (status !== 'done') {
      throw new Error(
        'Routine occurrences only support sign-off. Missed, skipped, unsure, and undo states do not exist in V1.'
      );
    }

    const target = tasksRef.current.find((t) => t.id === taskId);
    if (!target) throw new Error('Routine occurrence not found in the current agenda');
    if (target.status === 'done') return;

    await signOffOccurrence(taskId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'done',
              canonicalStatus: 'COMPLETED',
              completedAt: new Date().toISOString(),
              signedOffAt: new Date().toISOString(),
            }
          : t
      )
    );
    lastFetchedRef.current[`${target.patientId}:today`] = 0;
  }, []);

  const getTasksForPatient = useCallback(
    (patientId: string) => tasks.filter((t) => t.patientId === patientId),
    [tasks]
  );

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      loading,
      loadTasksForPatient,
      updateTaskStatus,
      getTasksForPatient,
    }),
    [tasks, loading, loadTasksForPatient, updateTaskStatus, getTasksForPatient]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// ─── Hook — the ONLY export components use ────────────────────────────────────

export const useTasks = (): TaskContextValue => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
};
