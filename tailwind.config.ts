import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#09070F",
          surface: "#141020",
          surface2: "#211633",
          border: "#3A2852",
          text: "#F7EEFF",
          muted: "#AA9BB9",
          brass: "#F29BFF",
          brassDim: "#A96BC4",
          green: "#7EE7C1",
          red: "#FF729F",
          amber: "#FFD0F7",
        },
      },
      fontFamily: {
        display: ["var(--font-oswald)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.07) inset, 0 14px 34px -18px rgba(0,0,0,0.9), 0 0 30px -16px rgba(242,155,255,0.75)",
      },
    },
  },
  plugins: [],
};

export default config;
