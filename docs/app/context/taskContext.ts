import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'surestep_tasks';

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
  tasks: Task[];
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

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [routines, setRoutines] = React.useState<Routine[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Initialize with sample data on first load
  const initializeSampleData = React.useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // No existing data, create sample tasks
        const sampleTasks: Task[] = [
          {
            id: 'task_1',
            patientId: 'p1',
            routineId: 'routine_1',
            title: 'Morning Medication',
            time: '08:30 AM',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'task_2', 
            patientId: 'p1',
            routineId: 'routine_1',
            title: 'Healthy Breakfast',
            time: '09:15 AM',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'task_3',
            patientId: 'p1', 
            routineId: 'routine_1',
            title: 'Daily Walk',
            time: '11:00 AM',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        const sampleRoutine: Routine = {
          id: 'routine_1',
          patientId: 'p1',
          name: 'Morning Routine',
          isActive: true,
          scheduleLabel: 'Daily · 8:00 AM - 12:00 PM',
          tasks: sampleTasks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveTasks(sampleTasks, [sampleRoutine]);
      }
    } catch (error) {
      console.warn('Failed to initialize sample data:', error);
    }
  }, []);

  // Load tasks from storage
  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setTasks(data.tasks || []);
        setRoutines(data.routines || []);
      }
    } catch (error) {
      console.warn('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save tasks to storage
  const saveTasks = React.useCallback(async (tasksData: Task[], routinesData: Routine[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        tasks: tasksData,
        routines: routinesData
      }));
      setTasks(tasksData);
      setRoutines(routinesData);
    } catch (error) {
      console.warn('Failed to save tasks:', error);
    }
  }, []);

  // Initialize on mount
  React.useEffect(() => {
    void initializeSampleData();
    void loadTasks();
  }, [initializeSampleData, loadTasks]);

  // Create routine with tasks
  const createRoutine = React.useCallback(async (routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRoutine: Routine = {
      id: `routine_${Date.now()}`,
      patientId: routineData.patientId,
      name: routineData.name,
      isActive: routineData.isActive,
      scheduleLabel: routineData.scheduleLabel,
      tasks: routineData.tasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedRoutines = [...routines, newRoutine];
    const updatedTasks = [...tasks, ...newRoutine.tasks];
    await saveTasks(updatedTasks, updatedRoutines);
    
    return newRoutine;
  }, [routines, tasks, saveTasks]);

  // Update task status
  const updateTaskStatus = React.useCallback(async (taskId: string, status: TaskStatus) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status, 
            completedAt: status === 'done' ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          }
        : task
    );

    await saveTasks(updatedTasks, routines);
  }, [tasks, routines, saveTasks]);

  // Get tasks for patient
  const getTasksForPatient = React.useCallback((patientId: string) => {
    return tasks.filter(task => task.patientId === patientId);
  }, [tasks]);

  // Get routines for patient
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
