/**
 * app/utils/devAuth.ts
 *
 * Local AsyncStorage cache for dev-mode phone → role registrations.
 * After a user registers via ProfileSetup, their role is stored here.
 * PhoneAuthScreen reads this cache first so 0000 works offline on
 * subsequent logins — no Supabase network call needed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV_ROLES_KEY = 'surestep_dev_registered_roles';

export async function getDevRole(phone: string): Promise<'CAREGIVER' | 'PATIENT' | null> {
  try {
    const raw = await AsyncStorage.getItem(DEV_ROLES_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    const r = map[phone];
    return r === 'CAREGIVER' || r === 'PATIENT' ? r : null;
  } catch {
    return null;
  }
}

export async function saveDevRole(phone: string, role: 'CAREGIVER' | 'PATIENT'): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DEV_ROLES_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[phone] = role;
    await AsyncStorage.setItem(DEV_ROLES_KEY, JSON.stringify(map));
  } catch {
    // best-effort — non-critical
  }
}

export async function clearDevRoles(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEV_ROLES_KEY);
  } catch {}
}
