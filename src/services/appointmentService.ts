/**
 * SureStep — src/services/appointmentService.ts
 * Appointment CRUD. Maps to backend /appointments routes.
 */
import apiClient from './apiClient';

export const getAppointments = (patientId: string) =>
  apiClient.get(`/appointments/patient/${patientId}`);

export const createAppointment = (patientId: string, body: unknown) =>
  apiClient.post(`/appointments/patient/${patientId}`, body);

export const updateAppointment = (appointmentId: string, body: unknown) =>
  apiClient.patch(`/appointments/${appointmentId}`, body);

export const completeAppointment = (appointmentId: string) =>
  apiClient.patch(`/appointments/${appointmentId}/complete`);

export const deleteAppointment = (appointmentId: string) =>
  apiClient.delete(`/appointments/${appointmentId}`);

