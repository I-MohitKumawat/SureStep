/**
 * SureStep — src/services/assessmentService.ts
 *
 * Interfaces with backend Express API to fetch and submit patient cognitive & risk assessments.
 */
import apiClient from './apiClient';

export interface AssessmentData {
  id?: string;
  version?: number;
  status: 'DRAFT' | 'COMPLETED';
  patient_basics: {
    preferred_name: string;
    address: string;
    living_arrangement: string;
    primary_language: string;
  };
  emergency_contacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    priority: number;
  }>;
  cognitive: {
    memory_concerns: string;
    orientation_concerns: string;
    wandering_risk: string;
    confusion_frequency: string;
  };
  risk: {
    fall_risk: 'Low' | 'Medium' | 'High';
    wandering_risk: 'Low' | 'Medium' | 'High';
    medication_adherence_risk: 'Low' | 'Medium' | 'High';
    emergency_risk: 'Low' | 'Medium' | 'High';
  };
  mobility: string;
  support_needs: {
    medication_reminders: boolean;
    meal_reminders: boolean;
    hydration_reminders: boolean;
    exercise_reminders: boolean;
    appointment_reminders: boolean;
    safety_monitoring: boolean;
  };
  tech_comfort: string;
  notes: {
    observations: string;
    meeting_summary: string;
    recommendations: string;
  };
}

export const getLatestAssessment = async (patientId: string): Promise<AssessmentData | null> => {
  try {
    const { data } = await apiClient.get(`/assessments/patient/${patientId}`);
    return data.data?.assessment || null;
  } catch (error) {
    console.warn('[assessmentService] getLatestAssessment failed:', error);
    return null;
  }
};

export const saveAssessment = async (patientId: string, payload: AssessmentData): Promise<any> => {
  const { data } = await apiClient.post(`/assessments/patient/${patientId}`, payload);
  return data.data;
};

export const getAssessmentHistory = async (patientId: string): Promise<any[]> => {
  try {
    const { data } = await apiClient.get(`/assessments/patient/${patientId}/history`);
    return data.data?.history || [];
  } catch (error) {
    console.warn('[assessmentService] getAssessmentHistory failed:', error);
    return [];
  }
};

export const getAssessmentById = async (id: string): Promise<AssessmentData | null> => {
  try {
    const { data } = await apiClient.get(`/assessments/${id}`);
    return data.data?.assessment || null;
  } catch (error) {
    console.warn('[assessmentService] getAssessmentById failed:', error);
    return null;
  }
};
