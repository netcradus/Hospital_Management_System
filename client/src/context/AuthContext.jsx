import { createContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import authService from "../services/authService";

export const AuthContext = createContext(null);

const STORAGE_KEY = "hms_auth";
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

function persistSession(nextSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  localStorage.removeItem(STORAGE_KEY);
}

function isTokenExpired(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return true;
    }

    const parsedPayload = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (!parsedPayload?.exp) {
      return false;
    }

    return parsedPayload.exp * 1000 <= Date.now();
  } catch (_error) {
    return true;
  }
}

function readStoredSession() {
  try {
      const persistentSession = localStorage.getItem(STORAGE_KEY);
      if (persistentSession) {
        const parsedSession = JSON.parse(persistentSession);
        if (isTokenExpired(parsedSession?.tokens?.accessToken)) {
          clearStoredSession();
          return { session: null };
        }
        persistSession(parsedSession);
        return { session: parsedSession };
      }

      const transientSession = sessionStorage.getItem(STORAGE_KEY);
      if (transientSession) {
        const parsedSession = JSON.parse(transientSession);
        if (isTokenExpired(parsedSession?.tokens?.accessToken)) {
          clearStoredSession();
          return { session: null };
        }
        return { session: parsedSession };
      }
  } catch (_error) {
    clearStoredSession();
  }

  return { session: null };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession().session);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(readStoredSession().session));

  useEffect(() => {
    if (session) {
      persistSession(session);
    } else {
      clearStoredSession();
    }
  }, [session]);

  useEffect(() => {
    const refreshSession = async () => {
      if (!session?.tokens?.accessToken || isTokenExpired(session.tokens.accessToken)) {
        setSession(null);
        setIsBootstrapping(false);
        return;
      }

      try {
        const user = await authService.me();
        setSession((currentSession) => (currentSession ? { ...currentSession, user: { ...currentSession.user, ...user } } : currentSession));
      } catch (_error) {
        setSession(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    refreshSession();
  }, [session?.tokens?.accessToken]);

  useEffect(() => {
    const handleUnauthorized = () => setSession(null);
    window.addEventListener("hms:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("hms:unauthorized", handleUnauthorized);
  }, []);

  const login = async (payload) => {
    setIsLoading(true);
    try {
      const data = await authService.login(payload);
      persistSession(data);
      setSession(data);
      toast.success("Welcome back");
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload) => {
    setIsLoading(true);
    try {
      const data = await authService.register(payload);
      persistSession(data);
      setSession(data);
      toast.success("Account created");
      return data;
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration failed"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
    toast.success("Signed out");
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.tokens?.accessToken ?? null,
      isAuthenticated: Boolean(session?.tokens?.accessToken),
      isLoading,
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [session, isLoading, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
