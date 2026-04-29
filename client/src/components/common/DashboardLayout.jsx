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
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineXMark,
} from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import useLiveQuery from "../../hooks/useLiveQuery";
import { useLanguage } from "../../context/LanguageContext";
import { createEntityService } from "../../services/entityService";
import { getLeaveRequests } from "../../utils/leaveRequests";
import { getDashboardPath } from "../../utils/roleRoutes";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Button from "./Button";
import LanguageSwitcher from "./LanguageSwitcher";
import Modal from "./Modal";
import ThemeToggle from "./ThemeToggle";
import SubscriptionModal from "../subscription/SubscriptionModal";

const appointmentService = createEntityService("appointments");
const billingService = createEntityService("billing");
const NOTIFICATION_STORAGE_KEY = "hms_notification_reads";

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [leaveNotificationRevision, setLeaveNotificationRevision] = useState(0);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : true));
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]");
    } catch (_error) {
      return [];
    }
  });

  const navByRole = useMemo(
    () => ({
      admin: [
        { to: "/admin/dashboard", label: "Overview", icon: HiOutlineHome },
        { to: "/admin/patients", label: t("nav.patients"), icon: HiOutlineUsers },
        { to: "/admin/doctors", label: t("nav.doctors"), icon: HiOutlineUserGroup },
        { to: "/admin/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/admin/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
        { to: "/admin/departments", label: t("nav.departments"), icon: HiOutlineBuildingOffice2 },
        { to: "/admin/staff", label: t("nav.staff"), icon: HiOutlineSquares2X2 },
      ],
      doctor: [
        { to: "/doctor/dashboard", label: "Overview", icon: HiOutlineHome },
        { to: "/doctor/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/doctor/patients", label: t("nav.patients"), icon: HiOutlineUsers },
      ],
      patient: [
        { to: "/patient/dashboard", label: "Overview", icon: HiOutlineHome },
        { to: "/patient/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/patient/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
      ],
      staff: [
        { to: "/staff/dashboard", label: "Overview", icon: HiOutlineHome },
        { to: "/staff/patients", label: t("nav.patients"), icon: HiOutlineUsers },
        { to: "/staff/appointments", label: t("nav.appointments"), icon: HiOutlineCalendarDays },
        { to: "/staff/billing", label: t("nav.billing"), icon: HiOutlineCreditCard },
      ],
    }),
    [t]
  );

  const loadNotifications = useCallback(async () => {
    const [appointments, billing] = await Promise.all([
      appointmentService.list({ limit: 20 }, { ttl: 120000 }),
      billingService.list({ limit: 20 }, { ttl: 120000 }),
    ]);

    const appointmentAlerts = (appointments.items || [])
      .filter((item) => item.status === "Scheduled")
      .slice(0, 4)
      .map((item) => ({
        id: `appointment:${item._id}`,
        title: `Upcoming appointment at ${item.appointmentTime}`,
        detail: item.reasonForVisit || "Pending appointment",
        target: user?.role === "doctor" ? "/doctor/appointments" : user?.role === "staff" ? "/staff/appointments" : "/admin/appointments",
      }));

    const billingAlerts = (billing.items || [])
      .filter((item) => item.paymentStatus !== "Paid")
      .slice(0, 4)
      .map((item) => ({
        id: `billing:${item._id}`,
        title: `Billing ${item.paymentStatus}`,
        detail: item.serviceDescription,
        target: user?.role === "patient" ? "/patient/billing" : user?.role === "staff" ? "/staff/billing" : "/admin/billing",
      }));

    const leaveAlerts =
      user?.role === "admin"
        ? getLeaveRequests()
            .filter((item) => item.status === "Pending")
            .slice(0, 4)
            .map((item) => ({
              id: `leave:${item.id}`,
              title: `Leave request from ${item.doctorName}`,
              detail: `${item.from} to ${item.to}${item.reason ? ` • ${item.reason}` : ""}`,
              target: "/admin/dashboard",
            }))
        : [];

    const items = [...leaveAlerts, ...appointmentAlerts, ...billingAlerts]
      .slice(0, 6)
      .map((item) => ({
        ...item,
        read: readNotificationIds.includes(item.id),
      }));

    return {
      count: items.filter((item) => !item.read).length,
      items,
    };
  }, [leaveNotificationRevision, readNotificationIds, user?.role]);

  const { data: notifications } = useLiveQuery(loadNotifications, {
    initialData: { count: 0, items: [] },
    interval: 180000,
    errorMessage: "Unable to refresh notifications",
  });

  const navItems = useMemo(() => navByRole[user?.role] || [], [navByRole, user?.role]);
  const roleLabel = t(`role.${user?.role || "admin"}`);
  const sidebarWidth = isSidebarCollapsed ? 104 : 288;

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setIsMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    const handleLeaveRequestUpdate = () => {
      setLeaveNotificationRevision((currentValue) => currentValue + 1);
    };

    window.addEventListener("hms:leave-requests-updated", handleLeaveRequestUpdate);
    return () => window.removeEventListener("hms:leave-requests-updated", handleLeaveRequestUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  const markNotificationRead = (notificationId) => {
    setReadNotificationIds((currentIds) => (currentIds.includes(notificationId) ? currentIds : [...currentIds, notificationId]));
  };

  const handleNotificationClick = (item) => {
    markNotificationRead(item.id);
    setNotificationsOpen(false);
    navigate(item.target);
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
      <Icon className="text-xl shrink-0" />
      {!compact ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );

  return (
    <div className="min-h-screen text-[var(--text-primary)] transition-colors duration-300" style={{ background: "var(--app-bg)" }}>
      <div style={{ paddingLeft: isDesktop ? `${sidebarWidth}px` : undefined }}>
        <aside
          style={{ width: `${sidebarWidth}px`, background: "var(--sidebar-bg)" }}
          className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:border-r lg:border-[var(--border-color)] lg:px-3 lg:py-5 lg:text-[var(--sidebar-text)] lg:transition-all lg:duration-300"
          aria-label="Sidebar navigation"
          role="navigation"
        >
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} gap-2 px-2`}>
            <Link to={getDashboardPath(user?.role)} className={`overflow-hidden ${isSidebarCollapsed ? "w-auto" : "flex-1"}`}>
              {isSidebarCollapsed ? (
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                  HM
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">Hospital System</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">MedAxis HMS</h1>
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

          <nav className="mt-6 flex-1 space-y-2 overflow-y-auto">
            {navItems.map((item) => renderNavItem(item, isSidebarCollapsed))}
          </nav>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setSubscriptionOpen(true)}
              className={`flex min-h-[48px] w-full items-center ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"} rounded-2xl bg-white/10 text-left text-sm transition hover:bg-white/15`}
              title="Manage plan"
            >
              <HiOutlineCog6Tooth className="text-xl shrink-0" />
              {!isSidebarCollapsed ? <span className="text-slate-50">Manage plan</span> : null}
            </button>

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
                title="Logout"
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
              >
                {isMobileSidebarOpen ? <HiOutlineXMark className="text-2xl" /> : <HiOutlineBars3 className="text-2xl" />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-dim)] sm:text-xs">{roleLabel} Workspace</p>
                <p className="hidden truncate text-sm text-[var(--text-muted)] sm:block">Patient flow, appointments, wards, billing, and department operations</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <LanguageSwitcher tone="light" compact showLabel={false} />
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] text-[var(--text-primary)]"
              >
                <HiOutlineBell className="text-xl" />
                {notifications?.count ? (
                  <span className="absolute right-1.5 top-1.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                    {notifications.count}
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
              <Link to={getDashboardPath(user?.role)}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">Hospital System</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">MedAxis HMS</h1>
              </Link>
              <nav className="mt-8 flex-1 space-y-2">{navItems.map((item) => renderNavItem(item, false))}</nav>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user?.name} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{user?.name || t("brand.userFallback")}</p>
                    <p className="text-sm text-slate-100/90">{roleLabel}</p>
                  </div>
                </div>
                <button type="button" onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-rose-100 transition hover:text-white">
                  <HiOutlineArrowRightOnRectangle />
                  {t("brand.logout")}
                </button>
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

      <SubscriptionModal open={subscriptionOpen} onClose={() => setSubscriptionOpen(false)} />

      <Modal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        description="Pending leave, appointment, and billing updates"
        size="md"
      >
        <div className="space-y-3">
          {notifications?.items?.length ? (
            notifications.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNotificationClick(item)}
                className={`w-full rounded-[24px] border p-4 text-left transition hover:border-brand-400 hover:bg-[var(--panel-bg)] ${
                  item.read ? "border-[var(--border-color)] bg-[var(--panel-muted)] opacity-85" : "border-brand-200 bg-brand-500/8"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{item.detail}</p>
                  </div>
                  <Badge variant={item.read ? "default" : "info"}>{item.read ? "Read" : "New"}</Badge>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--border-color)] bg-[var(--panel-muted)] p-6 text-center">
              <Badge variant="success">All clear</Badge>
              <p className="mt-3 text-sm text-[var(--text-muted)]">No urgent notifications right now.</p>
            </div>
          )}
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setNotificationsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DashboardLayout;
