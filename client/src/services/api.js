import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

function isPublicAuthRoute(url) {
  const normalizedUrl = String(url || "");
  return normalizedUrl.startsWith("/auth/login") || normalizedUrl.startsWith("/auth/register");
}

api.interceptors.request.use((config) => {
  const rawLocal = localStorage.getItem("hms_auth");
  const rawSession = sessionStorage.getItem("hms_auth");
  const raw = rawLocal || rawSession;

  if (raw) {
    try {
      const session = JSON.parse(raw);

      if (session?.tokens?.accessToken && !isPublicAuthRoute(config.url)) {
        config.headers.Authorization = `Bearer ${session.tokens.accessToken}`;
      }
    } catch (error) {
      localStorage.removeItem("hms_auth");
      sessionStorage.removeItem("hms_auth");
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("hms_auth");
      sessionStorage.removeItem("hms_auth");
      window.dispatchEvent(new CustomEvent("hms:unauthorized"));
    } else if (error.response?.status >= 500) {
      toast.error(error.response?.data?.message || "The server is having trouble right now");
    }

    return Promise.reject(error);
  }
);

export default api;
