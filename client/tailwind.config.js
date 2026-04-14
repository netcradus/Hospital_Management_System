/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8f6",
          100: "#d8f1ed",
          200: "#b4e3dc",
          500: "#188f83",
          600: "#13756b",
          700: "#0f5e57",
          950: "#072a2b"
        },
        accent: {
          100: "#fff1db",
          500: "#d98927",
          600: "#b96e18"
        },
        mist: {
          50: "#f7fbfb",
          100: "#eef5f5",
          200: "#dbe9e8"
        }
      },
      boxShadow: {
        soft: "0 24px 60px -28px rgba(5, 37, 39, 0.28)",
        float: "0 18px 42px -22px rgba(15, 118, 107, 0.35)"
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top left, rgba(24, 143, 131, 0.26), transparent 34%), radial-gradient(circle at bottom right, rgba(217, 137, 39, 0.18), transparent 28%), linear-gradient(160deg, rgba(7, 42, 43, 0.98), rgba(10, 59, 63, 0.9))",
        "shell-glow": "radial-gradient(circle at top, rgba(24, 143, 131, 0.08), transparent 32%), radial-gradient(circle at right, rgba(217, 137, 39, 0.1), transparent 28%)"
      }
    }
  },
  plugins: []
};
