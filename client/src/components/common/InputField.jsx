import { forwardRef } from "react";

const InputField = forwardRef(function InputField({ label, error, className = "", icon: Icon, suffix, ...props }, ref) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-[var(--field-label)]">{label}</span> : null}
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[var(--text-dim)]" /> : null}
        <input
          ref={ref}
          className={`min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70 sm:text-[15px] ${Icon ? "pl-11" : ""} ${suffix ? "pr-14" : ""} ${className}`}
          {...props}
        />
        {suffix ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div> : null}
      </div>
      {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
    </label>
  );
});

export default InputField;
