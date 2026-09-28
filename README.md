# Ulsaaham Celebrations — Web App

Official website for **Ulsaaham Celebrations**, a luxury event planning company. Built as a Bun-powered monorepo with Astro, React and Tailwind CSS, deployed on Vercel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build/) |
| UI Library | [React 19](https://react.dev/) (islands) |
| Styling | [Tailwind CSS 3.4](https://tailwindcss.com/) |
| Package Manager | [Bun 1.3.1](https://bun.sh/) |
| Monorepo | [Turbo 2.6](https://turbo.build/) |
| Deployment | [Vercel](https://vercel.com/) |

---

## Project Structure

```
web-app/                        # Monorepo root
├── apps/
│   └── site/
│       └── far-fusion/         # Main Astro site
│           ├── src/
│           │   ├── components/             # React islands
│           │   ├── layouts/
│           │   │   └── BaseLayout.astro    # HTML shell, SEO meta tags
│           │   ├── pages/
│           │   │   └── index.astro         # Homepage
│           │   └── styles/
│           │       └── global.css          # Global utilities & animations
│           ├── public/
│           │   ├── assets/
│           │   │   └── bg_video.mp4        # Hero background video
│           │   └── favicon.svg
│           ├── astro.config.mjs
│           ├── tailwind.config.mjs
│           └── package.json
├── packages/                   # Shared packages (reserved for future use)
├── turbo.json
├── package.json                # Root workspace config
└── vercel.json
```

---

## Prerequisites

- **[Bun](https://bun.sh/)** >= 1.3.1

Install Bun if you don't have it:

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verify:

```bash
bun --version
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd web-app
```

### 2. Install dependencies

Run this from the **monorepo root**:

```bash
bun install
```

### 3. Start the development server

```bash
bun run dev
```

This uses Turbo to start all apps in parallel. The site will be available at:

```
http://localhost:4321
```

### 4. Build for production

```bash
bun run build
```

Output is written to `apps/site/far-fusion/dist/`.

---

## Running only the Astro site

If you want to work directly inside the site app:

```bash
cd apps/site/far-fusion

# Install (if not done from root)
bun install

# Dev server
bun run dev

# Production build
bun run build

# Preview production build locally
bun run preview
```

---

## Available Scripts

### Root workspace

| Script | Command | Description |
|---|---|---|
| Dev | `bun run dev` | Start all apps via Turbo |
| Build | `bun run build` | Build all apps via Turbo |

### `apps/site/far-fusion`

| Script | Command | Description |
|---|---|---|
| Dev | `bun run dev` | Astro dev server with HMR |
| Build | `bun run build` | Production build |
| Preview | `bun run preview` | Serve the production build locally |

---

## Deployment (Vercel)

The project is pre-configured for Vercel via `vercel.json`:

```json
{
  "framework": "astro",
  "regions": ["bom1"],
  "installCommand": "bun install --frozen-lockfile",
  "buildCommand": "bun run build && mkdir -p .vercel/output && cp -r apps/site/far-fusion/.vercel/output/. .vercel/output/ && node apps/site/far-fusion/scripts/fix-vercel-routes.mjs .vercel/output/config.json"
}
```

The last step moves the adapter's long-cache rule for `/_astro/*` ahead of Vercel's filesystem check (where it otherwise never applies) and adds the security headers; it fails the build if the adapter stops writing that rule. The install fails if `bun.lock` is out of date: run `bun install` and commit the lockfile.

Public event and partner data is cached at the site's edge, and nowhere else. The `/api/public` proxy lets Vercel's CDN keep the exact reads the pages make, and only their 200 responses: event detail for up to 1 minute, upcoming and featured lists for up to 5, past lists and partners for up to an hour (`src/lib/edge-cache.js`). Bookings, payments and ticket lookups always reach the admin panel. A redeploy empties the cache. To check a deployment, fetch the same list twice with GET, e.g. `curl -s -o /dev/null -D - "<site>/api/public/events?page=1&limit=8&upcoming=true"`. The `x-vercel-cache` header should read `MISS` and then `HIT` or `STALE`.

To deploy manually with the Vercel CLI:

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

For production:

```bash
vercel --prod
```

---

## Environment & Image CDN

Remote images are served from **Cloudinary** and sized through its URL transforms (`src/lib/image.js`). Astro's own image service is switched off (passthrough), so `/_image` does not fetch remote images.

Copy `apps/site/far-fusion/.env.example` to `.env` for local work. Under `astro dev`, the browser's `/api/public` calls go to the production admin panel through a read-only proxy: GET and HEAD only, anything that writes gets a 403. Server-side code uses `BACKEND_URL`, which defaults to `http://localhost:3000` outside a production build.

---

## Contact (site content)

| Channel | Detail |
|---|---|
| Email | contactulsaaham@gmail.com |
| WhatsApp | +91 9446266011 |
