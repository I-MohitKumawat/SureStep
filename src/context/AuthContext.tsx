/**
 * SureStep — src/context/AuthContext.tsx
 * Global auth provider. Mounted at AppShell level (outside all role navigators).
 *
 * Uses Firebase Auth's onAuthStateChanged as the single source of truth for
 * whether a user is signed in. When Firebase reports a signed-in user, we:
 *   1. Register their getIdToken() as the Axios token resolver
 *   2. Call GET /users/me on the backend to load their DB profile + role
 *   3. Transition to the correct auth status for RoleNavigator routing
 *
 * Status values: 'loading' | 'unauthenticated' | 'no_role' | 'no_profile' | 'authenticated'
 */
import React, {
  createContext, useCallback, useContext, useEffect,
  useMemo, useState, type ReactNode,
} from 'react';
import { getAuth, onAuthStateChanged, signOut, getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { UserRoleType } from '../types/enums';
import { setFirebaseTokenResolver, clearFirebaseTokenResolver } from '../services/apiClient';
import { getMe } from '../services/userService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthStatus =
  | 'loading'           // Checking stored tokens on app start
  | 'unauthenticated'   // No valid Firebase session
  | 'no_role'           // Firebase session exists, but no DB record yet (new user)
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
  status:       AuthStatus;
  user:         AuthUser | null;
  firebaseUser: FirebaseAuthTypes.User | null;
  login:        (user: AuthUser) => void;
  logout:       () => void;
  setStatus:    (s: AuthStatus) => void;
  loginDevMode: (role: UserRoleType) => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status,       setStatus]       = useState<AuthStatus>('loading');
  const [user,         setUser]         = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    // onAuthStateChanged fires once immediately with the persisted session (or null)
    // and then whenever sign-in / sign-out happens.
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, async (fbUser) => {
      if (!fbUser) {
        // Signed out — clear everything
        clearFirebaseTokenResolver();
        setFirebaseUser(null);
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      // Signed in — wire up the Axios token resolver so every request carries
      // a fresh Firebase ID token automatically.
      setFirebaseUser(fbUser);
      setFirebaseTokenResolver(() => getIdToken(fbUser));

      // Now load the user's DB profile from the backend.
      try {
        const response = await getMe();
        const dbUser = response.data?.data?.user || response.data?.user || response.data;

        if (!dbUser || !dbUser.role || dbUser.role === 'NEW_USER') {
          setStatus('no_role');
        } else if (!dbUser.name) {
          setUser({
            id:        dbUser.id || '',
            phone:     dbUser.phone || '',
            name:      '',
            role:      dbUser.role as UserRoleType,
            photo_url: dbUser.photo_url || undefined,
          });
          setStatus('no_profile');
        } else {
          setUser({
            id:        dbUser.id || '',
            phone:     dbUser.phone || '',
            name:      dbUser.name || '',
            role:      dbUser.role as UserRoleType,
            photo_url: dbUser.photo_url || undefined,
          });
          setStatus('authenticated');
        }
      } catch (err: any) {
        // If getMe fails for ANY reason (404 = new user, network error, etc.),
        // we NEVER kick a Firebase-authenticated user back to unauthenticated.
        // 404 = user not in DB yet → send to onboarding
        // anything else = backend unreachable → still send to onboarding so they can proceed
        if (err.response?.status === 404) {
          console.log('[AuthContext] User not in DB (404) — directing to onboarding');
        } else {
          console.warn('[AuthContext] getMe failed (non-404), still treating as new user:', err?.message);
        }
        setStatus('no_role');
      }
    });

    return unsubscribe; // Clean up the listener on unmount
  }, []);

  const login = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      const authInstance = getAuth();
      if (authInstance.currentUser) {
        await signOut(authInstance);
      }
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
    } finally {
      clearFirebaseTokenResolver();
      setFirebaseUser(null);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const loginDevMode = useCallback(async (role: UserRoleType) => {
    setStatus('loading');
    const mockToken = `mock-dev-${role.toLowerCase()}-token`;
    
    // Set token resolver
    setFirebaseTokenResolver(() => Promise.resolve(mockToken));

    try {
      // Call backend to auto-provision / login the mock user
      const response = await getMe();
      const dbUser = response.data?.data?.user || response.data?.user || response.data;

      setFirebaseUser({
        uid: dbUser?.firebase_uid || `mock-dev-${role.toLowerCase()}-uid`,
        phoneNumber: dbUser?.phone || (role === 'PATIENT' ? '+919999999999' : '+918888888888'),
      } as any);

      setUser({
        id:        dbUser?.id || '',
        phone:     dbUser?.phone || '',
        name:      dbUser?.name || '',
        role:      dbUser?.role as UserRoleType,
        photo_url: dbUser?.photo_url || undefined,
      });
      setStatus('authenticated');
    } catch (err: any) {
      console.warn('[AuthContext] loginDevMode getMe failed, setting local mock state:', err?.message);
      // Fallback
      setUser({
        id: `mock-dev-${role.toLowerCase()}-id`,
        phone: role === 'PATIENT' ? '+919999999999' : '+918888888888',
        name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()}`,
        role,
      });
      setStatus('authenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, firebaseUser, login, logout, setStatus, loginDevMode }),
    [status, user, firebaseUser, login, logout, loginDevMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook — the ONLY export components use ────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
