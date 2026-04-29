import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "../../utils/cn";

function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--panel-muted)] text-[var(--text-primary)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      {isDark ? <HiOutlineSun className="text-xl" /> : <HiOutlineMoon className="text-xl" />}
    </button>
  );
}

export default ThemeToggle;
