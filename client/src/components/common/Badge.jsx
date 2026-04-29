import { cn } from "../../utils/cn";

const variants = {
  default: "border border-brand-500/20 bg-[var(--badge-surface)] text-[var(--badge-text)]",
  success: "border border-emerald-500/25 bg-emerald-500/18 text-emerald-900 dark:text-emerald-100",
  warning: "border border-amber-500/30 bg-amber-500/22 text-amber-950 dark:text-amber-100",
  danger: "border border-rose-500/25 bg-rose-500/18 text-rose-900 dark:text-rose-100",
  info: "border border-sky-500/25 bg-sky-500/18 text-sky-900 dark:text-sky-100",
};

function Badge({ children, variant = "default", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
