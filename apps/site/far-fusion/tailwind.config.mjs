import { type Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{astro,html,md,mdx,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", ...defaultTheme.fontFamily.sans],
        serif: ["'Playfair Display'", ...defaultTheme.fontFamily.serif]
      },
      colors: {
        primary: "#023301",
        accent: "#fecc01",
        light: "#ffffff"
      },
      boxShadow: {
        glow: "0 0 60px rgba(254, 204, 1, 0.28)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.65" },
          "50%": { opacity: "1" }
        },
        "gradient-x": {
          "0%": { "background-position": "0% 50%" },
          "100%": { "background-position": "100% 50%" }
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        float: "float 12s ease-in-out infinite",
        "pulse-soft": "pulse-soft 6s ease-in-out infinite",
        "gradient-x": "gradient-x 16s ease-in-out infinite alternate",
        "fade-up": "fade-up 0.9s ease forwards"
      }
    }
  },
  plugins: []
} satisfies Config;

