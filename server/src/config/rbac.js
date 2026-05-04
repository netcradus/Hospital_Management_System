export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  LAB_STAFF: "lab_staff",
  STAFF: "staff",
  PATIENT: "patient",
};

export const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    dashboard: ["view", "approve", "download"],
    patients: ["view", "create", "edit", "delete", "assign", "approve", "download"],
    doctors: ["view", "create", "edit", "delete", "assign"],
    appointments: ["view", "create", "edit", "delete", "approve"],
    billing: ["view", "create", "edit", "delete", "approve", "download"],
    departments: ["view", "create", "edit", "delete", "assign"],
    receptionist: ["view", "create", "edit", "delete", "assign"],
    prescriptions: ["view", "approve", "download"],
    labTests: ["view", "create", "edit", "delete", "assign", "approve", "upload", "download"],
  },
  [ROLES.DOCTOR]: {
    dashboard: ["view"],
    patients: ["view", "edit", "assign"],
    doctors: ["view", "edit"],
    appointments: ["view", "edit"],
    billing: ["view"],
    departments: ["view"],
    receptionist: [],
    prescriptions: ["view", "create", "edit", "download"],
    labTests: ["view", "create"],
  },
  [ROLES.RECEPTIONIST]: {
    dashboard: ["view"],
    patients: ["view", "create", "edit"],
    doctors: ["view"],
    appointments: ["view", "create", "edit", "delete"],
    billing: ["view", "create", "edit", "download"],
    departments: ["view"],
    receptionist: ["view"],
    prescriptions: [],
    labTests: ["view"],
  },
  [ROLES.LAB_STAFF]: {
    dashboard: ["view"],
    patients: ["view"],
    doctors: [],
    appointments: [],
    billing: ["view", "create"],
    departments: ["view"],
    receptionist: [],
    prescriptions: [],
    labTests: ["view", "edit", "upload", "download"],
  },
  [ROLES.PATIENT]: {
    dashboard: ["view"],
    patients: ["view"],
    doctors: ["view"],
    appointments: ["view", "create", "delete"],
    billing: ["view", "download"],
    departments: ["view"],
    receptionist: [],
    prescriptions: ["view", "download"],
    labTests: ["view", "download"],
  },
};

export function resolveRole(user) {
  const baseRole = user?.role;
  const email = String(user?.email || "").toLowerCase();

  if (baseRole === ROLES.ADMIN || baseRole === ROLES.SUPER_ADMIN) {
    return ROLES.SUPER_ADMIN;
  }
  if (baseRole === ROLES.STAFF || baseRole === ROLES.RECEPTIONIST || baseRole === ROLES.LAB_STAFF) {
    if (email.includes("lab")) {
      return ROLES.LAB_STAFF;
    }
    return ROLES.RECEPTIONIST;
  }
  if (baseRole === ROLES.DOCTOR) {
    return ROLES.DOCTOR;
  }
  return ROLES.PATIENT;
}

export function checkPermission(role, module, action) {
  const modulePermissions = PERMISSIONS[role]?.[module] || [];
  return modulePermissions.includes(action);
}

