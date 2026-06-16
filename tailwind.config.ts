import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep ocean / abyss base
        abyss: {
          DEFAULT: "#070b12",
          900: "#070b12",
          800: "#0b111c",
          700: "#0f1626",
          600: "#141d31",
          500: "#1b2740",
        },
        ink: {
          primary: "#e8eef6",
          secondary: "#8b97ab",
          muted: "#566276",
          faint: "#3a4356",
        },
        // Signature accent — abyssal cyan/teal
        tide: {
          DEFAULT: "#2ee6d6",
          bright: "#4ff5e6",
          deep: "#0fb8ad",
          dark: "#0a6e68",
        },
        // Semantic
        sev: {
          critical: "#ff5d6c",
          high: "#ff9f43",
          medium: "#ffd166",
          low: "#5dd0a0",
        },
        // HackerOcean — the CTF sub-brand (acid green, HTB-flavoured)
        hop: {
          DEFAULT: "#9fef00",
          dim: "#7bbf00",
          deep: "#3d5c00",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderColor: {
        hair: "rgba(255,255,255,0.07)",
        hover: "rgba(46,230,214,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-tide": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "pulse-tide": "pulse-tide 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
