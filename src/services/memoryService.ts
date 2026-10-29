/**
 * SureStep — src/services/memoryService.ts
 *
 * Client service for interacting with the backend memories subsystem:
 *   - /patients/:patientId/memories
 *
 * Returns real memory records (photos, videos, text memories)
 * associated with or created for the patient.
 */

import apiClient from './apiClient';

export interface MemoryItem {
  id: string;
  patient_id: string;
  creator_id: string;
  title: string;
  media_type: 'PHOTO' | 'VIDEO' | 'TEXT';
  media_key?: string | null;
  caption?: string | null;
  associated_person_id?: string | null;
  created_at: string;
  updated_at?: string;
  creator_name?: string;
  creator_photo_url?: string | null;
  associated_person_name?: string | null;
  associated_person_photo_url?: string | null;
}

export interface FetchMemoriesResponse {
  memories: MemoryItem[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface FetchMemoriesOptions {
  limit?: number;
  cursor?: string;
  personId?: string;
}

/**
 * Fetch memories for a patient, optionally filtered by person.
 */
export async function fetchPatientMemories(
  patientId: string,
  options?: FetchMemoriesOptions
): Promise<FetchMemoriesResponse> {
  try {
    const params: Record<string, any> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    if (options?.personId) params.personId = options.personId;

    const res = await apiClient.get(`/patients/${patientId}/memories`, { params });
    const data = res.data?.data || res.data;
    return {
      memories: data.memories || [],
      has_more: Boolean(data.has_more),
      next_cursor: data.next_cursor || null,
    };
  } catch (err) {
    console.warn('[memoryService] fetchPatientMemories failed:', err);
    return {
      memories: [],
      has_more: false,
      next_cursor: null,
    };
  }
}

/**
 * Fetch a single memory by ID.
 */
export async function fetchMemoryById(
  patientId: string,
  memoryId: string
): Promise<MemoryItem | null> {
  try {
    const res = await apiClient.get(`/patients/${patientId}/memories/${memoryId}`);
    return res.data?.data?.memory || res.data?.memory || null;
  } catch (err) {
    console.warn('[memoryService] fetchMemoryById failed:', err);
    return null;
  }
}

/**
 * Create a new memory for a patient.
 */
export async function createPatientMemory(
  patientId: string,
  dto: {
    title: string;
    media_type: 'PHOTO' | 'VIDEO' | 'TEXT';
    caption?: string;
    media_key?: string;
    associated_person_id?: string;
  }
): Promise<MemoryItem> {
  const res = await apiClient.post(`/patients/${patientId}/memories`, dto);
  return res.data?.data?.memory || res.data?.memory;
}

/**
 * Delete a memory for a patient.
 */
export async function deletePatientMemory(
  patientId: string,
  memoryId: string
): Promise<void> {
  await apiClient.delete(`/patients/${patientId}/memories/${memoryId}`);
}
