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

  const [activeRole, setActiveRole] = React.useState(null); // 'patient' | 'caregiver' | null
  const [profile, setProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError, setProfileError] = React.useState(null);

  const loadProfileForRole = React.useCallback(async (roleSlug) => {
    if (!roleSlug) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${roleSlug}`;

    setProfileLoading(true);
    setProfileError(null);
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      setProfile(parsed);
    } catch (e) {
      setProfileError('Unable to load profile.');
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (auth.status !== 'authenticated') {
      setActiveRole(null);
      setProfile(null);
      setProfileLoading(false);
      setProfileError(null);
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

      setProfileError(null);
      setProfile(draft);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(draft));
      } catch (e) {
        setProfileError('Unable to save profile.');
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
      refreshProfile: () => loadProfileForRole(activeRole),
      saveProfile
    }),
    [activeRole, profile, profileLoading, profileError, loadProfileForRole, saveProfile]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = React.useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}

