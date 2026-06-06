# Ulsaaham Celebrations — Web App

Official website for **Ulsaaham Celebrations**, a luxury event planning company. Built as a Bun-powered monorepo with Astro, React, Three.js, and Tailwind CSS, deployed on Vercel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build/) |
| UI Library | [React 19](https://react.dev/) (islands) |
| 3D / WebGL | [Three.js 0.169](https://threejs.org/) |
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
│           │   ├── components/
│           │   │   └── HeroScene.jsx       # Three.js 3D particle animation
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
  "installCommand": "bun install",
  "buildCommand": "bun run build",
  "outputDirectory": "apps/site/far-fusion/dist"
}
```

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

Remote images are served from **Cloudinary** and **Unsplash**. These origins are already whitelisted in `astro.config.mjs`. No additional `.env` setup is required to run the site locally.

---

## Contact (site content)

| Channel | Detail |
|---|---|
| Email | contactulsaaham@gmail.com |
| WhatsApp | +91 9446266011 |
