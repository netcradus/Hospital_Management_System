export const ROLE_PERMISSIONS = {
  super_admin: {
    dashboard: ["view"],
    patients: ["view", "create", "edit", "delete", "assign", "approve"],
    doctors: ["view", "create", "edit", "delete", "assign"],
    appointments: ["view", "create", "edit", "delete", "approve"],
    billing: ["view", "create", "edit", "delete", "approve", "download"],
    departments: ["view", "create", "edit", "delete", "assign"],
    receptionist: ["view", "create", "edit", "delete"],
    prescriptions: ["view", "approve", "download"],
    labTests: ["view", "create", "edit", "delete", "upload", "download"],
  },
  doctor: {
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
  receptionist: {
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
  lab_staff: {
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
  patient: {
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

export function canAccess(role, module, action = "view") {
  return Boolean(ROLE_PERMISSIONS?.[role]?.[module]?.includes(action));
}

