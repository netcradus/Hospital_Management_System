import { useEffect, useState } from "react";
import { toast } from "sonner";
import Card from "../../components/common/Card";
import { useLanguage } from "../../context/LanguageContext";
import dashboardService from "../../services/dashboardService";

function AdminDashboardPage() {
  const { t, formatCurrency } = useLanguage();
  const [stats, setStats] = useState([
    { label: t("stats.patients"), value: "-", delta: t("stats.liveCount") },
    { label: t("stats.doctors"), value: "-", delta: t("stats.liveCount") },
    { label: t("stats.appointments"), value: "-", delta: t("stats.liveCount") },
    { label: t("stats.revenue"), value: "-", delta: t("stats.liveTotal") },
  ]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await dashboardService.getAdminDashboard();
        setStats([
          { label: t("stats.patients"), value: data.stats.patients, delta: t("stats.registeredPatients") },
          { label: t("stats.doctors"), value: data.stats.doctors, delta: t("stats.activeMedicalStaff") },
          { label: t("stats.appointments"), value: data.stats.appointments, delta: t("stats.totalBookings") },
          { label: t("stats.revenue"), value: formatCurrency(data.stats.revenue || 0), delta: t("stats.totalBilledRevenue") },
        ]);
      } catch (error) {
        toast.error(error.response?.data?.message || t("error.failedToLoadDashboard"));
      }
    };

    loadDashboard();
  }, [formatCurrency, t]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">{t("dashboard.adminLabel")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t("dashboard.adminTitle")}</h1>
        <p className="mt-2 text-slate-500">{t("dashboard.adminDescription")}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-1">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-brand-700">{item.delta}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
        <Card title={t("admin.prioritiesTitle")} subtitle={t("admin.prioritiesSubtitle")}>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4">{t("admin.priorityOne")}</div>
            <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4">{t("admin.priorityTwo")}</div>
            <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4">{t("admin.priorityThree")}</div>
          </div>
        </Card>
        <Card title={t("admin.systemStatusTitle")} subtitle={t("admin.systemStatusSubtitle")}>
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl border border-mist-200 bg-mist-50 px-4 py-3">
              <span>{t("admin.authentication")}</span>
              <span className="font-medium text-emerald-600">{t("system.healthy")}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-mist-200 bg-mist-50 px-4 py-3">
              <span>{t("admin.appointmentApi")}</span>
              <span className="font-medium text-emerald-600">{t("system.ready")}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-mist-200 bg-mist-50 px-4 py-3">
              <span>{t("admin.billingPipeline")}</span>
              <span className="font-medium text-amber-600">{t("system.scaffolded")}</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
