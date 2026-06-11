import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        stadium: "#0a0f1e",
        emeraldGlow: "#22c55e",
        cyanGlow: "#22d3ee",
        leaderGold: "#f59e0b"
      },
      boxShadow: {
        glass: "0 24px 80px rgba(0, 0, 0, 0.35)",
        glow: "0 0 30px rgba(34, 211, 238, 0.22)",
        emerald: "0 0 28px rgba(34, 197, 94, 0.22)",
        gold: "0 0 32px rgba(245, 158, 11, 0.28)"
      },
      backgroundImage: {
        "stadium-grid":
          "radial-gradient(circle at top left, rgba(34, 211, 238, 0.2), transparent 32rem), radial-gradient(circle at top right, rgba(34, 197, 94, 0.16), transparent 28rem), linear-gradient(135deg, #0a0f1e 0%, #050816 55%, #020617 100%)"
      }
    }
  },
  plugins: []
};

export default config;
