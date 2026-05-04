import { createContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import authService from "../services/authService";
import { deriveWorkspaceRole, enrichUserWithWorkspaceRole, persistWorkspaceRole } from "../utils/workspaceRole";

export const AuthContext = createContext(null);

const STORAGE_KEY = "hms_auth";
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("hms_demo_user");
  localStorage.removeItem("userRole");
}

function persistSession(nextSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  localStorage.removeItem(STORAGE_KEY);
}

function persistSessionWithPreference(nextSession, rememberMe) {
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  persistSession(nextSession);
}

function enrichSession(session) {
  if (!session) {
    return null;
  }

  return {
    ...session,
    user: enrichUserWithWorkspaceRole(session.user),
  };
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
      const parsedSession = enrichSession(JSON.parse(persistentSession));
      if (isTokenExpired(parsedSession?.tokens?.accessToken)) {
        clearStoredSession();
        return { session: null, rememberMe: false };
      }
      return { session: parsedSession, rememberMe: true };
    }

    const transientSession = sessionStorage.getItem(STORAGE_KEY);
    if (transientSession) {
      const parsedSession = enrichSession(JSON.parse(transientSession));
      if (isTokenExpired(parsedSession?.tokens?.accessToken)) {
        clearStoredSession();
        return { session: null, rememberMe: false };
      }
      return { session: parsedSession, rememberMe: false };
    }
  } catch (_error) {
    clearStoredSession();
  }

  return { session: null, rememberMe: false };
}

export function AuthProvider({ children }) {
  const stored = readStoredSession();
  const [session, setSession] = useState(() => stored.session);
  const [rememberMe, setRememberMe] = useState(() => stored.rememberMe);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(stored.session));

  useEffect(() => {
    if (session) {
      persistSessionWithPreference(session, rememberMe);
    } else {
      clearStoredSession();
    }
  }, [rememberMe, session]);

  useEffect(() => {
    const refreshSession = async () => {
      if (!session?.tokens?.accessToken || isTokenExpired(session.tokens.accessToken)) {
        setSession(null);
        setIsBootstrapping(false);
        return;
      }

      try {
        const user = await authService.me();
        setSession((currentSession) => (currentSession ? enrichSession({ ...currentSession, user: { ...currentSession.user, ...user } }) : currentSession));
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
      const workspaceRole = deriveWorkspaceRole(data.user);
      persistWorkspaceRole(workspaceRole);
      const enrichedData = enrichSession(data);
      setRememberMe(Boolean(payload.rememberMe));
      persistSessionWithPreference(enrichedData, payload.rememberMe);
      setSession(enrichedData);
      toast.success("Welcome back");
      return enrichedData;
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
      const workspaceRole = deriveWorkspaceRole(data.user);
      persistWorkspaceRole(workspaceRole);
      const enrichedData = enrichSession(data);
      setRememberMe(true);
      persistSession(enrichedData);
      setSession(enrichedData);
      toast.success("Account created");
      return enrichedData;
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration failed"));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredSession();
    setRememberMe(false);
    setSession(null);
    toast.success("Signed out");
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.user?.workspaceRole || session?.user?.role || null,
      token: session?.tokens?.accessToken ?? null,
      isAuthenticated: Boolean(session?.tokens?.accessToken),
      isLoggedIn: Boolean(session?.tokens?.accessToken),
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
