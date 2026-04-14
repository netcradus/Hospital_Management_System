import { createContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import authService from "../services/authService";

export const AuthContext = createContext(null);

const STORAGE_KEY = "hms_auth";
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const login = async (payload) => {
    setIsLoading(true);
    try {
      const data = await authService.login(payload);
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
      login,
      register,
      logout,
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
