import * as React from 'react';
// import { supabase } from '../utils/supabaseClient'; // REMOVED: Supabase migration to Express/PostgreSQL

export type TaskStatus = 'pending' | 'done' | 'missed' | 'unsure';

export type Task = {
  id: string;
  patientId: string;
  routineId: string;
  title: string;
  time: string;
  description?: string;
  icon?: string;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Routine = {
  id: string;
  patientId: string;
  name: string;
  isActive: boolean;
  scheduleLabel: string;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
};

export type TaskDraft = {
  patientId: string;
  title: string;
  description?: string;
  time: string;
  icon?: string;
  status?: TaskStatus;
};

type TaskContextValue = {
  tasks: Task[];
  routines: Routine[];
  loading: boolean;
  loadTasks: () => Promise<void>;
  createRoutine: (routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Routine>;
  createTask: (draft: TaskDraft) => Promise<Task>;
  updateTask: (taskId: string, patch: Partial<TaskDraft>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTasksForPatient: (patientId: string) => Task[];
  getRoutinesForPatient: (patientId: string) => Routine[];
};

const TaskContext = React.createContext<TaskContextValue | undefined>(undefined);

// ── Icon encoding helpers ─────────────────────────────────────────────────────
// We encode the icon inside the description column to avoid a DB schema change.
// Format stored in Supabase: "ICON:🍽️|actual description text"
const ICON_PREFIX = 'ICON:';
const ICON_SEP = '|';

function encodeIconDescription(icon: string | undefined, description: string | undefined): string {
  const desc = description ?? '';
  if (icon) return `${ICON_PREFIX}${icon}${ICON_SEP}${desc}`;
  return desc;
}

function decodeIconDescription(raw: string | null | undefined): { icon: string; description: string } {
  const s = raw ?? '';
  if (s.startsWith(ICON_PREFIX)) {
    const rest = s.slice(ICON_PREFIX.length);
    const sepIdx = rest.indexOf(ICON_SEP);
    if (sepIdx !== -1) return { icon: rest.slice(0, sepIdx), description: rest.slice(sepIdx + 1) };
    return { icon: rest, description: '' };
  }
  return { icon: '📋', description: s };
}

// ── DB row mappers ────────────────────────────────────────────────────────────
function mapDbTaskToTask(row: any): Task {
  const { icon, description } = decodeIconDescription(row.description);
  return {
    id:          row.id,
    patientId:   row.patient_id,
    routineId:   row.routine_id ?? '',
    title:       row.title      ?? '',
    time:        row.time       ?? '',
    description,
    icon,
    status:      row.status as TaskStatus,
    completedAt: row.completed_at,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

function mapDbRoutineToRoutine(row: any): Routine {
  return {
    id:            row.id,
    patientId:     row.patient_id,
    name:          row.name           ?? '',
    isActive:      row.is_active      ?? true,
    scheduleLabel: row.schedule_label ?? '',
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks,    setTasks]    = React.useState<Task[]>([]);
  const [routines, setRoutines] = React.useState<Routine[]>([]);
  const [loading,  setLoading]  = React.useState(true);

  // ── Initial load + realtime ─────────────────────────────────────────────
  // REMOVED: Supabase migration to Express/PostgreSQL
  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      console.warn('[taskContext] loadTasks: Supabase removed, setting empty arrays');
      setTasks([]);
      setRoutines([]);
    } catch (e) {
      console.warn('loadTasks failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTasks();

    // REMOVED: Supabase realtime subscriptions
    return () => {};
  }, [loadTasks]);

  // ── createRoutine ─────────────────────────────────────────────────────────
  // REMOVED: Supabase migration to Express/PostgreSQL
  const createRoutine = React.useCallback(async (data: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.warn('[taskContext] createRoutine: Supabase removed, throwing error');
    throw new Error('Supabase removed - migrate to Express API');
  }, []);

  // ── createTask ────────────────────────────────────────────────────────────
  // REMOVED: Supabase migration to Express/PostgreSQL
  const createTask = React.useCallback(async (draft: TaskDraft): Promise<Task> => {
    console.warn('[taskContext] createTask: Supabase removed, throwing error');
    throw new Error('Supabase removed - migrate to Express API');
  }, []);

  // ── updateTask ────────────────────────────────────────────────────────────
  // REMOVED: Supabase migration to Express/PostgreSQL
  const updateTask = React.useCallback(async (taskId: string, patch: Partial<TaskDraft>) => {
    console.warn('[taskContext] updateTask: Supabase removed, no-op');
  }, []);

  // ── updateTaskStatus ──────────────────────────────────────────────────────
  // REMOVED: Supabase migration to Express/PostgreSQL
  const updateTaskStatus = React.useCallback(async (taskId: string, status: TaskStatus) => {
    console.warn('[taskContext] updateTaskStatus: Supabase removed, no-op');
  }, []);

  // ── deleteTask ────────────────────────────────────────────────────────────
  // REMOVED: Supabase migration to Express/PostgreSQL
  const deleteTask = React.useCallback(async (taskId: string) => {
    console.warn('[taskContext] deleteTask: Supabase removed, no-op');
  }, []);

  const getTasksForPatient    = React.useCallback((pid: string) => tasks.filter(t => t.patientId === pid), [tasks]);
  const getRoutinesForPatient = React.useCallback((pid: string) => routines.filter(r => r.patientId === pid), [routines]);

  const value = React.useMemo(() => ({
    tasks, routines, loading,
    loadTasks,
    createRoutine, createTask, updateTask, updateTaskStatus, deleteTask,
    getTasksForPatient, getRoutinesForPatient,
  }), [tasks, routines, loading, loadTasks, createRoutine, createTask, updateTask, updateTaskStatus, deleteTask, getTasksForPatient, getRoutinesForPatient]);

  return React.createElement(TaskContext.Provider, { value }, children);
}

export function useTasks(): TaskContextValue {
  const ctx = React.useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
