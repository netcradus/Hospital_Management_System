import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineEnvelope, HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed } from "react-icons/hi2";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { getDashboardPath } from "../../utils/roleRoutes";

function LoginPage() {
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      role: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setLoginError("");
      const data = await login({
        email: values.email,
        password: values.password,
      });
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath || getDashboardPath(data.user.role), { replace: true });
    } catch (error) {
      setLoginError(error.response?.data?.message || "Sign in failed. Please check your credentials.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-[32px] border border-[var(--border-color)] bg-[var(--panel-bg)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl transition-all duration-300 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full bg-brand-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand-800 dark:text-brand-100">
            {t("login.badge")}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-lg font-semibold text-white">
              HM
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-700 dark:text-slate-300">MedAxis Hospital</p>
              <h2 className="mt-1 text-3xl font-semibold leading-tight text-[var(--text-primary)]">Welcome Back</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)] sm:text-base">Sign in to your dashboard</p>
        </div>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label={t("login.email")}
          type="email"
          placeholder={t("login.emailPlaceholder")}
          error={errors.email?.message}
          icon={HiOutlineEnvelope}
          {...register("email", {
            required: t("login.emailRequired"),
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Enter a valid email address",
            },
          })}
        />
        <InputField
          label={t("login.password")}
          type={showPassword ? "text" : "password"}
          placeholder={t("login.passwordPlaceholder")}
          error={errors.password?.message}
          icon={HiOutlineLockClosed}
          suffix={
            <button type="button" onClick={() => setShowPassword((currentValue) => !currentValue)} className="rounded-full p-1 text-[var(--text-muted)] transition hover:bg-[var(--panel-muted)]">
              {showPassword ? <HiOutlineEyeSlash className="text-lg" /> : <HiOutlineEye className="text-lg" />}
            </button>
          }
          {...register("password", {
            required: t("login.passwordRequired"),
            minLength: { value: 8, message: "Password must be at least 8 characters" },
          })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[var(--field-label)]">Workspace role</span>
            <select
              className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70"
              {...register("role")}
            >
              <option value="">Auto-detect role</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="staff">Receptionist</option>
              <option value="patient">Patient</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <Link to="/auth/register" className="text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-200">
            Forgot Password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
              {t("login.submitting")}
            </span>
          ) : (
            t("login.submit")
          )}
        </Button>
        {loginError ? <p className="text-sm font-medium text-red-600 dark:text-red-300">{loginError}</p> : null}
      </form>

      <p className="mt-6 text-sm leading-6 text-[var(--text-muted)]">
        {t("login.needAccount")}{" "}
        <Link to="/auth/register" className="font-semibold text-brand-700 dark:text-brand-200">
          {t("login.registerLink")}
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
