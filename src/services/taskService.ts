/**
 * SureStep — src/services/taskService.ts
 * Task (routine) CRUD and completions. Maps to backend /tasks routes.
 */
import apiClient from './apiClient';

export const getTodaysTasks = (patientId: string) =>
  apiClient.get(`/tasks/patient/${patientId}/today`);

export const getTasksByDate = (patientId: string, date: string) =>
  apiClient.get(`/tasks/patient/${patientId}`, { params: { date } });

export const createTask = (patientId: string, body: unknown) =>
  apiClient.post(`/tasks/patient/${patientId}`, body);

export const updateTask = (taskId: string, body: unknown) =>
  apiClient.patch(`/tasks/${taskId}`, body);

export const deleteTask = (taskId: string) =>
  apiClient.delete(`/tasks/${taskId}`);

export const completeTask = (taskId: string) =>
  apiClient.post(`/tasks/${taskId}/complete`);

export const markUnsure = (taskId: string) =>
  apiClient.post(`/tasks/${taskId}/unsure`);

export const uploadVoiceNote = (taskId: string, formData: FormData) =>
  apiClient.post(`/media/upload/voice-note`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { task_id: taskId },
  });

