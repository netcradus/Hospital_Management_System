import api from "./api";

async function unwrap(promise) {
  const { data } = await promise;
  return data.data;
}

const authService = {
  login(payload) {
    return unwrap(api.post("/auth/login", payload));
  },
  register(payload) {
    return unwrap(api.post("/auth/register", payload));
  },
  me() {
    return unwrap(api.get("/auth/me"));
  },
};

export default authService;
