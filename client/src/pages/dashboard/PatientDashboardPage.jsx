import { useCallback } from "react";
import Card from "../../components/common/Card";
import useRoleDashboardData from "../../hooks/useRoleDashboardData";
import { createEntityService } from "../../services/entityService";

const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");

function PatientDashboardPage() {
  const loadDashboard = useCallback(async () => {
    const [appointments, billing] = await Promise.all([
      appointmentService.list({ limit: 100 }),
      billingService.list({ limit: 100 }),
    ]);

    return {
      upcoming: appointments.items.filter((item) => item.status === "Scheduled").length,
      totalAppointments: appointments.items.length,
      outstanding: billing.items.filter((item) => item.paymentStatus !== "Paid").length,
      paid: billing.items.filter((item) => item.paymentStatus === "Paid").length,
      latestAppointment: appointments.items[0] || null,
    };
  }, []);

  const { data, isLoading } = useRoleDashboardData(loadDashboard, {
    upcoming: 0,
    totalAppointments: 0,
    outstanding: 0,
    paid: 0,
    latestAppointment: null,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">Patient Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Care journey at a glance</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Upcoming appointments</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.upcoming}</p></Card>
        <Card><p className="text-sm text-slate-500">Total appointments</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.totalAppointments}</p></Card>
        <Card><p className="text-sm text-slate-500">Outstanding bills</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.outstanding}</p></Card>
        <Card><p className="text-sm text-slate-500">Paid bills</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.paid}</p></Card>
      </div>
      <Card title="Latest appointment" subtitle="Pulled from live appointment data">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {data.latestAppointment
            ? `${new Date(data.latestAppointment.appointmentDate).toLocaleDateString()} at ${data.latestAppointment.appointmentTime} - ${data.latestAppointment.status}`
            : "No appointments available yet."}
        </div>
      </Card>
    </div>
  );
}

export default PatientDashboardPage;
