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
    <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-soft backdrop-blur sm:rounded-[32px] sm:p-8">
      <div className="inline-flex rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent-600">
        {t("register.badge")}
      </div>
      <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">{t("register.title")}</h2>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <InputField label={t("register.name")} error={errors.name?.message} {...register("name", { required: t("register.nameRequired") })} />
        <InputField label={t("register.email")} type="email" error={errors.email?.message} {...register("email", { required: t("register.emailRequired") })} />
        <InputField label={t("register.password")} type="password" error={errors.password?.message} {...register("password", { required: t("register.passwordRequired") })} />
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

      <p className="mt-6 text-sm leading-6 text-slate-600">
        {t("register.hasAccount")}{" "}
        <Link to="/auth/login" className="font-semibold text-brand-700">
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
