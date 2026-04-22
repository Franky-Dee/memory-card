import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { api, type AuthUser } from "./api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
};

const STORAGE_KEY = "memory-card-session";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const persistSession = (nextToken: string | null, nextUser: AuthUser | null) => {
    if (nextToken && nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { token: string; user: AuthUser };
      setToken(session.token);
      setUser(session.user);
    }
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      authError,
      login: async (email: string, password: string) => {
        const response = await api.login(email, password);
        const session = { token: response.access_token, user: response.user };
        persistSession(session.token, session.user);
        setToken(response.access_token);
        setUser(response.user);
        setAuthError(null);
      },
      signup: async (name: string, email: string, password: string) => {
        const response = await api.signup(name, email, password);
        const session = { token: response.access_token, user: response.user };
        persistSession(session.token, session.user);
        setToken(response.access_token);
        setUser(response.user);
        setAuthError(null);
      },
      updateUser: (nextUser: AuthUser) => {
        persistSession(token, nextUser);
        setUser(nextUser);
      },
      logout: () => {
        persistSession(null, null);
        setToken(null);
        setUser(null);
        setAuthError(null);
      },
    }),
    [authError, ready, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

