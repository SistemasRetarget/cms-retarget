import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#faf8f5",
          ink: "#1a1a1a",
          muted: "#6b6b6b",
          accent: "#8b7355",
          soft: "#ede7dd"
        }
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"]
      },
      maxWidth: { prose: "65ch" }
    }
  },
  plugins: []
};
export default config;
