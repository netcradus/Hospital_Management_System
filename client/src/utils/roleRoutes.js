export const roleDashboardPath = {
  admin: "/admin/dashboard",
  doctor: "/doctor/dashboard",
  patient: "/patient/dashboard",
  staff: "/staff/dashboard",
};

export function getDashboardPath(role) {
  return roleDashboardPath[role] || "/unauthorized";
}

