import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi2";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import SelectField from "../../components/common/SelectField";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { getDashboardPath } from "../../utils/roleRoutes";

function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: "patient",
    },
  });

  const onSubmit = async (values) => {
    try {
      const data = await registerUser(values);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (_error) {
      // AuthContext shows the toast already.
    }
  };

  return (
    <div className="w-full max-w-xl rounded-[32px] border border-[var(--border-color)] bg-[var(--panel-bg)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl sm:p-8">
      <div className="inline-flex rounded-full border border-brand-200 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand-800 dark:border-brand-400/30 dark:bg-brand-500/16 dark:text-brand-100">
        {t("register.badge")}
      </div>
      <h2 className="mt-3 text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-3xl">{t("register.title")}</h2>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <InputField label={t("register.name")} icon={HiOutlineUser} error={errors.name?.message} {...register("name", { required: t("register.nameRequired") })} />
        <InputField label={t("register.email")} type="email" icon={HiOutlineEnvelope} error={errors.email?.message} {...register("email", { required: t("register.emailRequired") })} />
        <InputField label={t("register.password")} type="password" icon={HiOutlineLockClosed} error={errors.password?.message} {...register("password", { required: t("register.passwordRequired") })} />
        <SelectField
          label={t("register.role")}
          options={[
            { value: "patient", label: t("role.patient") },
            { value: "doctor", label: t("role.doctor") },
            { value: "staff", label: t("role.staff") },
            { value: "admin", label: t("role.admin") },
          ]}
          {...register("role")}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("register.submitting") : t("register.submit")}
        </Button>
      </form>

      <p className="mt-6 text-sm leading-6 text-[var(--text-muted)]">
        {t("register.hasAccount")}{" "}
        <Link to="/auth/login" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-200">
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
