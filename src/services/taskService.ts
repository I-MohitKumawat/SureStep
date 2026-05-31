/**
 * SureStep — src/services/taskService.ts
 * Task (routine) CRUD, completions, and routine template management.
 * Maps to backend /tasks and /routines routes.
 */
import apiClient from './apiClient';

// ─── Task Instance Endpoints ──────────────────────────────────────────────────

/** Fetch today's task execution instances for a patient. */
export const getTodaysTasks = (patientId: string) =>
  apiClient.get(`/tasks/patient/${patientId}/today`);

/** Fetch task execution instances for a patient on a specific date. */
export const getTasksByDate = (patientId: string, date: string) =>
  apiClient.get(`/tasks/patient/${patientId}`, { params: { date } });

/** Create a one-off task instance directly (no template). */
export const createTask = (patientId: string, body: unknown) =>
  apiClient.post(`/tasks/patient/${patientId}`, body);

/** Patch editable fields of a task instance. */
export const updateTask = (taskId: string, body: unknown) =>
  apiClient.patch(`/tasks/${taskId}`, body);

/** Delete a task instance. */
export const deleteTask = (taskId: string) =>
  apiClient.delete(`/tasks/${taskId}`);

/**
 * Idempotent task status update.
 * Passes a client_action_id so the backend can deduplicate retries
 * from the offline queue (ON CONFLICT (client_action_id) DO NOTHING).
 */
export const updateTaskStatusIdempotent = (
  taskId: string,
  status: string,
  clientActionId: string,
  completedBy?: string,
) =>
  apiClient.post(`/tasks/${taskId}/status`, {
    status,
    client_action_id: clientActionId,
    ...(completedBy ? { completed_by: completedBy } : {}),
  });

/** Legacy convenience wrappers — kept for backward compat during migration. */
export const completeTask = (taskId: string) =>
  apiClient.post(`/tasks/${taskId}/complete`);

export const markUnsure = (taskId: string) =>
  apiClient.post(`/tasks/${taskId}/unsure`);

/** Upload a voice note and associate it with a task. */
export const uploadVoiceNote = (taskId: string, formData: FormData) =>
  apiClient.post(`/media/upload/voice-note`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { task_id: taskId },
  });

// ─── Adherence Analytics ──────────────────────────────────────────────────────

/**
 * Fetch the precomputed daily adherence snapshot for a patient.
 * Backend computes this nightly via a background job.
 * Falls back to live computation if snapshot is unavailable.
 */
export const getAdherenceSnapshot = (patientId: string, date: string) =>
  apiClient.get(`/tasks/patient/${patientId}/adherence`, { params: { date } });

// ─── Routine Template Endpoints ───────────────────────────────────────────────

/**
 * Fetch all routine templates (care plan definitions) for a patient.
 * Response includes eager-loaded execution_times[] and attachments[].
 */
export const getRoutineTemplates = (patientId: string) =>
  apiClient.get(`/routines/patient/${patientId}`);

/**
 * Create a new routine template with nested execution times.
 * Body shape mirrors RoutineTemplate + execution_times[].
 */
export const createRoutineTemplate = (patientId: string, body: unknown) =>
  apiClient.post(`/routines/patient/${patientId}`, body);

/** Update a routine template's definition. */
export const updateRoutineTemplate = (templateId: string, body: unknown) =>
  apiClient.patch(`/routines/${templateId}`, body);

/** Soft-delete (deactivate) a routine template. */
export const deactivateRoutineTemplate = (templateId: string) =>
  apiClient.delete(`/routines/${templateId}`);

/** Upload a file attachment (image, PDF, video, audio) for a routine template. */
export const uploadRoutineAttachment = (templateId: string, formData: FormData) =>
  apiClient.post(`/routines/${templateId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/** Remove an attachment from a routine template. */
export const deleteRoutineAttachment = (templateId: string, attachmentId: string) =>
  apiClient.delete(`/routines/${templateId}/attachments/${attachmentId}`);
