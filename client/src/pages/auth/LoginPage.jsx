import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (values) => {
    try {
      const data = await login(values);
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath || getDashboardPath(data.user.role), { replace: true });
    } catch (_error) {
      // AuthContext shows the toast already.
    }
  };

  return (
    <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-soft backdrop-blur sm:rounded-[32px] sm:p-8">
      <div className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
        {t("login.badge")}
      </div>
      <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">{t("login.title")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
        {t("login.description")}
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label={t("login.email")}
          type="email"
          placeholder={t("login.emailPlaceholder")}
          error={errors.email?.message}
          {...register("email", { required: t("login.emailRequired") })}
        />
        <InputField
          label={t("login.password")}
          type="password"
          placeholder={t("login.passwordPlaceholder")}
          error={errors.password?.message}
          {...register("password", { required: t("login.passwordRequired") })}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>

      <p className="mt-6 text-sm leading-6 text-slate-600">
        {t("login.needAccount")}{" "}
        <Link to="/auth/register" className="font-semibold text-brand-700">
          {t("login.registerLink")}
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
