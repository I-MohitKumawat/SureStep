/**
 * SureStep — src/services/storyService.ts
 * Family stories feed. Maps to backend /stories routes.
 */
import apiClient from './apiClient';

export const getStoryFeed = (patientId: string) =>
  apiClient.get(`/stories/patient/${patientId}/feed`);

export const postStory = (body: unknown) =>
  apiClient.post('/stories', body);

export const reactToStory = (storyId: string, reaction: string) =>
  apiClient.post(`/stories/${storyId}/react`, { reaction });

