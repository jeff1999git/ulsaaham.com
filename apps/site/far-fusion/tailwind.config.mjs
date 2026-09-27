import { type Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{astro,html,md,mdx,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Each web font is followed by its size-matched local fallback
        // (@font-face in src/styles/global.css).
        sans: ["'Plus Jakarta Sans'", "'Plus Jakarta Sans Fallback'", ...defaultTheme.fontFamily.sans],
        serif: ["'Playfair Display'", "'Playfair Display Fallback'", ...defaultTheme.fontFamily.serif]
      },
      colors: {
        primary: "#023301",
        accent: "#9bca3b",
        info: "#2591d0",
        light: "#ffffff"
      },
      // The fade-up keyframes live in src/styles/global.css, next to the hero
      // rules that use them too.
      animation: {
        "fade-up": "fade-up 0.9s ease forwards"
      }
    }
  },
  plugins: []
} satisfies Config;

