const ROLE_STORAGE_KEY = "hms_workspace_role";

export function deriveWorkspaceRole(user) {
  const email = String(user?.email || "").toLowerCase();
  const baseRole = user?.role;

  if (baseRole === "super_admin" || baseRole === "admin") {
    return "super_admin";
  }

  if (baseRole === "staff") {
    if (email.includes("lab")) {
      return "lab_staff";
    }

    return "receptionist";
  }

  return baseRole || "patient";
}

export function getWorkspaceRoleLabel(role) {
  return (
    {
      super_admin: "Super Admin",
      doctor: "Doctor",
      patient: "Patient",
      receptionist: "Receptionist",
      lab_staff: "Lab Staff",
    }[role] || "User"
  );
}

export function persistWorkspaceRole(role) {
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function readPersistedWorkspaceRole() {
  return localStorage.getItem(ROLE_STORAGE_KEY);
}

export function enrichUserWithWorkspaceRole(user) {
  if (!user) {
    return null;
  }

  const workspaceRole = readPersistedWorkspaceRole() || deriveWorkspaceRole(user);
  return {
    ...user,
    apiRole: user.role,
    role: workspaceRole,
    workspaceRole,
  };
}
