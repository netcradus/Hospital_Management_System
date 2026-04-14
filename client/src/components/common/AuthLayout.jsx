import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="min-h-screen overflow-hidden bg-hero-grid px-4 py-4 text-slate-100 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <section className="relative hidden h-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-soft backdrop-blur lg:flex lg:min-h-[calc(100vh-3rem)] lg:flex-col lg:justify-between lg:p-10 xl:p-12">
          <div className="absolute -right-20 top-10 h-52 w-52 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-100">City Care Network</p>
            <div className="mt-10 max-w-xl">
              <h1 className="text-4xl font-bold leading-[1.08] xl:text-[3.6rem]">
                Hospital operations, patient care, and billing in one calm workspace.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-slate-200 xl:text-lg">
                Designed for administrators, clinicians, staff, and patients with role-aware access and connected records.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-100">Operations</p>
              <p className="mt-3 text-xl font-semibold leading-8">Appointments, patients, departments, and staffing aligned.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-100">Financials</p>
              <p className="mt-3 text-xl font-semibold leading-8">Billing visibility with live records and role-based workflows.</p>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center py-2 lg:min-h-[calc(100vh-3rem)] lg:py-8">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

export default AuthLayout;
