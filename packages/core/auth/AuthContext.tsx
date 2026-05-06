import React, { type ReactNode } from 'react';

export type UserRole = 'PATIENT' | 'CAREGIVER' | 'DOCTOR' | 'NEW_USER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;   // passed from PhoneAuthScreen to avoid a second mock_users fetch
};

export type AuthState =
  | {
      status: 'unauthenticated';
      user: null;
      accessToken: null;
    }
  | {
      status: 'authenticated';
      user: AuthUser;
      accessToken: string;
    };

type AuthContextValue = {
  auth: AuthState;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
};

const defaultAuthState: AuthState = {
  status: 'unauthenticated',
  user: null,
  accessToken: null,
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
  initialAuthState?: AuthState;
};

// Pure in-memory auth state.
// - Survives Fast Refresh (React state preserved by Metro HMR).
// - Clears on full reload / rescan Expo Go → shows Welcome screen.
// - npm run start:clear → Metro restarts → full reload → Welcome screen.
export const AuthProvider = ({ children, initialAuthState }: AuthProviderProps) => {
  const [auth, setAuth] = React.useState<AuthState>(initialAuthState ?? defaultAuthState);

  const login = React.useCallback((user: AuthUser, accessToken: string) => {
    setAuth({ status: 'authenticated', user, accessToken });
  }, []);

  const logout = React.useCallback(() => {
    setAuth(defaultAuthState);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ auth, login, logout }),
    [auth, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
