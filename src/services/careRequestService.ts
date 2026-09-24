/**
 * SureStep — src/services/careRequestService.ts
 *
 * Client API service for the canonical Care Request domain.
 * Communicates exclusively with /api/v1/care-requests.
 *
 * Endpoints:
 *  - POST   /care-requests              (createCareRequest)
 *  - GET    /care-requests/incoming     (getIncomingCareRequests)
 *  - GET    /care-requests/outgoing     (getOutgoingCareRequests)
 *  - GET    /care-requests/:id          (getCareRequestById)
 *  - POST   /care-requests/:id/accept   (acceptCareRequest)
 *  - POST   /care-requests/:id/decline  (declineCareRequest)
 *  - POST   /care-requests/:id/withdraw (withdrawCareRequest)
 */

import apiClient from './apiClient';
import type {
  CareRequest,
  CreateCareRequestPayload,
  DeclineCareRequestPayload,
  WithdrawCareRequestPayload,
} from '../types/care.types';

export interface CareRequestError {
  code?: string;
  message: string;
  statusCode?: number;
}

export function parseCareRequestError(error: any): CareRequestError {
  const data = error?.response?.data;
  const status = error?.response?.status;
  const message = data?.message || data?.error || error?.message || 'An unexpected error occurred';
  const code = data?.code || (status === 409 ? 'CONFLICT' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'UNKNOWN_ERROR');

  return {
    code,
    message,
    statusCode: status,
  };
}

/**
 * 1. Submit a new Care Request (Patient or Family)
 */
export async function createCareRequest(payload: CreateCareRequestPayload): Promise<CareRequest> {
  try {
    const res = await apiClient.post<{ data: { request: CareRequest } }>('/care-requests', payload);
    return res.data.data.request;
  } catch (err) {
    throw parseCareRequestError(err);
  }
}

/**
 * 2. Get incoming Care Requests (Caregiver Triage)
 */
export async function getIncomingCareRequests(status: string = 'PENDING'): Promise<CareRequest[]> {
  try {
    const res = await apiClient.get<{ data: { requests: CareRequest[] } }>('/care-requests/incoming', {
      params: { status },
    });
    return res.data.data.requests || [];
  } catch (err) {
    throw parseCareRequestError(err);
  }
}

/**
 * 3. Get outgoing Care Requests (Patient or Family)
 */
export async function getOutgoingCareRequests(
  targetPatientId?: string,
  status?: string,
): Promise<CareRequest[]> {
  try {
    const params: Record<string, string> = {};
    if (targetPatientId) params.patientId = targetPatientId;
    if (status && status !== 'ALL') params.status = status;

    const res = await apiClient.get<{ data: { requests: CareRequest[] } }>('/care-requests/outgoing', {
      params,
    });
    return res.data.data.requests || [];
  } catch (err) {
    throw parseCareRequestError(err);
  }
}

/**
 * 4. Get Care Request detail by ID
 */
export async function getCareRequestById(requestId: string): Promise<CareRequest> {
  try {
    const res = await apiClient.get<{ data: { request: CareRequest } }>(`/care-requests/${requestId}`);
    return res.data.data.request;
  } catch (err) {
    throw parseCareRequestError(err);
  }
}

/**
 * 5. Accept Care Request (Caregiver)
 */
export async function acceptCareRequest(
  requestId: string,
): Promise<{ request: CareRequest; relationship: any }> {
  try {
    const res = await apiClient.post<{ data: { request: CareRequest; relationship: any } }>(
      `/care-requests/${requestId}/accept`,
    );
    return res.data.data;
  } catch (err) {
    throw parseCareRequestError(err);
  }
}

/**
 * 6. Decline Care Request (Caregiver)
 */
export async function declineCareRequest(
  requestId: string,
  payload: DeclineCareRequestPayload,
): Promise<{ request: CareRequest }> {
  try {
    const res = await apiClient.post<{ data: { request: CareRequest } }>(
      `/care-requests/${requestId}/decline`,
      payload,
    );
    return res.data.data;
  } catch (err) {
    throw parseCareRequestError(err);
  }
}

/**
 * 7. Withdraw Care Request (Patient or Family)
 */
export async function withdrawCareRequest(
  requestId: string,
  payload: WithdrawCareRequestPayload,
): Promise<{ request: CareRequest }> {
  try {
    const res = await apiClient.post<{ data: { request: CareRequest } }>(
      `/care-requests/${requestId}/withdraw`,
      payload,
    );
    return res.data.data;
  } catch (err) {
    throw parseCareRequestError(err);
  }
}
