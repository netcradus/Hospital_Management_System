import { useLanguage } from "../../context/LanguageContext";

function LanguageSwitcher({ className = "", tone = "dark", compact = false, showLabel = true }) {
  const { language, setLanguage, t } = useLanguage();
  const isLight = tone === "light";

  const options = [
    { value: "en", label: "EN", description: t("language.english") },
    { value: "hi", label: "\u0939\u093f", description: t("language.hindi") },
  ];

  return (
    <div
      className={`inline-flex items-center rounded-full ${
        compact ? "gap-2 px-1.5 py-1.5" : "gap-3 px-2.5 py-2.5"
      } shadow-soft backdrop-blur ${
        isLight ? "border border-slate-300 bg-white/95 shadow-sm" : "border border-white/15 bg-white/10"
      } ${className}`}
    >
      {showLabel && (
        <span
          className={`font-semibold uppercase ${
            compact ? "pl-2 text-[10px] tracking-[0.28em]" : "pl-2 text-[11px] tracking-[0.22em]"
          } ${isLight ? "text-slate-500" : "text-slate-200"}`}
        >
          {t("language.label")}
        </span>
      )}
      <div className={`inline-flex rounded-full ${compact ? "p-0.5" : "p-1"} ${isLight ? "bg-mist-100" : "bg-brand-950/40"}`}>
        {options.map((option) => {
          const isActive = language === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLanguage(option.value)}
              className={`rounded-full font-semibold transition ${
                compact ? "min-w-[42px] px-3 py-1.5 text-xs" : "min-w-[58px] px-3.5 py-2 text-sm"
              } ${
                isActive
                  ? isLight
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-brand-950 shadow-sm"
                  : isLight
                    ? "text-slate-800 hover:bg-white hover:text-brand-700"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
              aria-label={option.description}
              aria-pressed={isActive}
              title={option.description}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
