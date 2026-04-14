function Card({ title, subtitle, children, action }) {
  return (
    <section className="rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-soft backdrop-blur sm:rounded-[28px] sm:p-6">
      {(title || subtitle || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export default Card;
