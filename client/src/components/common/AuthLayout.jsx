import { Outlet } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="fixed right-3 top-3 z-30 sm:right-6 sm:top-6">
        <div className="flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full bg-[var(--panel-bg)]/90 px-1.5 py-1.5 shadow-[var(--panel-shadow)] backdrop-blur sm:px-2 sm:py-2">
          <LanguageSwitcher
            compact
            showLabel={false}
            className="border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-primary)]"
          />
          <ThemeToggle />
        </div>
      </div>
      <Outlet />
    </div>
  );
}

export default AuthLayout;
