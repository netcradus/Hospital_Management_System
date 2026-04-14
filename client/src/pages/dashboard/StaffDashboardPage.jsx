import { useCallback } from "react";
import Card from "../../components/common/Card";
import useRoleDashboardData from "../../hooks/useRoleDashboardData";
import { createEntityService } from "../../services/entityService";

const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");

function StaffDashboardPage() {
  const loadDashboard = useCallback(async () => {
    const [patients, appointments, billing] = await Promise.all([
      patientService.list({ limit: 100 }),
      appointmentService.list({ limit: 100 }),
      billingService.list({ limit: 100 }),
    ]);

    return {
      patients: patients.items.length,
      appointments: appointments.items.length,
      scheduledAppointments: appointments.items.filter((item) => item.status === "Scheduled").length,
      pendingBilling: billing.items.filter((item) => item.paymentStatus !== "Paid").length,
    };
  }, []);

  const { data, isLoading } = useRoleDashboardData(loadDashboard, {
    patients: 0,
    appointments: 0,
    scheduledAppointments: 0,
    pendingBilling: 0,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">Staff Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Front desk and operations overview</h1>
        <p className="mt-2 text-slate-500">Track check-ins, booking flow, and operational tasks assigned to support teams.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Patients</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.patients}</p></Card>
        <Card><p className="text-sm text-slate-500">Appointments</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.appointments}</p></Card>
        <Card><p className="text-sm text-slate-500">Scheduled</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.scheduledAppointments}</p></Card>
        <Card><p className="text-sm text-slate-500">Pending billing</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.pendingBilling}</p></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Reception queue" subtitle="Current activity snapshot">
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">{isLoading ? "Loading..." : `${data.patients} patient records are currently available.`}</div>
            <div className="rounded-2xl bg-slate-50 p-4">{isLoading ? "Loading..." : `${data.scheduledAppointments} scheduled appointments need coordination.`}</div>
          </div>
        </Card>
        <Card title="Shift priorities" subtitle="Operational reminders">
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">Update patient contact details before afternoon check-in cycle.</div>
            <div className="rounded-2xl bg-slate-50 p-4">{isLoading ? "Loading..." : `${data.pendingBilling} billing records still need payment follow-up.`}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default StaffDashboardPage;
