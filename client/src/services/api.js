import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("hms_auth");
  if (raw) {
    const session = JSON.parse(raw);
    if (session?.tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${session.tokens.accessToken}`;
    }
  }

  return config;
});

export default api;

