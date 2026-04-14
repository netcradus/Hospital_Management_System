function DataTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-mist-200 bg-white/95">
      <div className="space-y-3 p-3 md:hidden">
        {rows.length ? (
          rows.map((row, index) => (
            <article
              key={row._id || row.id || index}
              className="rounded-[20px] border border-mist-200 bg-white p-4 shadow-sm"
            >
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-4 border-b border-mist-100 pb-3 last:border-b-0 last:pb-0">
                    <span className="min-w-[92px] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {column.label}
                    </span>
                    <div className="flex-1 text-right text-sm text-slate-700">
                      {column.render ? column.render(row[column.key], row) : row[column.key] ?? "-"}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-mist-200 bg-mist-50 px-4 py-8 text-center text-sm text-slate-500">
            No records yet.
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[640px] divide-y divide-mist-200 sm:min-w-[700px]">
          <thead className="bg-mist-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:px-5 sm:tracking-[0.2em]">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-100">
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row._id || row.id || index} className="transition hover:bg-mist-50/70">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 text-sm text-slate-700 sm:px-5 sm:text-[15px]">
                      {column.render ? column.render(row[column.key], row) : row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500">
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
