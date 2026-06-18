import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        stadium: "#050706",
        emeraldGlow: "#22c55e",
        trophyGold: "#f5c451",
        leaderGold: "#f5c451"
      },
      boxShadow: {
        glass: "0 24px 80px rgba(0, 0, 0, 0.35)",
        glow: "0 0 30px rgba(34, 197, 94, 0.2), 0 0 44px rgba(245, 196, 81, 0.12)",
        emerald: "0 0 28px rgba(34, 197, 94, 0.22)",
        gold: "0 0 32px rgba(245, 196, 81, 0.28)"
      },
      backgroundImage: {
        "stadium-grid":
          "radial-gradient(circle at top left, rgba(34, 197, 94, 0.2), transparent 32rem), radial-gradient(circle at top right, rgba(245, 196, 81, 0.14), transparent 28rem), linear-gradient(135deg, #050706 0%, #090D0A 55%, #0D120F 100%)"
      }
    }
  },
  plugins: []
};

export default config;
