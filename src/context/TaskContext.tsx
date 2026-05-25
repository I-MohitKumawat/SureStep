/**
 * SureStep — src/context/TaskContext.tsx
 * Tasks (routines) for a patient. Mounted inside PatientNavigator and CaregiverNavigator.
 * Migrated from: app/context/taskContext.ts
 * Changes:
 *   - Converted to .tsx
 *   - Added offline queue support via src/utils/offlineQueue.ts
 *   - Wired to Express API via taskService (Supabase stubs replaced)
 *   - Restructured CRUD to call real API endpoints
 */
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import * as taskService from '../services/taskService';
import { enqueue, flush } from '../utils/offlineQueue';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'done' | 'missed' | 'unsure' | 'skipped';

export type Task = {
  id:          string;
  patientId:   string;
  title:       string;
  description?: string;
  icon?:       string;
  time:        string;       // HH:MM
  status:      TaskStatus;
  completedAt?: string;
  createdAt:   string;
  updatedAt:   string;
};

export type TaskDraft = {
  patientId:    string;
  title:        string;
  description?: string;
  time:         string;
  icon?:        string;
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
      const mapped: Task[] = (data.data ?? []).map((row: any) => ({
        id:          row.id,
        patientId:   row.patient_id,
        title:       row.title       ?? '',
        description: row.patient_hint ?? row.description ?? '',
        icon:        row.emoji,
        time:        row.scheduled_time ?? '',
        status:      row.status as TaskStatus,
        completedAt: row.completed_at,
        createdAt:   row.created_at,
        updatedAt:   row.updated_at ?? row.created_at,
      }));
      setTasks((prev) => {
        const others = prev.filter((t) => t.patientId !== patientId);
        return [...others, ...mapped];
      });
    } catch (e) {
      console.warn('[TaskContext] loadTasksForPatient failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (draft: TaskDraft): Promise<Task> => {
    const { data } = await taskService.createTask(draft.patientId, {
      title:       draft.title,
      patient_hint:draft.description,
      emoji:       draft.icon,
      scheduled_time: draft.time,
    });
    const row = data.data;
    const created: Task = {
      id:          row.id,
      patientId:   row.patient_id,
      title:       row.title,
      description: row.patient_hint ?? '',
      icon:        row.emoji,
      time:        row.scheduled_time,
      status:      'pending',
      createdAt:   row.created_at,
      updatedAt:   row.created_at,
    };
    setTasks((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTask = useCallback(async (taskId: string, patch: Partial<TaskDraft>) => {
    try {
      await taskService.updateTask(taskId, {
        title:        patch.title,
        patient_hint: patch.description,
        emoji:        patch.icon,
        scheduled_time: patch.time,
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
    try {
      if (status === 'done') await taskService.completeTask(taskId);
      else if (status === 'unsure') await taskService.markUnsure(taskId);
      setTasks((prev) => prev.map((t) =>
        t.id === taskId
          ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : t.completedAt }
          : t,
      ));
    } catch {
      enqueue({ endpoint: `/tasks/${taskId}/${status}`, method: 'POST', body: {} });
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
