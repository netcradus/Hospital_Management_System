import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineEyeSlash, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi2";
import { useForm } from "react-hook-form";
import useAuth from "../../hooks/useAuth";
import { getDashboardPath } from "../../utils/roleRoutes";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const roleOptions = [
  { value: "super_admin", label: "Super Admin", badge: "SA" },
  { value: "doctor", label: "Doctor", badge: "DR" },
  { value: "receptionist", label: "Receptionist", badge: "RC" },
  { value: "lab_staff", label: "Lab Staff", badge: "LB" },
  { value: "patient", label: "Patient", badge: "PT" },
];

function PlusMark() {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        border: "1.5px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ position: "relative", width: 24, height: 24 }}>
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
            width: 4,
            height: "100%",
            borderRadius: 99,
            background: "white",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            transform: "translateY(-50%)",
            height: 4,
            width: "100%",
            borderRadius: 99,
            background: "white",
          }}
        />
      </div>
    </div>
  );
}

function TeamIllustration() {
  return (
    <svg viewBox="0 0 420 320" style={{ width: "100%", maxWidth: 270 }} aria-hidden="true">
      <circle cx="210" cy="138" r="96" fill="rgba(181,233,245,0.16)" />
      <circle cx="98" cy="72" r="18" fill="rgba(255,255,255,0.18)" />
      <path d="M98 60v24M86 72h24" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
      <g transform="translate(48 132)">
        <circle cx="44" cy="34" r="20" fill="#efb08c" />
        <path d="M24 34c3-17 17-25 30-25 11 0 22 5 27 16-7 7-16 6-26 5-10-1-18 0-31 4Z" fill="#9a6148" />
        <path d="M4 124c4-39 21-60 43-60 22 0 38 19 44 60H4Z" fill="#63d0c8" />
        <path d="M32 64h14l8 60H24l8-60Z" fill="#f7fbfb" />
      </g>
      <g transform="translate(135 78)">
        <circle cx="78" cy="44" r="28" fill="#f1b28c" />
        <path d="M51 46c2-21 20-32 39-32 14 0 28 7 35 22-7 8-19 8-29 5-13-4-26-2-45 5Z" fill="#915a43" />
        <path d="M29 218c0-76 21-108 54-108 34 0 56 28 56 108H29Z" fill="#f8fbfb" />
        <path d="M62 109h16l9 109H48l14-109Z" fill="#177e8f" />
        <path d="M87 109h16l8 109H74l13-109Z" fill="#0f657a" />
        <path d="M29 218c3-43 14-75 31-95l10 95H29Z" fill="#ebf7f7" />
        <path d="M139 218c-3-43-14-75-31-95l-10 95h41Z" fill="#ebf7f7" />
        <rect x="51" y="129" width="18" height="44" rx="9" fill="none" stroke="#97b9c0" strokeWidth="5" />
        <rect x="99" y="129" width="18" height="44" rx="9" fill="none" stroke="#97b9c0" strokeWidth="5" />
        <circle cx="84" cy="153" r="8" fill="#d7edf1" stroke="#97b9c0" strokeWidth="5" />
      </g>
      <g transform="translate(270 132)">
        <circle cx="38" cy="34" r="22" fill="#9a6148" />
        <circle cx="53" cy="30" r="22" fill="#9a6148" />
        <circle cx="46" cy="52" r="24" fill="#efb08c" />
        <path d="M8 124c3-40 21-60 45-60 26 0 42 18 47 60H8Z" fill="#61c3cd" />
        <path d="M33 64h15l9 60H24l9-60Z" fill="#f8fbfb" />
        <path d="M58 64h15l10 60H49l9-60Z" fill="#f8fbfb" />
        <rect x="74" y="82" width="22" height="40" rx="5" fill="#2a879d" />
        <path d="M78 90h14M78 98h14M78 106h14" stroke="#d8eff5" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function StatCard({ label, value, isDark }) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 16,
        border: isDark ? "1px solid rgba(190,231,255,0.22)" : "1px solid rgba(255,255,255,0.24)",
        background: isDark
          ? "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(120,181,255,0.08))"
          : "linear-gradient(180deg,rgba(255,255,255,0.16),rgba(120,181,255,0.12))",
        padding: "18px 8px",
        textAlign: "center",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <p style={{ fontSize: "1.9rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</p>
      <p style={{ marginTop: 10, fontSize: "0.62rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
        {label}
      </p>
    </div>
  );
}

function RoleButton({ role, selected, onClick, isDark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 54,
        borderRadius: 12,
        border: selected ? "1.5px solid #7cd8e6" : isDark ? "1px solid rgba(186,220,236,0.30)" : "1px solid rgba(133,161,186,0.42)",
        background: selected
          ? "linear-gradient(135deg,rgba(122,186,243,0.28),rgba(113,159,255,0.18))"
          : isDark
            ? "rgba(10,41,68,0.30)"
            : "rgba(255,255,255,0.42)",
        padding: "0 14px",
        cursor: "pointer",
        transition: "background 0.18s, border-color 0.18s",
        width: "100%",
        textAlign: "left",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "rgba(225,241,235,0.92)",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#167882",
          flexShrink: 0,
        }}
      >
        {role.badge}
      </span>
      <span style={{ fontSize: "0.95rem", fontWeight: 500, color: isDark ? "#fff" : "#112033" }}>{role.label}</span>
    </button>
  );
}

function InputWrapper({ children, isDark }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 64,
        borderRadius: 14,
        border: isDark ? "1px solid rgba(186,220,236,0.32)" : "1px solid rgba(158,180,199,0.58)",
        background: isDark ? "rgba(181,212,226,0.14)" : "rgba(241,248,250,0.75)",
        padding: "0 20px",
        boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.07)" : "inset 0 1px 0 rgba(255,255,255,0.62)",
      }}
    >
      {children}
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginState, setLoginState] = useState("idle");
  const [selectedRole, setSelectedRole] = useState("");
  const [roleError, setRoleError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "", role: "" } });

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${8 + (i * 11) % 84}%`,
        top: `${4 + (i * 13) % 88}%`,
        size: i % 3 === 0 ? 10 : 6,
      })),
    []
  );

  const onSubmit = async (values) => {
    if (!selectedRole) {
      setRoleError(t("login.roleRequired"));
      return;
    }
    setRoleError("");
    try {
      setLoginState("loading");
      const data = await login({ ...values, role: selectedRole, rememberMe });
      setLoginState("success");
      window.setTimeout(() => {
        navigate(getDashboardPath(data.user.workspaceRole || data.user.role), { replace: true });
      }, 1500);
    } catch (_error) {
      setLoginState("idle");
    }
  };

  const inputStyle = {
    flex: 1,
    border: 0,
    background: "transparent",
    fontSize: "1rem",
    color: isDark ? "#fff" : "#0f172a",
    outline: "none",
  };
  const iconStyle = { flexShrink: 0, fontSize: "1.25rem", color: isDark ? "#d2e2f6" : "#61748d" };
  const labelCapStyle = {
    display: "block",
    marginBottom: 10,
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.38em",
    color: isDark ? "#d6e4f6" : "#4b6481",
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: "var(--app-bg, #07192b)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(circle at 14% 20%,rgba(104,219,205,0.14),transparent 18%),radial-gradient(circle at 82% 18%,rgba(116,171,232,0.12),transparent 22%),radial-gradient(circle at 50% 86%,rgba(21,133,170,0.10),transparent 24%),linear-gradient(180deg,rgba(8,20,35,0.58),rgba(7,25,39,0.36))"
            : "radial-gradient(circle at 14% 20%,rgba(104,219,205,0.22),transparent 18%),radial-gradient(circle at 82% 18%,rgba(116,171,232,0.18),transparent 22%),radial-gradient(circle at 50% 86%,rgba(21,133,170,0.12),transparent 24%),linear-gradient(180deg,rgba(220,242,246,0.45),rgba(148,196,219,0.25))",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "96px 16px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            maxWidth: 1140,
            minHeight: "calc(100vh - 112px)",
            borderRadius: 28,
            overflow: "hidden",
            border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.55)",
            background: isDark ? "rgba(10,31,49,0.62)" : "rgba(255,255,255,0.42)",
            boxShadow: isDark ? "0 36px 120px -52px rgba(3,12,26,0.80)" : "0 36px 120px -52px rgba(57,88,112,0.35)",
            backdropFilter: "blur(20px)",
          }}
        >
          <section
            style={{
              position: "relative",
              width: "32%",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              padding: "28px 24px",
              borderRight: "1px solid rgba(255,255,255,0.10)",
              background:
                "linear-gradient(180deg,rgba(31,71,129,0.90),rgba(33,96,142,0.74) 24%,rgba(33,161,146,0.72) 48%,rgba(32,78,146,0.88) 100%)",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div
                style={{
                  position: "absolute",
                  left: -40,
                  top: 0,
                  width: 160,
                  height: 160,
                  borderRadius: 28,
                  transform: "rotate(45deg)",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "32%",
                  top: "-2%",
                  width: 112,
                  height: 112,
                  borderRadius: 20,
                  transform: "rotate(45deg)",
                  background: "rgba(93,224,209,0.16)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "-2%",
                  width: 64,
                  height: 176,
                  borderRadius: 999,
                  transform: "rotate(40deg)",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              {particles.map((p) => (
                <span
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.28)",
                  }}
                />
              ))}
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <PlusMark />
              <div
                style={{
                  marginTop: 24,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.06))",
                  padding: "26px 16px 20px",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  justifyContent: "center",
                  minHeight: 320,
                }}
              >
                <TeamIllustration />
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 10, marginTop: 18 }}>
              <StatCard label="Patients" value="2400+" isDark={isDark} />
              <StatCard label="Departments" value="48" isDark={isDark} />
              <StatCard label="Uptime" value="99.8%" isDark={isDark} />
            </div>
          </section>

          <section
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "36px 44px",
              background: isDark
                ? "linear-gradient(135deg,rgba(12,46,74,0.96),rgba(12,56,89,0.93) 45%,rgba(10,76,97,0.92) 100%)"
                : "linear-gradient(135deg,rgba(244,250,252,0.92),rgba(233,245,248,0.90) 45%,rgba(219,238,243,0.88) 100%)",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div style={{ position: "absolute", right: 40, top: 24, width: 210, height: 210, borderRadius: "50%", background: "rgba(52,199,180,0.12)", filter: "blur(48px)" }} />
              <div style={{ position: "absolute", left: 80, top: 0, width: 180, height: 180, borderRadius: "50%", background: "rgba(41,128,232,0.10)", filter: "blur(48px)" }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: isDark ? 0.055 : 0.04,
                  backgroundImage: `radial-gradient(circle at 1px 1px,${isDark ? "white" : "#7fa0be"} 1px,transparent 0)`,
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", maxWidth: 700, width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      background: "linear-gradient(135deg,#2cc5b8,#4c8de7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#fff",
                      boxShadow: "0 20px 44px -24px rgba(76,141,231,0.85)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    MC
                  </div>
                  <div>
                    <p style={{ fontSize: "1.65rem", fontWeight: 700, color: isDark ? "#fff" : "#13233c", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                      MEDICare HMS
                    </p>
                    <p style={{ fontSize: "0.62rem", letterSpacing: "0.44em", textTransform: "uppercase", color: isDark ? "#c7d9f1" : "#607a9a", marginTop: 4 }}>
                      Hospital Management System
                    </p>
                  </div>
                </div>
              </div>

              <h1
                style={{
                  marginTop: 36,
                  fontSize: "2.2rem",
                  fontWeight: 700,
                  color: isDark ? "#fff" : "#13233c",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                }}
              >
                {t("login.title") || "Login to your workspace"}
              </h1>

              <form style={{ marginTop: 28, flex: 1, display: "flex", flexDirection: "column" }} onSubmit={handleSubmit(onSubmit)}>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <label style={{ display: "block" }}>
                    <span style={labelCapStyle}>{t("login.email") || "Email"}</span>
                    <InputWrapper isDark={isDark}>
                      <HiOutlineUser style={iconStyle} />
                      <input
                        style={inputStyle}
                        placeholder={t("login.emailPlaceholder") || "admin@hospital.com"}
                        {...register("email", { required: t("login.emailRequired") || "Email is required" })}
                      />
                    </InputWrapper>
                    {errors.email && <p style={{ marginTop: 6, fontSize: "0.82rem", color: isDark ? "#fca5a5" : "#dc2626" }}>{errors.email.message}</p>}
                  </label>

                  <label style={{ display: "block" }}>
                    <span style={labelCapStyle}>{t("login.password") || "Password"}</span>
                    <InputWrapper isDark={isDark}>
                      <HiOutlineLockClosed style={iconStyle} />
                      <input
                        type={showPassword ? "text" : "password"}
                        style={inputStyle}
                        placeholder={t("login.passwordPlaceholder") || "Enter your password"}
                        {...register("password", { required: t("login.passwordRequired") || "Password is required" })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{ background: "none", border: 0, cursor: "pointer", color: isDark ? "#d2e2f6" : "#61748d", fontSize: "1.25rem", padding: 0, display: "flex" }}
                      >
                        {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                      </button>
                    </InputWrapper>
                    {errors.password && <p style={{ marginTop: 6, fontSize: "0.82rem", color: isDark ? "#fca5a5" : "#dc2626" }}>{errors.password.message}</p>}
                  </label>

                  <div>
                    <p style={labelCapStyle}>{t("login.selectRole") || "Select Role to Continue"}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                      {roleOptions.map((role) => (
                        <RoleButton
                          key={role.value}
                          role={role}
                          isDark={isDark}
                          selected={selectedRole === role.value}
                          onClick={() => {
                            setSelectedRole(role.value);
                            setRoleError("");
                          }}
                        />
                      ))}
                    </div>
                    {roleError && <p style={{ marginTop: 6, fontSize: "0.82rem", color: isDark ? "#fca5a5" : "#dc2626" }}>{roleError}</p>}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#d92b7b", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.93rem", color: isDark ? "#d6e4f6" : "#4b6481" }}>{t("login.rememberMe") || "Remember me"}</span>
                  </label>
                  <Link to="/auth/register" style={{ fontSize: "0.93rem", fontWeight: 600, color: isDark ? "#4dd5c6" : "#117f7a", textDecoration: "none" }}>
                    {t("login.forgotPassword") || "Forgot password?"}
                  </Link>
                </div>

                <div style={{ marginTop: 22 }}>
                  <button
                    type="submit"
                    disabled={isLoading || !selectedRole}
                    style={{
                      width: "100%",
                      minHeight: 66,
                      borderRadius: 18,
                      border: 0,
                      background: "linear-gradient(90deg,#58d2c1,#6da2ea)",
                      color: "#fff",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      letterSpacing: "0.01em",
                      cursor: isLoading || !selectedRole ? "not-allowed" : "pointer",
                      opacity: isLoading || !selectedRole ? 0.68 : 1,
                      boxShadow: "0 24px 44px -28px rgba(89,181,233,0.85)",
                      transition: "opacity 0.18s, filter 0.18s",
                    }}
                  >
                    {loginState === "loading"
                      ? t("login.submitting") || "Signing in..."
                      : loginState === "success"
                        ? t("login.success") || "Success"
                        : "Sign in"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
