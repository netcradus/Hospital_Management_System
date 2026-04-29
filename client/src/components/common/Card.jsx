function Card({ title, subtitle, children, action }) {
  return (
    <section className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 shadow-[var(--panel-shadow)] backdrop-blur sm:rounded-[28px] sm:p-6">
      {(title || subtitle || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-base font-semibold text-[var(--text-primary)] sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export default Card;
