import { forwardRef } from "react";

const SelectField = forwardRef(function SelectField({ label, error, options = [], className = "", ...props }, ref) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-[var(--field-label)]">{label}</span> : null}
      <select
        ref={ref}
        className={`min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70 sm:text-[15px] ${className}`}
        {...props}
      >
        {options.map((option) => {
          const isObj = typeof option === "object" && option !== null;
          const val = isObj ? option.value : option;
          const lbl = isObj ? option.label : option;
          return (
            <option key={val} value={val} className="bg-[var(--panel-bg)] text-[var(--text-primary)]">
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
    </label>
  );
});

export default SelectField;
