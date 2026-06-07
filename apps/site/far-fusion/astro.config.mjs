import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  image: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  vite: {
    server: {
      proxy: {
        "/api/public": {
          target: "https://ulsaham-admin-panel.vercel.app",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  },
});
