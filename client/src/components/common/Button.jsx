import { cn } from "../../utils/cn";

function Button({ children, className = "", variant = "primary", ...props }) {
  const styles = {
    primary:
      "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_18px_42px_-22px_rgba(15,118,107,0.55)] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-18px_rgba(15,118,107,0.45)]",
    secondary: "border border-[var(--border-color)] bg-[var(--panel-muted)] text-[var(--text-primary)] hover:-translate-y-0.5 hover:bg-[var(--panel-bg)]",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--panel-muted)]",
    danger: "bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:-translate-y-0.5",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
