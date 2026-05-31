/**
 * SureStep — src/utils/offlineQueue.ts
 * Persistent offline queue for task completions, game sessions, and location pings.
 * TDD Section 8.4.
 *
 * Backed by in-memory store (swap for SecureStore when expo-secure-store is installed).
 * On reconnect: flush queue in order, retry failed items once, discard stale items > 24h.
 */
import type { AxiosResponse } from 'axios';
import apiClient from '../services/apiClient';

export type QueuedRequest = {
  id:        string;
  endpoint:  string;
  method:    'POST' | 'PATCH';
  body:      unknown;
  queuedAt:  string;   // ISO timestamp
};

const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory queue — survives within a session, cleared on restart.
// TODO: Replace with SecureStore persistence when ready.
let queue: QueuedRequest[] = [];

/** Add a request to the offline queue. */
export const enqueue = (req: Omit<QueuedRequest, 'id' | 'queuedAt'>) => {
  queue.push({
    ...req,
    id:       `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    queuedAt: new Date().toISOString(),
  });
};

/** Returns the current queue size. */
export const queueSize = () => queue.length;

/**
 * Flush the queue in order.
 * Failed items are retried once. Items older than 24h are discarded.
 */
export const flush = async (): Promise<void> => {
  const now = Date.now();
  const fresh = queue.filter(
    (r) => now - new Date(r.queuedAt).getTime() < STALE_MS,
  );
  const stale = queue.length - fresh.length;
  if (stale > 0) console.info(`[offlineQueue] Discarded ${stale} stale items`);

  queue = [];
  const failed: QueuedRequest[] = [];

  for (const item of fresh) {
    try {
      let res: AxiosResponse;
      if (item.method === 'POST') {
        res = await apiClient.post(item.endpoint, item.body);
      } else {
        res = await apiClient.patch(item.endpoint, item.body);
      }
      console.info(`[offlineQueue] Flushed ${item.method} ${item.endpoint} → ${res.status}`);
    } catch (err) {
      console.warn(`[offlineQueue] Failed ${item.method} ${item.endpoint} — queuing for retry`);
      failed.push(item);
    }
  }

  // Retry failed items once
  for (const item of failed) {
    try {
      if (item.method === 'POST') await apiClient.post(item.endpoint, item.body);
      else await apiClient.patch(item.endpoint, item.body);
    } catch {
      console.warn(`[offlineQueue] Retry failed — discarding ${item.id}`);
    }
  }
};

export const hasPendingTaskUpdate = (taskId: string): boolean => {
  return queue.some(r => r.endpoint.includes(`/tasks/${taskId}`));
};

export const clearQueue = () => { queue = []; };
