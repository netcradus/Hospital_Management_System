import { useEffect } from "react";
import { createPortal } from "react-dom";
import { HiOutlineXMark } from "react-icons/hi2";
import { cn } from "../../utils/cn";

function Modal({ open, onClose, title, description, children, size = "lg", dismissible = true }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && dismissible) {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismissible, onClose, open]);

  if (!open) {
    return null;
  }

  const widths = {
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-md">
      <div className="absolute inset-0" onClick={dismissible ? onClose : undefined} />
      <div className={cn("relative max-h-[90vh] w-full overflow-hidden rounded-[32px] border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-primary)] shadow-2xl animate-[modalIn_220ms_ease-out]", widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] px-6 py-5">
          <div>
            {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p> : null}
          </div>
          {dismissible ? (
            <button type="button" onClick={onClose} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-[var(--panel-muted)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
              <HiOutlineXMark className="text-2xl" />
            </button>
          ) : null}
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
