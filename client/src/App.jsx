import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/common/AuthLayout";
import DashboardLayout from "./components/common/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";
import RoleHomeRedirect from "./components/auth/RoleHomeRedirect";
import Skeleton from "./components/common/Skeleton";
import { useEffect, useState } from "react";
import { FEATURES } from "./config/features";
import { ROLE_PERMISSIONS } from "./config/rbac";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const AdminDashboardPage = lazy(() => import("./pages/dashboard/AdminDashboardPage"));
const DoctorDashboardPage = lazy(() => import("./pages/dashboard/DoctorDashboardPage"));
const PatientDashboardPage = lazy(() => import("./pages/dashboard/PatientDashboardPage"));
const StaffDashboardPage = lazy(() => import("./pages/dashboard/StaffDashboardPage"));
const PatientsPage = lazy(() => import("./pages/patient/PatientsPage"));
const PatientProfilePage = lazy(() => import("./pages/patient/PatientProfilePage"));
const DoctorsPage = lazy(() => import("./pages/doctor/DoctorsPage"));
const DoctorsManagementPage = lazy(() => import("./pages/admin/DoctorsManagementPage"));
const AppointmentsPage = lazy(() => import("./pages/appointment/AppointmentsPage"));
const BillingPage = lazy(() => import("./pages/billing/BillingPage"));
const DepartmentsPage = lazy(() => import("./pages/department/DepartmentsPage"));
const DepartmentsManagementPage = lazy(() => import("./pages/admin/DepartmentsManagementPage"));
const StaffPage = lazy(() => import("./pages/staff/StaffPage"));
const SubscriptionPage = lazy(() => import("./pages/subscription/SubscriptionPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function RouteFallback() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowFallback(true), 180);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!showFallback) {
    return <div className="min-h-screen bg-[var(--app-bg)]" />;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-5">
        <Skeleton className="h-8 w-40 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-36 w-full rounded-[28px]" />
          <Skeleton className="h-36 w-full rounded-[28px]" />
          <Skeleton className="h-36 w-full rounded-[28px]" />
          <Skeleton className="h-36 w-full rounded-[28px]" />
        </div>
        <Skeleton className="h-72 w-full rounded-[32px]" />
      </div>
    </div>
  );
}

function App() {
  const dashboardRoles = Object.keys(ROLE_PERMISSIONS).filter((role) => ROLE_PERMISSIONS[role].dashboard.includes("view"));
  const patientViewRoles = Object.keys(ROLE_PERMISSIONS).filter((role) => ROLE_PERMISSIONS[role].patients.includes("view"));
  const doctorViewRoles = Object.keys(ROLE_PERMISSIONS).filter((role) => ROLE_PERMISSIONS[role].doctors.includes("view"));
  const appointmentViewRoles = Object.keys(ROLE_PERMISSIONS).filter((role) => ROLE_PERMISSIONS[role].appointments.includes("view"));
  const billingViewRoles = Object.keys(ROLE_PERMISSIONS).filter((role) => ROLE_PERMISSIONS[role].billing.includes("view"));
  const departmentViewRoles = Object.keys(ROLE_PERMISSIONS).filter((role) => ROLE_PERMISSIONS[role].departments.includes("view"));
  const receptionistViewRoles = Object.keys(ROLE_PERMISSIONS).filter((role) => ROLE_PERMISSIONS[role].receptionist.includes("view"));

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          element={
            <PublicOnlyRoute>
              <AuthLayout />
            </PublicOnlyRoute>
          }
        >
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/register" element={<RegisterPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route path="/dashboard" element={<RoleHomeRedirect />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/patient" element={<Navigate to="/patient/dashboard" replace />} />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={dashboardRoles}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/receptionist" element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="/dashboard/lab" element={<Navigate to="/staff/dashboard" replace />} />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={patientViewRoles}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={patientViewRoles}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/patients"
            element={
              <ProtectedRoute allowedRoles={patientViewRoles}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients/:patientId"
            element={
              <ProtectedRoute allowedRoles={patientViewRoles}>
                <PatientProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:patientId"
            element={
              <ProtectedRoute allowedRoles={patientViewRoles}>
                <PatientProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/patients/:patientId"
            element={
              <ProtectedRoute allowedRoles={patientViewRoles}>
                <PatientProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <DoctorsManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/doctors"
            element={
              <ProtectedRoute allowedRoles={doctorViewRoles}>
                <DoctorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/doctors"
            element={
              <ProtectedRoute allowedRoles={doctorViewRoles}>
                <DoctorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRoles={appointmentViewRoles}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={appointmentViewRoles}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={appointmentViewRoles}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/appointments"
            element={
              <ProtectedRoute allowedRoles={appointmentViewRoles}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute allowedRoles={billingViewRoles}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/billing"
            element={
              <ProtectedRoute allowedRoles={billingViewRoles}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/billing"
            element={
              <ProtectedRoute allowedRoles={billingViewRoles}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={departmentViewRoles}>
                <DepartmentsManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={receptionistViewRoles}>
                <StaffPage />
              </ProtectedRoute>
            }
          />
          {FEATURES.SUBSCRIPTION_ENABLED ? (
            <Route
              path="/subscription"
              element={
                <ProtectedRoute allowedRoles={["admin", "super_admin", "doctor", "patient", "staff", "receptionist", "lab_staff"]}>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
          ) : null}
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
