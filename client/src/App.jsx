import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/common/AuthLayout";
import DashboardLayout from "./components/common/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";
import RoleHomeRedirect from "./components/auth/RoleHomeRedirect";
import Skeleton from "./components/common/Skeleton";
import { useEffect, useState } from "react";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const AdminDashboardPage = lazy(() => import("./pages/dashboard/AdminDashboardPage"));
const DoctorDashboardPage = lazy(() => import("./pages/dashboard/DoctorDashboardPage"));
const PatientDashboardPage = lazy(() => import("./pages/dashboard/PatientDashboardPage"));
const StaffDashboardPage = lazy(() => import("./pages/dashboard/StaffDashboardPage"));
const PatientsPage = lazy(() => import("./pages/patient/PatientsPage"));
const DoctorsPage = lazy(() => import("./pages/doctor/DoctorsPage"));
const AppointmentsPage = lazy(() => import("./pages/appointment/AppointmentsPage"));
const BillingPage = lazy(() => import("./pages/billing/BillingPage"));
const DepartmentsPage = lazy(() => import("./pages/department/DepartmentsPage"));
const StaffPage = lazy(() => import("./pages/staff/StaffPage"));
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
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/patients"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor", "staff"]}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/patients"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DoctorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor", "patient", "staff"]}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/appointments"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute allowedRoles={["admin", "patient", "staff"]}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/billing"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/billing"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StaffPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
