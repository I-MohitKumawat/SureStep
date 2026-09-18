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
  useMemo, useRef, useState, type ReactNode,
} from 'react';
import { getAuth, onAuthStateChanged, signOut, getIdToken, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import type { UserRoleType } from '../types/enums';
import type { CareContext } from '../types/api.types';
import { setFirebaseTokenResolver, clearFirebaseTokenResolver } from '../services/apiClient';
import { connectSocket, disconnectSocket, setSocketTokenResolver } from '../services/socketClient';
import { getMe } from '../services/userService';
import { bootstrapFcmToken } from '../services/fcmTokenService';
import locationService from '../services/locationService';
import {
  requestBackgroundLocationPermission,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
} from '../services/backgroundLocationService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthStatus =
  | 'loading'           // Checking stored tokens on app start
  | 'unauthenticated'   // No valid Firebase session
  | 'no_role'           // Firebase session exists, but no DB record yet / needs onboarding
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
  status:               AuthStatus;
  user:                 AuthUser | null;
  firebaseUser:         FirebaseAuthTypes.User | null;
  careContext:          CareContext | null;
  activeRole:           UserRoleType | 'NEW_USER' | null;
  networkError:         boolean;
  networkErrorMessage?: string | null;
  isRetrying:           boolean;
  retryAuth:            () => Promise<void>;
  refreshUser:          () => Promise<void>;
  login:                (user: AuthUser, careCtx?: CareContext, role?: UserRoleType) => void;
  logout:               () => void;
  setStatus:            (s: AuthStatus) => void;
  loginDevMode:         (role: UserRoleType) => Promise<void>;
  updateUser:           (patch: Partial<AuthUser>) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status,              setStatus]              = useState<AuthStatus>('loading');
  const [user,                setUser]                = useState<AuthUser | null>(null);
  const [firebaseUser,        setFirebaseUser]        = useState<FirebaseAuthTypes.User | null>(null);
  const [careContext,         setCareContext]         = useState<CareContext | null>(null);
  const [activeRole,          setActiveRole]          = useState<UserRoleType | 'NEW_USER' | null>(null);
  const [networkError,        setNetworkError]        = useState(false);
  const [networkErrorMessage, setNetworkErrorMessage] = useState<string | null>(null);
  const [isRetrying,          setIsRetrying]          = useState(false);
  const resolutionSeq = useRef(0);

  const resolveSession = useCallback(async (fbUser: FirebaseAuthTypes.User) => {
    const currentSeq = ++resolutionSeq.current;
    try {
      console.log('[AUTH] GET /users/me started');
      const response = await getMe();
      if (currentSeq !== resolutionSeq.current) return;
      console.log('[AUTH] GET /users/me succeeded');
      const resData = (response.data as any)?.data || response.data;
      const dbUser = resData?.user || resData;
      const resActiveRole = resData?.activeRole || dbUser?.role;
      const resCareContext = resData?.careContext || null;

      console.log('[AUTH] resolved activeRole =', resActiveRole);
      console.log('[AUTH] resolved careContext profiles =', JSON.stringify(resCareContext?.profiles ?? {}));

      if (!dbUser || !dbUser.name) {
        // DB row missing or basic profile not yet completed
        if (dbUser?.id) {
          setUser({
            id:        dbUser.id,
            phone:     dbUser.phone || fbUser.phoneNumber || '',
            name:      '',
            role:      (resActiveRole && resActiveRole !== 'NEW_USER' ? resActiveRole : 'PATIENT') as UserRoleType,
            photo_url: dbUser.photo_url || undefined,
          });
          console.log('[AUTH] Status transition -> no_profile');
          setStatus('no_profile');
        } else {
          // No user row at all in DB
          console.log('[AUTH] Status transition -> no_role');
          setStatus('no_role');
        }
        setNetworkError(false);
        setNetworkErrorMessage(null);
        return;
      }

      // Valid account with a name exists
      const resolvedUser: AuthUser = {
        id:        dbUser.id || '',
        phone:     dbUser.phone || fbUser.phoneNumber || '',
        name:      dbUser.name || '',
        role:      (resActiveRole && resActiveRole !== 'NEW_USER' ? resActiveRole : dbUser.role || 'PATIENT') as UserRoleType,
        photo_url: dbUser.photo_url || undefined,
      };
      setUser(resolvedUser);
      setCareContext(resCareContext);
      setActiveRole(resActiveRole);
      setNetworkError(false);
      setNetworkErrorMessage(null);

      // Connect socket
      try {
        const token = await fbUser.getIdToken();
        if (token) connectSocket(token);
      } catch (tokenErr) {
        console.warn('[AuthContext] Failed to resolve token for socket connection:', tokenErr);
      }

      console.log('[AUTH] Status transition -> authenticated');
      setStatus('authenticated');
      void bootstrapFcmToken();

      if (resolvedUser.role === 'PATIENT') {
        void (async () => {
          const granted = await requestBackgroundLocationPermission();
          if (granted) await startBackgroundLocationUpdates();
        })();
      }
    } catch (err: any) {
      if (currentSeq !== resolutionSeq.current) return;
      if (err.response?.status === 404) {
        // True 404: Authenticated with Firebase, but no SureStep user account yet.
        console.log('[AuthContext] User not in DB (404) — directing to onboarding');
        setNetworkError(false);
        setNetworkErrorMessage(null);
        setStatus('no_role');
      } else {
        const httpStatus = err.response?.status;
        const errCode = err.code;
        const errMsg = err.response?.data?.error?.message || err.message || 'Unknown error';
        console.warn(`[AUTH] GET /users/me failed: status=${httpStatus}, code=${errCode}, message=${errMsg}`);

        // Transient network or server failure (e.g. Render cold start or 500 error)
        let errorMsg = 'Could not connect to SureStep server.';
        if (err.response?.status) {
          errorMsg = `Server error (${err.response.status}).`;
        } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          errorMsg = 'Connection timed out.';
        } else if (err.message) {
          errorMsg = err.message;
        }

        console.warn('[AuthContext] getMe failed with network/server error:', errorMsg);
        setNetworkError(true);
        setNetworkErrorMessage(errorMsg);
        // Do not log user out! If already authenticated, maintain state. Otherwise stay in loading and allow retry.
        setStatus((prev) => (prev === 'authenticated' ? 'authenticated' : 'loading'));
      }
    }
  }, []);

  const retryAuth = useCallback(async () => {
    const authInstance = getAuth();
    if (authInstance.currentUser) {
      setIsRetrying(true);
      try {
        await resolveSession(authInstance.currentUser);
      } finally {
        setIsRetrying(false);
      }
    }
  }, [resolveSession]);

  const refreshUser = useCallback(async () => {
    const authInstance = getAuth();
    if (authInstance.currentUser) {
      await resolveSession(authInstance.currentUser);
    }
  }, [resolveSession]);

  useEffect(() => {
    // onAuthStateChanged fires once immediately with the persisted session (or null)
    // and then whenever sign-in / sign-out happens.
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, async (fbUser) => {
      if (!fbUser) {
        resolutionSeq.current++;
        // Signed out — clear everything
        clearFirebaseTokenResolver();
        disconnectSocket();
        setFirebaseUser(null);
        setUser(null);
        setCareContext(null);
        setActiveRole(null);
        setNetworkError(false);
        setStatus('unauthenticated');
        return;
      }

      // Signed in — wire up the Axios token resolver so every request carries
      // a fresh Firebase ID token automatically.
      setFirebaseUser(fbUser);
      const resolver = () => getIdToken(fbUser);
      setFirebaseTokenResolver(resolver);
      setSocketTokenResolver(resolver);

      // Now resolve the user's DB profile + care context from backend
      await resolveSession(fbUser);
    });

    return unsubscribe; // Clean up the listener on unmount
  }, [resolveSession]);

  const login = useCallback(async (authUser: AuthUser, careCtx?: CareContext, role?: UserRoleType) => {
    setUser(authUser);
    if (careCtx) setCareContext(careCtx);
    if (role) setActiveRole(role);
    try {
      const fbUser = getAuth().currentUser;
      if (fbUser) {
        const token = await fbUser.getIdToken();
        if (token) connectSocket(token);
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to connect socket on login:', err);
    }
    setNetworkError(false);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    resolutionSeq.current++;
    try {
      const authInstance = getAuth();
      if (authInstance.currentUser) {
        await signOut(authInstance);
      }
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
    } finally {
      clearFirebaseTokenResolver();
      disconnectSocket();
      setFirebaseUser(null);
      setUser(null);
      setCareContext(null);
      setActiveRole(null);
      setNetworkError(false);
      setNetworkErrorMessage(null);
      setIsRetrying(false);
      setStatus('unauthenticated');
      // Stop patient background location on logout
      void stopBackgroundLocationUpdates();
    }
  }, []);

  const loginDevMode = useCallback(async (role: UserRoleType) => {
    setStatus('loading');
    const mockToken = `mock-dev-${role.toLowerCase()}-token`;
    
    // Set token resolver
    const resolver = () => Promise.resolve(mockToken);
    setFirebaseTokenResolver(resolver);
    setSocketTokenResolver(resolver);

    try {
      // Call backend to auto-provision / login the mock user
      const response = await getMe();
      const resData = (response.data as any)?.data || response.data;
      const dbUser = resData?.user || resData;
      const resActiveRole = resData?.activeRole || role;
      const resCareContext = resData?.careContext || null;

      setFirebaseUser({
        uid: dbUser?.firebase_uid || `mock-dev-${role.toLowerCase()}-uid`,
        phoneNumber: dbUser?.phone || (role === 'PATIENT' ? '+919999999999' : '+918888888888'),
      } as any);

      setUser({
        id:        dbUser?.id || '',
        phone:     dbUser?.phone || '',
        name:      dbUser?.name || '',
        role:      resActiveRole as UserRoleType,
        photo_url: dbUser?.photo_url || undefined,
      });
      setCareContext(resCareContext);
      setActiveRole(resActiveRole);
      setNetworkError(false);
      connectSocket(mockToken);
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
      setCareContext(null);
      setActiveRole(role);
      setNetworkError(false);
      connectSocket(mockToken);
      setStatus('authenticated');
    }
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...patch };
    });
  }, []);

  // Caregiver and Family location watching
  useEffect(() => {
    if (status !== 'authenticated' || !user || (user.role !== 'CAREGIVER' && user.role !== 'FAMILY')) {
      return;
    }

    let sub: Location.LocationSubscription | null = null;
    let isCleaningUp = false;

    const startWatching = async () => {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
          console.warn('[AuthContext] Foreground location permission denied for', user.role);
          return;
        }

        if (isCleaningUp) return;

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000,
            distanceInterval: 10,
          },
          async (loc) => {
            try {
              let batteryPct: number | undefined;
              const batteryLevel = await Battery.getBatteryLevelAsync().catch(() => -1);
              if (batteryLevel >= 0) {
                batteryPct = Math.round(batteryLevel * 100);
              }

              await locationService.postPing({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                accuracy_m: loc.coords.accuracy ?? undefined,
                speed_kmh: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed * 3.6 : undefined,
                heading: loc.coords.heading ?? undefined,
                battery_pct: batteryPct,
                recorded_at: new Date(loc.timestamp).toISOString(),
                source: 'PHONE',
              });
            } catch (err) {
              console.warn('[AuthContext] Failed to send location ping:', err);
            }
          }
        );
      } catch (err) {
        console.warn('[AuthContext] Error setting up location watch:', err);
      }
    };

    void startWatching();

    return () => {
      isCleaningUp = true;
      if (sub) {
        sub.remove();
      }
    };
  }, [status, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      firebaseUser,
      careContext,
      activeRole,
      networkError,
      networkErrorMessage,
      isRetrying,
      retryAuth,
      refreshUser,
      login,
      logout,
      setStatus,
      loginDevMode,
      updateUser,
    }),
    [
      status,
      user,
      firebaseUser,
      careContext,
      activeRole,
      networkError,
      networkErrorMessage,
      isRetrying,
      retryAuth,
      refreshUser,
      login,
      logout,
      loginDevMode,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook — the ONLY export components use ────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
