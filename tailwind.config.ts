import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F6F3F3",
        card: "#FFFFFF",
        ink: "#1A1A1A",
        muted: "#4A4441",
        faint: "#6B6461",
        line: "rgba(26,26,26,0.10)",
        gold: {
          DEFAULT: "#B99353",
          deep: "#B99353",
          text: "#B99353",
          pale: "#E8D4B0",
          mid: "#B99353",
          glow: "#B99353"
        },
        open: {
          bg: "#E3EBDD",
          text: "#4B6B43"
        },
        sand: "#F6F3F3",
        lock: "#6B6461"
      },
      fontFamily: {
        serif: ["Forum", "Georgia", "serif"],
        sans: ["Noto Sans", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
        display: ["Forum", "Georgia", "serif"]
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
