import { useCallback } from "react";
import Card from "../../components/common/Card";
import { useLanguage } from "../../context/LanguageContext";
import useRoleDashboardData from "../../hooks/useRoleDashboardData";
import { createEntityService } from "../../services/entityService";

const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");

function StaffDashboardPage() {
  const { t } = useLanguage();
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
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">{t("dashboard.staffLabel")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t("dashboard.staffTitle")}</h1>
        <p className="mt-2 text-slate-500">{t("dashboard.staffDescription")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">{t("stats.patients")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.patients}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.appointments")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.appointments}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.scheduled")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.scheduledAppointments}</p></Card>
        <Card><p className="text-sm text-slate-500">{t("stats.pendingBilling")}</p><p className="mt-3 text-3xl font-semibold">{isLoading ? "-" : data.pendingBilling}</p></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t("staff.receptionQueueTitle")} subtitle={t("staff.receptionQueueSubtitle")}>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">{isLoading ? t("common.loading") : t("staff.recordsAvailable", { count: data.patients })}</div>
            <div className="rounded-2xl bg-slate-50 p-4">{isLoading ? t("common.loading") : t("staff.coordinationNeeded", { count: data.scheduledAppointments })}</div>
          </div>
        </Card>
        <Card title={t("staff.shiftPrioritiesTitle")} subtitle={t("staff.shiftPrioritiesSubtitle")}>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">{t("staff.contactReminder")}</div>
            <div className="rounded-2xl bg-slate-50 p-4">{isLoading ? t("common.loading") : t("staff.paymentFollowUp", { count: data.pendingBilling })}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default StaffDashboardPage;
