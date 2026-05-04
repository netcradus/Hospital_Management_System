export const roleDashboardPath = {
  super_admin: "/dashboard/admin",
  doctor: "/dashboard/doctor",
  patient: "/dashboard/patient",
  receptionist: "/dashboard/receptionist",
  lab_staff: "/dashboard/lab",
  staff: "/dashboard/receptionist",
};

export function getDashboardPath(role) {
  return roleDashboardPath[role] || "/dashboard";
}

