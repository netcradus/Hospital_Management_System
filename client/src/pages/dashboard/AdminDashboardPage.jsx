import { useEffect, useState } from "react";
import { toast } from "sonner";
import Card from "../../components/common/Card";
import dashboardService from "../../services/dashboardService";

function AdminDashboardPage() {
  const [stats, setStats] = useState([
    { label: "Patients", value: "-", delta: "Live count" },
    { label: "Doctors", value: "-", delta: "Live count" },
    { label: "Appointments", value: "-", delta: "Live count" },
    { label: "Revenue", value: "-", delta: "Live total" },
  ]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await dashboardService.getAdminDashboard();
        setStats([
          { label: "Patients", value: data.stats.patients, delta: "Registered patients" },
          { label: "Doctors", value: data.stats.doctors, delta: "Active medical staff" },
          { label: "Appointments", value: data.stats.appointments, delta: "Total bookings" },
          { label: "Revenue", value: `₹${Number(data.stats.revenue || 0).toFixed(2)}`, delta: "Total billed revenue" },
        ]);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard");
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-600">Admin Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Hospital operations overview</h1>
        <p className="mt-2 text-slate-500">Track admissions, staffing, revenue, and scheduling health from a single command center.</p>
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
        <Card title="Today's priorities" subtitle="Focus items for the front desk and care teams">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4">41 appointments scheduled, 6 need confirmation, and 3 overlap risks were prevented.</div>
            <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4">Billing follow-up required for 18 pending invoices due within 48 hours.</div>
            <div className="rounded-2xl border border-mist-200 bg-mist-50 p-4">Two departments are approaching staff capacity for evening shifts.</div>
          </div>
        </Card>
        <Card title="System status" subtitle="Starter metrics can later be replaced with live charts">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl border border-mist-200 bg-mist-50 px-4 py-3">
              <span>Authentication</span>
              <span className="font-medium text-emerald-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-mist-200 bg-mist-50 px-4 py-3">
              <span>Appointment API</span>
              <span className="font-medium text-emerald-600">Ready</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-mist-200 bg-mist-50 px-4 py-3">
              <span>Billing pipeline</span>
              <span className="font-medium text-amber-600">Scaffolded</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
