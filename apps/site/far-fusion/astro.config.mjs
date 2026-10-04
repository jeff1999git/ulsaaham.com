import { defineConfig, passthroughImageService } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";
import { readOnlyProxy } from "./scripts/dev-proxy.mjs";

export default defineConfig({
  site: "https://www.ulsaaham.com",
  output: "server",
  // Since Astro 5.18 an on-demand route trusts the Host and X-Forwarded-Host
  // headers only for the hosts listed here; anything else turns the request
  // URL into https://localhost. That sent Google sign-in back to localhost and
  // made the ticket mailer's same-site check refuse every page of this site.
  security: {
    allowedDomains: [
      { protocol: "https", hostname: "www.ulsaaham.com" },
      { protocol: "https", hostname: "ulsaaham.com" },
      // Vercel preview deployments of this project.
      { protocol: "https", hostname: "**.vercel.app" },
    ],
  },
  // A ceiling for the server routes: the /api/public proxy gives up on reads
  // after 8 s, and nothing here should run for the platform's default minutes.
  adapter: vercel({ maxDuration: 60 }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  // Nothing uses astro:assets: images are sized by Cloudinary URL transforms
  // (src/lib/image.js). The passthrough service, with no remote patterns, keeps
  // /_image from fetching and re-encoding outside images with sharp.
  image: {
    service: passthroughImageService(),
  },
  vite: {
    server: {
      proxy: {
        // `astro dev` reads live data from the production admin panel. Only
        // GET and HEAD are forwarded; anything that writes gets a local 403.
        "/api/public": readOnlyProxy("https://ulsaham-admin-panel.vercel.app"),
      },
    },
  },
});
