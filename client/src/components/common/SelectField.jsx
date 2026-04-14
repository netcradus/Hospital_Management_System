import { forwardRef } from "react";

const SelectField = forwardRef(function SelectField({ label, error, options, className = "", ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        ref={ref}
        className={`min-h-[46px] w-full rounded-2xl border border-mist-200 bg-white/95 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-[15px] ${className}`}
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
