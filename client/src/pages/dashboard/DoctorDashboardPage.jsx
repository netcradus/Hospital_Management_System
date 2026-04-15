import { useCallback } from "react";
import Card from "../../components/common/Card";
import { useLanguage } from "../../context/LanguageContext";
import useRoleDashboardData from "../../hooks/useRoleDashboardData";
import { createEntityService } from "../../services/entityService";

const appointmentService = createEntityService("appointments");
const patientService = createEntityService("patients");

function DoctorDashboardPage() {
  const { t, formatDate } = useLanguage();
  const getStatusLabel = (status) =>
    ({
      Scheduled: t("option.scheduled"),
      "In-Progress": t("option.inProgress"),
      Completed: t("option.completed"),
      Cancelled: t("option.cancelled"),
      Rescheduled: t("option.rescheduled"),
    }[status] || status);
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
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">{t("dashboard.doctorLabel")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t("dashboard.doctorTitle")}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">{t("stats.appointments")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.totalAppointments}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.scheduled")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.scheduled}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.completed")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.completed}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.patients")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.patients}</p></Card>
      </div>
      <Card title={t("doctor.feedTitle")} subtitle={t("doctor.feedSubtitle")}>
        <div className="space-y-3 text-sm text-slate-600">
          {data.agenda.length ? (
            data.agenda.map((item) => (
              <div key={item._id} className="rounded-2xl bg-slate-50 p-4">
                {formatDate(item.appointmentDate)} {t("common.at")} {item.appointmentTime} - {getStatusLabel(item.status)}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4">{t("common.noAppointments")}</div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default DoctorDashboardPage;
