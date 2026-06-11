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
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import type { UserRoleType } from '../types/enums';
import { setFirebaseTokenResolver, clearFirebaseTokenResolver } from '../services/apiClient';
import { connectSocket, disconnectSocket, setSocketTokenResolver } from '../services/socketClient';
import { getMe } from '../services/userService';
import { bootstrapFcmToken } from '../services/fcmTokenService';
import locationService from '../services/locationService';

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
  updateUser:   (patch: Partial<AuthUser>) => void;
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
        disconnectSocket();
        setFirebaseUser(null);
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      // Signed in — wire up the Axios token resolver so every request carries
      // a fresh Firebase ID token automatically.
      setFirebaseUser(fbUser);
      const resolver = () => getIdToken(fbUser);
      setFirebaseTokenResolver(resolver);
      setSocketTokenResolver(resolver);

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
          // Connect socket first to avoid races
          try {
            const token = await resolver();
            if (token) connectSocket(token);
          } catch (tokenErr) {
            console.warn('[AuthContext] Failed to resolve token for socket connection:', tokenErr);
          }
          setStatus('authenticated');
          // Register FCM device token now that we have an authenticated session
          void bootstrapFcmToken();
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

  const login = useCallback(async (authUser: AuthUser) => {
    setUser(authUser);
    try {
      const fbUser = getAuth().currentUser;
      if (fbUser) {
        const token = await fbUser.getIdToken();
        if (token) connectSocket(token);
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to connect socket on login:', err);
    }
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
      disconnectSocket();
      setFirebaseUser(null);
      setUser(null);
      setStatus('unauthenticated');
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
    () => ({ status, user, firebaseUser, login, logout, setStatus, loginDevMode, updateUser }),
    [status, user, firebaseUser, login, logout, loginDevMode, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook — the ONLY export components use ────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
