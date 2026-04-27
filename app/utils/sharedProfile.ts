/**
 * Shared patient profile store.
 * Stores the patient's profile in AsyncStorage under a well-known key
 * so both the Patient screen and Caregiver screen can read it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PATIENT_PROFILE_KEY = 'surestep_patient_shared_profile';
export const CAREGIVER_PROFILE_KEY = 'surestep_caregiver_shared_profile';

export type SharedProfile = {
  fullName: string;
  role: 'patient' | 'caregiver';
  batteryLevel?: number;   // 0-100, patient wearable battery %
};

/** Write a profile to AsyncStorage. */
export async function writeSharedProfile(profile: SharedProfile): Promise<void> {
  const key = profile.role === 'patient' ? PATIENT_PROFILE_KEY : CAREGIVER_PROFILE_KEY;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(profile));
  } catch (e) {
    console.warn('writeSharedProfile failed:', e);
  }
}

/** Read the patient's shared profile. Returns null if not found. */
export async function readPatientProfile(): Promise<SharedProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PATIENT_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as SharedProfile) : null;
  } catch {
    return null;
  }
}
