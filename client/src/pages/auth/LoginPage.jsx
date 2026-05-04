import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineBellAlert,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineUser,
} from "react-icons/hi2";
import { useForm } from "react-hook-form";
import useAuth from "../../hooks/useAuth";
import { getDashboardPath } from "../../utils/roleRoutes";
import { useLanguage } from "../../context/LanguageContext";

const roleOptions = [
  { value: "super_admin", label: "Super Admin", badge: "SA" },
  { value: "doctor", label: "Doctor", badge: "DR" },
  { value: "receptionist", label: "Receptionist", badge: "RC" },
  { value: "lab_staff", label: "Lab Staff", badge: "LB" },
  { value: "patient", label: "Patient", badge: "PT" },
];

const pills = [
  { label: "Appointments", icon: HiOutlineCalendarDays },
  { label: "Prescriptions", icon: HiOutlineClipboardDocumentList },
  { label: "Billing", icon: HiOutlineCreditCard },
  { label: "Lab Reports", icon: HiOutlineSparkles },
  { label: "Notifications", icon: HiOutlineBellAlert },
];

const quotes = [
  "Wherever the art of medicine is loved, there is also a love of humanity.",
  "Healing is a matter of time, but care is a matter of intention.",
  "The good physician treats the disease; the great physician treats the patient.",
];

function HospitalMark() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/16 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] backdrop-blur">
      <div className="relative h-8 w-8">
        <span className="absolute inset-x-3 top-0 h-full rounded-full bg-white" />
        <span className="absolute inset-y-3 left-0 w-full rounded-full bg-white" />
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginState, setLoginState] = useState("idle");
  const [selectedRole, setSelectedRole] = useState("");
  const [roleError, setRoleError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      role: "",
    },
  });

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${(index * 13) % 100}%`,
        top: `${(index * 17) % 100}%`,
        delay: `${(index % 6) * 0.45}s`,
      })),
    []
  );

  const onSubmit = async (values) => {
    if (!selectedRole) {
      setRoleError(t("login.roleRequired"));
      return;
    }
    setRoleError("");
    try {
      setLoginState("loading");
      const data = await login({ ...values, role: selectedRole, rememberMe });
      setLoginState("success");
      window.setTimeout(() => {
        navigate(getDashboardPath(data.user.workspaceRole || data.user.role), { replace: true });
      }, 1500);
    } catch (_error) {
      setLoginState("idle");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--app-bg)] px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-90px] h-72 w-72 rounded-full bg-[rgba(26,188,156,0.16)] blur-3xl animate-drift" />
        <div className="absolute bottom-[-120px] right-[-60px] h-96 w-96 rounded-full bg-[rgba(41,128,232,0.16)] blur-3xl animate-drift" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[36px] border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-[0_32px_90px_-42px_rgba(15,118,110,0.34)] backdrop-blur-xl animate-fade-up lg:flex-row">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[var(--teal)] via-[var(--teal-dark)] to-[var(--blue)] px-10 py-10 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-between">
          <div className="absolute inset-0">
            {particles.map((particle) => (
              <span
                key={particle.id}
                className="absolute h-1.5 w-1.5 rounded-full bg-white/30 animate-float-y"
                style={{ left: particle.left, top: particle.top, animationDelay: particle.delay }}
              />
            ))}
            <div className="absolute -left-12 top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl animate-drift" />
            <div className="absolute bottom-8 right-8 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl animate-drift" style={{ animationDelay: "1.2s" }} />
          </div>

          <div className="relative z-10">
            <div className="animate-float-y">
              <HospitalMark />
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.36em] text-white/75">{t("auth.network")}</p>
            <h1 className="mt-6 max-w-sm text-5xl font-semibold leading-[0.92]">{t("auth.heroTitle")}</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/82">
              {t("auth.heroDescription")}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {pills.map((pill, index) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur animate-fade-up"
                  style={{ animationDelay: `${200 + index * 70}ms` }}
                >
                  <pill.icon className="text-sm" />
                  {pill.label}
                </span>
              ))}
            </div>
            <div className="mt-7 space-y-3">
              {quotes.map((quote, index) => (
                <blockquote
                  key={quote}
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm leading-6 text-white/90 backdrop-blur animate-fade-up"
                  style={{ animationDelay: `${350 + index * 120}ms` }}
                >
                  "{quote}"
                </blockquote>
              ))}
            </div>
          </div>
          <div className="relative z-10 mt-10 grid grid-cols-3 gap-3">
            {[
              { label: "Patients", value: "2400+" },
              { label: "Departments", value: "48" },
              { label: "Uptime", value: "99.8%" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur animate-fade-up"
                style={{ animationDelay: `${600 + index * 90}ms` }}
              >
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/75">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="relative flex flex-1 items-center justify-center bg-[var(--panel-bg)] px-5 py-10 sm:px-8 lg:px-14">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-[rgba(26,188,156,0.08)] blur-3xl animate-drift" />
            <div className="absolute bottom-16 left-6 h-40 w-40 rounded-full bg-[rgba(41,128,232,0.08)] blur-3xl animate-drift" style={{ animationDelay: "1.4s" }} />
          </div>

          <div className="relative z-10 w-full max-w-xl">
            <div className="flex items-center gap-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-lg font-semibold text-white shadow-[0_16px_36px_-18px_rgba(41,128,232,0.5)]">
                MC
              </div>
              <div>
                <p className="text-3xl font-semibold text-[var(--text-primary)]">MEDICare HMS</p>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--text-dim)]">Hospital Management System</p>
              </div>
            </div>

            <div className="mt-10 animate-fade-up" style={{ animationDelay: "220ms" }}>
              <h2 className="text-5xl font-semibold leading-none text-[var(--text-primary)]">{t("login.title")}</h2>
              <p className="mt-4 text-lg text-[var(--text-muted)]">{t("login.description")}</p>
            </div>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <label className="block animate-fade-up" style={{ animationDelay: "320ms" }}>
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{t("login.email")}</span>
                <div className="flex min-h-[58px] items-center gap-3 rounded-[22px] border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 transition focus-within:border-[var(--teal)] focus-within:shadow-[0_0_0_4px_rgba(26,188,156,0.08)]">
                  <HiOutlineUser className="text-xl text-[var(--text-dim)]" />
                  <input
                    className="w-full border-0 bg-transparent text-[var(--text-primary)] outline-none"
                    placeholder={t("login.emailPlaceholder")}
                    {...register("email", { required: t("login.emailRequired") })}
                  />
                </div>
                {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email.message}</p> : null}
              </label>

              <label className="block animate-fade-up" style={{ animationDelay: "420ms" }}>
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{t("login.password")}</span>
                <div className="flex min-h-[58px] items-center gap-3 rounded-[22px] border border-[var(--border-color)] bg-[var(--panel-muted)] px-4 transition focus-within:border-[var(--teal)] focus-within:shadow-[0_0_0_4px_rgba(26,188,156,0.08)]">
                  <HiOutlineLockClosed className="text-xl text-[var(--text-dim)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border-0 bg-transparent text-[var(--text-primary)] outline-none"
                    placeholder={t("login.passwordPlaceholder")}
                    {...register("password", { required: t("login.passwordRequired") })}
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[var(--text-dim)] transition hover:text-[var(--text-primary)]">
                    {showPassword ? <HiOutlineEyeSlash className="text-xl" /> : <HiOutlineEye className="text-xl" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password.message}</p> : null}
              </label>

              <div className="animate-fade-up" style={{ animationDelay: "480ms" }}>
                <p className="mb-2 block text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {t("login.selectRole")}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {roleOptions.map((role) => {
                    const selected = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.value);
                          setRoleError("");
                        }}
                        className={`relative rounded-xl border p-3 text-left transition ${selected ? "border-[var(--teal)] bg-[rgba(26,188,156,0.15)] shadow-[0_0_0_3px_rgba(26,188,156,0.15)]" : "border-[var(--border-color)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(26,188,156,0.5)] hover:bg-[rgba(26,188,156,0.08)]"}`}
                      >
                        {selected ? <span className="absolute right-2 top-2 text-[var(--teal)]">✓</span> : null}
                        <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--panel-muted)] text-xs font-bold text-[var(--teal-dark)]">{role.badge}</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{role.label}</span>
                      </button>
                    );
                  })}
                </div>
                {roleError ? <p className="mt-2 text-sm text-rose-600">{roleError}</p> : null}
              </div>

              <div className="flex flex-col gap-3 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between animate-fade-up" style={{ animationDelay: "520ms" }}>
                <label className="inline-flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--teal)] focus:ring-[var(--teal)]"
                  />
                  <span>{t("login.rememberMe")}</span>
                </label>
                <Link to="/auth/register" className="font-semibold text-[var(--teal)] transition hover:text-[var(--teal-dark)]">
                  {t("login.forgotPassword")}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedRole}
                className="animate-fade-up animate-pulse-glow flex min-h-[60px] w-full items-center justify-center rounded-[22px] bg-gradient-to-r from-[var(--teal)] via-[var(--teal-dark)] to-[var(--blue)] px-6 text-lg font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ animationDelay: "620ms" }}
              >
                {loginState === "loading" ? t("login.submitting") : loginState === "success" ? t("login.success") : t("login.submit")}
              </button>
            </form>

            <div className="mt-8 animate-fade-up" style={{ animationDelay: "720ms" }}>
              <div className="flex items-center gap-3 text-sm text-[var(--text-dim)]">
                <span className="h-px flex-1 bg-[var(--border-color)]" />
                <span>{t("login.demoModeTitle")}</span>
                <span className="h-px flex-1 bg-[var(--border-color)]" />
              </div>
              <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(26,188,156,0.35)] bg-[rgba(26,188,156,0.05)] p-5 text-center text-sm text-[var(--text-muted)]">
                <p>
                  {t("login.demoModeDescription")}
                </p>
                <p className="mt-2">
                  {t("login.demoModeExamples")}
                </p>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;

