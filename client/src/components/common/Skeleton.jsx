import { cn } from "../../utils/cn";

function Skeleton({ className = "", variant = "line" }) {
  const baseClassName =
    variant === "card"
      ? "rounded-[28px] border border-[var(--border-color)] bg-[var(--panel-bg)]"
      : "rounded-xl bg-[var(--panel-muted)]";

  return <div className={cn("skeleton overflow-hidden relative", baseClassName, className)} />;
}

export default Skeleton;
