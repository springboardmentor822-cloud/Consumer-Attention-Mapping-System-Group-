import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0b1220",
        panel: "#111827",
        line: "#263244",
        brand: "#2563eb",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#38bdf8",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        glow: "0 0 24px 0 rgba(37, 99, 235, 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
