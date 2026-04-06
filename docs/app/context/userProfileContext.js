import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../../../packages/core/auth/AuthContext';

const STORAGE_KEY_PREFIX = 'surestep_user_profile_';

function roleToSlug(userRole) {
  switch (userRole) {
    case 'PATIENT':
      return 'patient';
    case 'CAREGIVER':
      return 'caregiver';
    default:
      return null;
  }
}

const UserProfileContext = React.createContext(undefined);

export function UserProfileProvider({ children }) {
  const { auth } = useAuth();
  const loadVersionRef = React.useRef(0);
  // Session fallback cache by role for cases where AsyncStorage is unavailable in dev.
  const sessionProfileCacheRef = React.useRef({});

  const [activeRole, setActiveRole] = React.useState(null); // 'patient' | 'caregiver' | null
  const [profile, setProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError, setProfileError] = React.useState(null);
  const [hasProfileForRouting, setHasProfileForRouting] = React.useState(false);

  const loadProfileForRole = React.useCallback(async (roleSlug) => {
    if (!roleSlug) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${roleSlug}`;
    const requestVersion = ++loadVersionRef.current;

    setProfileLoading(true);
    setProfileError(null);
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      let parsedFromStorage = null;
      if (raw) {
        try {
          parsedFromStorage = JSON.parse(raw);
        } catch (parseError) {
          console.warn('Failed to parse stored profile data:', parseError);
          // Clear corrupted data
          try {
            await AsyncStorage.removeItem(storageKey);
          } catch (removeError) {
            console.warn('Failed to remove corrupted profile data:', removeError);
          }
        }
      }
      const parsed = parsedFromStorage ?? sessionProfileCacheRef.current[roleSlug] ?? null;
      // Ignore stale load responses (for example, a pre-save load finishing after save).
      if (requestVersion !== loadVersionRef.current) return;
      setProfile(parsed);
      setHasProfileForRouting(Boolean(parsed));
    } catch (e) {
      if (requestVersion !== loadVersionRef.current) return;
      setProfileError('Unable to load profile.');
      setProfile(null);
      setHasProfileForRouting(false);
    } finally {
      if (requestVersion !== loadVersionRef.current) return;
      setProfileLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (auth.status !== 'authenticated') {
      setActiveRole(null);
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      setHasProfileForRouting(false);
      return;
    }

    const nextRole = roleToSlug(auth.user?.role);
    setActiveRole(nextRole);
    setProfile(null);
    setProfileError(null);

    if (nextRole) {
      void loadProfileForRole(nextRole);
    } else {
      setProfileLoading(false);
    }
  }, [auth.status, auth.user?.role, loadProfileForRole]);

  const saveProfile = React.useCallback(
    async (draft) => {
      if (!draft?.role) return;
      const key = `${STORAGE_KEY_PREFIX}${draft.role}`;
      // Invalidate any in-flight load so it can't overwrite the newly saved profile.
      loadVersionRef.current += 1;

      setProfileError(null);
      setProfile(draft);
      setProfileLoading(false);
      setHasProfileForRouting(true);
      sessionProfileCacheRef.current[draft.role] = draft;
      try {
        const serializedData = JSON.stringify(draft);
        await AsyncStorage.setItem(key, serializedData);
        return true;
      } catch (e) {
        // Fail-soft: keep in-memory profile so UX can proceed even if local persistence fails.
        // This is common in dev builds when AsyncStorage native module/version is mismatched.
        // eslint-disable-next-line no-console
        console.warn('AsyncStorage setItem failed for profile:', e);
        setProfileError('Saved for this session only (local storage unavailable).');
        return true;
      }
    },
    []
  );

  const value = React.useMemo(
    () => ({
      activeRole,
      profile,
      profileLoading,
      profileError,
      profileExists: Boolean(profile),
      hasProfileForRouting,
      refreshProfile: () => loadProfileForRole(activeRole),
      saveProfile
    }),
    [
      activeRole,
      profile,
      profileLoading,
      profileError,
      hasProfileForRouting,
      loadProfileForRole,
      saveProfile
    ]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = React.useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}

