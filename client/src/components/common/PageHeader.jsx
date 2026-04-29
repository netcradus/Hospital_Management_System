import { Link, useLocation } from "react-router-dom";
import { HiChevronRight } from "react-icons/hi2";
import { cn } from "../../utils/cn";

function humanizeSegment(segment) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PageHeader({ title, description, eyebrow, actions, breadcrumbs }) {
  const location = useLocation();
  const computedCrumbs =
    breadcrumbs ||
    location.pathname
      .split("/")
      .filter(Boolean)
      .map((segment, index, segments) => ({
        label: humanizeSegment(segment),
        to: `/${segments.slice(0, index + 1).join("/")}`,
      }));

  return (
    <header className="space-y-4">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">
        <Link to="/" className="transition hover:text-brand-500">
          Home
        </Link>
        {computedCrumbs.map((crumb) => (
          <span key={crumb.to} className="inline-flex items-center gap-2">
            <HiChevronRight />
            <span className={cn("transition", location.pathname === crumb.to ? "text-[var(--text-primary)]" : "text-[var(--text-dim)]")}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.26em] text-brand-500">{eyebrow}</p> : null}
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">{title}</h1>
          {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

export default PageHeader;
