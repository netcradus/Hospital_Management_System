import { useCallback } from "react";
import Card from "../../components/common/Card";
import useRoleDashboardData from "../../hooks/useRoleDashboardData";
import { createEntityService } from "../../services/entityService";

const appointmentService = createEntityService("appointments");
const patientService = createEntityService("patients");

function DoctorDashboardPage() {
  const loadDashboard = useCallback(async () => {
    const [appointments, patients] = await Promise.all([
      appointmentService.list({ limit: 100 }),
      patientService.list({ limit: 100 }),
    ]);

    return {
      totalAppointments: appointments.items.length,
      scheduled: appointments.items.filter((item) => item.status === "Scheduled").length,
      completed: appointments.items.filter((item) => item.status === "Completed").length,
      patients: patients.items.length,
      agenda: appointments.items.slice(0, 4),
    };
  }, []);

  const { data, isLoading } = useRoleDashboardData(loadDashboard, {
    totalAppointments: 0,
    scheduled: 0,
    completed: 0,
    patients: 0,
    agenda: [],
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">Doctor Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your daily patient schedule</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Appointments</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.totalAppointments}</p></Card>
        <Card><p className="text-sm text-slate-500">Scheduled</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.scheduled}</p></Card>
        <Card><p className="text-sm text-slate-500">Completed</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.completed}</p></Card>
        <Card><p className="text-sm text-slate-500">Patients</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.patients}</p></Card>
      </div>
      <Card title="Appointment feed" subtitle="Latest live appointment records">
        <div className="space-y-3 text-sm text-slate-600">
          {data.agenda.length ? (
            data.agenda.map((item) => (
              <div key={item._id} className="rounded-2xl bg-slate-50 p-4">
                {new Date(item.appointmentDate).toLocaleDateString()} at {item.appointmentTime} - {item.status}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4">No appointments available yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default DoctorDashboardPage;
