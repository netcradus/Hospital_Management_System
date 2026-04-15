import { useCallback } from "react";
import Card from "../../components/common/Card";
import { useLanguage } from "../../context/LanguageContext";
import useRoleDashboardData from "../../hooks/useRoleDashboardData";
import { createEntityService } from "../../services/entityService";

const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");

function PatientDashboardPage() {
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
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">{t("dashboard.patientLabel")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t("dashboard.patientTitle")}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">{t("stats.upcomingAppointments")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.upcoming}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.totalAppointments")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.totalAppointments}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.outstandingBills")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.outstanding}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.paidBills")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.paid}</p></Card>
      </div>
      <Card title={t("patient.latestAppointmentTitle")} subtitle={t("patient.latestAppointmentSubtitle")}>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {data.latestAppointment
            ? `${formatDate(data.latestAppointment.appointmentDate)} ${t("common.at")} ${data.latestAppointment.appointmentTime} - ${getStatusLabel(data.latestAppointment.status)}`
            : t("common.noAppointments")}
        </div>
      </Card>
    </div>
  );
}

export default PatientDashboardPage;
