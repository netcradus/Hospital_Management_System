import { useMemo, useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";
import Badge from "./Badge";
import Button from "./Button";
import EmptyState from "./EmptyState";
import SearchInput from "./SearchInput";
import Skeleton from "./Skeleton";

function exportCsv(filename, columns, rows) {
  const csvRows = [
    columns.map((column) => column.label).join(","),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const rawValue = column.exportValue ? column.exportValue(row) : row[column.key];
          return `"${String(rawValue ?? "").replaceAll('"', '""')}"`;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DataTable({
  columns,
  rows,
  isLoading = false,
  title = "Records",
  emptyTitle = "No records found",
  emptyDescription = "The backend did not return any records for this view yet.",
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(null);
  const pageSize = 8;

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const searchedRows = normalizedQuery
      ? rows.filter((row) =>
          columns.some((column) => {
            const rawValue = column.searchValue ? column.searchValue(row) : row[column.key];
            return String(rawValue ?? "")
              .toLowerCase()
              .includes(normalizedQuery);
          })
        )
      : rows;

    if (!sortConfig) {
      return searchedRows;
    }

    return [...searchedRows].sort((leftRow, rightRow) => {
      const leftValue = sortConfig.getValue(leftRow);
      const rightValue = sortConfig.getValue(rightRow);
      const comparison = String(leftValue ?? "").localeCompare(String(rightValue ?? ""), undefined, { numeric: true });
      return sortConfig.direction === "asc" ? comparison : comparison * -1;
    });
  }, [columns, query, rows, sortConfig]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const handleSort = (column) => {
    if (!column.sortable) {
      return;
    }

    setSortConfig((currentSort) => {
      if (currentSort?.key === column.key) {
        return {
          ...currentSort,
          direction: currentSort.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key: column.key,
        direction: "asc",
        getValue: (row) => (column.sortValue ? column.sortValue(row) : row[column.key]),
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}`} />
        <Button type="button" variant="secondary" className="gap-2" onClick={() => exportCsv(`${title.toLowerCase().replaceAll(" ", "-")}.csv`, columns, filteredRows)}>
          <HiOutlineArrowDownTray className="text-lg" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-[24px]" />
          ))}
        </div>
      ) : filteredRows.length ? (
        <>
          <div className="overflow-hidden rounded-[28px] border border-[var(--border-color)] bg-[var(--panel-bg)]">
            <div className="space-y-3 p-3 lg:hidden">
              {paginatedRows.map((row, index) => (
                <article key={row._id || row.id || index} className="rounded-[24px] border border-[var(--border-color)] bg-[var(--panel-muted)] p-4 shadow-sm">
                  <div className="space-y-3">
                    {columns.map((column) => (
                      <div key={column.key} className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] pb-3 last:border-b-0 last:pb-0">
                        <span className="min-w-[92px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-dim)]">
                          {column.label}
                        </span>
                        <div className="flex-1 text-right text-sm text-[var(--text-secondary)]">
                          {column.render ? column.render(row[column.key], row) : row[column.key] ?? "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-[var(--border-color)]">
                <thead className="bg-[var(--panel-muted)]">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-dim)]">
                        <button
                          type="button"
                          onClick={() => handleSort(column)}
                          className={`inline-flex items-center gap-1 ${column.sortable ? "transition hover:text-[var(--text-primary)]" : ""}`}
                        >
                          {column.label}
                          {column.sortable ? (
                            sortConfig?.key === column.key && sortConfig.direction === "desc" ? <HiOutlineChevronDown /> : <HiOutlineChevronUp />
                          ) : null}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {paginatedRows.map((row, index) => (
                    <tr key={row._id || row.id || index} className="transition hover:bg-[var(--panel-muted)]/70">
                      {columns.map((column) => (
                        <td key={column.key} className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                          {column.render ? column.render(row[column.key], row) : row[column.key] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge>{`${filteredRows.length} result${filteredRows.length === 1 ? "" : "s"}`}</Badge>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" disabled={page === 1} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}>
                Previous
              </Button>
              <span className="text-sm text-[var(--text-muted)]">{`Page ${page} of ${totalPages}`}</span>
              <Button type="button" variant="secondary" disabled={page === totalPages} onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}>
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  );
}

export default DataTable;
