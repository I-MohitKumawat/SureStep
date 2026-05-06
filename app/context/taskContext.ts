import * as React from 'react';
import { supabase } from '../utils/supabaseClient';

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
  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: tData, error: tErr }, { data: rData, error: rErr }] = await Promise.all([
        supabase.from('tasks').select('*').order('time', { ascending: true }),
        supabase.from('routines').select('*').order('created_at', { ascending: true }),
      ]);
      if (tErr) console.error('tasks fetch error:', tErr);
      if (rErr) console.error('routines fetch error:', rErr);
      if (tData) setTasks(tData.map(mapDbTaskToTask));
      if (rData) setRoutines(rData.map(mapDbRoutineToRoutine));
    } catch (e) {
      console.warn('loadTasks failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTasks();

    const taskSub = supabase
      .channel('ctx:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, ({ eventType, new: n, old: o }) => {
        setTasks((cur) => {
          if (eventType === 'INSERT') {
            // If we already have this id (optimistic insert), replace it; otherwise append.
            const exists = cur.some(t => t.id === (n as any).id);
            return exists
              ? cur.map(t => t.id === (n as any).id ? mapDbTaskToTask(n) : t)
              : [...cur, mapDbTaskToTask(n)];
          }
          if (eventType === 'UPDATE') return cur.map(t => t.id === (n as any).id ? mapDbTaskToTask(n) : t);
          if (eventType === 'DELETE') return cur.filter(t => t.id !== (o as any).id);
          return cur;
        });
      })
      .subscribe();

    const routineSub = supabase
      .channel('ctx:routines')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routines' }, ({ eventType, new: n, old: o }) => {
        setRoutines((cur) => {
          if (eventType === 'INSERT') return [...cur, mapDbRoutineToRoutine(n)];
          if (eventType === 'UPDATE') return cur.map(r => r.id === (n as any).id ? mapDbRoutineToRoutine(n) : r);
          if (eventType === 'DELETE') return cur.filter(r => r.id !== (o as any).id);
          return cur;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskSub);
      supabase.removeChannel(routineSub);
    };
  }, [loadTasks]);

  // ── createRoutine ─────────────────────────────────────────────────────────
  const createRoutine = React.useCallback(async (data: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const routineId = `routine_${Date.now()}`;
    const { error } = await supabase.from('routines').insert({
      id: routineId, patient_id: data.patientId,
      name: data.name, is_active: data.isActive, schedule_label: data.scheduleLabel,
    });
    if (error) { console.error('createRoutine error:', error); throw error; }

    if (data.tasks?.length) {
      const rows = data.tasks.map(t => ({
        id: t.id || `task_${Date.now()}_${Math.random()}`,
        patient_id: data.patientId, routine_id: routineId,
        title: t.title, time: t.time,
        description: encodeIconDescription(t.icon, t.description),
        status: t.status || 'pending',
      }));
      const { error: tErr } = await supabase.from('tasks').insert(rows);
      if (tErr) console.error('createRoutine tasks error:', tErr);
    }
    return { ...data, id: routineId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Routine;
  }, []);

  // ── createTask ────────────────────────────────────────────────────────────
  const createTask = React.useCallback(async (draft: TaskDraft): Promise<Task> => {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const row = {
      id,
      patient_id:  draft.patientId,
      routine_id:  null,
      title:       draft.title.trim(),
      time:        draft.time.trim(),
      description: encodeIconDescription(draft.icon, draft.description),
      status:      draft.status ?? 'pending',
    };
    // Optimistic
    const optimistic = mapDbTaskToTask({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    setTasks(cur => [...cur, optimistic]);

    const { data, error } = await supabase.from('tasks').insert(row).select().single();
    if (error) {
      console.error('createTask error:', error);
      setTasks(cur => cur.filter(t => t.id !== id));
      throw error;
    }
    const real = mapDbTaskToTask(data);
    setTasks(cur => cur.map(t => t.id === id ? real : t));
    return real;
  }, []);

  // ── updateTask ────────────────────────────────────────────────────────────
  const updateTask = React.useCallback(async (taskId: string, patch: Partial<TaskDraft>) => {
    setTasks(cur => cur.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        ...(patch.title       !== undefined ? { title:       patch.title       } : {}),
        ...(patch.time        !== undefined ? { time:        patch.time        } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.icon        !== undefined ? { icon:        patch.icon        } : {}),
        ...(patch.status      !== undefined ? { status:      patch.status      } : {}),
      };
    }));

    const current = tasks.find(t => t.id === taskId);
    const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.title  !== undefined) dbPatch.title  = patch.title.trim();
    if (patch.time   !== undefined) dbPatch.time   = patch.time.trim();
    if (patch.status !== undefined) dbPatch.status = patch.status;
    dbPatch.description = encodeIconDescription(patch.icon ?? current?.icon, patch.description ?? current?.description);

    const { error } = await supabase.from('tasks').update(dbPatch).eq('id', taskId);
    if (error) { console.error('updateTask error:', error); void loadTasks(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, loadTasks]);

  // ── updateTaskStatus ──────────────────────────────────────────────────────
  const updateTaskStatus = React.useCallback(async (taskId: string, status: TaskStatus) => {
    setTasks(cur => cur.map(t =>
      t.id === taskId ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : undefined } : t
    ));
    const completedAt = status === 'done' ? new Date().toISOString() : null;
    const { error } = await supabase.from('tasks')
      .update({ status, completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq('id', taskId);
    if (error) { console.error('updateTaskStatus error:', error); void loadTasks(); }
  }, [loadTasks]);

  // ── deleteTask ────────────────────────────────────────────────────────────
  const deleteTask = React.useCallback(async (taskId: string) => {
    setTasks(cur => cur.filter(t => t.id !== taskId));
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) { console.error('deleteTask error:', error); void loadTasks(); }
  }, [loadTasks]);

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
