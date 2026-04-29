import { forwardRef } from "react";

const TextAreaField = forwardRef(function TextAreaField({ label, error, className = "", ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--field-label)]">{label}</span>
      <textarea
        ref={ref}
        className={`min-h-28 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-dim)] focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70 ${className}`}
        {...props}
      />
      {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
    </label>
  );
});

export default TextAreaField;
