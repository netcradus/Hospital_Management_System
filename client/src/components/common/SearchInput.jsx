import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";
import { cn } from "../../utils/cn";

function SearchInput({ value, onChange, placeholder = "Search", isLoading = false, className = "" }) {
  return (
    <label className={cn("flex min-h-[48px] items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 text-[var(--text-primary)] shadow-sm", className)}>
      <HiOutlineMagnifyingGlass className="text-lg text-[var(--text-muted)]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-dim)]"
      />
      {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" /> : null}
      {value ? (
        <button type="button" onClick={() => onChange("")} className="rounded-full p-1 text-[var(--text-muted)] transition hover:bg-[var(--panel-muted)]">
          <HiOutlineXMark className="text-lg" />
        </button>
      ) : null}
    </label>
  );
}

export default SearchInput;
