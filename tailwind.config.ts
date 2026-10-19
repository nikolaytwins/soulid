import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0EA",
        card: "#FBF8F4",
        ink: "#2A211D",
        muted: "#5E534C",
        faint: "#8E8178",
        line: "rgba(80,60,45,0.10)",
        gold: {
          DEFAULT: "#E2AE63",
          deep: "#B9813F",
          text: "#8E5F2A",
          pale: "#F3CF94",
          mid: "#D9A055",
          glow: "#F0B865"
        },
        open: {
          bg: "#E3EBDD",
          text: "#4B6B43"
        },
        sand: "#F1E7DA",
        lock: "#A89A8F"
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Manrope", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
        display: ["Unbounded", "Manrope", "system-ui", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 50px rgba(120,85,50,0.08)",
        overlay: "0 30px 80px rgba(42,33,29,0.25)",
        tip: "0 12px 30px rgba(42,33,29,0.25)"
      },
      maxWidth: {
        page: "1440px"
      }
    }
  },
  plugins: []
};

export default config;
