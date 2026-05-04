import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineBell,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import useLiveQuery from "../../hooks/useLiveQuery";
import { useLanguage } from "../../context/LanguageContext";
import { createEntityService } from "../../services/entityService";
import {
  deleteNotification,
  ensureSupplementData,
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  searchGrouped,
} from "../../services/hmsSupplementService";
import { getDashboardPath } from "../../utils/roleRoutes";
import { getWorkspaceRoleLabel } from "../../utils/workspaceRole";
import { canAccess } from "../../config/rbac";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Button from "./Button";
import LanguageSwitcher from "./LanguageSwitcher";
import Modal from "./Modal";
import ThemeToggle from "./ThemeToggle";

const patientService = createEntityService("patients");
const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");
const doctorService = createEntityService("doctors");

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.workspaceRole || user?.role;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));

  const navByRole = useMemo(
    () => ({
      super_admin: [
        { to: "/admin/dashboard", label: t("nav.dashboard"), icon: HiOutlineHome },
        { to: "/admin/patients", label: t("nav.patients"), icon: HiOutlineUsers },
        { to: "/admin/doctors", label: t("nav.doctors"), icon: HiOutlineUserGroup },
        { to: "/admin/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/admin/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
        { to: "/admin/departments", label: t("nav.departments"), icon: HiOutlineBuildingOffice2 },
        { to: "/admin/staff", label: t("nav.staff"), icon: HiOutlineSquares2X2 },
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
      receptionist: [
        { to: "/staff/dashboard", label: t("nav.dashboard"), icon: HiOutlineHome },
        { to: "/staff/patients", label: t("nav.patients"), icon: HiOutlineUsers },
        { to: "/staff/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/staff/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
      ],
      lab_staff: [
        { to: "/staff/dashboard", label: t("nav.dashboard"), icon: HiOutlineHome },
        { to: "/staff/patients", label: t("nav.patients"), icon: HiOutlineUsers },
        { to: "/staff/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
      ],
    }),
    [t]
  );

  const loadShellData = useCallback(async () => {
    const [patients, doctors, appointments, billing] = await Promise.all([
      patientService.list({ limit: 200 }, { ttl: 120000 }),
      doctorService.list({ limit: 100 }, { ttl: 120000 }),
      appointmentService.list({ limit: 200 }, { ttl: 120000 }),
      billingService.list({ limit: 200 }, { ttl: 120000 }),
    ]);

    ensureSupplementData({
      patients: patients.items,
      doctors: doctors.items,
      appointments: appointments.items,
      billing: billing.items,
    });

    return { patients: patients.items, doctors: doctors.items, appointments: appointments.items, billing: billing.items };
  }, []);

  const { data: shellData } = useLiveQuery(loadShellData, {
    initialData: { patients: [], doctors: [], appointments: [], billing: [] },
    interval: 180000,
    errorMessage: "Unable to refresh workspace data",
  });

  const notifications = useMemo(
    () => getNotificationsForUser(user, shellData),
    [shellData, user]
  );
  const unreadCount = notifications.filter((item) => !item.read).length;
  const groupedSearch = useMemo(() => searchGrouped(searchText, shellData), [searchText, shellData]);
  const hasSearchResults = groupedSearch.patients.length || groupedSearch.doctors.length || groupedSearch.appointments.length;
  const navItems = navByRole[role] || navByRole.patient;
  const filteredNavItems = navItems.filter((item) => {
    if (item.to.includes("dashboard")) return canAccess(role, "dashboard", "view");
    if (item.to.includes("patients")) return canAccess(role, "patients", "view");
    if (item.to.includes("doctors")) return canAccess(role, "doctors", "view");
    if (item.to.includes("appointments")) return canAccess(role, "appointments", "view");
    if (item.to.includes("billing")) return canAccess(role, "billing", "view");
    if (item.to.includes("departments")) return canAccess(role, "departments", "view");
    if (item.to.includes("staff")) return canAccess(role, "receptionist", "view");
    return true;
  });
  const roleLabel = getWorkspaceRoleLabel(role);
  const translatedRoleLabel = t(`role.${role}`);
  const displayRoleLabel = translatedRoleLabel.startsWith("role.") ? roleLabel : translatedRoleLabel;
  const sidebarWidth = isSidebarCollapsed ? 104 : 288;

  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setSearchText("");
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearchNavigate = (target) => {
    setSearchText("");
    navigate(target);
  };

  const patientProfilePathForRole = useMemo(() => {
    if (role === "doctor") {
      return "/doctor/patients";
    }
    if (role === "super_admin" || role === "patient") {
      return "/admin/patients";
    }
    return "/staff/patients";
  }, [role]);

  const handleNotificationClick = (item) => {
    markNotificationRead(user, item.id);
    setNotificationsOpen(false);
    navigate(item.targetPath || getDashboardPath(role));
  };

  const renderNavItem = ({ to, label, icon: Icon }, compact = false) => (
    <NavLink
      key={to}
      to={to}
      title={compact ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center ${compact ? "justify-center px-2" : "gap-3 px-4"} min-h-[48px] rounded-2xl border-l-4 py-3 text-sm transition ${
          isActive
            ? "border-brand-500 bg-white/16 text-white shadow-sm"
            : "border-transparent text-slate-100 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      <Icon className="shrink-0 text-xl" />
      {!compact ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );

  return (
    <div className="min-h-screen text-[var(--text-primary)] transition-colors duration-300" style={{ background: "var(--app-bg)" }}>
      <div style={{ paddingLeft: isDesktop ? `${sidebarWidth}px` : undefined }}>
        <aside
          style={{ width: `${sidebarWidth}px`, background: "var(--sidebar-bg)" }}
          className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:border-r lg:border-[var(--border-color)] lg:px-3 lg:py-5 lg:text-[var(--sidebar-text)] lg:transition-all lg:duration-300"
        >
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} gap-2 px-2`}>
            <Link to={getDashboardPath(role)} className={`overflow-hidden ${isSidebarCollapsed ? "w-auto" : "flex-1"}`}>
              {isSidebarCollapsed ? (
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">HM</div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">{t("brand.tagline")}</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">MEDICare HMS</h1>
                </>
              )}
            </Link>
            {!isSidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <HiOutlineChevronDoubleLeft />
              </button>
            ) : null}
          </div>

          {isSidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="mx-auto mt-4 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
            >
              <HiOutlineChevronDoubleRight />
            </button>
          ) : null}

          <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">{filteredNavItems.map((item) => renderNavItem(item, isSidebarCollapsed))}</nav>

          <div className="space-y-3">
            <div className={`rounded-[28px] border border-white/10 bg-white/10 ${isSidebarCollapsed ? "p-3" : "p-4"}`}>
              <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                <Avatar name={user?.name} />
                {!isSidebarCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{user?.name || t("brand.userFallback")}</p>
                    <p className="text-sm text-slate-100/90">{roleLabel}</p>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={logout}
                className={`mt-4 flex min-h-[44px] items-center ${isSidebarCollapsed ? "justify-center" : "gap-2"} text-sm text-rose-100 transition hover:text-white`}
              >
                <HiOutlineArrowRightOnRectangle />
                {!isSidebarCollapsed ? t("brand.logout") : null}
              </button>
            </div>
          </div>
        </aside>

        <div className="sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--panel-bg)]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] lg:hidden"
                onClick={() => setIsMobileSidebarOpen((currentValue) => !currentValue)}
                aria-label="Toggle sidebar menu"
              >
                {isMobileSidebarOpen ? <HiOutlineXMark className="text-2xl" /> : <HiOutlineBars3 className="text-2xl" />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)] sm:text-xs">
                  {t("dashboard.workspaceTitle", { role: displayRoleLabel })}
                </p>
                <p className="hidden truncate text-sm text-[var(--text-muted)] md:block">{t("dashboard.workspaceDescription")}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="relative hidden min-w-[280px] lg:block">
                <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[var(--text-dim)]" />
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={t("dashboard.searchPlaceholder")}
                  className="min-h-[46px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] pl-11 pr-4 text-sm outline-none"
                />
                {searchText.trim() ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 shadow-2xl">
                    {hasSearchResults ? (
                      <div className="space-y-4 text-sm">
                        {groupedSearch.patients.length ? (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
                              {t("search.patients")}
                            </p>
                            <div className="space-y-2">
                              {groupedSearch.patients.map((patient) => (
                                <button
                                  key={patient._id}
                                  type="button"
                                  onClick={() => handleSearchNavigate(`${patientProfilePathForRole}/${patient._id}`)}
                                  className="block w-full rounded-2xl bg-[var(--panel-muted)] px-4 py-3 text-left"
                                >
                                  {patient.firstName} {patient.lastName}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {groupedSearch.doctors.length ? (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
                              {t("search.doctors")}
                            </p>
                            <div className="space-y-2">
                              {groupedSearch.doctors.map((doctor) => (
                                <div key={doctor._id} className="rounded-2xl bg-[var(--panel-muted)] px-4 py-3">
                                  <p>{doctor.firstName} {doctor.lastName}</p>
                                  <p className="text-xs text-[var(--text-muted)]">{doctor.specialization || "Doctor"}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {groupedSearch.appointments.length ? (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)]">
                              {t("search.appointments")}
                            </p>
                            <div className="space-y-2">
                              {groupedSearch.appointments.map((appointment) => (
                                <button
                                  key={appointment._id}
                                  type="button"
                                  onClick={() => handleSearchNavigate(role === "doctor" ? "/doctor/appointments" : role === "patient" ? "/patient/appointments" : "/admin/appointments")}
                                  className="block w-full rounded-2xl bg-[var(--panel-muted)] px-4 py-3 text-left"
                                >
                                  {appointment.patientId?.firstName} {appointment.patientId?.lastName} • {appointment.appointmentTime}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">{t("search.noResults")}</p>
                    )}
                  </div>
                ) : null}
              </div>
              <LanguageSwitcher tone="light" compact showLabel={false} />
              <Badge variant="info" className="hidden sm:inline-flex">{displayRoleLabel} Mode</Badge>
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] text-[var(--text-primary)]"
              >
                <HiOutlineBell className="text-xl" />
                {unreadCount ? (
                  <span className="absolute right-1.5 top-1.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        {isMobileSidebarOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
            <aside
              className="absolute left-0 top-0 flex h-full w-[290px] max-w-[88vw] flex-col p-5 text-[var(--sidebar-text)] shadow-2xl"
              style={{ background: "var(--sidebar-bg)" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <Link to={getDashboardPath(role)} className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">{t("brand.tagline")}</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">MEDICare HMS</h1>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                >
                  <HiOutlineXMark className="text-2xl" />
                </button>
              </div>
              <nav className="mt-8 flex-1 space-y-2">{filteredNavItems.map((item) => renderNavItem(item, false))}</nav>
              <div className="space-y-3">
                <div className="rounded-[28px] border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={user?.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{user?.name || t("brand.userFallback")}</p>
                      <p className="text-sm text-slate-100/90">{displayRoleLabel}</p>
                    </div>
                  </div>
                  <button type="button" onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-rose-100 transition hover:text-white">
                    <HiOutlineArrowRightOnRectangle />
                    {t("brand.logout")}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <Modal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notification Center"
        description="Appointments, prescriptions, billing, medical, and system updates"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="default" onClick={() => markAllNotificationsRead(user, notifications)}>
              Mark all read
            </Button>
            <Button type="button" variant="default" onClick={() => setNotificationsOpen(false)}>
              Close
            </Button>
          </div>
          {notifications.length ? (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-[24px] border p-4 ${item.read ? "border-[var(--border-color)] bg-[var(--panel-muted)]" : "border-brand-200 bg-brand-500/8"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button type="button" onClick={() => handleNotificationClick(item)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.read ? "default" : "info"}>{item.category}</Badge>
                      <Badge variant="default">{item.type}</Badge>
                    </div>
                    <p className="mt-3 font-medium text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{item.detail}</p>
                  </button>
                  <Button type="button" variant="ghost" className="text-rose-600" onClick={() => deleteNotification(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border-color)] bg-[var(--panel-muted)] p-6 text-center">
              <Badge variant="success">All clear</Badge>
              <p className="mt-3 text-sm text-[var(--text-muted)]">No urgent notifications right now.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default DashboardLayout;

