import { cn } from "../../utils/cn";
import { getInitials } from "../../utils/dashboard";

const sizes = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
};

function Avatar({ name, size = "md", className = "" }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 font-semibold text-white shadow-lg",
        sizes[size],
        className
      )}
    >
      {getInitials(name || "HM")}
    </div>
  );
}

export default Avatar;
