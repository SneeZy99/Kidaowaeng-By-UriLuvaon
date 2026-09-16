import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#14171B",
          surface: "#1C2025",
          surface2: "#242A31",
          border: "#2E353D",
          text: "#E9E6DD",
          muted: "#8C939C",
          brass: "#C39A5D",
          brassDim: "#8F7444",
          green: "#7A9873",
          red: "#B5654B",
          amber: "#D8A657",
        },
      },
      fontFamily: {
        display: ["var(--font-oswald)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
