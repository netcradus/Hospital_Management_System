import { forwardRef } from "react";

const SelectField = forwardRef(function SelectField({ label, error, options, className = "", ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--field-label)]">{label}</span>
      <select
        ref={ref}
        className={`min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70 sm:text-[15px] ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
    </label>
  );
});

export default SelectField;
