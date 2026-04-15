import { Link } from "react-router-dom";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
      <div className="rounded-[28px] border border-white/80 bg-white/95 p-8 shadow-soft">
        <div className="mb-6 flex justify-center">
          <LanguageSwitcher tone="light" />
        </div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-600">404</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">{t("notFound.title")}</h1>
        <p className="mt-3 text-slate-500">{t("notFound.description")}</p>
        <Link to="/" className="mt-6 inline-block text-brand-600">
          {t("notFound.link")}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
