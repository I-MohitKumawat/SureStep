/** SureStep — src/hooks/useTasks.ts — Re-export from TaskContext. */
export { useTasks } from '../context/TaskContext';
export type {
  Task, TaskDraft, TaskStatus,
  TaskCategory, TaskPriority,
} from '../context/TaskContext';
export type {
  RoutineTemplate, RoutineExecutionTime, RoutineAttachment,
  RoutineRecurrencePattern, DailyAdherenceSnapshot,
} from '../types/api.types';
