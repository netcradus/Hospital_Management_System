import { useMemo, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { getDashboardPath } from "../../utils/roleRoutes";
import LanguageSwitcher from "./LanguageSwitcher";

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navByRole = useMemo(
    () => ({
      admin: [
        { to: "/admin/dashboard", label: t("nav.dashboard"), icon: HiOutlineHome },
        { to: "/admin/patients", label: t("nav.patients"), icon: HiOutlineUsers },
        { to: "/admin/doctors", label: t("nav.doctors"), icon: HiOutlineUserGroup },
        { to: "/admin/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/admin/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
        { to: "/admin/departments", label: t("nav.departments"), icon: HiOutlineBuildingOffice2 },
        { to: "/admin/staff", label: t("nav.staff"), icon: HiOutlineUsers },
      ],
      doctor: [
        { to: "/doctor/dashboard", label: t("nav.dashboard"), icon: HiOutlineHome },
        { to: "/doctor/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/doctor/patients", label: t("nav.patients"), icon: HiOutlineUsers },
      ],
      patient: [
        { to: "/patient/dashboard", label: t("nav.dashboard"), icon: HiOutlineHome },
        { to: "/patient/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/patient/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
      ],
      staff: [
        { to: "/staff/dashboard", label: t("nav.dashboard"), icon: HiOutlineHome },
        { to: "/staff/patients", label: t("nav.patients"), icon: HiOutlineUsers },
        { to: "/staff/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/staff/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
      ],
    }),
    [t]
  );
  const navItems = useMemo(() => navByRole[user?.role] || [], [navByRole, user?.role]);
  const roleLabel = t(`role.${user?.role || "admin"}`);

  return (
    <div className="min-h-screen bg-shell-glow text-slate-900">
      <div className="lg:pl-[280px]">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[280px] lg:flex-col lg:border-r lg:border-white/10 lg:bg-brand-950 lg:px-6 lg:py-8 lg:text-slate-100">
          <Link to={getDashboardPath(user?.role)} className="block text-2xl font-semibold tracking-tight">
            MedAxis HMS
          </Link>
          <p className="mt-2 text-sm text-slate-300">{t("brand.tagline")}</p>

          <nav className="mt-10 flex-1 space-y-2 overflow-y-auto pr-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive ? "bg-white text-brand-950 shadow-float" : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon className="text-lg" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                {t("language.label")}
              </span>
              <LanguageSwitcher compact showLabel={false} className="border-0 bg-transparent p-0 shadow-none" />
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">{t("brand.signedInAs")}</p>
            <p className="mt-2 font-medium text-white">{user?.name || t("brand.userFallback")}</p>
            <p className="text-sm text-slate-300">{roleLabel}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex items-center gap-2 text-sm text-red-300 transition hover:text-red-200"
            >
              <HiOutlineArrowRightOnRectangle />
              {t("brand.logout")}
            </button>
          </div>
        </aside>

        <div className="sticky top-0 z-30 border-b border-mist-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <Link to={getDashboardPath(user?.role)} className="block max-w-[112px] text-[1.05rem] font-semibold leading-tight text-slate-900 sm:max-w-none sm:text-lg">
                MedAxis HMS
              </Link>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:text-xs">
                {t("brand.panel", { role: roleLabel })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageSwitcher tone="light" compact showLabel={false} />
              <button
                type="button"
                className="rounded-2xl border border-mist-200 bg-white p-2.5 text-slate-700 shadow-sm"
                onClick={() => setIsMobileSidebarOpen((value) => !value)}
              >
                {isMobileSidebarOpen ? <HiOutlineXMark className="text-2xl" /> : <HiOutlineBars3 className="text-2xl" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-brand-950/45 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
            <aside
              className="absolute left-0 top-0 h-full w-[280px] max-w-[88vw] bg-brand-950 px-5 py-7 text-slate-100 shadow-soft"
              onClick={(event) => event.stopPropagation()}
            >
              <Link to={getDashboardPath(user?.role)} className="block text-2xl font-semibold tracking-tight" onClick={() => setIsMobileSidebarOpen(false)}>
                MedAxis HMS
              </Link>
              <p className="mt-2 text-sm text-slate-400">{t("brand.tagline")}</p>
              <nav className="mt-10 space-y-2">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                        isActive ? "bg-white text-brand-950 shadow-float" : "text-slate-200 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="text-lg" />
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                    {t("language.label")}
                  </span>
                  <LanguageSwitcher compact showLabel={false} className="border-0 bg-transparent p-0 shadow-none" />
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">{t("brand.signedInAs")}</p>
                <p className="mt-2 font-medium text-white">{user?.name || t("brand.userFallback")}</p>
                <p className="text-sm text-slate-300">{roleLabel}</p>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-4 flex items-center gap-2 text-sm text-red-300 transition hover:text-red-200"
                >
                  <HiOutlineArrowRightOnRectangle />
                  {t("brand.logout")}
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
