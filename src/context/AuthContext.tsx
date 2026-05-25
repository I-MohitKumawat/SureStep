/**
 * SureStep — src/context/AuthContext.tsx
 * Global auth provider. Mounted at AppShell level (outside all role navigators).
 * Consolidated from:
 *   - packages/core/auth/AuthContext.tsx  (in-memory auth state)
 *   - app/context/userProfileContext.js   (profile loading + hasProfileForRouting)
 *
 * Exposes: status, user, login(), logout()
 * status values: 'loading' | 'unauthenticated' | 'no_role' | 'no_profile' | 'authenticated'
 * These map directly to RoleNavigator routing decisions.
 *
 * Token persistence: in-memory now. Swap tokenStore in apiClient.ts for SecureStore
 * when expo-secure-store is installed.
 */
import React, {
  createContext, useCallback, useContext, useEffect,
  useMemo, useState, type ReactNode,
} from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import type { UserRoleType } from '../types/enums';
import { setClerkTokenResolver } from '../services/apiClient';
import { getMe } from '../services/userService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthStatus =
  | 'loading'           // Checking stored tokens on app start
  | 'unauthenticated'   // No valid session
  | 'no_role'           // Authenticated but no role selected yet (new user)
  | 'no_profile'        // Has role but profile setup not completed
  | 'authenticated';    // Fully authenticated and onboarded

export type AuthUser = {
  id:         string;
  phone:      string;
  name:       string;
  role:       UserRoleType | 'NEW_USER';
  photo_url?: string;
};

type AuthContextValue = {
  status:   AuthStatus;
  user:     AuthUser | null;
  login:    (user: AuthUser, accessToken?: string, refreshToken?: string) => void;
  logout:   () => void;
  setStatus:(s: AuthStatus) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user,   setUser]   = useState<AuthUser | null>(null);

  // Expose the Clerk token getter to our Axios client
  useEffect(() => {
    setClerkTokenResolver(() => getToken());
  }, [getToken]);

  // Synchronize auth status with Clerk session state
  useEffect(() => {
    if (!isLoaded) {
      setStatus('loading');
      return;
    }

    if (!isSignedIn) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await getMe();
        const dbUser = response.data?.data?.user || response.data?.user || response.data;
        
        if (!dbUser || !dbUser.role || dbUser.role === 'NEW_USER') {
          setStatus('no_role');
        } else if (!dbUser.name) {
          setStatus('no_profile');
        } else {
          setUser({
            id: dbUser.id || dbUser.phone || '',
            phone: dbUser.phone || '',
            name: dbUser.name || '',
            role: dbUser.role as UserRoleType,
            photo_url: dbUser.photo_url || dbUser.profilePhotoUrl || undefined,
          });
          setStatus('authenticated');
        }
      } catch (err: any) {
        console.error('[AuthContext] Error loading user profile:', err);
        if (err.response?.status === 404) {
          // Authenticated in Clerk, but no record in DB yet
          setStatus('no_role');
        } else {
          // Other API errors (e.g. network timeout)
          setStatus('unauthenticated');
        }
      }
    };

    void loadProfile();
  }, [isLoaded, isSignedIn]);

  const login = useCallback(
    (authUser: AuthUser) => {
      setUser(authUser);
      setStatus('authenticated');
    },
    [],
  );

  const logout = useCallback(() => {
    void signOut();
    setUser(null);
    setStatus('unauthenticated');
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, setStatus }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook — the ONLY export components use ────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
