/**
 * SureStep — src/context/TaskContext.tsx
 * Tasks (routines) for a patient. Mounted inside PatientNavigator and CaregiverNavigator.
 * Migrated from: app/context/taskContext.ts
 * Changes:
 *   - Converted to .tsx
 *   - Added offline queue support via src/utils/offlineQueue.ts
 *   - Wired to Express API via taskService (Supabase stubs replaced)
 *   - Restructured CRUD to call real API endpoints
 *   - Added TaskCategory, TaskPriority, 'overdue' status, instructionsMd, iconName, clientActionId
 *   - updateTaskStatus now generates a UUID client_action_id for idempotent offline sync
 */
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import * as taskService from '../services/taskService';
import { enqueue, flush, hasPendingTaskUpdate } from '../utils/offlineQueue';
import type { TaskCategory, TaskPriority } from '../types/enums';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'done' | 'missed' | 'overdue' | 'unsure' | 'skipped';

export type { TaskCategory, TaskPriority };

export type Task = {
  id:               string;
  patientId:        string;
  title:            string;
  instructionsMd?:  string;       // Markdown instructions shown to patient (replaces plain description)
  description?:     string;       // Legacy plain text — kept for backward compat
  category:         TaskCategory; // Structured category — drives icon and filtering
  priority:         TaskPriority; // Escalation level — drives alert thresholds
  iconName?:        string;       // Feather/vector icon name (replaces emoji field)
  icon?:            string;       // Legacy emoji field — kept for backward compat
  time:             string;       // HH:MM — derived from scheduled_timestamp for display
  scheduledTimestamp?: string;    // Full ISO datetime from backend
  status:           TaskStatus;
  clientActionId?:  string;       // UUID for offline idempotency
  completedAt?:     string;
  completedBy?:     string;       // user_id of who marked done
  createdAt:        string;
  updatedAt:        string;
  localUpdateTs?:   number;
};

export type TaskDraft = {
  patientId:         string;
  title:             string;
  instructionsMd?:   string;
  description?:      string;
  category?:         TaskCategory;
  priority?:         TaskPriority;
  iconName?:         string;
  time:              string;
  recurrencePattern?: Record<string, unknown>; // JSONB pattern from RoutineRecurrencePattern
  startDate?:        string;
  endDate?:          string;
  completionWindow?: string;
};

type TaskContextValue = {
  tasks:              Task[];
  loading:            boolean;
  loadTasksForPatient:(patientId: string) => Promise<void>;
  createTask:         (draft: TaskDraft) => Promise<Task>;
  updateTask:         (taskId: string, patch: Partial<TaskDraft>) => Promise<void>;
  updateTaskStatus:   (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask:         (taskId: string) => Promise<void>;
  getTasksForPatient: (patientId: string) => Task[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a UUID v4 for client-side idempotency keys without external deps. */
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Extract HH:MM 12h display time from a full ISO timestamp or plain HH:MM:SS string. */
function extractDisplayTime(scheduledTimestamp?: string, scheduledTime?: string): string {
  let dateObj: Date | null = null;
  if (scheduledTimestamp) {
    try {
      const d = new Date(scheduledTimestamp);
      if (!isNaN(d.getTime())) {
        dateObj = d;
      }
    } catch { /* fall through */ }
  }
  if (!dateObj && scheduledTime) {
    try {
      const parts = scheduledTime.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const d = new Date();
          d.setHours(hours);
          d.setMinutes(minutes);
          d.setSeconds(0);
          dateObj = d;
        }
      }
    } catch { /* fall through */ }
  }

  if (dateObj) {
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return scheduledTime ?? '';
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TaskContext = createContext<TaskContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasksForPatient = useCallback(async (patientId: string) => {
    setLoading(true);
    try {
      const { data } = await taskService.getTodaysTasks(patientId);
      const mapped: Task[] = (data.data?.tasks ?? []).map((row: any) => ({
        id:                 row.id,
        patientId:          row.patient_id,
        title:              row.title          ?? '',
        // BACKEND FETCH REQUIREMENT: instructions_md from tasks table (markdown care instructions)
        instructionsMd:     row.instructions_md ?? row.patient_hint ?? '',
        description:        row.patient_hint   ?? row.description   ?? '',
        // BACKEND FETCH REQUIREMENT: category and priority from tasks/routine_templates
        category:           (row.category as TaskCategory) ?? 'custom',
        priority:           (row.priority as TaskPriority) ?? 'medium',
        iconName:           row.icon_name,
        icon:               row.emoji,
        scheduledTimestamp: row.scheduled_timestamp,
        time:               extractDisplayTime(row.scheduled_timestamp, row.scheduled_time),
        status:             row.status as TaskStatus,
        clientActionId:     row.client_action_id,
        completedAt:        row.completed_at,
        completedBy:        row.completed_by,
        createdAt:          row.created_at,
        updatedAt:          row.updated_at ?? row.created_at,
      }));
      setTasks((prev) => {
        const others = prev.filter((t) => t.patientId !== patientId);
        const merged = mapped.map((backendTask) => {
          const localTask = prev.find((t) => t.id === backendTask.id);
          if (localTask) {
            const isQueued = hasPendingTaskUpdate(backendTask.id);
            // 15s window — longer than the 10s polling interval — guarantees optimistic
            // update survives at least one full poll cycle after the API call completes.
            const isRecent = localTask.localUpdateTs && (Date.now() - localTask.localUpdateTs < 15_000);
            if (isQueued || isRecent) {
              return {
                ...backendTask,
                status: localTask.status,
                clientActionId: localTask.clientActionId,
                completedAt: localTask.completedAt,
                localUpdateTs: localTask.localUpdateTs,
              };
            }
          }
          return backendTask;
        });
        return [...others, ...merged];
      });
    } catch (e) {
      console.warn('[TaskContext] loadTasksForPatient failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (draft: TaskDraft): Promise<Task> => {
    const { data } = await taskService.createTask(draft.patientId, {
      title:              draft.title,
      instructions_md:    draft.instructionsMd,
      patient_hint:       draft.description,
      category:           draft.category ?? 'custom',
      priority:           draft.priority ?? 'medium',
      icon_name:          draft.iconName,
      scheduled_time:     draft.time,
      recurrence_pattern: draft.recurrencePattern,
      start_date:         draft.startDate,
      end_date:           draft.endDate,
      completion_window:  draft.completionWindow,
    });
    const row = data.data;
    const created: Task = {
      id:             row.id,
      patientId:      row.patient_id,
      title:          row.title,
      instructionsMd: row.instructions_md ?? '',
      description:    row.patient_hint ?? '',
      category:       (row.category as TaskCategory) ?? 'custom',
      priority:       (row.priority as TaskPriority) ?? 'medium',
      iconName:       row.icon_name,
      icon:           row.emoji,
      scheduledTimestamp: row.scheduled_timestamp,
      time:           extractDisplayTime(row.scheduled_timestamp, row.scheduled_time),
      status:         'pending',
      createdAt:      row.created_at,
      updatedAt:      row.created_at,
    };
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (taskId: string, patch: Partial<TaskDraft>) => {
    try {
      await taskService.updateTask(taskId, {
        title:           patch.title,
        instructions_md: patch.instructionsMd,
        patient_hint:    patch.description,
        category:        patch.category,
        priority:        patch.priority,
        icon_name:       patch.iconName,
        scheduled_time:  patch.time,
      });
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      ));
    } catch {
      // Offline: queue for later
      enqueue({ endpoint: `/tasks/${taskId}`, method: 'PATCH', body: patch });
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    // Generate a client-side UUID to make this action idempotent
    // so retries after offline queue flush don't create duplicate completions.
    const clientActionId = generateUUIDv4();
    const now = Date.now();

    // 1. Optimistic update
    setTasks((prev) => prev.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status,
            clientActionId,
            localUpdateTs: now,
            completedAt: status === 'done' ? new Date().toISOString() : t.completedAt,
          }
        : t,
    ));

    // 2. Network sync
    try {
      await taskService.updateTaskStatusIdempotent(taskId, status, clientActionId);
    } catch {
      enqueue({
        endpoint: `/tasks/${taskId}/status`,
        method: 'POST',
        body: { status, client_action_id: clientActionId },
      });
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await taskService.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const getTasksForPatient = useCallback(
    (patientId: string) => tasks.filter((t) => t.patientId === patientId),
    [tasks],
  );

  const value = useMemo<TaskContextValue>(() => ({
    tasks, loading,
    loadTasksForPatient, createTask, updateTask, updateTaskStatus, deleteTask, getTasksForPatient,
  }), [tasks, loading, loadTasksForPatient, createTask, updateTask, updateTaskStatus, deleteTask, getTasksForPatient]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// ─── Hook — the ONLY export components use ────────────────────────────────────

export const useTasks = (): TaskContextValue => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
};
