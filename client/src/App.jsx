import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/common/AuthLayout";
import DashboardLayout from "./components/common/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";
import RoleHomeRedirect from "./components/auth/RoleHomeRedirect";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminDashboardPage from "./pages/dashboard/AdminDashboardPage";
import DoctorDashboardPage from "./pages/dashboard/DoctorDashboardPage";
import PatientDashboardPage from "./pages/dashboard/PatientDashboardPage";
import StaffDashboardPage from "./pages/dashboard/StaffDashboardPage";
import PatientsPage from "./pages/patient/PatientsPage";
import DoctorsPage from "./pages/doctor/DoctorsPage";
import AppointmentsPage from "./pages/appointment/AppointmentsPage";
import BillingPage from "./pages/billing/BillingPage";
import DepartmentsPage from "./pages/department/DepartmentsPage";
import StaffPage from "./pages/staff/StaffPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
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
  );
}

export default App;
