import api from "./api";

async function unwrap(promise) {
  const { data } = await promise;
  return data.data;
}

const authService = {
  async login(payload) {
    const email = String(payload?.email || "").trim();
    const password = String(payload?.password || "").trim();
    const requestedRole = String(payload?.role || "").trim();

    if (!email || !password || !requestedRole) {
      throw new Error("Email, password, and role are required");
    }

    const apiRole =
      requestedRole === "super_admin"
        ? "admin"
        : requestedRole === "receptionist" || requestedRole === "lab_staff"
          ? "staff"
          : requestedRole;

    const data = await unwrap(
      api.post("/auth/login", {
        email,
        password,
        role: apiRole,
        demoMode: true,
      })
    );

    return {
      ...data,
      user: {
        ...data.user,
        apiRole: data.user.role,
        role: requestedRole,
        workspaceRole: requestedRole,
      },
    };
  },
  register(payload) {
    return unwrap(api.post("/auth/register", payload));
  },
  me() {
    return unwrap(api.get("/auth/me"));
  },
};

export default authService;
