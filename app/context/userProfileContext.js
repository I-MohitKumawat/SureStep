/**
 * app/context/userProfileContext.js
 *
 * Supabase as source of truth — fast path via auth.user.fullName:
 *   - Name is already in auth state (passed from PhoneAuthScreen/ProfileSetup).
 *   - Only one extra Supabase call needed for extended profile (patients/caregivers).
 *   - Zero duplicate mock_users queries.
 */
import React from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../../packages/core/auth/AuthContext';

// ─── Context ──────────────────────────────────────────────────────────────────

const UserProfileContext = React.createContext(undefined);

export function UserProfileProvider({ children }) {
  const { auth } = useAuth();

  const [profile,        setProfile]        = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError,   setProfileError]   = React.useState(null);

  // ── Load extended profile from Supabase when auth changes ────────────────

  const loadProfile = React.useCallback(async (phone, role, nameFromAuth) => {
    if (!phone || !role || role === 'NEW_USER') {
      setProfile(null);
      return;
    }

    // Use name from auth state immediately — no extra mock_users call needed
    const baseName = nameFromAuth ?? '';

    setProfileLoading(true);
    setProfileError(null);

    try {
      if (role === 'PATIENT') {
        const { data: patient } = await supabase
          .from('patients')
          .select('name, dob, gender, city, language')
          .eq('id', phone)
          .maybeSingle();

        setProfile({
          fullName: patient?.name  ?? baseName,
          role:     'patient',
          dob:      patient?.dob      ?? '',
          gender:   patient?.gender   ?? '',
          city:     patient?.city     ?? '',
          language: patient?.language ?? 'English',
        });

      } else if (role === 'CAREGIVER') {
        const { data: cg } = await supabase
          .from('caregivers')
          .select('name, specialty, bio, availability, location')
          .eq('id', phone)
          .maybeSingle();

        setProfile({
          fullName:     cg?.name         ?? baseName,
          role:         'caregiver',
          specialty:    cg?.specialty    ?? 'General',
          bio:          cg?.bio          ?? '',
          availability: cg?.availability ?? 'Flexible',
          location:     cg?.location     ?? '',
        });
      }
    } catch (e) {
      console.error('[UserProfile] loadProfile error:', e);
      setProfileError('Failed to load profile.');
      // Still set a minimal profile from auth state so UI isn't blank
      setProfile({ fullName: baseName, role: role === 'PATIENT' ? 'patient' : 'caregiver' });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (auth.status === 'authenticated') {
      void loadProfile(auth.user.id, auth.user.role, auth.user.fullName);
    } else {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
    }
  }, [auth.status, auth.user?.id, auth.user?.role, auth.user?.fullName, loadProfile]);

  // ── Save profile to Supabase ──────────────────────────────────────────────

  const saveProfile = React.useCallback(async (draft) => {
    if (!draft?.role) return false;
    const phone = auth.user?.id;
    if (!phone) return false;

    try {
      if (draft.role === 'patient') {
        const [userRes, patientRes] = await Promise.all([
          supabase.from('mock_users').upsert({
            phone_number: phone, otp: '0000', role: 'patient', full_name: draft.fullName ?? '',
          }),
          supabase.from('patients').upsert({
            id:       phone,
            name:     draft.fullName ?? '',
            dob:      draft.dob      ?? '',
            gender:   draft.gender   ?? '',
            city:     draft.city     ?? '',
            language: draft.language ?? 'English',
          }),
        ]);
        if (userRes.error) throw userRes.error;
        if (patientRes.error) throw patientRes.error;

      } else if (draft.role === 'caregiver') {
        const [userRes, cgRes] = await Promise.all([
          supabase.from('mock_users').upsert({
            phone_number: phone, otp: '0000', role: 'caregiver', full_name: draft.fullName ?? '',
          }),
          supabase.from('caregivers').upsert({
            id:           phone,
            name:         draft.fullName     ?? '',
            specialty:    draft.specialty    ?? 'Family Caregiver',
            bio:          draft.bio          ?? '',
            availability: draft.availability ?? 'Flexible',
            location:     draft.location     ?? draft.city ?? '',
          }),
        ]);
        if (userRes.error) throw userRes.error;
        if (cgRes.error)   throw cgRes.error;
      }

      // Update in-memory state immediately
      setProfile(draft);
      return true;
    } catch (e) {
      console.error('[UserProfile] saveProfile error:', e);
      return false;
    }
  }, [auth.user?.id]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = React.useMemo(
    () => ({
      profile,
      profileLoading,
      profileError,
      profileExists:        Boolean(profile),
      hasProfileForRouting: Boolean(profile),
      activeRole:           profile?.role ?? null,
      refreshProfile: () =>
        loadProfile(auth.user?.id, auth.user?.role, auth.user?.fullName),
      saveProfile,
    }),
    [profile, profileLoading, profileError, loadProfile, saveProfile,
     auth.user?.id, auth.user?.role, auth.user?.fullName],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUserProfile() {
  const ctx = React.useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}
