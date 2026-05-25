/**
 * SureStep — src/services/messageService.ts
 * Message threads between caregivers and family. Maps to /messages routes.
 */
import apiClient from './apiClient';

export const getThreads = (patientId: string) =>
  apiClient.get(`/messages/threads/patient/${patientId}`);

export const createThread = (body: unknown) =>
  apiClient.post('/messages/threads', body);

export const getMessages = (threadId: string) =>
  apiClient.get(`/messages/threads/${threadId}`);

export const sendMessage = (threadId: string, body: unknown) =>
  apiClient.post(`/messages/threads/${threadId}`, body);

export const markRead = (threadId: string) =>
  apiClient.patch(`/messages/threads/${threadId}/read`);

