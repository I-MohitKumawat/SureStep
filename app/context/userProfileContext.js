/**
 * app/context/userProfileContext.js
 *
 * Supabase as source of truth — fast path via auth.user.fullName:
 *   - Name is already in auth state (passed from PhoneAuthScreen/ProfileSetup).
 *   - Only one extra Supabase call needed for extended profile (patients/caregivers).
 *   - Zero duplicate mock_users queries.
 */
import React from 'react';
// import { supabase } from '../utils/supabaseClient'; // REMOVED: Supabase migration to Express/PostgreSQL
import { useAuth } from '../../packages/core/auth/AuthContext';

// ─── Context ──────────────────────────────────────────────────────────────────

const UserProfileContext = React.createContext(undefined);

export function UserProfileProvider({ children }) {
  const { auth } = useAuth();

  const [profile,        setProfile]        = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError,   setProfileError]   = React.useState(null);

  // ── Load extended profile from Supabase when auth changes ────────────────
  // REMOVED: Supabase migration to Express/PostgreSQL

  const loadProfile = React.useCallback(async (phone, role, nameFromAuth) => {
    if (!phone || !role || role === 'NEW_USER') {
      setProfile(null);
      return;
    }

    const baseName = nameFromAuth ?? '';

    setProfileLoading(true);
    setProfileError(null);

    try {
      console.warn('[UserProfile] loadProfile: Supabase removed, using auth state only');
      setProfile({
        fullName: baseName,
        role: role === 'PATIENT' ? 'patient' : 'caregiver',
      });
    } catch (e) {
      console.error('[UserProfile] loadProfile error:', e);
      setProfileError('Failed to load profile.');
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
  // REMOVED: Supabase migration to Express/PostgreSQL

  const saveProfile = React.useCallback(async (draft) => {
    console.warn('[UserProfile] saveProfile: Supabase removed, no-op');
    return false;
  }, []);

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
