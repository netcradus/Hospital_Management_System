function Button({ children, className = "", variant = "primary", ...props }) {
  const styles = {
    primary: "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-float hover:from-brand-700 hover:to-brand-600",
    secondary: "border border-mist-200 bg-mist-50 text-slate-900 hover:bg-mist-100",
    ghost: "bg-transparent text-slate-700 hover:bg-mist-100",
  };

  return (
    <button
      className={`inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
