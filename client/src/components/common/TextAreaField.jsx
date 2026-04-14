import { forwardRef } from "react";

const TextAreaField = forwardRef(function TextAreaField({ label, error, className = "", ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        ref={ref}
        className={`min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
        {...props}
      />
      {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
    </label>
  );
});

export default TextAreaField;

