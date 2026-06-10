/**
 * SureStep — src/services/carePlanService.ts
 *
 * Interfaces with backend Express API to fetch patients' generated Care Plans.
 */
import apiClient from './apiClient';

export interface CarePlanData {
  id: string;
  patient_id: string;
  assessment_id: string;
  care_goals: string;
  monitoring_requirements: string;
  recommended_routines: any[];
  recommended_geofencing: any;
  risk_profile: {
    fall_risk: 'Low' | 'Medium' | 'High';
    wandering_risk: 'Low' | 'Medium' | 'High';
    medication_adherence_risk: 'Low' | 'Medium' | 'High';
    emergency_risk: 'Low' | 'Medium' | 'High';
  };
  assessment_version?: number;
  assessment_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const getCarePlan = async (patientId: string): Promise<CarePlanData | null> => {
  try {
    const { data } = await apiClient.get(`/care-plans/patient/${patientId}`);
    return data.data?.carePlan || null;
  } catch (error) {
    console.warn('[carePlanService] getCarePlan failed:', error);
    return null;
  }
};
