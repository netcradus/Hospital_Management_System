import Badge from "./Badge";
import Skeleton from "./Skeleton";
import { cn } from "../../utils/cn";

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  trend,
  progress,
  isLoading = false,
  className = "",
}) {
  const trendVariant = trend?.value > 0 ? "success" : trend?.value < 0 ? "danger" : "info";

  return (
    <section className={cn("group rounded-[28px] border border-[var(--border-color)] bg-[var(--panel-bg)] p-5 shadow-[var(--panel-shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-2xl", className)}>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 text-brand-600 dark:text-brand-200">
              {Icon ? <Icon className="text-2xl" /> : null}
            </div>
            {trend ? <Badge variant={trendVariant}>{`${trend.value > 0 ? "+" : ""}${trend.value.toFixed(1)}%`}</Badge> : null}
          </div>
          <p className="mt-5 text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <div className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{value}</div>
          {progress ? (
            <div className="mt-4">
              <progress className="stat-progress" max="100" value={Math.min(progress.value, 100)} />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{progress.label}</p>
            </div>
          ) : null}
          {helper ? <p className="mt-4 text-sm text-[var(--text-muted)]">{helper}</p> : null}
        </>
      )}
    </section>
  );
}

export default StatCard;
