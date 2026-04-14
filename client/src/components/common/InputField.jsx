import { forwardRef } from "react";

const InputField = forwardRef(function InputField({ label, error, className = "", ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        ref={ref}
        className={`min-h-[46px] w-full rounded-2xl border border-mist-200 bg-white/95 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-[15px] ${className}`}
        {...props}
      />
      {error && <span className="mt-2 block text-sm text-red-500">{error}</span>}
    </label>
  );
});

export default InputField;
