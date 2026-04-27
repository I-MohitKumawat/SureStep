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

type TaskContextValue = {
  tasks: Task[];
  routines: Routine[];
  loading: boolean;
  loadTasks: () => Promise<void>;
  createRoutine: (routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Routine>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  getTasksForPatient: (patientId: string) => Task[];
  getRoutinesForPatient: (patientId: string) => Routine[];
};

const TaskContext = React.createContext<TaskContextValue | undefined>(undefined);

// Helper to map DB snake_case to frontend camelCase
function mapDbTaskToTask(dbTask: any): Task {
  return {
    id: dbTask.id,
    patientId: dbTask.patient_id,
    routineId: dbTask.routine_id,
    title: dbTask.title,
    time: dbTask.time,
    description: dbTask.description,
    status: dbTask.status as TaskStatus,
    completedAt: dbTask.completed_at,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}

function mapDbRoutineToRoutine(dbRoutine: any): Routine {
  return {
    id: dbRoutine.id,
    patientId: dbRoutine.patient_id,
    name: dbRoutine.name,
    isActive: dbRoutine.is_active,
    scheduleLabel: dbRoutine.schedule_label,
    createdAt: dbRoutine.created_at,
    updatedAt: dbRoutine.updated_at,
  };
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [routines, setRoutines] = React.useState<Routine[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: tasksData, error: tasksError }, { data: routinesData, error: routinesError }] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
        supabase.from('routines').select('*').order('created_at', { ascending: true }),
      ]);

      if (tasksError) console.error('Error fetching tasks:', tasksError);
      if (routinesError) console.error('Error fetching routines:', routinesError);

      if (tasksData) setTasks(tasksData.map(mapDbTaskToTask));
      if (routinesData) setRoutines(routinesData.map(mapDbRoutineToRoutine));
    } catch (error) {
      console.warn('Failed to load tasks from Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTasks();

    // Set up Realtime subscriptions for tasks
    const taskSubscription = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks((currentTasks) => {
            const newDbTask = payload.new as any;
            if (payload.eventType === 'INSERT') {
              return [...currentTasks, mapDbTaskToTask(newDbTask)];
            }
            if (payload.eventType === 'UPDATE') {
              return currentTasks.map(t => t.id === newDbTask.id ? mapDbTaskToTask(newDbTask) : t);
            }
            if (payload.eventType === 'DELETE') {
              return currentTasks.filter(t => t.id !== (payload.old as any).id);
            }
            return currentTasks;
          });
        }
      )
      .subscribe();

    // Set up Realtime subscriptions for routines
    const routineSubscription = supabase
      .channel('public:routines')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routines' },
        (payload) => {
          setRoutines((currentRoutines) => {
            const newDbRoutine = payload.new as any;
            if (payload.eventType === 'INSERT') {
              return [...currentRoutines, mapDbRoutineToRoutine(newDbRoutine)];
            }
            if (payload.eventType === 'UPDATE') {
              return currentRoutines.map(r => r.id === newDbRoutine.id ? mapDbRoutineToRoutine(newDbRoutine) : r);
            }
            if (payload.eventType === 'DELETE') {
              return currentRoutines.filter(r => r.id !== (payload.old as any).id);
            }
            return currentRoutines;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
      supabase.removeChannel(routineSubscription);
    };
  }, [loadTasks]);

  const createRoutine = React.useCallback(async (routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const routineId = `routine_${Date.now()}`;
    const dbRoutine = {
      id: routineId,
      patient_id: routineData.patientId,
      name: routineData.name,
      is_active: routineData.isActive,
      schedule_label: routineData.scheduleLabel,
    };

    const { error: routineError } = await supabase.from('routines').insert(dbRoutine);
    if (routineError) {
      console.error('Error creating routine:', routineError);
      throw routineError;
    }

    if (routineData.tasks && routineData.tasks.length > 0) {
      const dbTasks = routineData.tasks.map(task => ({
        id: task.id || `task_${Date.now()}_${Math.random()}`,
        patient_id: routineData.patientId,
        routine_id: routineId,
        title: task.title,
        time: task.time,
        description: task.description || '',
        status: task.status || 'pending',
      }));

      const { error: tasksError } = await supabase.from('tasks').insert(dbTasks);
      if (tasksError) {
        console.error('Error creating tasks:', tasksError);
      }
    }

    // Return an optimistically generated routine (it will be corrected by real-time sync if needed)
    return {
      ...routineData,
      id: routineId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Routine;
  }, []);

  const updateTaskStatus = React.useCallback(async (taskId: string, status: TaskStatus) => {
    // Optimistic UI update
    setTasks(current => current.map(t => 
      t.id === taskId 
        ? { ...t, status, completedAt: status === 'done' ? new Date().toISOString() : undefined } 
        : t
    ));

    const completedAt = status === 'done' ? new Date().toISOString() : null;
    const { error } = await supabase
      .from('tasks')
      .update({ status, completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      // Might want to silently revert or show error if this fails.
      // Easiest is to just call loadTasks() on error to resync.
      loadTasks();
    }
  }, [loadTasks]);

  const getTasksForPatient = React.useCallback((patientId: string) => {
    return tasks.filter(task => task.patientId === patientId);
  }, [tasks]);

  const getRoutinesForPatient = React.useCallback((patientId: string) => {
    return routines.filter(routine => routine.patientId === patientId);
  }, [routines]);

  const value = React.useMemo(() => ({
    tasks,
    routines,
    loading,
    loadTasks,
    createRoutine,
    updateTaskStatus,
    getTasksForPatient,
    getRoutinesForPatient
  }), [tasks, routines, loading, loadTasks, createRoutine, updateTaskStatus, getTasksForPatient, getRoutinesForPatient]);

  return React.createElement(TaskContext.Provider, { value }, children);
}

export function useTasks(): TaskContextValue {
  const ctx = React.useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
