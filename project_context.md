# Project handbook: Ulsaham Entertainments event booking platform

> **Last updated:** 2026-10-17 · branch `dev2` · commit `3bfdcea` (this file itself is not yet committed)
>
> **Covers:** the customer site in this repo, and the backend API plus staff admin panel in the companion repo (`dev3` · `ad5620c`). Line numbers refer to the site code at `187547e` (`3bfdcea` only added `AGENTS.md` and `CLAUDE.md`) and to the admin code at `ad5620c`.
>
> **Secrets policy:** this file never contains secret values or personal data. It names config keys and says where their values live: the Vercel project environment in production, and the git-ignored `.env` (site) and `.env.local` (admin) on a developer machine. Never open or print those files, keystores or private keys from an AI tool, and never paste a secret into a chat, code, a log, a test or this file. A secret that has been exposed is rotated, not hidden.
>
> **Status marker:** **unverified** means not confirmed on a real device or in production.
>
> **Start here:** read §0 to §4, follow the golden rules in §2, and update this file after every change (§0.4).

## Table of contents

- [0. How to use and maintain this file](#0-how-to-use-and-maintain-this-file)
  - [0.1 What this file is](#01-what-this-file-is)
  - [0.2 Reading order](#02-reading-order)
  - [0.3 Conventions used here](#03-conventions-used-here)
  - [0.4 Mandatory steps after every change](#04-mandatory-steps-after-every-change)
  - [0.5 Changelog entry template](#05-changelog-entry-template)
  - [0.6 Rules for editing this file](#06-rules-for-editing-this-file)
  - [0.7 How this file was produced](#07-how-this-file-was-produced)
- [1. Snapshot](#1-snapshot)
- [2. Golden rules](#2-golden-rules)
  - [2.1 Secrets and personal data](#21-secrets-and-personal-data)
  - [2.2 Money and bookings](#22-money-and-bookings)
  - [2.3 Build and deployment](#23-build-and-deployment)
  - [2.4 Database](#24-database)
  - [2.5 Client decisions that must not be undone](#25-client-decisions-that-must-not-be-undone)
  - [2.6 Working agreements](#26-working-agreements)
- [3. Product overview](#3-product-overview)
  - [3.1 What the product is](#31-what-the-product-is)
  - [3.2 Customer journey](#32-customer-journey)
  - [3.3 Roles](#33-roles)
  - [3.4 Event model](#34-event-model)
  - [3.5 Pricing and fees](#35-pricing-and-fees)
  - [3.6 Booking rules](#36-booking-rules)
  - [3.7 What the product does not do](#37-what-the-product-does-not-do)
- [4. Tech stack and key libraries](#4-tech-stack-and-key-libraries)
  - [4.1 Toolchain and runtimes](#41-toolchain-and-runtimes)
  - [4.2 Customer site libraries](#42-customer-site-libraries)
  - [4.3 Admin panel and backend libraries](#43-admin-panel-and-backend-libraries)
  - [4.4 Pins and upgrade constraints](#44-pins-and-upgrade-constraints)
  - [4.5 What is deliberately not used and why](#45-what-is-deliberately-not-used-and-why)
- [5. Repository layout](#5-repository-layout)
  - [5.1 Two repositories and how they relate](#51-two-repositories-and-how-they-relate)
  - [5.2 Customer site repo](#52-customer-site-repo)
  - [5.3 Admin repo](#53-admin-repo)
  - [5.4 Where to look first](#54-where-to-look-first)
- [6. Architecture](#6-architecture)
  - [6.1 System map](#61-system-map)
  - [6.2 Startup and request lifecycle](#62-startup-and-request-lifecycle)
  - [6.3 Routing and pages](#63-routing-and-pages)
  - [6.4 Client state and browser storage](#64-client-state-and-browser-storage)
  - [6.5 Client API layer](#65-client-api-layer)
  - [6.6 Customer sign-in lifecycle](#66-customer-sign-in-lifecycle)
  - [6.7 Configuration and environments](#67-configuration-and-environments)
  - [6.8 Forms and validation](#68-forms-and-validation)
  - [6.9 Time and money rules](#69-time-and-money-rules)
- [7. API and backend reference](#7-api-and-backend-reference)
  - [7.1 Conventions](#71-conventions)
  - [7.2 Site server routes](#72-site-server-routes)
  - [7.3 Admin public API](#73-admin-public-api)
  - [7.4 Razorpay webhook](#74-razorpay-webhook)
  - [7.5 Signed server-to-server call](#75-signed-server-to-server-call)
  - [7.6 Error codes](#76-error-codes)
  - [7.7 Rate limits](#77-rate-limits)
  - [7.8 Edge cache policy](#78-edge-cache-policy)
  - [7.9 Public data contracts](#79-public-data-contracts)
  - [7.10 External APIs the code calls](#710-external-apis-the-code-calls)
  - [7.11 Staff-only HTTP routes](#711-staff-only-http-routes)
- [8. Feature guide](#8-feature-guide)
  - [8.1 Home page](#81-home-page)
  - [8.2 Events list](#82-events-list)
  - [8.3 Event detail](#83-event-detail)
  - [8.4 Booking and payment](#84-booking-and-payment)
  - [8.5 Payment recovery](#85-payment-recovery)
  - [8.6 Customer sign-in screens](#86-customer-sign-in-screens)
  - [8.7 My Bookings](#87-my-bookings)
  - [8.8 Tickets](#88-tickets)
  - [8.9 Brand partners, static pages, navigation, SEO and the 404 page](#89-brand-partners-static-pages-navigation-seo-and-the-404-page)
  - [8.10 Staff sign-in, navigation and role-based screens](#810-staff-sign-in-navigation-and-role-based-screens)
  - [8.11 Event management](#811-event-management)
  - [8.12 Participants](#812-participants)
  - [8.13 Excel import and export](#813-excel-import-and-export)
  - [8.14 Gate scanner](#814-gate-scanner)
  - [8.15 Counter enrolment and counter payments](#815-counter-enrolment-and-counter-payments)
  - [8.16 Dashboard and revenue](#816-dashboard-and-revenue)
  - [8.17 Activity logs](#817-activity-logs)
  - [8.18 Staff accounts](#818-staff-accounts)
  - [8.19 Settings and brand partners](#819-settings-and-brand-partners)
- [9. UI foundation and coding conventions](#9-ui-foundation-and-coding-conventions)
  - [9.1 Customer site design tokens](#91-customer-site-design-tokens)
  - [9.2 Customer site CSS conventions](#92-customer-site-css-conventions)
  - [9.3 Customer site reusable components](#93-customer-site-reusable-components)
  - [9.4 Images and media rules](#94-images-and-media-rules)
  - [9.5 Admin UI foundation](#95-admin-ui-foundation)
  - [9.6 Coding conventions, both repos](#96-coding-conventions-both-repos)
  - [9.7 Misspelled-but-real names](#97-misspelled-but-real-names)
  - [9.8 Accessibility and performance rules](#98-accessibility-and-performance-rules)
- [10. Admin panel and backend internals](#10-admin-panel-and-backend-internals)
  - [10.1 Layering and request paths](#101-layering-and-request-paths)
  - [10.2 Staff sign-in and sessions](#102-staff-sign-in-and-sessions)
  - [10.3 Role matrix](#103-role-matrix)
  - [10.4 Server actions](#104-server-actions)
  - [10.5 Admin env keys](#105-admin-env-keys)
  - [10.6 Housekeeping jobs](#106-housekeeping-jobs)
  - [10.7 Rate limiting and visitor IP trust](#107-rate-limiting-and-visitor-ip-trust)
  - [10.8 Uploads and Cloudinary](#108-uploads-and-cloudinary)
  - [10.9 Activity logging](#109-activity-logging)
- [11. Database schema](#11-database-schema)
  - [11.1 Engine and access](#111-engine-and-access)
  - [11.2 Models](#112-models)
  - [11.3 Indexes](#113-indexes)
  - [11.4 Rules for changing the schema](#114-rules-for-changing-the-schema)
  - [11.5 Data rules](#115-data-rules)
  - [11.6 Seed and maintenance scripts](#116-seed-and-maintenance-scripts)
- [12. Deployment and infrastructure](#12-deployment-and-infrastructure)
  - [12.1 The two Vercel projects](#121-the-two-vercel-projects)
  - [12.2 How the site build reaches Vercel](#122-how-the-site-build-reaches-vercel)
  - [12.3 Domains and redirects, allowed hosts, preview deployments](#123-domains-and-redirects-allowed-hosts-preview-deployments)
  - [12.4 Edge caching in production](#124-edge-caching-in-production)
  - [12.5 Environment variables on Vercel](#125-environment-variables-on-vercel)
  - [12.6 The admin deployment](#126-the-admin-deployment)
  - [12.7 Monitoring and logs](#127-monitoring-and-logs)
- [13. Patches and tooling](#13-patches-and-tooling)
  - [13.1 Patches](#131-patches)
  - [13.2 Dev proxy](#132-dev-proxy)
  - [13.3 Lint and type tooling](#133-lint-and-type-tooling)
  - [13.4 Bundle-size guards](#134-bundle-size-guards)
  - [13.5 Test support code](#135-test-support-code)
  - [13.6 Maintenance scripts as tools](#136-maintenance-scripts-as-tools)
  - [13.7 Editor config, line endings and encoding](#137-editor-config-line-endings-and-encoding)
- [14. Build, run and release](#14-build-run-and-release)
  - [14.1 First-time setup on a new machine](#141-first-time-setup-on-a-new-machine)
  - [14.2 Everyday commands](#142-everyday-commands)
  - [14.3 What local development can and cannot exercise](#143-what-local-development-can-and-cannot-exercise)
  - [14.4 Release process](#144-release-process)
  - [14.5 Release checklist](#145-release-checklist)
  - [14.6 Rollback and emergencies](#146-rollback-and-emergencies)
- [15. Third-party services and accounts](#15-third-party-services-and-accounts)
- [16. Console and deployment decisions already made](#16-console-and-deployment-decisions-already-made)
  - [16.1 Decisions made](#161-decisions-made)
  - [16.2 Options considered and rejected](#162-options-considered-and-rejected)
  - [16.3 Actions handed to the owner and not confirmed done](#163-actions-handed-to-the-owner-and-not-confirmed-done)
- [17. Known issues and open items](#17-known-issues-and-open-items)
  - [17.1 How to use this list](#171-how-to-use-this-list)
  - [17.2 Blockers](#172-blockers)
  - [17.3 Business rules awaiting the owner](#173-business-rules-awaiting-the-owner)
  - [17.4 Security](#174-security)
  - [17.5 Bugs and risky behaviour](#175-bugs-and-risky-behaviour)
  - [17.6 Tech debt and stale documentation](#176-tech-debt-and-stale-documentation)
  - [17.7 Unverified](#177-unverified)
  - [17.8 Recently resolved](#178-recently-resolved)
- [18. Testing, quality baselines and debugging recipes](#18-testing-quality-baselines-and-debugging-recipes)
  - [18.1 Baselines on 2026-10-11](#181-baselines-on-2026-10-11)
  - [18.2 Test map](#182-test-map)
  - [18.3 How to run each check](#183-how-to-run-each-check)
  - [18.4 What is not covered by automated tests](#184-what-is-not-covered-by-automated-tests)
  - [18.5 Debugging recipes](#185-debugging-recipes)
  - [18.6 Production smoke checks](#186-production-smoke-checks)
- [19. History, branches and versioning](#19-history-branches-and-versioning)
  - [19.1 Branch conventions](#191-branch-conventions)
  - [19.2 Versioning](#192-versioning)
  - [19.3 Timeline](#193-timeline)
  - [19.4 Things tried and later removed or rejected](#194-things-tried-and-later-removed-or-rejected)
  - [19.5 Incidents](#195-incidents)
- [20. Changelog](#20-changelog)
- [21. Glossary](#21-glossary)

---

## 0. How to use and maintain this file

### 0.1 What this file is

- The single source of truth for this product. It must be enough, on its own, to understand, build, release and safely change the project on a new machine or in a different coding tool.
- It lives at the root of the customer-site repo and covers the WHOLE product: the customer site (this repo), and the backend API plus staff admin panel (the companion repo, see §1 and §5.1). The companion repo has no copy of this file.
- When this file and the code disagree, the code wins. Fix this file in the same change and say so in the changelog entry.

### 0.2 Reading order

This file is long (about 3,600 lines) because it is a reference for two codebases. Nobody should read it end to end, and an AI agent must not load it whole: read §0 to §4 in full (about 400 lines), then use the table of contents to open only the sections the task needs.

| You are | Read |
|---|---|
| New to the project (person or AI agent) | §0, §1, §2, §3, §4 in full, then §5 and §6 |
| About to change a feature | its subsection in §8, the endpoints it uses in §7, then §2 again |
| About to change the database or a booking rule | §11.4, §11.5, §2.2, §2.4 |
| Setting up a new machine | §14.1, then §18.3 to prove the setup works |
| Releasing | §14.4, §14.5, §12 |
| Debugging production | §18.5, §18.6, §19.5 |
| Asked to "just fix" an open item | §17 first: many items wait for an owner decision |

### 0.3 Conventions used here

| Convention | Meaning |
|---|---|
| `site:path` | Relative to `apps/site/far-fusion/` in this repo, for example `site:src/lib/api.js:40` |
| `root:path` | Relative to the root of this repo, for example `root:vercel.json` |
| `admin:path` | Relative to the root of the companion repo (admin panel and backend API) |
| `path:12-30` | Line numbers at the commit named in the header. They drift; the file and the function name are the stable part |
| **unverified** | Not confirmed on a real device or in production. Treat it as a claim to test, not a fact |
| G1, G2 ... | Golden rules (§2) |
| K1-K7, D26, BLK-, SEC-, BUG-, DEBT-, UNV-, DONE- | Open-item ids (§17). Ids are stable and never reused |
| DEC-01 ... | Console and deployment decisions (§16) |
| §7.3 | A pointer to another section. Each fact has one home; other sections point to it |

### 0.4 Mandatory steps after every change

Do these in the same piece of work as the change, before handing it over:

1. **Changelog:** add an entry at the top of §20 using the template in §0.5.
2. **Stale sections:** search this file for every file, function, constant, endpoint, env key or rule you touched, and correct each mention. A changed limit or timeout usually appears in §7 and §8.
3. **Open items (§17):** add anything you found and did not fix, with a new id. Move anything you resolved to §17.8 with the date and commit. Never renumber.
4. **Golden rules (§2):** if the change came out of an incident or an owner decision, add a rule with its why.
5. **Baselines (§18.1):** if a test count, lint count or bundle size changed, update the table and its date.
6. **Header:** bump "Last updated" (date, branch, short commit).
7. **Scan:** run the secret and personal-data scan in §0.6 over this file.
8. **Do not commit.** Leave the change in the working tree for the owner to review (G-rules in §2.6).

A change in the companion repo needs the same steps whenever it alters anything this file describes.

### 0.5 Changelog entry template

```markdown
#### YYYY-MM-DD - branch - site or admin - Short title
- **What:** what changed, in one or two lines, with the main paths.
- **Why:** the problem, request or decision behind it.
- **Verified:** how it was checked (tests run and their counts, build, a production GET, a device), or "not verified".
- **Follow-ups:** what is left, with §17 ids, or "none".
```

### 0.6 Rules for editing this file

- **No secret values, ever:** no passwords, tokens, API keys, private keys, connection strings or database host names. Name the config key and say where the value lives.
- **No personal data:** no real people's names, e-mail addresses, phone numbers, payment ids, real ticket codes or account names. Point to the constant and its file instead.
- **Never open** `.env`, `.env.local`, keystores, private keys or service-account files to fill this file in. `.env.example` is the reference for key names.
- **Say why** for every non-obvious rule. A rule without its reason gets "simplified" away by the next person.
- **Mark the unconfirmed** as **unverified**, and remove the marker only when someone has seen it work on a device or in production.
- **Keep headings plain** (letters, digits, spaces, dots, hyphens, commas) so the table of contents anchors keep working, and update the table of contents when a heading changes.
- **Scan before finishing.** Run the command below from the repo root and remove every real hit. It looks for cloud and payment key prefixes, private-key blocks, connection strings, e-mail addresses, 10-digit numbers and long opaque strings. The square brackets stop the command from matching its own text, so a clean file prints nothing.

```bash
grep -nE "AK[I]A|AI[z]a|sk_[l]ive|rzp_[l]ive|BEGIN [A-Z ]*PRIVATE|mongodb[+]srv|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|[0-9]{10}|[A-Za-z0-9+=]{32,}" project_context.md
```

### 0.7 How this file was produced

- Written on 2026-10-11 from the code at the commits named in the header. Eight read-only area reads of both repos were each fact-checked against the code; twelve section drafts were then each checked against the code again.
- Run on the dev machine that day: the site tests, build, after-build checks and lint; the admin type-check, tests and lint. Not run: the admin build and bundle check (figures from 2026-10-04 are marked as such in §18.1).
- Production was checked with read-only GET and HEAD requests only (§18.6). E-mail delivery, payments, the webhook and the gate scanner were NOT exercised and are listed as **unverified** in §17.7.

---

## 1. Snapshot

| Item | Value |
|---|---|
| Product | Event booking and ticketing platform for Ulsaham Entertainments: a customer website, a backend REST API and a staff admin panel |
| Public site | `https://www.ulsaaham.com` (the apex domain answers 308 to `www`) |
| Admin panel and API host | `https://ulsaham-admin-panel.vercel.app` (the site reaches it server-side through its own `/api/public` proxy) |
| This repo (customer site) | GitHub `jeff1999git/ulsaaham.com`; local folder name `web-app`; app in `apps/site/far-fusion` |
| Companion repo (admin panel and backend API) | GitHub `jeff1999git/UlsahamAdminPanel` |
| Production branch | `main` in both repos; a merge to `main` deploys on Vercel |
| Working branches | `dev2` (site), `dev3` (admin); merged to `main` by the owner through pull requests (§19.1) |
| State on 2026-10-11 | Site `dev2` `187547e` has the same content as `origin/main` `3b3de89` (PR #27). Admin `dev3` `ad5620c` has the same content as `origin/main` `cdfee7e` (PR #30). Both working trees clean |
| Identifiers | Packages: `web-app` (repo root), `far-fusion` 0.0.1 (site app), `ulsaham-admin` 0.1.0. Ticket codes start `UE-`. Browser storage keys start `ulsaham_`; cookie names do not (§6.4) |
| Versions and releases | Package versions are never bumped and there are no git tags; a release is a pull-request merge to `main` (§19.2) |
| Site stack | Astro 5.18.2 (server output, `@astrojs/vercel` 8.2.11), React 19.2.0 islands, Tailwind CSS 3.4.18, JavaScript and JSX, nodemailer 10.0.13; Bun workspace with Turborepo 2.6.0 |
| Admin and API stack | Next.js 15.5.27 (App Router), React 19.2.6, TypeScript 5.9.3, Prisma 5.22.0 on MongoDB, NextAuth 5.0.0-beta.32, Zod 3.25.76, Tailwind CSS 3.4.19 with shadcn/ui, Razorpay SDK 2.9.8, Vitest 3.2.7; npm |
| Platforms | Web only, responsive. Phones are the main target for customers and for gate staff. No native apps |
| Toolchain | Node 20.9 or newer on the 20 line, or 22 and later (the dev machine has v20.11.0; nothing in either repo pins it, see §4.1), Bun 1.3.x for the site, npm for the admin. Dev machine is Windows 11; Vercel builds on Linux |
| Environments | Production, plus Vercel preview deployments. No staging. Local site development reads production data through a GET and HEAD only proxy (§13.2) |
| Hosting | Two Vercel projects, both pinned to region `bom1` (Mumbai), next to the database. Confirmed in production on 2026-10-11 (§18.6) |
| Services | Razorpay (payments), MongoDB Atlas (database), Cloudinary (images and hero video), Upstash Redis (rate limits and job throttles), Brevo SMTP relay (e-mail), Google OAuth (customer sign-in), Vercel Speed Insights (site), GitHub (§15) |
| Money and time | Indian rupees; Razorpay amounts and recorded revenue are in paise. Every event date and booking window is in IST (§6.9) |
| Automated checks | Site: 239 tests (`node --test`). Admin: 690 tests (Vitest). No CI: nothing runs them automatically (§18.1) |
| Biggest open risks | Seven business rules wait for an owner decision (K1-K7), ticket e-mail delivery is **unverified** since its fix, and there is no CI or error tracking (§17) |

---

## 2. Golden rules

Break none of these without the owner's explicit say-so. Every rule names the incident or decision behind it and what enforces it. "process" means nothing in code or tests will stop you. IDs are stable: add new rules with the next free number and never renumber. Incident timeline: §19. Open decisions: §17.

### 2.1 Secrets and personal data

| ID | Rule | Why | Enforced by |
|---|---|---|---|
| G1 | Never open, print or copy `.env`, `.env.local` or any `.env.*` file; `.env.example` is the only readable one. Never load `dotenv` or `.env.local` in a test | `admin:.env.local` holds PRODUCTION credentials (agreed 2026-09-27) | process; `admin:vitest.config.ts:8-10`; `admin:test/setup.ts:4-5,29-39`; `site:tests/mail/support/load.mjs:12-16`; ignore rules `root:.gitignore:19-23`, `site:.gitignore:17-18`, `admin:.gitignore:27-32` |
| G2 | The owner generates secrets in their own terminal. A secret never goes into a chat, code, a log, a test or this file | A value that has been pasted anywhere must be rotated (`site:.env.example:3`) | process |
| G3 | Site server code reads env by literal name only: `import.meta.env.NAME` with a `process.env.NAME` fallback (`SITE_URL` is read from `process.env` alone, `site:src/lib/mailer.js:19-22`). Never index, spread, destructure or alias `import.meta.env`; never read env in browser code | Any other form makes the bundler inline the whole build-time environment, SMTP password included. The `process.env` half dates from 2026-08-08: values added after a build were missing in production | `site:src/lib/mailer.js:6-10`; `site:tests/mail/support/hooks.mjs:28-47` (guards `mailer.js` and `otp.js` only); `site:tests/mail/client-bundle.test.mjs:63` after a build |
| G4 | Delete `site:.vercel/output` and `site:dist` (and `root:.vercel/output` if the output was copied there) once a local build has been inspected | A local build writes this machine's `.env` values into the server chunks as literals (`site:tests/mail/client-bundle.test.mjs:5-9`) | process |
| G5 | No real names, addresses, phone numbers, payment ids or ticket codes in code comments, tests, logs, commit messages or this file. Point to the constant instead | Bookings are personal data, and so is the output of the report script and of a participant export | process (scan in §0.6); `site:tests/lib/contact.test.mjs:37-54` |
| G6 | The public event payload is an allow-list. Coupon and complimentary codes, Cloudinary ids and counters never leave the server | A leaked complimentary code is a free ticket; a new `Event` column must stay private until someone adds it on purpose | `admin:src/services/event.service.ts:178-212`; `admin:test/public-event.test.ts:117-179`; `site:tests/contract/public-event.test.mjs:205` |
| G7 | No server may treat the customer's signed-in state as proof of identity | It is a `localStorage` entry; there is no server session (§6.6) | comment at `site:src/pages/api/auth/verify-otp.js:10-15`; otherwise process |

### 2.2 Money and bookings

| ID | Rule | Why | Enforced by |
|---|---|---|---|
| G8 | A paid booking is built only from the Razorpay ORDER notes the server wrote: never from the request body, never from the payment's own notes | Until 2026-09-27 one real payment could be replayed for any event or seat count; the payer can set payment notes at Checkout | `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:122-130,162-168`; `admin:src/app/api/razorpay/webhook/route.ts:79-84`; `admin:test/payment-routes.test.ts:245` |
| G9 | The server prices every order; `site:src/lib/fees.js` is display only. A rate or rounding change edits `admin:src/lib/pricing.ts`, `fees.js` and the fee fixture in BOTH repos in one piece of work | The total shown before payment must be the total charged | `admin:test/pricing.test.ts:55-206`; `site:tests/lib/fees.test.mjs`; run-time check `site:src/components/RegistrationForm.jsx:707-716` |
| G10 | Bookings stay idempotent: paid ones on the Razorpay order id, free ones on `requestId`, with the ticket code seeded from that key | Browser confirmation, the webhook and retries race each other; the failure is a second ticket or a second charge (2026-09-13, 2026-10-04) | `admin:src/services/participant.service.ts:76-82,106-151`; `admin:src/lib/ticket-code.ts:17-32`; `admin:test/booking-logic.test.ts:231-366` |
| G11 | No Pay button on the verify-failed panel, and no way round the "Checking your last payment" panel | Paying again charges twice (payment round of 2026-10-04) | comments only: `site:src/components/VerifyFailed.jsx:5-8`, `site:src/components/RegistrationForm.jsx:412-414` |
| G12 | Keep verify answers inside the retry scheme: the site retries status 0, 500, 502, 503 and 504 after 1, 3 and 6 s; any 4xx except 429 is final and clears the pending-payment record (`site:src/components/RegistrationForm.jsx:394`) | An answer outside the scheme either loops or throws away a paid customer's recovery | `site:src/lib/payment-flow.js:26-36`; `site:tests/lib/payment-flow.test.mjs` |
| G13 | Do not close booking for, cancel, delete or re-slug an event while payments may be in flight | A paid booking is written only while the STORED status is `PUBLISHED`. Otherwise verify answers 500 `REGISTRATION_FAILED` (booking closed, or `COMPLETED` already stored) or 404 `EVENT_NOT_FOUND` (cancelled, deleted, slug changed): money taken, no ticket. Open decision K2 | none: process. The checks that refuse: `admin:src/services/participant.service.ts:86`; `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:149-160,246-256`. Afterwards the owner runs the read-only report (§13.6) |
| G14 | Keep the Razorpay webhook on the `payment.captured` event | Every other event is answered `ignored`; the webhook is the only recovery when the browser never returns | `admin:src/app/api/razorpay/webhook/route.ts:56-59`; `admin:test/payment-routes.test.ts:498` |
| G15 | Never send POST, PUT or DELETE to production as a test: no test bookings or payments against the live database | They would be real bookings and real charges | `site:scripts/dev-proxy.mjs:8-26` (dev reads production with GET and HEAD only); `site:tests/dev/dev-proxy.test.mjs:39-61`; otherwise process |
| G16 | Ticket mail is built on the server from the booking the admin holds. A request carries only the ticket code and the address, and an unpaid booking is never mailed (409) | Until 2026-09-14 the route mailed any JSON, from anyone, from the company address | `site:src/pages/api/send-ticket.js:49-52,73-76`; `site:src/lib/ticket-mail.js:54-60`; `site:tests/mail/routes.test.mjs` |

### 2.3 Build and deployment

| ID | Rule | Why | Enforced by |
|---|---|---|---|
| G17 | Vercel deploys `root:.vercel/output`. Set no `outputDirectory`, keep the copy and patch steps of the build command (`root:vercel.json:6`), never commit a `.vercel` or `.turbo` folder, keep `.vercel/output/**` in the Turbo outputs | Until 2026-07-30 Vercel was pointed at `site:dist`: static routes 404, every API route `FUNCTION_INVOCATION_FAILED`. Until 2026-08-01 a cached build restored only `dist/**`, so stale committed output was deployed | `root:vercel.json:6`; `root:turbo.json:6`; `root:.gitignore:37,40`; `site:.gitignore:27,30`; `site:scripts/fix-vercel-routes.mjs:56-62` fails the build |
| G18 | Import server dependencies statically, never through `createRequire`. After any dependency or server-route change run a build, then `BUNDLE_CHECK=1 node --test tests/build/` | 2026-06-12 to 2026-10-04: `qrcode` was left out of the function and no ticket e-mail was sent. A local run hides it, because Node finds the package in a parent `node_modules` | `site:src/lib/ticket-mail.js:1-4`; `site:tests/build/function-smoke.test.mjs:74-87` |
| G19 | A new hostname goes into `security.allowedDomains`, and into the Google client's redirect URIs, before it serves traffic | 2026-09-28 to 2026-10-04: after the move to Astro 5.18 unlisted hosts read as `https://localhost`; Google sign-in returned to localhost and ticket mail answered 403 | `site:astro.config.mjs:14-21`; `site:tests/build/function-smoke.test.mjs:131-135` |
| G20 | Treat every env change as needing a redeploy. Never set `NODE_ENV` by hand | Values are fixed into a deployment when it is created (empty commit `aff0b98`, 2026-08-01, to redeploy) | process; `admin:.env.example:44` |
| G21 | `PROXY_SHARED_SECRET` is identical in both Vercel projects: change both, redeploy both | When it differs all visitors share one rate-limit bucket and webhook ticket mail answers 401, while bookings keep working, so nothing visible points at it | log lines only: `admin:src/lib/ratelimit.ts:213-219`, `site:src/lib/backend.js:54-64` |
| G22 | When the API contract changes release ADMIN first, then SITE, and add any new endpoint to the proxy path list | The site proxies to the live admin; a path not on the list is a 404 at the proxy | process (§14.4); `site:src/pages/api/public/[...path].js:20-22`; `site:tests/contract/public-event.test.mjs` |
| G23 | Nothing gates a deploy: there is no CI and the Vercel build runs no tests. Run the §14.5 checklist before handing work over; raise a bundle budget only on purpose, in the same change | Two production outages (G18, G19) passed every offline test (`site:tests/build/function-smoke.test.mjs:1-11`) | process; `site:tests/build/bundle-budget.test.mjs:20-34`; `admin:scripts/check-bundle.mjs:27-45` |

### 2.4 Database

| ID | Rule | Why | Enforced by |
|---|---|---|---|
| G24 | The build never runs `prisma db push`. The owner pushes an index or `@unique` change to the production database BEFORE the code that relies on it is merged (§11, §14.4) | 2026-09-13 to 2026-10-04: a unique index on (eventId, phone) that the schema had dropped stayed in production. On 2026-10-04 a second booking was charged and then refused | `admin:package.json:7`; guard `admin:src/lib/index-guard.ts:4-8,74-94`; 409 before any order at `admin:src/app/api/public/events/[slug]/payment/order/route.ts:120-128`; `admin:test/booking-logic.test.ts:102-229` |
| G25 | Never make phone or e-mail unique per event again, and never put `@unique` on an optional field | Owner rule of 2026-09-08 (G27). A MongoDB unique index counts a missing value as one value (**unverified** here), so optional keys carry plain indexes or none | `admin:prisma/schema.prisma:124-131,142-149`; the G24 guard |
| G26 | A field added to an existing model is optional or has a `@default`, and every filter on it copes with documents that lack it (`isSet`, `NOT`) | On MongoDB a missing field is not `null`: a compare-and-set on `enteredCount` silently missed older bookings (found in review, 2026-09-28) | `admin:src/repositories/participant.repository.ts:281-284,333-344`; `admin:test/data-queries.test.ts` |

### 2.5 Client decisions that must not be undone

| ID | Rule | Why | Enforced by |
|---|---|---|---|
| G27 | A customer may hold several bookings for one event. Only the Excel import still skips a phone that is already booked | Owner rule, 2026-09-08: per-phone uniqueness swallowed repeat paid bookings | `admin:prisma/schema.prisma:142-149`; `admin:src/app/api/public/events/[slug]/register/route.ts:146`; `admin:src/services/participant.service.ts:258-267` |
| G28 | Booking stays open until the event's END (date plus end time, IST), not its start. `COMPLETED` is never chosen by hand | Owner rule, 2026-09-13; it replaced the close-at-start rule of 2026-08-30 | `admin:src/lib/event-status.ts:20-44`; `admin:src/validators/event.validator.ts:163-175`; `admin:test/event-time.test.ts` |
| G29 | No "Paid" tick box, dropdown or manual payment marking. Entry Type is read-only and set once: added or imported by staff, or booked on the site with a complimentary code = Complimentary; Razorpay on the site or at the counter = Paid; free event booked on the site = Free | Owner rule, 2026-09-27 | `admin:prisma/schema.prisma:85-90`; `admin:src/actions/participant.actions.ts:57-59`; `admin:src/services/participant.service.ts:314-316`; `admin:src/actions/payment.actions.ts:156-157`; `admin:src/app/api/public/events/[slug]/register/route.ts:170` |
| G30 | Edge-cache freshness: event detail within 1 minute, upcoming and featured lists within 5 minutes, past lists and partners within 1 hour. `participants/*` is never cached | Owner decision, 2026-09-27; ticket lookups carry personal data | `site:src/lib/edge-cache.js:13-20,40-51`; `site:tests/proxy/proxy.test.mjs:89-99` |
| G31 | Keep React (no Preact), and keep both Vercel projects in region `bom1` | Owner decisions, 2026-09-27. The database is in Mumbai; the work plan of that day recorded 0.95 to 1.33 s per production API call while the functions ran in another region | `root:vercel.json:4`; `admin:vercel.json:4`; otherwise process |
| G32 | The home page past-events coverflow animates and auto-scrolls even when the system asks for reduced motion. Do not add `prefers-reduced-motion` there | Owner request, 2026-09-27. The owner's Windows has animation effects off, so an honoured preference looks static to them | process; no `reduced` string exists in `site:src/` |
| G33 | Brand spellings are exact: company "Ulsaham Entertainments"; domain `www.ulsaaham.com` (double a); admin host `ulsaham-admin-panel.vercel.app`; browser storage keys (`ulsaham_user`, `ulsaham_accounts`, `ulsaham_pending_payment`, `ulsaham_user_enrollments`), the `x-ulsaham-` headers, the Upstash prefix `ulsaham:` and the Cloudinary folders use `ulsaham`. No cookie carries the brand (`otp_session`, `g_oauth_nonce`, `google_auth_result`) | Deliberate since 2026-06-08 (`3edf8f2`). Renaming a storage key signs every visitor out and orphans pending payments | process; `site:tests/lib/pending-payment.test.mjs:29` pins one key |
| G34 | Rate limits fail open, and a duplicate payment is logged for staff to refund by hand, never refunded by code | Defaults the owner accepted on 2026-09-27: an Upstash outage must not stop bookings | `admin:src/lib/ratelimit.ts:133-144`; `admin:src/lib/duplicate-payment.ts:3-8` |
| G35 | K1-K7, D26 and every other open decision in §17 belong to the owner. Do not implement one unprompted | Scope decision, 2026-09-27: speed, bugs and payment reliability first, business rules later | process |

### 2.6 Working agreements

| ID | Rule | Why | Enforced by |
|---|---|---|---|
| G36 | An AI session never runs `git commit`, `git push`, `git merge` or anything that rewrites history. Its changes stay in the working tree | Agreed 2026-09-14, after two commits an AI session made locally (`8ede162`, `0543a43`) | process |
| G37 | The owner reviews, commits, pushes, and merges `dev2` to `main` (SITE) and `dev3` to `main` (ADMIN) through GitHub pull requests. Nobody pushes to `main` directly | A push to `main` deploys to production on Vercel | process (§14.4) |
| G38 | Before any write run `git status` and `git log -1` in the repo: right branch, clean tree, expected commit. Compare against `origin/main`, never the stale local `main` | Commits made outside the current work appeared mid-session under the owner's identity (2026-07-28 to 2026-07-30, 2026-09-27 21:46, 2026-10-04 17:47) and captured half-finished work. Their origin is unconfirmed | process |
| G39 | An AI session never runs anything that opens a database connection: `next dev`, `next start`, `prisma db push`, `npm run db:seed`, `prisma studio`, or the two database scripts in `admin:scripts/`. It hands the owner the exact command | `.env.local` is production (agreed 2026-09-27). The seed also resets the super admin's password (`admin:prisma/seed.ts:23-36`) | process (§13.6) |
| G40 | Keep each file's line endings. Never run `sed -i` or a formatter over a CRLF file, and write new files as UTF-8 without a byte-order mark | `core.autocrlf=true` with no `.gitattributes`: a rewritten file becomes a whole-file diff (§13.7) | process; `root:.editorconfig` |

- Safe for an AI session, because none of them connects to a database: `prisma generate`, `prisma validate`, `npm run check:bundle`, `npm test`, `npm run typecheck`, `npm run lint`, and on the site `bun run test`, `bun run lint`, `bun run build`.
- The command the owner uses to generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- A rule marked only "process" has no automatic guard: nothing fails when it is broken. Re-read this section before a release (§14.5).

---

## 3. Product overview

### 3.1 What the product is

An event booking and ticketing platform for one organiser, Ulsaham Entertainments. Customers browse events, book free or paid entry and receive a ticket; staff create events, sell at the counter and admit people at the gate. Money is Indian rupees through Razorpay; all dates and times are IST.

| Surface | Who uses it | Where it runs | Details |
|---|---|---|---|
| Customer site | The public, mostly on phones | `https://www.ulsaaham.com`; SITE repo, Astro pages with React islands | §6, §8.1-8.9 |
| Backend API | The customer site only, through its own `/api/public` proxy; Razorpay calls one webhook | `/api/public/*` and `/api/razorpay/webhook` on the admin host; ADMIN repo | §7 |
| Staff admin panel | The organiser's staff | `/admin/*` on `https://ulsaham-admin-panel.vercel.app`; the same Next.js app as the API | §8.10-8.19, §10 |

### 3.2 Customer journey

1. Open the home page (hero video, upcoming events, past events, partners) or `/events` (Featured, Upcoming and Past sections). The lists come from the edge cache (§7.8).
2. Open an event at `/events/detail?slug=<slug>`: posters, date, time, venue, price, seats left, description. One static page serves every event (`site:src/pages/events/detail.astro:2`).
3. Signed out, the booking form shows "Login Required" (`site:src/components/RegistrationForm.jsx:480-493`). Sign in at `/login` with a 6-digit code sent by e-mail (valid 10 minutes, 5 guesses, `site:src/lib/otp.js:65,69`) or with Google. Before the first booking, complete the profile: name, 10-digit phone, age (`site:src/components/RegistrationForm.jsx:495-508`).
4. Fill the form: seats (1 to 10), optional e-mail, optional promo code on a paid event.
5. Confirm. A free event or a complimentary code is booked at once (`POST events/<slug>/register`). A paid event shows an Order Summary with the fee breakdown, then Razorpay Checkout takes the payment and the server confirms it (`payment/order`, then `payment/verify`).
6. Success screen: QR code and ticket code, or a chest number for a competition; download the ticket (PNG) or participation card (PDF); the ticket is e-mailed when an address was given.
7. If the confirmation never arrives (tab closed, payment approved in a UPI app), the Razorpay webhook completes the booking and the site finds it by polling (§8.5).
8. My Bookings at `/account` lists every booking, with download, "Email Ticket" and, for an unpaid booking, "Complete Payment".
9. At the venue staff scan the QR code in the admin panel; a group ticket can enter in parts (§8.14). 14 days after the event date the bookings are deleted and only seat and revenue totals stay on the event (§10).

### 3.3 Roles

Customers have no account on the server: "signed in" is browser storage, checked only in the browser (§6.6). Staff accounts live in the `Admin` model and sign in to the panel with a username and password; a session ends 24 hours after sign-in (`admin:auth.config.ts:19,82-83`).

| Role | May | May not |
|---|---|---|
| Customer, signed out | Browse home, events, event pages, About, Privacy, Terms | Book ("Login Required"); open My Bookings (sent to `/login?next=/account`) |
| Customer, signed in | Book free and paid events; see, download and e-mail tickets; pay an unpaid booking | Edit, cancel or transfer a booking |
| `USER`, shown as "Counter staff" | See the events list without seat counts; enrol a walk-in from the Enroll dialog: a free event directly (Complimentary), a paid event through Razorpay (Paid) | Open the dashboard, participants, scanner, logs, settings or accounts |
| `ADMIN` | Dashboard without the revenue card; events list; participants page; add a booking by hand (Complimentary); mark attendance; export to Excel; gate scanner; activity logs | Create, edit or delete events or change their status; edit or delete a booking; Excel import; settings, brand partners, staff accounts |
| `SUPER_ADMIN` | Everything, including revenue, event management, booking edits, Excel import, settings, brand partners and staff accounts | Be created, changed or deleted from the panel (seed script only) |

- Enforced three times: middleware, each page, each server action. The exact path and action matrix is in §10.
- Only counter staff are shown the Enroll button (`admin:src/components/events/event-table.tsx:213-232`); the counter-payment server action itself accepts any signed-in role. A super admin creates `ADMIN` and `USER` accounts (`admin:src/validators/admin.validator.ts:18`). The Accounts page labels `USER` "User"; the header says "Counter staff" (`admin:src/constants/index.ts:90`).

### 3.4 Event model

| Concept | Business meaning | Code |
|---|---|---|
| Free or paid | `isFree` is the default: booked with no payment, entry type Free. A paid event has a per-person `amount` in rupees and may have an early-bird price, GST, a platform fee, coupons and complimentary codes | `admin:prisma/schema.prisma:39-44,54-55` |
| Competition | `isCompetition` with a participation type: `INDIVIDUAL` (1 person), `GROUP` (2 or more), `BOTH`. Each entry gets a chest number, from 1001, instead of a QR code | `admin:src/lib/competition.ts:15-27`; `admin:src/constants/index.ts:14-15` |
| Featured | A flag. Featured events get their own section on `/events`, are left out of Upcoming there, and carry a "Featured" badge | `site:src/lib/page-data.js:13-15`; `site:src/components/EventCard.jsx:44` |
| Capacity | Optional seat limit. Seats taken = the sum of seats over all bookings, unpaid ones included. Shown as "N spots remaining", in red at 20 or fewer | `admin:src/repositories/participant.repository.ts:212-218`; `site:src/components/EventDetail.jsx:225-226,281-285` |
| Booking window | Open from publication until the event's END: its date plus end time in IST. No end time means 23:59 IST; an end at or before the start rolls to the next day | `admin:src/lib/event-time.ts:64-82`; §6.9 |

| Status | How it is set | Customer sees | Can book |
|---|---|---|---|
| `ANNOUNCED` | Default for a new event; a draft | Nothing: not listed, the event page says "Event not found" | no |
| `PUBLISHED` | Super admin | Listed under Upcoming or Featured | yes, until the end or until full |
| `BOOKING_CLOSED` | Super admin | Still listed, marked "Booking Closed" | no; an existing unpaid booking can still be paid |
| `CANCELLED` | Super admin, or automatically when an event that has bookings is deleted | Not listed; the event page stays reachable and says "Event Cancelled" | no |
| `COMPLETED` | Automatically once the end has passed; never by hand | Listed under Past events | no |

- The API sends the EFFECTIVE status: an event past its end reads `COMPLETED` at once, before the sweep stores it (`admin:src/lib/event-status.ts:25-28`). A refused booking answers HTTP 410 with the reason: ended, cancelled, closed or "Event is full" (`:7-13`).
- Capacity is count-then-insert, so two buyers can both take the last seat, and a paid booking is never refused for capacity after payment (open decision K4, §17).

### 3.5 Pricing and fees

There are no subscription plans, memberships, wallets or stored cards. Every charge is a one-off Razorpay order for one booking, priced by the server (G9).

| Element | Rule as the customer meets it | Code |
|---|---|---|
| Price | One per-person price per event, shown as "₹<amount> per person" | `site:src/components/EventDetail.jsx:278` |
| Early bird | A switch plus a lower price on the event, not a date rule. While on, the regular price is struck through beside an "Early Bird" badge | `admin:src/lib/pricing.ts:9-18` |
| Group pricing (competitions) | The first member pays the entry price; each further member pays the event's extra-member amount, or the entry price again when none is set | `admin:src/lib/pricing.ts:47-54` |
| GST | 18% of the discounted base, only when GST is switched on for the event (default off) | `GST_RATE = 0.18`, `admin:src/lib/pricing.ts:1,28` |
| Platform fee | 2% of the discounted base, unless switched off for the event (default on) | `PLATFORM_FEE_RATE = 0.02`, `admin:src/lib/pricing.ts:2,29` |
| Coupon | A flat rupee amount off the whole order, not per person. It must be worth less than the per-person price, so it never makes a booking free | `admin:src/lib/coupon.ts:18-29` |
| Complimentary code | Makes the whole booking free (up to 10 seats), with no payment. Each code has a number of uses; one booking is one use | `admin:src/app/api/public/events/[slug]/register/route.ts:128-144,175-177` |
| Minimum charge | A total under 100 paise (1 rupee) is refused with 400 `AMOUNT_TOO_LOW`: Razorpay takes no smaller order | `admin:src/app/api/public/events/[slug]/payment/order/route.ts:20-21,150-156` |

- GST and the platform fee are each taken on the discounted base, neither on the other; total = discounted base + GST + fee, rounded to 2 decimals. From the shared fee table: price 333.33, GST 60.00, fee 6.67, total 400.00 (`site:tests/fixtures/fee-cases.json:113-118`). Formula and rounding: §6.9.
- The form shows "(+ 18% GST + 2% platform fee)" beside the price and an Order Summary before Pay (`site:src/components/RegistrationForm.jsx:519-522`). If the server's total differs from the one shown, the site shows the server's figures and asks again before anything is paid.
- Both code kinds go in one "promo code" field and are stored upper-case; the coupon list is searched first, so a name used for both acts as a coupon. At the staff counter the early-bird price applies but no coupon (`admin:src/actions/payment.actions.ts:73-77`). Paying later for an unpaid booking charges today's price for that booking's own seat count (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:83-96,147-149`).

### 3.6 Booking rules

| Rule | Value | Code |
|---|---|---|
| Bookings per person | Any number per event; each is its own ticket (owner rule, 2026-09-08). Only the staff Excel import skips a phone already booked | `admin:prisma/schema.prisma:142-144` |
| Seats per booking | 1 to 10 (`MAX_PARTICIPANTS_PER_REGISTRATION`); competitions follow their participation type. Buyer fields: §6.8 | `admin:src/constants/index.ts:13` |
| Entry type | Read-only, set once: Paid (Razorpay, site or counter), Complimentary (complimentary code, or added or imported by staff), Free (free event booked on the site). An older booking without one gets an inferred label, or "Unpaid" | `admin:prisma/schema.prisma:85-90`; `admin:src/lib/entry-type.ts:19-27` |
| Ticket code | `UE-<first 6 letters and digits of the slug, upper-case, padded with X>-<6 of A-Z0-9>`, unique across all events | `admin:src/lib/ticket-code.ts:41-51` |
| Ticket | The QR code encodes the ticket code; download as a PNG. A competition entry has a chest number, a "Reference Code" and a PDF participation card but no QR code, so the scanners cannot admit it and attendance is ticked by hand | `site:src/components/RegistrationForm.jsx:162-177`; §8.8, §8.14 |
| Retention | Bookings are deleted 14 days after the event date, at the next staff visit to the events page | `admin:src/repositories/participant.repository.ts:261-289` |

- **E-mailed, always from the site:** the sign-in code (never in the subject line) and the ticket. Ticket subject: "Your ticket for <event> — <ticket code>", with the QR code inline, event, date, venue, seats and Payment ID. For a competition: "Your participation card for <event> — Chest No <n>", no QR code (`site:src/lib/ticket-mail.js:60-125`).
- **When a ticket is mailed:** after a booking, if the form had an address; when the Razorpay webhook completes a booking that has an address; and on "Email Ticket" in My Bookings. At most 12 per hour per IP and 6 per hour per ticket (`site:src/pages/api/send-ticket.js:11-12`). An unpaid booking is never mailed.
- Delivery in production is **unverified** since the fix of 2026-10-04; bookings made from 2026-06-12 to 2026-10-04 got no ticket e-mail (§17).

### 3.7 What the product does not do

| Not there | Evidence |
|---|---|
| Refunds, or any reaction to a refund | The webhook handles `payment.captured` only (`admin:src/app/api/razorpay/webhook/route.ts:56-59`). A duplicate payment is logged for staff to refund by hand in Razorpay (`admin:src/lib/duplicate-payment.ts:3-8`). The Terms page promises refunds only for an event the organiser cancels or reschedules (`site:src/pages/terms.astro:25,31`). Open decision D26 |
| Customer accounts, sessions or passwords on the server | The database holds staff only; the customer profile and ticket list live in `localStorage` (§6.4). Phone numbers are never verified (K1) |
| Cancelling, editing or transferring a booking by the customer | No such public endpoint (`site:src/pages/api/public/[...path].js:20-21`); only a super admin edits or deletes bookings |
| Ticket tiers, seat maps, add-ons, subscriptions, wallets, saved cards, invoices | One price per event plus early bird and the group extra amount; no such code in either repo |
| Checks of payment, event status or date at the gate; typing a code at the gate | The scan path checks the ticket code and the entered count only (K7) |
| Scheduled jobs, CI, error tracking, analytics beyond Vercel Speed Insights on the site | No cron in either `vercel.json`: the `COMPLETED` sweep and the 14-day prune run on page views (§10). No `.github` folder in either repo (§15) |
| Native apps, push notifications, SMS | Web only; the WhatsApp and Instagram entries on the site are plain links |

---

## 4. Tech stack and key libraries

"Declared" is the range in the manifest (`site:package.json:13-35`, `root:package.json:11-17`, `admin:package.json:19-71`); "resolved" is the lockfile at the commits in the header. Every range is a caret except `@types/bun` (`latest`) and `xlsx` (a URL), so the lockfiles are the only real pin.

### 4.1 Toolchain and runtimes

| Item | Customer site | Admin panel and API |
|---|---|---|
| Package manager | Bun; `packageManager` is `bun@1.3.1` (`root:package.json:3`) | npm; no `packageManager` field |
| Lockfile | `root:bun.lock` (text, `lockfileVersion: 1`); the only one | `admin:package-lock.json` (`lockfileVersion: 3`) |
| Workspace, task runner | Globs `apps/*`, `apps/*/*`, `packages/*` (`root:package.json:6`); only `apps/site/far-fusion` matches. Turborepo runs `dev` and `build` only (`root:turbo.json`) | One package; npm scripts (`admin:package.json:5-18`) |
| Language | JavaScript ES modules, JSX, `.astro`. No TypeScript source is tracked | TypeScript, `strict` (`admin:tsconfig.json:6`) |
| Why Node is needed | Tests are `node --test tests/` (`site:package.json:9`); the Vercel build runs a `node` script (`root:vercel.json:6`) | Next.js, Prisma, Vitest, `tsx` |
| Minimum Node | 20.9 on the 20 line, or 22 and later. Tests: 20.6, because the loader calls `module.register()` (`site:tests/mail/support/load.mjs:1,5`). Lint: ESLint 9.39.5 accepts 18.18+, 20.9+ and 21.1+. Build: Astro 5.18.2 accepts 18.20.8, 20.3+ and 22+; Vite 6.4.1 accepts 18, 20 and 22+. Mail: nodemailer 10.0.13 needs 20+. Source: `engines` of the installed packages under `root:node_modules/`; `root:bun.lock` does not record them | 20.9 on the 20 line, or 22 and later. Next 15.5.27 accepts 18.18+, 19.8+ and 20+; ESLint 9.39.4 accepts 18.18+, 20.9+ and 21.1+; Vitest 3.2.7 accepts 18, 20 and 22+; `type-fest` 5.6.0 (through `zxing-wasm`) needs 20+ (`engines` in `admin:package-lock.json`). Scripts were written against 20.11 (`admin:scripts/backfill-entry-type.ts:26`) |
| Vercel runtime | One Node function, `_render.func`, serves the 7 routes under `site:src/pages/api/`, `maxDuration: 60` seconds (`site:astro.config.mjs:24`); the 10 pages are static files. Region `bom1`; install is `bun install --frozen-lockfile` (`root:vercel.json:4-5`) | Next.js functions, `fluid: true`, region `bom1` (`admin:vercel.json:3-4`). Only the webhook sets a limit: `maxDuration = 15` (`admin:src/app/api/razorpay/webhook/route.ts:20`) |

- **Dev machine on 2026-10-11:** Windows 11, Node v20.11.0, Bun 1.3.14 (newer than the declared `bun@1.3.1`), npm for the admin repo. The baselines of that day in §18.1 were measured there. `bun --cwd <dir> run <script>` printed help there instead of running the script: run scripts from inside the folder (§14).
- **Not declared anywhere:** no `engines` in any `package.json`; no `.nvmrc`, `.node-version`, `.tool-versions`, `.npmrc` or `bunfig.toml`; no `overrides` or `resolutions`. Nothing stops a wrong Node or Bun version. The plan of 2026-09-27 asked for a Node 22 pin (`engines` and `.nvmrc`); it was not done (§17).
- **Node 19 and 21 are refused** by the ranges above (Astro, Vite and Vitest all skip 21). Deeper in both trees `eslint-visitor-keys` 5.0.1 (lint only) asks for `^20.19.0 || ^22.13.0 || >=24`, and in the site tree `undici` 8.11.2 (through Astro's `unifont`) asks for `>=22.19.0`. The dev machine's 20.11.0 is below both, yet both lint runs and the site build passed there on 2026-10-11 (§18.1).
- **unverified:** the Node version of the Vercel functions, the Bun and Node versions of Vercel's build image, and the install command Vercel uses for the admin repo (`admin:vercel.json` sets none). They are project settings, not in either repo (§12).
- **No CI:** neither repo tracks a workflow folder or git hooks, and tests and lint are not Turbo tasks. Every check runs by hand (§18).

### 4.2 Customer site libraries

| Package | Declared | Resolved | Used for | Notes |
|---|---|---|---|---|
| `astro` | `^5.18.2` | 5.18.2 | Framework, `output: "server"`: 10 prerendered pages, 7 on-demand routes | Config in `site:astro.config.mjs`; see §4.4 |
| `@astrojs/vercel` | `^8.0.0` | 8.2.11 | Adapter; writes the deployable Build Output to `site:.vercel/output` | Its `config.json` is patched after the build (§13) |
| `@astrojs/react`, `react`, `react-dom` | `^4.0.5`, `^19.0.0` | 4.4.2, 19.2.0 | The 12 `.jsx` components, hydrated with `client:load` or `client:idle` | |
| `@astrojs/tailwind` | `^5.1.2` | 5.1.5 | Tailwind integration, `applyBaseStyles: false` (`site:astro.config.mjs:27`) | Peer range `tailwindcss ^3.0.24` |
| `tailwindcss`, `autoprefixer` (dev) | `^3.4.14`, `^10.4.20` | 3.4.18, 10.4.21 | Utility CSS; theme in `site:tailwind.config.mjs` | PostCSS config `site:postcss.config.cjs` |
| `nodemailer` | `^10.0.13` | 10.0.13 | SMTP for sign-in codes and ticket mail, server only (`site:src/lib/mailer.js:1`) | Pooled transport, 3 connections (`site:src/lib/mailer.js:70-73`) |
| `qrcode` | `^1.5.4` | 1.5.4 | QR image inside the ticket e-mail, server only (`site:src/lib/ticket-mail.js:4`) | Keep it a static import: loaded through `createRequire`, Vercel's file tracing left it out and every ticket mail failed (`site:src/lib/ticket-mail.js:1-3`) |
| `react-qr-code` | `^2.0.21` | 2.0.21 | QR on screen (`site:src/components/AccountPage.jsx:2`, `site:src/components/RegistrationForm.jsx:2`) | |
| `jspdf` | `^4.2.1` | 4.2.1 | Participation-card PDF, in the browser | Only through `import()` (`site:src/lib/participation-card-pdf.js:10`); the bundle test fails if a page loads it up front |
| `@vercel/speed-insights` | `^2.0.0` | 2.0.0 | Nothing imports it | The layout loads Vercel's script by URL (`site:src/layouts/BaseLayout.astro:55-62`). Probably removable: **unverified** |
| `eslint` (dev) | `^9.39.4` | 9.39.5 | `bun run lint` | With `@eslint/js` 9.39.5, `eslint-plugin-astro` 1.7.0, `eslint-plugin-react-hooks` 7.1.1, `globals` 16.5.0, `@typescript-eslint/parser` 8.70.1 (§13) |
| `turbo` (root, dev) | `^2.6.0` | 2.6.0 | `bun run dev` and `bun run build` at the root | |
| `vite` | not declared | 6.4.1 | Dev server and bundler | Arrives through `astro` |
| `typescript` (root, peer), `@types/bun` (root, dev) | `^5`, `latest` | 5.9.3, 1.3.1 | Editor support; `typescript` is also the peer of `@typescript-eslint/parser` | `bun init` leftovers; nothing type-checks the site |

- Not npm packages: Razorpay Checkout is a script loaded at run time from Razorpay (`site:src/lib/razorpay.js:4`); the web fonts are three self-hosted woff2 files in `site:src/assets/fonts/` (§9). No test framework either: tests use Node's own `node:test` and `node:assert` (§18).

### 4.3 Admin panel and backend libraries

| Package | Declared | Resolved | Used for | Notes |
|---|---|---|---|---|
| `next` | `^15.5.26` | 15.5.27 | App Router pages, server actions, route handlers, `after()`, `next/image`, `next/font` | Config in `admin:next.config.ts` |
| `react`, `react-dom` | `^19.0.0` | 19.2.6 | UI | |
| `typescript`, `@types/node` (dev) | `^5.7.2`, `^22.10.1` | 5.9.3, 22.19.19 | `npm run typecheck`; type errors fail the build (`admin:next.config.ts:46-48`) | Types are Node 22 while the machine runs Node 20: a Node 22 only API type-checks and then fails at run time on Node 20 |
| `next-auth` | `^5.0.0-beta.32` | 5.0.0-beta.32, with `@auth/core` 0.41.3 | Staff sign-in, JWT sessions, middleware (§10) | Pre-release; see §4.4 |
| `@prisma/client`, `prisma` (dev) | `^5.22.0` | 5.22.0 | MongoDB data layer (`admin:prisma/schema.prisma:1-8`) | `prisma generate` runs in `build` and `postinstall` (`admin:package.json:7,13`); no build step runs `db push` (§11) |
| `zod` | `^3.23.8` | 3.25.76 | Validators and the env schema | |
| `react-hook-form`, `@hookform/resolvers` | `^7.54.2`, `^3.9.1` | 7.76.1, 3.10.0 | Forms, except the login form | |
| `razorpay` | `^2.9.8` | 2.9.8 | Server SDK: creates and fetches orders (`admin:src/lib/razorpay.ts:2,116`); `admin:scripts/report-unrecorded-payments.ts` also lists payments | Checkout in the browser is Razorpay's own script |
| `@upstash/ratelimit`, `@upstash/redis` | `^2.0.5`, `^1.34.3` | 2.0.8, 1.38.0 | Rate limits and the hourly job throttle (`admin:src/lib/ratelimit.ts:2-3`) | |
| `cloudinary`, `bcryptjs` | `^2.5.1`, `^2.4.3` | 2.10.0, 2.4.3 | Image upload and delete; password hashes | |
| `xlsx` (SheetJS) | vendor URL | 0.20.3 | Excel import and export, in the browser | Only through `import()`; see §4.4 |
| `jspdf` | `^4.2.1` | 4.2.1 | Participation-card PDF, in the browser | Only through `import()` (`admin:src/lib/participation-card-pdf.ts:36`) |
| `@yudiel/react-qr-scanner` | `^2.0.4` | 2.6.0 | Gate scanner: camera and decoder | Brings `barcode-detector` 3.1.3, which requires `zxing-wasm` exactly 3.0.3; see §4.4 |
| `react-qr-code`, `react-image-crop` | `^2.0.15`, `^11.0.10` | 2.0.21, 11.0.10 | Ticket QR in the modal; partner-logo crop | Both behind `next/dynamic` |
| 10 `@radix-ui/react-*` packages, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner` | carets | 1.1.8 to 2.2.6; 0.7.1; 2.1.1; 2.6.1; 0.468.0; 1.7.4 | shadcn/ui components, icons, toasts (§9) | |
| `tailwindcss`, `postcss`, `autoprefixer` (dev) | `^3.4.16`, `^8.4.49`, `^10.4.20` | 3.4.19, 8.5.28, 10.5.0 | Styling | `plugins: []` (`admin:tailwind.config.ts:77`) |
| `vitest`, `vite` (dev) | `^3.2.7`, `^6.4.3` | 3.2.7, 6.4.3 | `npm test` | Node environment, no DOM (`admin:vitest.config.ts:12`) |
| `eslint`, `eslint-config-next`, `@eslint/eslintrc` (dev) | `^9.16.0`, `^15.5.26`, `^3.3.7` | 9.39.4, 15.5.27, 3.3.7 | `npm run lint` | Next's presets load through `FlatCompat` (`admin:eslint.config.mjs:3-14`) |
| `tsx`, `dotenv` (dev) | `^4.19.2`, `^17.4.2` | 4.22.3, 17.4.2 | Run the seed and `admin:scripts/*.ts`; load `.env.local` for the seed (`admin:prisma/seed.ts:1-2`) | §11 |

- **Load on demand:** `xlsx`, `jspdf`, the scanner, `react-qr-code`, the cropper, the enrol dialog and the participant form load through `import()` or `next/dynamic` with `ssr: false`, so no page pays for them up front. `npm run check:bundle` fails when SheetJS or jsPDF is in the participants page's first load, or when any page other than the two scan pages references zxing (`admin:scripts/check-bundle.mjs:47-53`); the others are caught only by the page budgets (§13).
- **Font:** Inter through `next/font/google`, `latin` subset, variable `--font-inter` (`admin:src/app/layout.tsx:6-10`). The subset has no rupee sign, so render it with `<Rupee />`; a raw sign makes the browser fetch an 85 KB latin-ext file (size quoted from `admin:src/components/shared/rupee.tsx:3-6`).

### 4.4 Pins and upgrade constraints

| What | Where | Rule | Why |
|---|---|---|---|
| Site lockfile frozen on Vercel | `root:vercel.json:5` | Commit the updated `root:bun.lock` with every `package.json` change | `--frozen-lockfile` fails the deploy on drift, so a deploy never resolves new versions by itself |
| Astro 5.18 and later | `site:astro.config.mjs:10-21` | Every host that serves the site must be in `security.allowedDomains` (at `187547e`: `www.ulsaaham.com`, `ulsaaham.com`, `**.vercel.app`) | Since 5.18 any other host turns the request URL into `https://localhost`. That sent Google sign-in to localhost and made the mailer refuse the site's own pages (2026-09-28 to 2026-10-04) |
| `@astrojs/vercel` 8 | `site:scripts/fix-vercel-routes.mjs:56-62` | After an adapter bump, build and confirm the patch step still passes | The patch exits 1 when the adapter stops writing the immutable `/_astro` rule, so a layout change cannot silently drop asset caching and the security headers. `site:src/lib/edge-cache.js:36-42` also relies on the adapter's `x-astro-path` header |
| `nodemailer` 10 | `site:package.json:20` | Run the mail tests after any bump | Raised from `^6.9.16` in `fcf2989` (2026-10-03), which also dropped `@types/nodemailer`; the reason is not recorded in the repo. Version 10 needs Node 20 or later. `site:tests/mail/mailer.test.mjs:83-92` pins the transport options |
| Tailwind 3, not 4 | `site:package.json:34`, `admin:package.json:66` | Not a routine bump | Both repos use a config-file theme (`site:tailwind.config.mjs`, `admin:tailwind.config.ts`), the `tailwindcss` PostCSS plugin and `@tailwind` directives, and `@astrojs/tailwind` accepts only `tailwindcss ^3.0.24`. Version 4 is a migration; deferred |
| `xlsx` from a vendor URL | `admin:package.json:51` | Upgrade by editing the URL by hand; never switch back to the registry name | The value is the 0.20.3 tarball on SheetJS's own CDN. Until `d3f60bd` (2026-09-27) it was `^0.18.5` from npm; the work notes say that build has known vulnerabilities and newer releases ship only from the vendor (no comment in the repo: **unverified**). Install needs that host reachable |
| `next-auth` 5 beta | `admin:package.json:42` | Move one beta at a time, then run `npm run typecheck` and the auth tests | A pre-release line: types and behaviour change between betas. The caret range also admits later betas and stable 5.x on an `npm update`. The session cookie name is not set in code (`admin:auth.config.ts:30-38`), so a changed library default would sign everyone out: **unverified** |
| zxing wasm file | `admin:next.config.ts:11-19`, `admin:public/zxing/zxing_reader-3.0.3.wasm` | When `zxing-wasm` moves, copy `admin:node_modules/zxing-wasm/dist/reader/zxing_reader.wasm` to `admin:public/zxing/zxing_reader-<version>.wasm` and delete the old copy | The decoder is self-hosted so the gate never depends on a public CDN, and the wasm must match the bundled JavaScript. The config throws when the file for the installed version is missing, which stops `next dev` and `next build` |
| `prisma`, `@prisma/client` | `admin:package.json:21,65` | Move both together | Both resolve to 5.22.0; the client is generated by the CLI on every install |
| Framework majors | both repos | Stay on Astro 5.x and Next 15.x | The owner-approved plan of 2026-09-27 lists "Framework majors (Astro 7, Next 16)" under "Not doing"; that round bumped only inside the current lines |
| React, not Preact | both repos | Do not swap | Owner decision, 2026-09-27 |
| `npm audit` leftovers | admin repo | `npm audit fix` without `--force` only | 11 findings remained on 2026-10-04. Each needs a major (Tailwind 4, Next 16, Vitest 5) and all are build-time or dev-time only; left on purpose (§17) |
| Page-weight budgets | `site:tests/build/bundle-budget.test.mjs:23-34`, `admin:scripts/check-bundle.mjs:27-43` | After any dependency bump, build and run both checks | Budgets sit about 5% above the build they were set from; `/events/detail` has about 1.5% left (§18.1) |
| Node line | both repos | Stay on Node 20 (20.9 or later) until another line is tested | The baselines of 2026-10-11 were measured on 20.11.0 (§4.1). `site:package.json:9` passes a folder to `node --test`; whether that form still finds the tests on Node 22 and later is **unverified**, and so is the quoted-glob form `node --test "tests/**/*.test.mjs"` suggested as its replacement. `@types/node` is already on 22 (§4.3) |

### 4.5 What is deliberately not used and why

| Not used | Used instead | Why or evidence |
|---|---|---|
| Astro image service (`astro:assets`, `/_image`) | `passthroughImageService()` and Cloudinary URL transforms (`site:src/lib/image.js`) | A public `/_image` would fetch and re-encode outside images with sharp (`site:astro.config.mjs:29-34`). Production answers 403 there (2026-10-11) |
| three.js | Nothing | The 3D hero left the home page on 2026-06-07 (`912bab8`) and the About page on 2026-06-12 (`6ebb21a`); file and dependency were deleted in `c28b2ea` (2026-09-27) |
| Preact | React 19 | Rejected by the owner on 2026-09-27 |
| CSS-in-JS library | Tailwind 3 and one stylesheet per repo (`site:src/styles/global.css`, `admin:src/app/globals.css`); the only `<style>` block is in `site:src/pages/auth/complete.astro` | None is in either manifest |
| Client router, view transitions | Full page loads between prerendered pages; `/events/detail` reads the slug from the query string (`site:src/components/EventDetail.jsx:190`) | No `ClientRouter` or `astro:transitions` import in `site:src` (§6) |
| Global state or data-fetching library | React hooks, `localStorage` keys and one `fetch` wrapper, `site:src/lib/api.js` (§6) | None is in the manifest |
| Redis or a database on the site | An in-memory limiter per function instance (`site:src/lib/rate-limit.js:1-8`); all data comes through the proxy | Its comment: enough "without adding a Redis dependency"; the authoritative limits are in the admin panel |
| Job queue, cron | Next `after()` started by page views, throttled with an Upstash key (`admin:src/lib/ratelimit.ts:172-186`) | `admin:vercel.json` has no `crons`. Consequences in §10 |
| Database migrations | `prisma db push`, run by hand (§11) | MongoDB; the build never touches indexes |
| Test framework and TypeScript on the site | `node --test` and plain `.js` | Tests run the real source files through a small loader (§13); the proxy was rewritten from `.ts` to `.js` in `c28b2ea` so they could |
| Google-hosted fonts on the site | Self-hosted, subset woff2 (`site:src/styles/global.css:5-38`) | Two fewer origins to connect to; changed in `c28b2ea` |
| Public CDN for the zxing wasm | `admin:public/zxing/` | No third party at the gate (`admin:src/lib/gate-scanner.ts:8-12`) |
| Brevo HTTP API | SMTP through `nodemailer` | Rejected in the 2026-09-27 plan: a new secret for about 0.5 s saved on sign-in mail only |
| `sharp` as a direct admin dependency; `tailwindcss-animate`; Radix menu in the header and Radix selects in filter bars | Nothing; no dialog animations; a hand-built menu and native `<select>` | `sharp` was unused and carried an audit finding (removed in `d3f60bd`). The animation plugin is simply absent (`admin:tailwind.config.ts:77`), reason not recorded. The Radix dropdown "cost ~20 KB of JS on every admin page" (`admin:src/components/admin/header.tsx:61-66`) |
| `eslint-plugin-react`, React Compiler | An inline rule, `local/jsx-uses-vars` | `site:eslint.config.js:11-13,30-32` |
| CI, error tracking | Checks run by hand (§18) | Not a decision, a gap: no workflow files and no such dependency in either repo (§17) |

---

## 5. Repository layout

### 5.1 Two repositories and how they relate

| | Customer site repo | Admin repo |
|---|---|---|
| Local folder | `web-app` | `UlsahamAdminPanel` |
| Holds | The public site, its 7 server routes (API proxy, sign-in, mail) and this handbook | The staff panel (`/admin/*`), the public REST API (`/api/public/*`), the Razorpay webhook, the Prisma schema and the database scripts |
| Shape | Bun and Turborepo workspace with one app, `apps/site/far-fusion` | One Next.js app at the repo root |
| Path prefix in this file | `root:` for the repo root, `site:` for the app folder | `admin:` |
| Calls the other through | Its `/api/public/*` proxy, which forwards to the admin API with `x-proxy-key` and `x-client-ip` (`site:src/lib/backend.js:42-50`) | A signed POST to the site's `/api/internal/ticket-mail` (`admin:src/lib/site-ticket-mail.ts:25-52`) |
| Kept in step by hand | Copies: `site:tests/fixtures/fee-cases.json`, `site:tests/contract/public-event.json`. Mirrors: `site:src/lib/fees.js`, `site:src/lib/event-status.js`, `site:src/lib/event-time.js` | Originals: `admin:test/fixtures/fee-cases.json`, the public event field lists (§5.4), `admin:src/lib/pricing.ts`, `admin:src/lib/event-status.ts`, `admin:src/lib/event-time.ts` |

- There is no shared package, submodule or code generation. A change to fees, public event fields or booking-closed rules is made in both repos in the same piece of work; when the API contract changes, the admin repo is deployed first (§14).
- Both sides read `PROXY_SHARED_SECRET`; the value must be identical in the two Vercel projects (§12).

### 5.2 Customer site repo

```text
web-app/                               repo root (root:)
├─ project_context.md                  this handbook
├─ AGENTS.md, CLAUDE.md                entry files for AI agents; CLAUDE.md only includes AGENTS.md
├─ README.md                           human intro, partly stale (§17)
├─ package.json                        workspace root: packageManager, workspace globs, scripts dev and build
├─ bun.lock                            the only lockfile
├─ turbo.json                          tasks build and dev; build outputs dist/** and .vercel/output/**
├─ vercel.json                         framework, region, install command, 4-step build command (§12)
├─ tsconfig.json                       bun init leftover; no script runs tsc
├─ .editorconfig, .gitignore           UTF-8 without a byte-order mark; ignore rules
├─ node_modules/ .turbo/ .vercel/      GENERATED, ignored.  packages/ .cursor/  empty, untracked, absent on a fresh clone
└─ apps/site/far-fusion/               the only app (site:), package name far-fusion
   ├─ package.json                     scripts dev, build, preview, test, lint, astro
   ├─ astro.config.mjs                 site URL, server output, allowed hosts, adapter, image service, dev proxy
   ├─ tailwind.config.mjs, postcss.config.cjs, eslint.config.js, tsconfig.json     tool configs (§9, §13)
   ├─ .env.example                     the 13 env keys, with comments (§6)
   ├─ .gitignore, .vscode/             app ignore rules; editor files (launch.json points at a path Bun does not create)
   ├─ public/                          served as-is: icons, meta-share.jpg, robots.txt, brand_logo.avif (ticket image), assets/ (empty)
   ├─ scripts/                         dev-proxy.mjs (dev proxy, GET and HEAD only), fix-vercel-routes.mjs (post-build patch) (§13)
   ├─ src/pages/                       one file per route; all 10 pages are prerendered (§6)
   │  ├─ index.astro, events/index.astro, events/detail.astro     home; list; one event (slug in the query string)
   │  ├─ login.astro, auth/complete.astro, account.astro          sign-in; last step of Google sign-in; My Bookings
   │  ├─ about.astro, privacy.astro, terms.astro, 404.astro
   │  └─ api/                          the 7 on-demand routes (§7)
   │     ├─ public/[...path].js        proxy to the admin API; sets the edge-cache headers
   │     ├─ auth/send-otp.js, auth/verify-otp.js, auth/google.js, auth/google/callback.js
   │     └─ send-ticket.js, internal/ticket-mail.js               ticket e-mail: asked by the visitor; by the admin (signed)
   ├─ src/layouts/BaseLayout.astro     head, meta tags, font preload, Speed Insights script
   ├─ src/components/                  12 React .jsx files and 2 .astro files (§8, §9)
   │  ├─ SiteNav.astro, ApiPrefetch.astro                         top bar; early API requests from the page head
   │  ├─ HomeEventsSection, HomeEvents, PastEventsRunner, PastEventsCoverflow, BrandPartners     home page
   │  ├─ EventsList, EventCard, EventDetail                       listing and detail
   │  ├─ RegistrationForm, VerifyFailed                           booking and payment
   │  └─ AuthForm, AccountPage                                    sign-in; My Bookings and tickets
   ├─ src/lib/                         24 plain .js modules
   │  ├─ api.js, page-data.js                                     browser API client; the first reads of each page
   │  ├─ backend.js, edge-cache.js, http.js, rate-limit.js        server side: admin origin, CDN policy, JSON, limiter
   │  ├─ auth.js, otp.js, google-oauth.js, google-complete.js, next-path.js     customer sign-in
   │  ├─ mailer.js, ticket-mail.js, contact.js                    SMTP and mail layout; ticket mail; support address
   │  ├─ fees.js, event-status.js, event-time.js, format-date.js  money and time rules
   │  ├─ payment-flow.js, pending-payment.js, razorpay.js         payment decisions, recovery record, checkout loader
   │  └─ generate-ticket.js, participation-card-pdf.js, image.js  ticket PNG, card PDF, Cloudinary URLs
   ├─ src/assets/                      brand_logo_128.avif and fonts/ (3 woff2); bundled under hashed names
   ├─ src/styles/global.css            Tailwind layers, @font-face rules, every custom class (§9)
   ├─ tests/                           25 test files run by node --test (§18)
   │  ├─ auth/ build/ contract/ dev/ lib/ mail/ proxy/            one folder per area; after-build checks are in build/ and mail/client-bundle.test.mjs
   │  ├─ mail/support/                 7 helper modules that EVERY area imports (loader, env, fake SMTP); do not move
   │  └─ contract/public-event.json, fixtures/fee-cases.json      data copied from the admin repo (§5.1)
   └─ node_modules/ .astro/ dist/ .turbo/ .vercel/ .env           GENERATED or secret, ignored
```

- **What a build writes:** `site:dist/` is Astro's own output (`site:dist/client` for the browser, `site:dist/server/entry.mjs` as input of the function). `site:.vercel/output/` is the deployable result (`static/`, `functions/_render.func`, `config.json`); the Vercel build copies it to `root:.vercel/output/`. `site:dist/` is NOT what Vercel deploys (§12).
- **Never commit `.turbo/` or `.vercel/`:** a committed Turbo cache and a committed `.vercel/output` were once deployed as they were, and every function call crashed (`fd0ff33`, 2026-08-01). Both are ignored at both levels (`root:.gitignore:36-40`, `site:.gitignore:26-30`). Delete a local `site:.vercel/output/` and `site:dist/` after looking at them: a local build writes this machine's `.env` values into the server files as literals (`site:tests/mail/client-bundle.test.mjs:5-9`).
- **`site:.env` holds secrets:** create it from `site:.env.example`; never commit it and never open it from an AI tool. Only `.env`, `.env.local`, `.env.production` and the three `.env.*.local` names are ignored (`root:.gitignore:19-23`, `site:.gitignore:17-18`); a file named `.env.development` or `.env.staging` is ignored nowhere and could be committed by accident.

### 5.3 Admin repo

```text
UlsahamAdminPanel/                     repo root (admin:)
├─ package.json, package-lock.json     scripts and ranges; npm lockfile
├─ next.config.ts                      zxing wasm check, image host rule, security headers, lint skipped in builds
├─ vercel.json                         fluid: true, regions bom1
├─ auth.config.ts                      Auth.js config shared with the middleware: session, cookie, path rules (§10)
├─ tsconfig.json                       strict; alias @/* to src/*; also covers test/, scripts/ and prisma/seed.ts
├─ eslint.config.mjs, vitest.config.ts, tailwind.config.ts, postcss.config.mjs, components.json     tool configs
├─ .env.example, .gitignore, README.md every env key with placeholders (§10); ignore rules; a 5-line README, stale (§17)
├─ prisma/                             schema.prisma (5 models, 5 enums, 5 embedded types, MongoDB), seed.ts (§11)
├─ scripts/                            run by hand only
│  ├─ check-bundle.mjs                 npm run check:bundle: page budgets, reads .next/ (§13)
│  ├─ backfill-entry-type.ts           one-off data fix; dry run unless --apply (§11)
│  └─ report-unrecorded-payments.ts, lib/payment-pairing.ts       read-only report of payments with no booking (§11)
├─ public/brand_logo_440.avif          the logo in use (login, header, sidebar, ticket image)
├─ public/zxing/zxing_reader-3.0.3.wasm     scanner decoder; the name must match the installed zxing-wasm (§4.4)
├─ public/brand_logo.avif, public/brand_logo.png, assets/         older logo files and ticket mock-ups; no code uses them
├─ src/middleware.ts                   applies the path rules of auth.config.ts
├─ src/app/                            App Router
│  ├─ layout.tsx, page.tsx, globals.css, global-error.tsx         root shell, redirect from /, design tokens
│  ├─ (auth)/login/page.tsx            /login
│  ├─ admin/                           staff pages; layout.tsx re-checks the session; loading, error, not-found files
│  │  ├─ dashboard/ logs/ settings/ admins/ scan/
│  │  └─ events/                       list, new/, [id]/edit/, [id]/participants/, [id]/scan/
│  └─ api/
│     ├─ public/                       the REST API the site calls, 11 route files (§7)
│     │  ├─ events/, events/[slug]/, brand-partners/, participants/{check, my-tickets, my-tickets-by-user}/
│     │  └─ events/[slug]/{register, apply-coupon, payment/order, payment/verify, payment/status}/
│     ├─ razorpay/webhook/route.ts     Razorpay webhook
│     └─ admin/upload/route.ts, auth/[...nextauth]/route.ts       image upload to Cloudinary; Auth.js handlers
├─ src/actions/                        6 files of server actions, the staff write path (§10)
├─ src/services/, src/repositories/    business rules (3 files); nearly all Prisma queries (5 files)
├─ src/validators/                     zod schemas: event, participant, admin, settings
├─ src/lib/                            31 helper modules
│  ├─ auth.ts, env.ts, env-schema.ts, prisma.ts, activity-logger.ts             sign-in, env check, DB client, audit log
│  ├─ pricing.ts, coupon.ts, competition.ts, event-status.ts, event-time.ts, entry-type.ts, revenue.ts     rules
│  ├─ razorpay.ts, ticket-code.ts, ticket-payload.ts, duplicate-payment.ts, index-guard.ts     payments, bookings
│  ├─ ratelimit.ts, cors.ts, sanitize.ts, query-params.ts, server-timing.ts     API plumbing
│  ├─ site-ticket-mail.ts, cloudinary.ts                          calls to the site and to Cloudinary
│  └─ gate-scanner.ts, counter-checkout.ts, image-resize.ts, participation-card-pdf.ts, ticket-contacts.ts, slug.ts, utils.ts
├─ src/components/                     ui/ (19 files: shadcn primitives and a native select), admin/, auth/, events/, participants/, settings/, shared/ (§9)
├─ src/constants/index.ts, src/config/nav.ts, src/types/          limits, labels and UI copy; nav items; DTOs and typings
├─ test/                               15 Vitest files by theme, setup.ts (isolation), fixtures/fee-cases.json (§18)
└─ node_modules/ .next/ next-env.d.ts tsconfig.tsbuildinfo .env.local           GENERATED or secret, ignored
```

- **`admin:.env.local` holds PRODUCTION credentials** (`admin:vitest.config.ts:8-10`, `admin:test/setup.ts:1-5`). Never commit it and never open it; anything run locally with it acts on the live database (§2). The repo has no `.env`, which matters for the Prisma CLI (§11).
- `admin:.next/` is written by `next build` and `next dev` (the bundle check reads it); `admin:next-env.d.ts` and `admin:tsconfig.tsbuildinfo` are regenerated by Next and `tsc`; `admin:node_modules/` comes from `npm install`, whose `postinstall` runs `prisma generate`. None is ever committed (`admin:.gitignore:2,11,38-39`; env files `:27-28`, `.vercel` `:35`).
- Layering: `admin:src/actions` (session, role, validation, audit log) calls `admin:src/services` (rules), which calls `admin:src/repositories` (Prisma). It is a convention, not enforced: API routes, pages and five of the six action files also import repositories directly, and four `admin:src/lib` files use the Prisma client themselves (`auth.ts`, `activity-logger.ts`, `index-guard.ts`, `server-timing.ts`) (§10).

### 5.4 Where to look first

| I want to change ... | Start in |
|---|---|
| Fees, GST or the platform fee | `admin:src/lib/pricing.ts`, then `site:src/lib/fees.js`, then the fee table in both repos (§5.1) |
| A field the site reads from an event | `toPublicEvent` in `admin:src/services/event.service.ts:178-212` (detail), `PUBLIC_EVENT_LIST_SELECT` in `admin:src/repositories/event.repository.ts:173-193` (list), the event inside each booking in `admin:src/app/api/public/participants/my-tickets/route.ts` (tickets), then the matching list in `site:tests/contract/public-event.json` |
| When booking is open or closed | `admin:src/lib/event-status.ts`, `admin:src/lib/event-time.ts`, then the site mirrors (§5.1) |
| How long the CDN keeps API answers | `site:src/lib/edge-cache.js:13-20` |
| Booking and payment | Screens: `site:src/components/RegistrationForm.jsx`, `site:src/lib/payment-flow.js`, `site:src/lib/pending-payment.js`. API: `admin:src/app/api/public/events/[slug]/payment/`, `admin:src/app/api/razorpay/webhook/route.ts`, `admin:src/lib/razorpay.ts` |
| Customer sign-in | `site:src/pages/api/auth/`, `site:src/lib/otp.js`, `site:src/lib/google-oauth.js`, `site:src/components/AuthForm.jsx` |
| E-mail wording or layout | `site:src/lib/mailer.js` (shell, senders), `site:src/lib/ticket-mail.js`, `site:src/pages/api/auth/send-otp.js` |
| My Bookings, the ticket image, the card PDF | `site:src/components/AccountPage.jsx`, `site:src/lib/generate-ticket.js`, `site:src/lib/participation-card-pdf.js` |
| Colours, fonts, shared CSS | `site:tailwind.config.mjs`, `site:src/styles/global.css`; `admin:src/app/globals.css`, `admin:tailwind.config.ts` (§9) |
| Add a site page | `site:src/pages/` with `export const prerender = true`, plus a budget in `site:tests/build/bundle-budget.test.mjs:23-34` (a page without one fails the check) |
| Add a staff page | `admin:src/app/admin/`, the path rules in `admin:auth.config.ts:3-17`, a row in `admin:test/auth-config.test.ts`, a budget in `admin:scripts/check-bundle.mjs:27-43` |
| Add or change a staff action, or who may run it | `admin:src/actions/`, then its service and repository; a row in `admin:test/action-roles.test.ts` (an action without one fails) |
| Database fields or indexes | `admin:prisma/schema.prisma`, after reading §11 (an index change needs a manual push) |
| Gate scanner | `admin:src/components/participants/qr-scanner.tsx`, `admin:src/components/participants/global-qr-scanner.tsx`, `admin:src/lib/gate-scanner.ts`; admit rules in `admin:src/actions/participant.actions.ts:195-376` |
| An env key | Site: `site:.env.example`, read by literal name as in `site:src/lib/mailer.js:11-23`. Admin: `admin:src/lib/env-schema.ts`, `admin:.env.example`, `admin:test/setup.ts` |
| Host names, or the admin origin | Allowed hosts: `site:astro.config.mjs:14-21`. The public site URL is written in `site:astro.config.mjs:8` (`site`) and as the `SITE_URL` default in `site:src/lib/mailer.js:41` and `admin:src/lib/env-schema.ts:32`; the admin's CORS origins come from env keys (`admin:src/lib/cors.ts:4`). The admin origin is written in `site:astro.config.mjs:40`, `site:src/lib/backend.js:13` and `site:tests/lib/backend-url.test.mjs:28` |
| Rate limits; security headers | `admin:src/lib/ratelimit.ts` (authoritative), `site:src/lib/rate-limit.js` (the site's own routes); `site:scripts/fix-vercel-routes.mjs:22-26`, `admin:next.config.ts:56-64` |
| Limits, labels and UI copy in the panel; the support contact on the site | `admin:src/constants/index.ts`; `SUPPORT_EMAIL` in `site:src/lib/contact.js:4` |

---

## 6. Architecture

This section covers the customer site and its hops to the backend. Admin panel internals (layering, staff sessions, server actions, its env keys) are in §10. Per-endpoint status codes, rate limits and the edge-cache table are in §7. In citations a bare `:N` continues the file cited just before it in the same bullet, list item or table row.

### 6.1 System map

```text
CUSTOMER BROWSER
  |-- HTTPS ---------------> VERCEL EDGE, site project, region bom1
  |                            |-- prerendered pages, /_astro files, /404.html   (no function runs)
  |                            |-- CDN cache for GET /api/public reads           (table in §7)
  |                            '-- /api/* --> SITE FUNCTION _render.func (Astro on Node, 60 s ceiling)
  |                                             |-- SMTP ----------------> SMTP relay
  |                                             |-- HTTPS ---------------> Google (token, userinfo)
  |                                             '-- HTTPS + x-proxy-key -> ADMIN API /api/public/* (Next.js on Vercel, bom1)
  |-- consent screen ------> Google                                           |-- Prisma --> MongoDB
  |-- images, hero video --> Cloudinary <----------- uploads (§10) -----------|
  '-- checkout.js, pay ----> Razorpay <------------- orders API (SDK) --------|-- REST ----> Upstash Redis
                               '-- webhook payment.captured ----------------->|
SITE FUNCTION /api/internal/ticket-mail <----------- HMAC-signed POST --------'
STAFF BROWSER -- HTTPS, staff session (§10) --> admin panel pages (same Next.js app as the ADMIN API)
```

| From | To | Protocol and auth | Code |
|---|---|---|---|
| Browser | Site edge | HTTPS, no auth. `ulsaaham.com` answers 308 to `www.ulsaaham.com` (checked 2026-10-11; §12) | `site:astro.config.mjs:8`, `root:vercel.json:4` |
| Site edge | Site function | `/api/*` (and Astro's built-in `/_image`); one function serves all 7 route files | `site:astro.config.mjs:9,24`, `site:tests/build/function-smoke.test.mjs:29-32` |
| Site function | Admin `/api/public/*` | HTTPS. Adds `x-proxy-key` (shared secret) and `x-client-ip`; forwards only 4 request headers; 8 s reads, 25 s writes. The ticket mailer's lookup (`GET participants/check`, 10 s) uses the same handshake | `site:src/pages/api/public/[...path].js:10,27-28,65`, `site:src/lib/backend.js:42-50,94-113`, `admin:src/lib/ratelimit.ts:188-225` |
| Admin | Site `/api/internal/ticket-mail` | HTTPS POST, 5 s. `x-ulsaham-timestamp` + `x-ulsaham-signature` (HMAC-SHA256 keyed with `PROXY_SHARED_SECRET`) | `admin:src/lib/site-ticket-mail.ts:13-15,25-52`, `site:src/lib/backend.js:78-88` |
| Admin | MongoDB | Prisma client, `DATABASE_URL` | `admin:prisma/schema.prisma:5-8` |
| Admin | Upstash Redis | REST, URL + token. Rate limits only; every limiter fails open | `admin:src/lib/ratelimit.ts:8-12,137-144` |
| Admin | Razorpay API | HTTPS through the SDK, `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | `admin:src/lib/razorpay.ts:7-17` |
| Razorpay | Admin `/api/razorpay/webhook` | HTTPS POST. `x-razorpay-signature` = HMAC of the raw body keyed with `RAZORPAY_WEBHOOK_SECRET` | `admin:src/app/api/razorpay/webhook/route.ts:34-47` |
| Browser | Razorpay Checkout | Script plus payment window. The public key arrives as `keyId` in the order answer; none is stored on the site | `site:src/lib/razorpay.js:4`, `site:src/components/RegistrationForm.jsx:736-760` |
| Site function | SMTP relay | SMTP, port 587 unless set, login `SMTP_USER` + `SMTP_PASS`, pooled | `site:src/lib/mailer.js:60-79` |
| Browser and site function | Google | OAuth 2.0 code flow. The function calls the token and userinfo endpoints | `site:src/pages/api/auth/google.js:14-23`, `site:src/pages/api/auth/google/callback.js:32-57` |
| Browser; admin | Cloudinary | Browser: HTTPS GET of image and video URLs, sized by a transform inside the URL. Admin: SDK upload with API key and secret (§10) | `site:src/lib/image.js:8-12`, `site:src/pages/index.astro:10-16`, `admin:src/lib/cloudinary.ts:13-34` |

- The browser never calls the admin origin. Why: the proxy is where the visitor IP is attached and where the CDN lifetime is set (`site:src/lib/edge-cache.js:1-9`), and a same-origin call needs no CORS. Admin public routes need no session (`admin:src/middleware.ts:8`); they are protected by rate limits keyed on the relayed IP. Why a relay: Vercel overwrites `x-forwarded-for` on ingress, so without a trusted `x-client-ip` every site visitor would share one bucket (`site:src/lib/backend.js:36-41`).
- One secret, `PROXY_SHARED_SECRET`, serves both directions: the `x-proxy-key` handshake (site to admin) and the request signature (admin to site). It must be identical in both Vercel projects.

### 6.2 Startup and request lifecycle

#### Prerendered page

1. Example `https://www.ulsaaham.com/events/detail?slug=<slug>`. The edge serves static HTML; no function runs. All 10 pages set `export const prerender = true` (line 2 of each page file; line 4 in `site:src/pages/404.astro` and `site:src/pages/auth/complete.astro`). The server does not read the query string, so every slug gets the same file.
2. `<head>` in document order (`site:src/layouts/BaseLayout.astro:29-64`): meta tags, `preconnect` to Cloudinary, `dns-prefetch` for Razorpay, preload of the body font, the page's `head` slot, `<title>`, and in production builds the Speed Insights stub and script (`:56-63`).
3. On `/`, `/events` and `/events/detail` the `head` slot holds `ApiPrefetch`: an inline script that at once calls `fetch("/api/public" + path)` for the page's first reads and parks each promise in `window.__ulsPre[path]` (`site:src/components/ApiPrefetch.astro:15-34`). Why inline and in the head: it runs while the HTML is still parsing and before the stylesheet can hold it back, so the data request overlaps the island JS download (`:2-7`).
4. The static shell paints. On the seven pages that include `SiteNav` (all but `/login`, `/auth/complete` and the 404 page) its bundled script reads `getUser()` and, when a user is stored, turns the avatar into the name's first letter linking to `/account` (`site:src/components/SiteNav.astro:48-72`).
5. React islands hydrate. Directives in use: `client:load` (hydrate as soon as the island JS arrives) on `/events`, `/events/detail`, `/account` and `/login`; `client:idle={{ timeout: 1500 }}` (hydrate when the browser is idle, after 1500 ms at the latest) for the two home islands, which sit on slides 2 and 3 (`site:src/pages/index.astro:189,194`). No other directive is used. Until then the HTML shows each island's first render (a spinner or skeleton; on `/login` the form itself); this is Astro's standard behaviour, **unverified** against the build output.
6. First data call: the island's mount effect calls a helper from `site:src/lib/api.js`, and `apiFetch` takes the parked promise for the same path, once, so no second request is made (`:63-78`). A failed early request settles to `null` and the helper fetches again. The `GET /api/public/...` itself is answered by the edge cache when it holds a copy, otherwise by the function, which relays it to the admin API. Checked on 2026-10-11: `x-vercel-cache` read `MISS`, then `HIT`, for the home upcoming list.
7. Gating happens only now, in the browser: `/account` redirects to `/login?next=/account` when no user is stored (`site:src/components/AccountPage.jsx:504-505`), and the booking form shows a login gate (`site:src/components/RegistrationForm.jsx:480-493`).

#### On-demand route

1. The edge passes each `/api/*` request to the single function `_render.func`: ceiling 60 s (`site:astro.config.mjs:24`), region `bom1` (`root:vercel.json:4`). `output: "server"` (`site:astro.config.mjs:9`) exists only for these routes; no page is rendered on demand.
2. Astro builds `request.url` from `Host` and `X-Forwarded-Host` only for hosts listed in `security.allowedDomains`; any other host becomes `https://localhost` (`site:astro.config.mjs:10-21`). Why it matters: the Google `redirect_uri` and the same-site check of `/api/send-ticket` are both derived from `request.url`.
3. The route file's exported handler runs: `ALL` for the proxy, exactly one of `GET` or `POST` for the other six. What Astro answers for a method a file does not export is **unverified**.
4. State a handler keeps between requests is per warm instance and is lost on a cold start: env values read at module load, the in-memory rate-limit `Map` (`site:src/lib/rate-limit.js:10-11`), the pooled SMTP transport (`site:src/lib/mailer.js:58`).
5. The answer is the JSON envelope `{ success: true, ...data }` or `{ success: false, error, ...extra }` with `Cache-Control: no-store` (`site:src/lib/http.js:3-15`), or a 302 from the two Google routes. Only a proxied read may carry a CDN lifetime (§7).

### 6.3 Routing and pages

| Route | File | Rendering | Purpose |
|---|---|---|---|
| `/` | `site:src/pages/index.astro` | prerendered | Home: four-slide pager with hero video, events, partners, contact |
| `/events` | `site:src/pages/events/index.astro` | prerendered | Featured, upcoming and past lists |
| `/events/detail?slug=<slug>` | `site:src/pages/events/detail.astro` | prerendered, one file for every event | Event page and booking form |
| `/account` | `site:src/pages/account.astro` | prerendered, `noindex` | Profile and My Bookings |
| `/login` | `site:src/pages/login.astro` | prerendered, `noindex` | Sign-in; reads `?next=` and `?error=` |
| `/auth/complete` | `site:src/pages/auth/complete.astro` | prerendered, `noindex` | Finishes Google sign-in in the browser |
| `/about`, `/privacy`, `/terms` | `site:src/pages/about.astro`, `site:src/pages/privacy.astro`, `site:src/pages/terms.astro` | prerendered | Static copy |
| any unknown path | `site:src/pages/404.astro` | prerendered, `noindex` | `/404.html`, served by the CDN through the adapter's catch-all route (`:2-3`) |
| `GET, HEAD, POST, OPTIONS /api/public/<allowed path>` | `site:src/pages/api/public/[...path].js` | on-demand | Proxy to the admin public API |
| `POST /api/auth/send-otp`, `POST /api/auth/verify-otp` | `site:src/pages/api/auth/send-otp.js`, `site:src/pages/api/auth/verify-otp.js` | on-demand | Mail a one-time code and set `otp_session`; check the code |
| `GET /api/auth/google`, `GET /api/auth/google/callback` | `site:src/pages/api/auth/google.js`, `site:src/pages/api/auth/google/callback.js` | on-demand | Start Google sign-in (302); finish it (302 to `/auth/complete`) |
| `POST /api/send-ticket` | `site:src/pages/api/send-ticket.js` | on-demand | A visitor asks for a ticket e-mail |
| `POST /api/internal/ticket-mail` | `site:src/pages/api/internal/ticket-mail.js` | on-demand | The admin asks for a ticket e-mail (signed) |
| `/_image` | Astro built-in, passthrough service (`site:astro.config.mjs:29-34`) | on-demand | Unused; answered 403 in production on 2026-10-11 |

- There is no client router and no view transitions. Every navigation is a full page load through a plain `<a href>`. Scripts navigate with `window.location.replace(...)` (sign-in finished, sign-out, gates) or `window.location.href` (hand-off to Google, `site:src/components/AuthForm.jsx:282`).
- The event slug travels as a query parameter. The inline prefetch reads it in the head (`site:src/components/ApiPrefetch.astro:30-33`) and `EventDetail` reads it on mount (`site:src/components/EventDetail.jsx:190`). No slug shows "No event specified."; an unknown slug shows the API error with a link back to `/events`.
- Links to an event must be `/events/detail?slug=<slug>` (`site:src/components/EventCard.jsx:22`), and a slug must match `[a-z0-9-]+` or the proxy answers 404 (`site:src/pages/api/public/[...path].js:20-22,50`). Cost of the single shell: every event has the same title, description and share image, and the page has no canonical link on purpose, because one would fold every event into one URL (`site:src/layouts/BaseLayout.astro:11-15`).
- Other URL inputs: `?next=<path>` on `/login`, `/auth/complete` and `/api/auth/google`, always passed through `safeNextPath` (§6.6); `?error=<code>` on `/login`; the hashes `#gallery`, `#testimonials` and `#connect` pick a home slide (`site:src/pages/index.astro:263`).
- A new page needs `export const prerender = true` and a bundle budget entry (§13). If it has a first read, add the query to `site:src/lib/page-data.js` and put `ApiPrefetch` in the `head` slot.

### 6.4 Client state and browser storage

- State lives in React `useState` and `useRef` inside each island. There is no context, reducer or store library (a search of `site:src` finds none), and islands do not share React state. What crosses islands, scripts and pages is `localStorage`, the JS global `window.__ulsPre` and the URL. `sessionStorage` is not used.
- A full page load drops all React state. Examples: the 15-minute Razorpay order reuse is a ref, and the Payment ID of a finally refused confirmation is plain state (§8).

| Key | JSON shape | Written by | Read by | Lifetime |
|---|---|---|---|---|
| `ulsaham_user` (localStorage) | `{ email?, name?, phone?, age?, avatar?, googleId?, tickets: [ticket] }` | `setUser`, `addTicket` (`site:src/lib/auth.js:22-33,47-55`) | `getUser` (`:7-9`): nav script, `AuthForm`, `RegistrationForm`, `AccountPage`, `signInWithGoogle` | Until sign-out (`clearUser`, `:35-40`) or cleared storage. No expiry |
| `ulsaham_accounts` (localStorage) | `{ "<lower-cased address>": { "hasGoogle": true } }` and nothing else | `setUser`, `clearUser` (`site:src/lib/auth.js:26-30,39`) | `getKnownAccount` (`:43-45`) | Survives sign-out on purpose. No expiry |
| `ulsaham_pending_payment` (localStorage) | `{ slug, orderId, phone, total, createdAt, email?, paymentId?, checkedAt? }` | `savePendingPayment`, `updatePendingPayment` (`site:src/lib/pending-payment.js:34-40,69-72`) | `readPendingPayment` (`:53-66`), from the booking form only | Looked for during 30 min, dropped on read after 24 h (`:13-14`); cleared when the booking is found or finally refused. NOT cleared by sign-out (open item, §17) |
| `window.__ulsPre` (JS global, not storage) | `{ [path]: Promise of { ok, status, data }, { status: 429 } or null }` | inline prefetch (`site:src/components/ApiPrefetch.astro:16`) | `takePrefetched` (`site:src/lib/api.js:63-70`) | One page view; an entry is deleted on first use |

- `ticket` is the register or verify payload plus `registeredAt` and `savedAt` (ISO strings), or a bare `{ ticketCode }` for a code found by lookup. `phone` is a 10-digit string, `age` a number, `total` rupees.
- Why `ulsaham_accounts` holds one flag per address and nothing else: on a shared phone the next person must not find earlier visitors' names, phones or ages (`site:src/lib/auth.js:2-4`).
- `getUser()` never throws. `setUser()` can throw when storage is blocked or full, so callers that must survive it wrap it (`site:src/lib/google-complete.js:56-61`, `site:src/components/AccountPage.jsx:412-417`). Renaming a key signs every visitor out and orphans pending payments; the spelling `ulsaham_` is deliberate.

| Cookie | Set by | Attributes | Lifetime | Purpose |
|---|---|---|---|---|
| `otp_session` | `site:src/pages/api/auth/send-otp.js:120`, re-set at `site:src/pages/api/auth/verify-otp.js:83` | `HttpOnly; SameSite=Lax; Path=/api/auth`; `Secure` in production builds (`site:src/lib/otp.js:85-93`) | 600 s; the remaining seconds after a wrong guess; deleted on success, on expiry and after 5 wrong guesses | Stateless one-time-code session, HMAC-signed |
| `g_oauth_nonce` | `site:src/pages/api/auth/google.js:11` | `HttpOnly; SameSite=Lax; Path=/api/auth/google`; `Secure` in production builds (`site:src/lib/google-oauth.js:14-20`) | 600 s; deleted first thing in the callback (`site:src/pages/api/auth/google/callback.js:11-12`) | Binds a Google sign-in to the browser that started it |
| `google_auth_result` | `site:src/pages/api/auth/google/callback.js:80-86` | Not `HttpOnly`; `SameSite=Lax; Path=/`; `Secure` in production builds | 60 s; cleared by `/auth/complete` on every visit (`site:src/lib/google-complete.js:52-53`) | Hands the Google profile to a static page |

- None of the three is a session; all are gone within 10 minutes. `Lax` is required because the way back from Google is a top-level GET from another site (`site:src/lib/google-oauth.js:10-12`). A set and its delete must name the same `Path`, or the browser keeps a second copy (`site:src/lib/otp.js:83-85`).
- `otp_session` value: `base64url(JSON(session)) + "." + base64url(HMAC-SHA256(OTP_SECRET, data))` (`site:src/lib/otp.js:24-28`). Session fields: `email, hashedOtp, expiresAt, attempts, lastSentAt, firstSentAt, sendCount` (`site:src/pages/api/auth/send-otp.js:96-104`).

### 6.5 Client API layer

- **One file, same origin only.** `site:src/lib/api.js`, `BASE = "/api/public"` (`:1`); the function table is in §7, and every bare `:N` in the bullets below is this file. The browser calls `/api/public/*` and `/api/send-ticket` through it, and `/api/auth/*` straight from the sign-in form (`site:src/components/AuthForm.jsx:121,143,243`). It never calls the admin origin. The only header set is `Content-Type: application/json` on POSTs; no cookie or `Authorization` header carries identity.
- **Result shape.** Every helper resolves, never rejects, to `{ ok, status, data }`. `data` is the server envelope `{ success, data?, error?, code?, fieldErrors?, pending? }`, so a payload is `res.data.data`. A `try/catch` around a helper is dead code; test `ok` and `status`. Statuses other than 429 and 0 pass the server JSON through untouched.
- **429.** The body is not read. The text is replaced per call and `code` is lost: default "Too many requests. Please try again later." (`:38`); order and verify "Too many attempts. Please wait before trying again." (`:132`); reads, the `my-tickets-by-user` lookup and the status check "Too many requests. Please try again in a moment." (`:3,158`).
- **Status 0.** Offline, aborted, timed out or a non-JSON answer all become `{ ok: false, status: 0 }` with "Network error. Please try again." (`:5-7`). Why: the payment screens treat a lost answer as "ask again", never as a refusal.
- **Exception, `sendTicketEmail`** (`:175-192`): it keeps the server's own 429 text, a non-JSON answer keeps its real status with `data = {}`, and a missing code or address answers locally with status 0. It sends `keepalive: true` so the request survives leaving the page (**unverified** on a device).
- **Timeouts.** `ORDER_TIMEOUT_MS = 25000`, `VERIFY_TIMEOUT_MS = 20000`, `STATUS_TIMEOUT_MS = 10000` (`:12-14`), each overridable with `timeoutMs` and cancellable with `signal`. Nothing else has a browser timeout: the other `/api/public` calls are bounded by the proxy (8 s reads, 25 s writes, then 504); `/api/send-ticket` and `/api/auth/*` only by server-side limits (10 s booking lookup, `site:src/lib/backend.js:100`; SMTP 10 s connect, 10 s greeting, 20 s socket, `site:src/lib/mailer.js:75-77`) under the 60 s function ceiling. Why a hand-written `deadline()` (`site:src/lib/api.js:21-35`): older phones lack `AbortSignal.timeout` and `AbortSignal.any`.
- **Prefetch.** `apiFetch(path)` called without `init` takes `window.__ulsPre[path]` once and deletes it; `null` falls through to a live fetch; `{ status: 429 }` becomes the 429 object (`:72-78`). POSTs never take a prefetched result. `getEvent(slug, { fresh: true })` appends `?fresh=1`, which misses both the prefetch and the edge cache on purpose (`:108-115`).
- **The URL is a contract.** `eventsPath()` writes `page, limit, featured, upcoming, past` in that order, defaults `page = 1` and `limit = 12` (`:95-102`). First-page queries live in `site:src/lib/page-data.js:10-19`, never inline. Why: one character of drift misses both the prefetch and the CDN cache. Pinned by `site:tests/proxy/prefetch.test.mjs`.
- **A new endpoint** needs a helper here and its path in the proxy's `PATHS` expression (`site:src/pages/api/public/[...path].js:20-21`); without the second, the proxy answers 404 "Not found.".

### 6.6 Customer sign-in lifecycle

#### One-time code by e-mail

1. `/login?next=<path>`: `AuthForm` computes `next = safeNextPath(...)` and leaves at once if a user is already stored (`site:src/components/AuthForm.jsx:226-230`). The address is trimmed and lower-cased; if `ulsaham_accounts` flags it `hasGoogle`, the visitor is sent to Google instead (`:61-64,281-284`).
2. `POST /api/auth/send-otp` with `{ email }`. The server applies its limits (§7), draws a 6-digit code with `crypto.randomInt`, mails it, and only then sets `otp_session` (`site:src/pages/api/auth/send-otp.js:95-121`). Why mail first: a failed send must not burn the cooldown or leave a cookie for a code that never arrived.
3. `POST /api/auth/verify-otp` with `{ email, otp }`, the code as a string (a number loses leading zeros). The server checks the cookie signature, the address, the expiry, the attempt count and its own limits, then compares in constant time (`site:src/pages/api/auth/verify-otp.js:36-73`). A wrong code answers 400 with `attemptsLeft`.
4. A right code deletes the cookie and answers `{ success: true, data: { email, tickets: [] } }` (`site:src/pages/api/auth/verify-otp.js:92-94`). Nothing else the client posted comes back, because a code proves only the address.
5. The browser stores `knownAccount ? { ...knownAccount, ...data.data } : data.data` with `setUser` and calls `window.location.replace(next)` (`site:src/components/AuthForm.jsx:165-167`). Resend posts `{ email, resend: true }` after a 60 s countdown (`:93,121-125`). Name, phone and age are asked for later by the booking form (`CompleteProfileStep`, `site:src/components/RegistrationForm.jsx:495-508`); the phone is never verified.

#### Google

1. The button links to `/api/auth/google?next=<path>`. The route sanitises `next`, draws a nonce (16 random bytes, base64url), sets `g_oauth_nonce`, and redirects to Google with `state = base64(JSON({ next, nonce }))`, `scope=openid email profile`, `prompt=select_account` and `redirect_uri = <request origin>/api/auth/google/callback` (`site:src/pages/api/auth/google.js:4-24`).
2. The callback reads and deletes the nonce cookie, then refuses in this order: `error` or no `code` (`google_denied`); nonce in `state` differs from the cookie (`google_state`, before the code is spent); token exchange fails (`google_token`); userinfo fails (`google_profile`); `verified_email !== true` (`google_unverified`). Each is a 302 to `/login?error=<code>` (`site:src/pages/api/auth/google/callback.js:10-67`). The flow must finish within 600 s and in one tab: a second start overwrites the nonce, and the first tab ends at `google_state`.
3. On success it sets `google_auth_result` = `{ email, name, avatar, googleId }` and redirects to `/auth/complete?next=<path>` (`site:src/pages/api/auth/google/callback.js:69-88`). Only the access token is used, once; the ID token is ignored and nothing from Google is stored on the server.
4. The static page reads and clears the cookie, then `signInWithGoogle`: the same person (address compared case-insensitively) keeps what this device holds, anyone else starts from `{ tickets: [], ...profile }` (`site:src/lib/google-complete.js:39-63`). No cookie gives `/login?error=no_auth_result`; a storage failure gives `auth_failed`.

#### What signed in means

- Signed in = `localStorage["ulsaham_user"]` holds a JSON object. There is no server session, session cookie or token. It is checked only in the browser (nav avatar, `/login` redirect, `/account` gate, booking-form gate), and anyone can write the key in dev tools, so it proves nothing to a server. Sign-out is `clearUser()` then `window.location.replace("/")` (`site:src/components/AccountPage.jsx:543`).
- `safeNextPath(value, fallback = "/account")` (`site:src/lib/next-path.js:7-28`) accepts only a path on this site: it must start with `/`, parse against a dummy base without changing origin, and not begin with `//` or `/\` after rebuilding. It runs at four places: the sign-in form (`site:src/components/AuthForm.jsx:228`), the start route, the callback and the complete page. Why: `state` returns from Google unsigned, and an absolute or `javascript:` URL would be an open redirect or script on this origin.

| Call | What stands in for identity |
|---|---|
| `POST participants/my-tickets-by-user` | Nothing: returns ticket codes for any phone or address. 10 per minute per IP (`admin:src/lib/ratelimit.ts:116-122`) |
| `POST participants/my-tickets`, `GET participants/check` | Knowing a ticket code. 30 and 20 per minute per IP (`admin:src/lib/ratelimit.ts:100-106,57-63`) |
| `POST /api/send-ticket` | Nothing: mails any paid ticket to any address. Same-site check on `Origin` or `Referer` (a script can forge it), 12 per hour per IP, 6 per hour per ticket (`site:src/pages/api/send-ticket.js:11-18`) |
| `POST events/<slug>/register`, `payment/order` | Nothing: a booking can be made under any phone |
| `POST events/<slug>/payment/status` | Order id plus the booking's own phone; a wrong phone reads as "pending" (`admin:src/app/api/public/events/[slug]/payment/status/route.ts:68-72`) |
| Profile edit on `/account` | Local only; the address can be changed with no new code and becomes the lookup identity when the profile has no phone (`site:src/components/AccountPage.jsx:436,536`) |

- Rule: never put anything sensitive behind "is there a user in localStorage". Before a code ever issues a server-side session, move the guess limits to a shared store (`site:src/pages/api/auth/verify-otp.js:10-15`). Only `/api/send-ticket` has a same-site check; Astro's default `security.checkOrigin` behaviour for the other POST routes is **unverified**. Decisions still open on lookup identity: §17.

#### Token and secret lifecycles

| Item | Lives | Ends | What rotating its key breaks |
|---|---|---|---|
| One-time code and `otp_session` | 10 min (`OTP_TTL_MS`), 5 guesses (`site:src/lib/otp.js:65,69`) | Success, expiry, fifth wrong guess | `OTP_SECRET` signs the cookie and keys the code hash. Rotation only breaks codes in flight ("Session expired or not found. Please request a new code."); nobody is signed out (`site:.env.example:3-5`) |
| OAuth `state`, nonce, Google code and access token | Nonce 600 s, single use; code and token one callback, never stored | Start of the callback | `state` is unsigned and the nonce has no key. New `GOOGLE_CLIENT_SECRET`: Google sign-in ends at `google_token` until the site is redeployed with it (inferred from the code); stored users are unaffected |
| Admin request signature | Timestamp within 5 min either way (`SIGNATURE_WINDOW_MS`, `site:src/lib/backend.js:70`) | Window passes | `PROXY_SHARED_SECRET`: change it in BOTH projects and redeploy both. While they differ the admin ignores `x-client-ip` (one rate-limit bucket for all visitors) and webhook ticket mail answers 401. Bookings keep working, so nothing a visitor sees points at it |
| SMTP login | Static | - | New `SMTP_PASS`: every mail fails with 500, code sign-in included, until the site is redeployed (inferred from the code) |

- The signature covers the exact bytes sent: lowercase hex HMAC-SHA256 of `<timestamp>.` followed by the body, timestamp in epoch milliseconds (`site:src/lib/backend.js:72-88`). Re-serialising the JSON on either side breaks it. A changed env value needs a redeploy (§12); secrets are generated by the owner, never in a chat (§2). The Razorpay keys exist only in the admin project (§10).

### 6.7 Configuration and environments

Values live in the git-ignored `site:.env` on a dev machine and in the Vercel project environment. The template is `site:.env.example`: 13 keys, all read by code, and `site:src` reads no other key (the tests add two switches, `BUNDLE_CHECK` and `MAIL_SCAN_STRICT`, §18). No `PUBLIC_*` variable exists. Admin keys are in §10.

| Key | Read at | Required | Default or behaviour when missing |
|---|---|---|---|
| `BACKEND_URL` | `site:src/lib/backend.js:10`, module load | No | Production build: `https://ulsaham-admin-panel.vercel.app/api/public` (`:13,21`). Otherwise `http://localhost:3000/api/public` plus a `console.warn` (`:16,22-23`) |
| `PROXY_SHARED_SECRET` | `site:src/lib/backend.js:11`, module load | Yes in production, equal to the admin's | No handshake headers sent, so the admin rate-limits every visitor as one address; `/api/internal/ticket-mail` answers 503; one `console.warn` per instance, production builds only (`:42-64`) |
| `OTP_SECRET` | `site:src/lib/otp.js:5`, every call | Yes in production | Production build: both code routes answer 503. Otherwise a development placeholder constant (HMAC key literal at `site:src/lib/otp.js:3`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `site:src/pages/api/auth/google.js:15`, `site:src/pages/api/auth/google/callback.js:37-38`, per request | For Google sign-in | Not guarded. No id: `client_id=undefined` is sent and the error appears on Google's page. No secret: the token exchange fails, `/login?error=google_token` (inferred from `site:src/pages/api/auth/google/callback.js:43-48`) |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | `site:src/lib/mailer.js:12,15,16`, module load | Yes for any mail | `isMailConfigured()` is false (`:43-45`): `send-otp`, `send-ticket` and internal ticket mail answer 503 |
| `SMTP_PORT`, `SMTP_SECURE` | `site:src/lib/mailer.js:13-14` | No | `587`; `false` unless exactly `"true"` (`:63-64`) |
| `OTP_EMAIL_FROM`, `TICKET_EMAIL_FROM` | `site:src/lib/mailer.js:17-18` | No | Fallback sender literals (`:37-38`). One wrapping pair of quotes is stripped (`:25-31`) |
| `SITE_URL` | `site:src/lib/mailer.js:22`, `process.env` only | No | `https://www.ulsaaham.com` (`:41`); base of the account link in ticket mail |

- **Mandatory read form:** `import.meta.env.NAME ?? process.env.NAME`, with the literal name, in server code only. Why two sources: the first is the build-time value, the second the run-time value; which one a given key uses on Vercel is **unverified**, so treat every change as needing a redeploy. Why the literal name: a computed lookup, destructuring, spread or alias of `import.meta.env` makes the bundler inline the whole build-time environment, SMTP password included (`site:src/lib/mailer.js:6-10`, `site:src/lib/backend.js:8-9`). `SITE_URL` is read from `process.env` alone for the same reason (`site:src/lib/mailer.js:19-22`).
- Never read env in an island or in a module an island imports. `site:tests/mail/client-bundle.test.mjs` scans the browser output for secret names and values after a build. A local build writes this machine's `.env` values into the server chunks as literals, so delete that server output after inspecting it and never share it (`:5-9`).
- `OTP_SECRET` uses `||`, so an empty string counts as unset. The placeholder in `site:.env.example:6` is non-empty: copied unchanged it counts as configured, which defeats the production refusal.
- `BACKEND_URL`: trailing slashes are trimmed and a bare origin gets `/api/public` appended (`site:src/lib/backend.js:19,25-27`). A value that does not lead to `/api/public` makes the proxy answer 503 for everything (`site:src/pages/api/public/[...path].js:80-93`); the mail routes have no such guard and report 502 or a misleading 404. The admin origin is written in three places that must change together: `site:astro.config.mjs:40`, `site:src/lib/backend.js:13`, `site:tests/lib/backend-url.test.mjs:28`.

| Aspect | `astro dev` | Vercel preview deployment (derived from the code, **unverified**) | Production |
|---|---|---|---|
| `import.meta.env.PROD` and what hangs on it | `false`: cookies not `Secure`, placeholder OTP secret used when `OTP_SECRET` is unset, no Speed Insights tags | `true` (any `astro build`): `Secure` cookies, 503 without `OTP_SECRET`, Speed Insights tags emitted | Same as preview; whether Speed Insights is enabled on the project is **unverified** |
| Browser calls to `/api/public/*` | Vite proxy to the production admin; GET and HEAD only, every other method gets a local 403 (`site:scripts/dev-proxy.mjs:8-26`). No edge cache | Proxy route to `BACKEND_URL`, behind the Vercel CDN | Same as preview |
| Server-side backend when `BACKEND_URL` is unset | Local admin on port 3000 | The LIVE admin: bookings would be written to production | The live admin |
| Host accepted by `security.allowedDomains` | Localhost is not listed; the effect on the sign-in routes is **unverified** | `**.vercel.app` | `www.ulsaaham.com`, `ulsaaham.com` |
| Google sign-in | **unverified** | **unverified**; needs the preview callback URL registered in the Google client | Redirect confirmed on 2026-10-11 |

- Why the dev proxy is read-only: Vite's proxy runs ahead of the site's own route, and a booking made while developing would be written to the production database (`site:scripts/dev-proxy.mjs:3-6`). So booking, payment, coupons and My Bookings (all POSTs) cannot be exercised under `astro dev`, and the browser reads production while server-side code (`/api/send-ticket`) looks bookings up at `BACKEND_URL`, the local admin unless set otherwise.
- A new hostname must be added to `security.allowedDomains` (`site:astro.config.mjs:14-21`) and its callback URL registered in the Google client, or sign-in returns to localhost.

### 6.8 Forms and validation

All five forms set `noValidate` (`site:src/components/AuthForm.jsx:72,171`, `site:src/components/RegistrationForm.jsx:218,887`, `site:src/components/AccountPage.jsx:611`), so the browser's own checks are off and each rule is JavaScript. The proxy forwards the body bytes unchanged; the admin's zod schemas are the authority.

| Field | Client rule | Server re-check |
|---|---|---|
| Name | Booking form: non-empty after trim (`site:src/components/RegistrationForm.jsx:550`). Profile step and Edit Profile: at least 2 characters (`:206`, `site:src/components/AccountPage.jsx:534`) | 2 to 100 characters (`admin:src/validators/participant.validator.ts:5-8`) |
| Phone | `/^\d{10}$/` (`site:src/components/RegistrationForm.jsx:209,553`); hint "10 digits, no +91" | Same pattern (`admin:src/validators/participant.validator.ts:9-11`); also on `payment/status` and `my-tickets-by-user` |
| Age | Integer 1 to 120 (`site:src/components/RegistrationForm.jsx:210-212,554-556`). Edit Profile accepts non-integers (`site:src/components/AccountPage.jsx:535`) | `z.coerce.number().int().min(1).max(120)` (`admin:src/validators/participant.validator.ts:18-22`) |
| Participant count | Integer from `minMembers` (1, or 2 for a group-only competition) to `MAX_PARTICIPANTS = 10`; forced to 1 for an individual-only competition; not above `remainingUses` of a complimentary code (`site:src/components/RegistrationForm.jsx:33,513,558-567`) | Integer 1 to 10 (`admin:src/validators/participant.validator.ts:23-27`, `admin:src/constants/index.ts:13`), competition quantity rule (`admin:src/lib/competition.ts:15-26`), capacity (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:113-118`) |
| Address | Sign-in: trimmed, lower-cased, loose one-at-sign pattern (`site:src/components/AuthForm.jsx:51-52`). Booking form: optional, not validated (`site:src/components/RegistrationForm.jsx:928`) | Sign-in and ticket mail: at most 254 characters and `EMAIL_RE` (`site:src/pages/api/auth/send-otp.js:50-52`, `site:src/lib/mailer.js:51`). Booking: zod `.email()`, optional, null or empty allowed (`admin:src/validators/participant.validator.ts:12-17`) |
| One-time code | `/^\d{6}$/`; the input strips non-digits and stops at 6 (`site:src/components/AuthForm.jsx:135,185`) | `/^\d{6}$/` after `String(...).trim()` (`site:src/pages/api/auth/verify-otp.js:8,31,34`) |
| Promo code | Upper-cased, `maxLength={32}` (`site:src/components/RegistrationForm.jsx:586,969-972`) | 1 to 50 characters, matched case-insensitively (`admin:src/app/api/public/events/[slug]/apply-coupon/route.ts:9`, `admin:src/lib/coupon.ts:22-23`) |
| Ticket code | Never typed by the visitor | Site mail routes: trimmed, upper-cased, `/^[A-Z0-9][A-Z0-9-]{3,39}$/` (`site:src/lib/ticket-mail.js:12`). Admin order route: 1 to 40 characters (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:17`) |
| `requestId` | `crypto.randomUUID()` or a timestamp-plus-random fallback (`site:src/lib/payment-flow.js:76-83`) | `/^[A-Za-z0-9-]{8,64}$/` (`admin:src/app/api/public/events/[slug]/register/route.ts:16`) |

- Server field errors come back as HTTP 400 with `fieldErrors` and are shown under the fields (`site:src/components/RegistrationForm.jsx:621-626`). This is how the known drifts surface: a one-letter name, a malformed booking address. `EMAIL_RE` refuses the characters an address parser reads as structure, so only one plain address can ever reach the mailer (`site:src/lib/mailer.js:47-51`).
- `MAX_PARTICIPANTS`, the 6-digit code, the 60 s resend and the 5 attempts are duplicated constants with no shared source; change both sides together.
- Re-payment from My Bookings posts the stored profile's name, phone and age through the same schema, so an incomplete profile or a non-integer age gets "Validation failed" with no field shown (§8).

### 6.9 Time and money rules

#### Time

- `event.date` holds only a calendar day, stored as UTC midnight of the day picked in India. `startTime` and `endTime` are strings `hh:mm AM/PM` in India Standard Time. A 24-hour string does not parse, because the pattern needs AM or PM: the start silently becomes 00:00 and the end 23:59 (`site:src/lib/event-time.js:5,27,36-37`).
- Instants are built with a fixed offset, `IST_OFFSET_MINUTES = 5 * 60 + 30`, no daylight saving (`site:src/lib/event-time.js:1,16-20`; mirror of `admin:src/lib/event-time.ts:1,41-47`).
- End of an event: `endTime` on the event day; missing or unparsable gives 23:59 IST; an end at or before the start rolls to the next day (`site:src/lib/event-time.js:35-42`).
- Booking window: open until the END instant, unless the status closes it (`CANCELLED`, `ANNOUNCED`, `BOOKING_CLOSED`) or the event is full (`admin:src/lib/event-status.ts:30-44`). The site applies the same order plus the API's `bookingOpen` flag (`site:src/lib/event-status.js:7-16`). Why the site re-checks the clock: it keeps running on a page left open. The server decides: a closed event answers HTTP 410.
- `status` from the API is the effective status and already reads `COMPLETED` once the end has passed (`admin:src/lib/event-status.ts:25-28`). Use `isBookingOpen(event)`, never `status === "PUBLISHED"`.
- Display is pinned to India: `Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata" })`, built once (`site:src/lib/format-date.js:7-11`); the ticket mail does the same (`site:src/lib/ticket-mail.js:30`). Why: the function runs in UTC and a visitor abroad would otherwise see the day before. Never format `event.date` in the visitor's zone or compare it to "now" directly.

#### Money

- Every price and breakdown field is rupees as a JS number. The only integer-paise values are `order.amount` from the server and `fees.totalPaise` on the site; `ulsaham_pending_payment.total` is `order.amount / 100`. Breakdown lines and totals are shown with `toFixed(2)`; the per-person price on the form is printed as stored.
- Rates: `GST_RATE = 0.18`, `PLATFORM_FEE_RATE = 0.02` (`site:src/lib/fees.js:5-6`, `admin:src/lib/pricing.ts:1-2`). Minimum order `MIN_ORDER_PAISE = 100`; below it the admin answers 400 `AMOUNT_TOO_LOW` because Razorpay refuses orders under one rupee (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:20-21,151-156`).
- Formula, in this order on both sides: (1) price = `effectiveAmount`: `null` when free, the early-bird amount while it is on, else `amount`; (2) base = price x count for a ticket, or price + (`groupExtraAmount`, else price) x (count - 1) for a competition; (3) coupon is flat rupees off the whole order: `discount = min(coupon, base)`, `discountedBase = max(0, base - discount)`; (4) GST and platform fee are each `round2(discountedBase x rate)` when enabled, neither charged on the other, `round2(x) = Math.round(x * 100) / 100`; (5) `total = round2(discountedBase + gst + platformFee)`, `totalPaise = Math.round(total * 100)`.
- Where it lives: `calcFees` in `site:src/lib/fees.js:26-38` is display only; `admin:src/lib/pricing.ts:20-66` is the amount actually charged, called at `admin:src/app/api/public/events/[slug]/payment/order/route.ts:147-150`.
- Kept in step by a shared fixture: `site:tests/fixtures/fee-cases.json` is a byte-for-byte copy of `admin:test/fixtures/fee-cases.json` (30 cases; same git blob `3df58f4` in both repos). `site:tests/lib/fees.test.mjs` and `admin:test/pricing.test.ts` both run every row. The copy is manual. Changing a rate or the rounding means editing `admin:src/lib/pricing.ts`, the fixture in both repos and `site:src/lib/fees.js` together, then releasing ADMIN first (§14).
- Run-time guard: when `order.amount !== fees.totalPaise` the site shows the server's breakdown ("The price changed to ...") and reloads the event before anything is paid (`site:src/components/RegistrationForm.jsx:707-716`).
- Missing-field trap: on the site an absent `gstEnabled` means no GST but an absent `platformFeeEnabled` still charges the fee (`!== false`, `site:src/lib/fees.js:34-35`); the admin requires real booleans (`admin:src/lib/pricing.ts:4-6`). Only the detail payload and the My Bookings `event` carry the pricing fields; a list item must never be priced.

---

## 7. API and backend reference

Flows that use these endpoints are in §8. The browser client (`site:src/lib/api.js`), the sign-in lifecycle and SITE env keys are in §6; server actions and ADMIN env keys in §10; schema in §11. Citation rule here: a bare `:N` continues the file cited just before it; inside a §7.3 block and in §7.4 it is a line of the route file named at the top.

### 7.1 Conventions

- **Three surfaces.** (1) SITE function routes under `site:src/pages/api/` (7 files, ceiling `maxDuration: 60` s, `site:astro.config.mjs:24`). (2) ADMIN public API `admin:src/app/api/public/**/route.ts` (11 files) plus `admin:src/app/api/razorpay/webhook/route.ts`; all are outside the staff sign-in middleware (`admin:src/middleware.ts:8`), so none needs a session. (3) ADMIN staff-only routes (§7.11).
- **Base URLs.** The browser calls only same-origin paths on `https://www.ulsaaham.com`: `/api/public/*` (`site:src/lib/api.js:1`) and the site's own routes (§7.2). The site relays `/api/public/*` to `BACKEND_URL`, resolved once at module load (`site:src/lib/backend.js:10-34`): unset in a production build = `https://ulsaham-admin-panel.vercel.app/api/public`; unset elsewhere = `http://localhost:3000/api/public` plus a warning (why: a dev session must not write to production by default); a bare origin gets `/api/public` appended. Under `astro dev` browser calls to `/api/public` never reach the site route (read-only dev proxy, §13).
- **Path mapping.** Site `/api/public/<path><query>` -> `<BACKEND_URL>/<path><query>` -> `admin:src/app/api/public/<path>/route.ts`. The query string is forwarded verbatim. The target must stay on the `BACKEND_URL` origin under `/api/public/`, else 503 and one `[proxy]` error log per instance (`site:src/pages/api/public/[...path].js:80-93`).
- **Path allow-list** (`:20-22`, `:50`). Answered 404 with no upstream call: a path containing `%`, `..` or a backslash, or one that does not match the pattern below. A slug is `[a-z0-9-]+` only. A new admin endpoint is unreachable from the site until it is added here.
  ```
  ^(events(\/[a-z0-9-]+(\/(register|apply-coupon|payment\/(order|verify|status)))?)?|brand-partners|participants\/(check|my-tickets|my-tickets-by-user))$
  ```
- **Methods** (`:12-13`, `:47`): `GET`, `HEAD`, `POST`, `OPTIONS`; anything else gets 405 with `allow: GET, HEAD, POST, OPTIONS`. Path and method are checked independently.
- **Request headers forwarded** (`:10`, `:56-60`): only `content-type`, `accept`, `accept-language`, `user-agent`. Cookies, `Authorization`, `Origin`, cache validators and any visitor-sent `x-client-ip` or `x-proxy-key` are dropped (why: an allow-list cannot leak a new header; without validators the admin never answers 304, so the CDN always gets a full body).
- **Request headers added** (`site:src/lib/backend.js:42-50`): `x-client-ip` (the visitor IP: `context.clientAddress`, else the first `x-forwarded-for` entry, `site:src/lib/rate-limit.js:55-63`) and `x-proxy-key` (the value of `PROXY_SHARED_SECRET`). Both are sent only when both values exist. The admin trusts `x-client-ip` only when `x-proxy-key` equals its own `PROXY_SHARED_SECRET` (equal length plus `timingSafeEqual`); otherwise it uses the first `x-forwarded-for` entry, then `x-real-ip`, then `127.0.0.1` (`admin:src/lib/ratelimit.ts:188-225`). Why: relayed requests arrive from the site's egress address, so without the handshake every visitor shares one rate-limit bucket. That Vercel overwrites `x-forwarded-for` on ingress is stated only in code comments: **unverified**.
- **Response headers returned by the proxy** (`site:src/pages/api/public/[...path].js:130-137`, `:169-172`): only `content-type` (upstream value, else `application/json`), the cache headers (§7.8; every write gets `cache-control: no-store`) and `retry-after` when the upstream answer is not ok and carries one. `Set-Cookie`, CORS headers, `ETag` and everything else are dropped.
- **CORS** (`admin:src/lib/cors.ts:3-33`): allowed origins are `FRONTEND_URL` (default `http://localhost:3001`) and `NEXT_PUBLIC_APP_URL` when set. A listed `Origin` is echoed; any other request gets `FRONTEND_URL`. Always sent: `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type, Authorization`, `Access-Control-Max-Age: 86400`, `Vary: Origin`; never `Access-Control-Allow-Credentials`. `OPTIONS` answers 204. CORS never refuses a request: it only stops browsers on other origins, and the public POST routes have no Origin allow-list (open decision, §17). The site reaches the admin server to server, and the proxy drops CORS headers, so `/api/public` on the site is same-origin only.
- **ADMIN app-wide headers** on every response (`admin:next.config.ts:54-65`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), microphone=(), geolocation=()`. SITE edge headers: §12.
- **JSON shapes.** For a coded error, switch on `code`, not on the HTTP status or the text: one code is sent with different statuses (§7.6).

| Producer | Success | Error |
|---|---|---|
| ADMIN public API | `{ success: true, data?, message?, pending? }` | `{ success: false, error, code?, fieldErrors? }` |
| ADMIN webhook | `{ status }` | `{ error }` |
| ADMIN upload | `{ url, publicId }` | `{ error }` |
| SITE own routes | `{ success: true, ...data }` | `{ success: false, error, ...extra }`; always `Cache-Control: no-store`; a wait time goes in a `Retry-After` header, not the body (`site:src/lib/http.js:3-15`) |
| SITE proxy, own errors | none | `{ success: false, error }` (`site:src/pages/api/public/[...path].js:36-40`) |

### 7.2 Site server routes

All seven route files are on-demand. Each non-proxy file exports one method; what Astro answers for any other method is **unverified**. None creates a server session (§6).

| Method | Path | Purpose | Auth or check | Success | Errors |
|---|---|---|---|---|---|
| GET, HEAD | `/api/public/<path>` | Relay a read to the admin | Path and method allow-list (§7.1) | Upstream status and body | 404, 405, 503, 504 |
| POST, OPTIONS | `/api/public/<path>` | Relay a write | Same | Upstream status and body | 404, 405, 503, 504 |
| POST | `/api/auth/send-otp` | E-mail a 6-digit sign-in code | `OTP_SECRET` and SMTP configured | 200 `{success:true}` + `otp_session` cookie | 400, 429, 500, 503 |
| POST | `/api/auth/verify-otp` | Check the code | Signed `otp_session` cookie | 200 `{success:true,data:{email,tickets:[]}}` | 400, 429, 503 |
| GET | `/api/auth/google` | Start Google sign-in | None | 302 to Google + `g_oauth_nonce` cookie | None |
| GET | `/api/auth/google/callback` | Finish Google sign-in | Nonce cookie equals the nonce in `state` | 302 `/auth/complete?next=<path>` + `google_auth_result` cookie | 302 `/login?error=<code>` |
| POST | `/api/send-ticket` | Visitor asks for a ticket e-mail | `Origin` or `Referer` host equals the request host | 200 `{success:true}` | 400, 403, 404, 409, 429, 500, 502, 503 |
| POST | `/api/internal/ticket-mail` | Admin asks for a ticket e-mail | HMAC headers (§7.5) | 200 `{success:true}` | 400, 401, 404, 409, 422, 429, 500, 502, 503 |

#### Proxy details
- File `site:src/pages/api/public/[...path].js`. Reads (`:111-138`): `READ_TIMEOUT_MS = 8000`, covering headers and body. Writes (`:146-173`): `WRITE_TIMEOUT_MS = 25000` (why longer: payment verify waits on Razorpay); the POST body is relayed as raw bytes; `OPTIONS` sends no body. No local rate limit, no cookies.
- Own errors (`:33-34`, `:47-54`, `:101-104`): 405 `Method not allowed.`; 404 `Not found.`; 503 `Service temporarily unavailable. Please try again.` (bad `BACKEND_URL`, or the fetch failed); 504 `The server took too long to respond. Please try again.` (timeout).
- Writes only (`:161-167`, `:175-181`): a non-ok, non-JSON upstream answer (a platform HTML 502 or 504) keeps its status and gets a JSON body: 404 `Not found.`, 429 `Too many requests. Please try again in a moment.`, 504 the timeout text, other 5xx the unavailable text, else `The request could not be completed. Please try again.` Why: the browser's `res.json()` would throw and the visitor would read it as a lost connection. Reads are NOT normalised: a non-JSON GET error passes through and the browser client reports status 0.

#### Sign-in routes
- `send-otp` (`site:src/pages/api/auth/send-otp.js:41-122`): body `{ email, resend?: true }`; the e-mail is trimmed, lower-cased, at most 254 chars and must match `EMAIL_RE` (`site:src/lib/mailer.js:51`). The mail is sent before the cookie is set (why: a failed send must not burn the cooldown or leave a cookie for a code that never arrived). Errors: 503 `Sign-in is temporarily unavailable. Please try again later.`; 400 `Invalid request body.`, `A valid email address is required.`, `No active OTP session for this email. Please restart signup.` (resend without a session); 429 with `Retry-After`: `Please wait <N> seconds before requesting another code.`, `Too many OTP requests for this email. Please try again in an hour.`, `Too many verification codes requested from this device. Please try again later.` (limits in §7.7); 500 `Failed to send the verification email. Please try again.` or `Failed to resend code. Please try again.`
- `verify-otp` (`site:src/pages/api/auth/verify-otp.js:19-95`): body `{ email, otp }`; `otp` must be `/^\d{6}$/` (send a string: a number loses leading zeros). Errors: 503 as above; 400 `Invalid request body.`, `Email and OTP code are required.`, `Enter the 6-digit code.`, `Session expired or not found. Please request a new code.`, `Email does not match the OTP session.`, `OTP has expired. Please request a new code.`, `Incorrect code. Please try again.` with `attemptsLeft`; 429 `Too many incorrect attempts. Please request a new code.` (`attemptsLeft: 0` on the fifth wrong guess), `Too many incorrect codes from this device. Please try again later.`, `Too many incorrect codes for this email. Please wait a few minutes and request a new code.` (the last two with `Retry-After`). Success deletes the cookie and returns only the address (why: a code proves an address and nothing else).
- Google start (`site:src/pages/api/auth/google.js:4-24`): `?next=` goes through `safeNextPath`; `state = base64(JSON({ next, nonce }))`; `redirect_uri = <request origin>/api/auth/google/callback`; `scope=openid email profile`; `prompt=select_account`. The request origin is right only for hosts listed in `security.allowedDomains` (`site:astro.config.mjs:14-21`; incident in §2).
- Google callback (`site:src/pages/api/auth/google/callback.js:4-89`): error codes in check order `google_denied` (error or no code), `google_state` (nonce mismatch, checked before the code is spent), `google_token`, `google_profile`, `google_unverified` (`verified_email !== true`, strict boolean). Only `access_token` is used. The result cookie holds `{ email, name, avatar, googleId }` as JSON. The browser step on `/auth/complete` adds two more `/login?error=` codes, `no_auth_result` and `auth_failed` (`site:src/lib/google-complete.js:54-60`; lifecycle in §6).

| Cookie | Attributes | Lifetime | Set at | Cleared by |
|---|---|---|---|---|
| `otp_session` | HttpOnly, SameSite=Lax, Path `/api/auth`, Secure in a production build (`site:src/lib/otp.js:87-93`) | 600 s; the remaining seconds after a wrong guess | `site:src/pages/api/auth/send-otp.js:120`, `site:src/pages/api/auth/verify-otp.js:83` | verify-otp on success, expiry or attempts used up |
| `g_oauth_nonce` | HttpOnly, Lax, Path `/api/auth/google`, Secure in production (`site:src/lib/google-oauth.js:14-20`) | 600 s | `site:src/pages/api/auth/google.js:11` | The callback, at once (`site:src/pages/api/auth/google/callback.js:11-12`) |
| `google_auth_result` | NOT HttpOnly, Lax, Path `/`, Secure in production | 60 s | `site:src/pages/api/auth/google/callback.js:80-86` | The browser on `/auth/complete` |

- `otp_session` value: `base64url(JSON(session))`, a dot, then `base64url(HMAC-SHA256(OTP_SECRET, <that base64url text>))` (`site:src/lib/otp.js:24-28`). Session fields: `email, hashedOtp, expiresAt, attempts, lastSentAt, firstSentAt, sendCount`; `hashedOtp` is hex `HMAC-SHA256(OTP_SECRET, code)` (`:52-54`). With `OTP_SECRET` unset a production build answers the 503 above; any other build signs with a hard-coded development placeholder string (`:3`, `:13-22`), so never treat a non-production build as secure. A set and its delete must name the same path, or the browser keeps a second copy.

#### Visitor ticket mail
- `/api/send-ticket` (`site:src/pages/api/send-ticket.js:14-99`), body `{ ticketCode, email }`. Checks in order: 403 `Request blocked.` (`isSameOrigin`, `site:src/lib/http.js:20-34`: no `Origin` and no `Referer` is also refused) -> 503 `Email is not available right now. Please download your ticket instead.` -> 400 `Invalid request body.`, `Valid email is required.`, `Valid ticket code is required.` (`TICKET_CODE_RE = /^[A-Z0-9][A-Z0-9-]{3,39}$/` after upper-casing, `site:src/lib/ticket-mail.js:12`) -> 429 `Too many ticket emails from this device. Please try again later.`, then 429 `This ticket has already been emailed several times. Please try again later.` (§7.7) -> admin lookup (below) -> 409 `This booking is awaiting payment, so there is no ticket to email yet.` (`amountPaid === false`) -> 429 `That ticket was just emailed. Please check your inbox, including spam.` (same code and address within 60 s) -> 500 `Failed to send the ticket email. Please try again.` -> 200.
- Lookup `fetchTicketByCode` (`site:src/lib/backend.js:94-113`): `GET <BACKEND_URL>/participants/check?ticketCode=<code>` with the proxy handshake, timeout 10000 ms. 404 -> 404 `We could not find that ticket.`; 429 -> 429 `Too many requests. Please try again in a moment.`; anything else not usable -> 502 `Could not confirm your ticket right now. Please try again.`
- The mail is built from the admin's booking, never from the request body (why: no made-up tickets, no injected markup). There is no ownership check: any address can be sent any valid paid code, so the rate limits are the only ceiling. On an SMTP failure only the 60 s slot is given back; the hourly slots stay spent.

### 7.3 Admin public API

Shared by all eleven routes (files under `admin:src/app/api/public/`; inside a block a bare `:N` is a line of that block's route file):
- `OPTIONS` answers 204 with the CORS headers; every response carries them (§7.1).
- Rate-limit refusal: 429 `{success:false,error:"Too many requests. Please try again later."}`, no `code`, no `Retry-After`. Read routes, apply-coupon, my-tickets and my-tickets-by-user check it first; register and the three payment routes check it after the body validates (why: a malformed request costs nothing, `admin:src/lib/ratelimit.ts:150-151`). Limits: §7.7.
- A body that is not JSON: 400 `Invalid JSON body`.
- Buyer fields (`participantSchema`, `admin:src/validators/participant.validator.ts:4-28`): `name` 2..100 chars; `phone` `/^\d{10}$/`; `email` absent, null, `""` or a valid address; `age` integer 1..120 (coerced); `numberOfParticipants` integer 1..10 (coerced; `MAX_PARTICIPANTS_PER_REGISTRATION`).
- Event visibility: drafts (`ANNOUNCED`) are never found. Detail, booking and payment routes find `PUBLISHED`, `BOOKING_CLOSED`, `COMPLETED` and `CANCELLED` so they can answer with a reason (`admin:src/repositories/event.repository.ts:41-45`, `:80-85`); payment status does not find `CANCELLED` (`:91-96`).
- Every 410 text is one of `BOOKING_CLOSED_MESSAGES` (`admin:src/lib/event-status.ts:7-13`): `Booking is closed — this event has ended.` (ENDED), `This event has been cancelled.` (CANCELLED), `Booking is closed for this event.` (CLOSED), `Event is full` (FULL). The competition 400 text is `This competition accepts individual entries only` or `This competition accepts group entries only (minimum 2 members)` (`admin:src/lib/competition.ts:20-25`).
- Cache behaviour: no route sets `Cache-Control` except the brand-partners 200; what Next.js or Vercel adds by default is **unverified**. At the site edge only the list, detail and brand-partners GETs are stored; every POST and every `participants/*` answer is `no-store` there (§7.8). `Server-Timing` is sent only when `SERVER_TIMING=1`, on the 200 and 429 answers of the list, detail and brand-partners routes (`admin:src/lib/server-timing.ts:11`).

#### Events list
- `GET /api/public/events`, file `admin:src/app/api/public/events/route.ts`. Query (`:33-38`, no zod): `page` default 1, clamped 1..1000; `limit` default 10, clamped 1..50 (a non-numeric value reads as the default; why: `?page=abc` would otherwise reach the database as NaN and answer 500); `featured` `true` or `false`, anything else ignored; `upcoming` and `past` count only when exactly `true`.
- Selection (`admin:src/repositories/event.repository.ts:206-231`): `past=true` -> stored `COMPLETED`, newest first, `featured` and `upcoming` ignored. Otherwise stored `PUBLISHED` or `BOOKING_CLOSED`, oldest first; `featured=false` means "not `featured: true`" (rows saved before the field existed count); `upcoming=true` means `date >=` the server's local midnight (`setHours(0, 0, 0, 0)`; expected to be UTC midnight on Vercel, which is **unverified**).
- 200 `{success:true,data:{events,total,page,totalPages}}` (`:43-54`); item keys in §7.9. `total` is counted only for a full page or an empty later page, otherwise it is `skip + events.length` (`admin:src/repositories/event.repository.ts:240-243`).
- Errors: 429; 500 `Internal server error`. Limiter `eventsListRateLimit`. Edge profile `LIVE` or `PAST` (§7.8).
- This read starts the COMPLETED sweep (after the response; the past list waits for it), at most once per 60 s per instance (`admin:src/services/event.service.ts:51-94`, `admin:src/services/event.service.ts:238-239`). A just-ended event can sit in the live list with `status: "COMPLETED"` until the sweep stores it.

#### Event detail
- `GET /api/public/events/[slug]`, file `admin:src/app/api/public/events/[slug]/route.ts`. No parameters.
- 200 `{success:true,data:{event}}`: 31 keys (§7.9), narrowed by `toPublicEvent` (`:41-44`).
- Errors: 429; 404 `Event not found` with no `code` (unknown slug or draft, `:32-37`); 500 `Internal server error`.
- A `CANCELLED` event is found (why: the site says cancelled instead of not found). This read does not start the sweep.
- Limiter `eventDetailRateLimit`. Edge profile `DETAIL`.

#### Apply coupon
- `POST /api/public/events/[slug]/apply-coupon`, file `admin:src/app/api/public/events/[slug]/apply-coupon/route.ts`. Body `{ couponCode }`: string, 1..50 chars (`:8-10`). Checks only; nothing is reserved or counted.
- 200 `data`: `{type:"coupon",couponCode,discount}` (`discount` = flat rupees off the whole order) or `{type:"complimentary",couponCode,remainingUses}` (`:78-83`, `:103-106`).
- Checks in order: 429 (`:24-29`) -> 400 `Invalid JSON body` -> 400 with the first `couponCode` message (`Coupon code is required` for an empty string, zod's default text for a missing, non-string or over-long value) or `Invalid request` (`:41-47`) -> 404 `EVENT_NOT_FOUND` -> 410 (ENDED, CANCELLED or CLOSED; never FULL) -> 400 `COUPON_INVALID` `Coupon codes are not applicable to free events` -> coupon list: valid = 200, discount not below the per-person price = 400 `COUPON_INVALID` `This coupon code is not valid for this event` -> complimentary list: used up = 400 `COUPON_INVALID` `This code has no remaining entries.`, else 200 -> 404 `COUPON_INVALID` `Invalid coupon code` -> 500 `Failed to validate coupon`.
- Rule (`admin:src/lib/coupon.ts:18-29`): matching is case-insensitive; a coupon is valid only when `discount < effectiveAmount` (the per-person price). Why: a coupon never makes a booking free; complimentary codes do that.
- Gotchas: the coupon list is searched first, so a code in both lists is a coupon, and a not-applicable coupon hides a complimentary code of the same name. A coupon accepted here can still be refused by payment order with `AMOUNT_TOO_LOW`.
- Limiter `couponValidateRateLimit`.

#### Payment order
- `POST /api/public/events/[slug]/payment/order`, file `admin:src/app/api/public/events/[slug]/payment/order/route.ts`. Body (`:14-18`): buyer fields + `couponCode?` (max 50) + `ticketCode?` (trimmed, 1..40; present = pay for an existing unpaid ticket).
- 200 `data` (`:194-208`): `orderId`, `amount` (paise), `currency: "INR"`, `keyId` (the public Razorpay key; the site holds no key of its own), `breakdown: { base, discount, discountedBase, gst, platformFee, total }` (rupees; formula in §6), `numberOfParticipants`, `ticketCode` (re-payment only).
- Checks in order: 400 `Invalid JSON body` -> 400 `Validation failed` + `fieldErrors` (`:46-52`) -> 429 -> 404 `EVENT_NOT_FOUND` -> 410 ENDED or CANCELLED (`:72-78`) -> 400 `This is a free event — use the register endpoint` (free event, or no price, `:79-81`).
- Re-payment only: 404 `Ticket not found for this event` (`:88-90`) -> 409 `This ticket is already paid` (`:91-93`). New booking only: 410 CLOSED (`:101-106`) -> 400 competition text -> 410 `Event is full` when `currentCount + quantity > capacity` (`:113-118`) -> 409 `PHONE_ALREADY_REGISTERED` (legacy-index guard, before any order exists, `:120-128`).
- Then: 404 `COUPON_INVALID` `Invalid coupon code` (unknown OR not applicable, `:135-142`) -> 400 `AMOUNT_TOO_LOW` when `Math.round(breakdown.total * 100) < MIN_ORDER_PAISE` (100; why: Razorpay refuses orders under 1 rupee, `:20-21`, `:150-156`) -> 502 `GATEWAY_UNAVAILABLE` (Razorpay error, the 8000 ms timeout, or an unset `RAZORPAY_KEY_SECRET`; nothing was charged, `:185-192`) -> 500 `Failed to create payment order. Please try again.` (also when `RAZORPAY_KEY_ID` is unset, `:158-159`).
- Razorpay order (`:164-181`): `amount` in paise; `currency: "INR"`; `receipt: pub_<last 8 chars of the event id>_<Date.now()>`; `notes`: `eventId`, `eventName`, `phone`, `name`, `email` (`""` when absent), `age` and `numberOfParticipants` as strings, `ticketCode` on a re-payment, `couponCode` + `couponDiscount` when a coupon applied. Why: verify and the webhook book ONLY from these notes, never from the browser.
- Re-payment: seat count, phone, name, e-mail and age come from the ticket, not the body; closed, full and legacy-index checks are skipped (why: the unpaid ticket already holds its seats); the body must still pass the buyer schema; the rate-limit key uses the phone the client sent; the price is the event's current price, not the price when the ticket was made, and a coupon is still accepted.
- Limiters `paymentOrderRateLimit` + `paymentOrderIpRateLimit`; both must pass. Capacity is count-then-create with no transaction and counts unpaid rows too, so two buyers can both get the last seat.

#### Payment verify
- `POST /api/public/events/[slug]/payment/verify`, file `admin:src/app/api/public/events/[slug]/payment/verify/route.ts`. Body (`:18-43`): `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` (non-empty strings), `ticketCode?` (trimmed, 1..40). Without `ticketCode` the buyer fields must also be present and valid; they are checked for shape only and never used.
- Signature (`:94-102`): hex `HMAC-SHA256(RAZORPAY_KEY_SECRET, "<razorpay_order_id>|<razorpay_payment_id>")`, compared with `safeHexEqual`. It proves only that the payment belongs to the order; event, seats, buyer and ticket are read from the ORDER notes (why: otherwise one real payment could be replayed for any event or seat count, `:122-126`).
- Success: `{success:true,message:"Payment verified and registration confirmed!",data:TicketPayload}` (§7.9). 201 for a new booking; 200 for a replay, the fast path or a re-payment.
- Steps: (1) fast path (`:108-120`): a booking already recorded for this order id on this slug (and matching `ticketCode` when sent) is answered from the database alone, whatever the event status, and marked paid if it was not. (2) Razorpay order fetch (8000 ms) and event read run together (`:127-130`). (3) Re-payment (`:170-197`): the unpaid ticket gets `amountPaid: true`, `entryType: "PAID"`, `paymentId`, `paymentOrderId: existing ?? new`, `amountPaidPaise`; a ticket already paid with another payment id is left alone, answered 200 and logged for a manual refund (`admin:src/lib/duplicate-payment.ts:9-30`). (4) New booking (`:199-230`): `registerParticipant` from the notes, idempotent on the order id.
- Checks in order: 400 `Invalid JSON body` -> 400 `Invalid request data` -> 429 -> 500 `REGISTRATION_FAILED` `Payment configuration error` (no `RAZORPAY_KEY_SECRET`) -> 400 `SIGNATURE_INVALID` -> 502 `GATEWAY_UNAVAILABLE` (order fetch failed; it wins even if the event read failed too) -> 404 `EVENT_NOT_FOUND` (unknown, or `CANCELLED` with its own text) -> 400 `ORDER_MISMATCH` (`:162-168`) -> 404 `Ticket not found. Please contact support with your payment ID.` (re-payment, no `code`) -> 409 `PHONE_ALREADY_REGISTERED` -> 500 `REGISTRATION_FAILED` (booking closed, or generic). Texts: §7.6.
- Limiter `verifyRateLimit`, after body validation and before the signature check. The call is safe to repeat.
- Gotchas: verify never tests `bookingClosedReason`; a NEW booking is refused only when the stored status is not `PUBLISHED` (`admin:src/services/participant.service.ts:86`), and by then the money is taken (500, no ticket). Do not close booking or rename a slug while payments are in flight (a renamed slug gives 404 after payment; the webhook still books by `eventId`). The fast path does not record `amountPaidPaise`. A deleted paid booking is re-created by replaying its verify call (open decision D26, §17).

#### Payment status
- `POST /api/public/events/[slug]/payment/status`, file `admin:src/app/api/public/events/[slug]/payment/status/route.ts`. Body `{ orderId, phone }`: `orderId` 1..64 chars, `phone` 10 digits (`:14-17`). Purpose: the site polls it when a verify answer never arrived (`:9-13`).
- 200 `{success:true,pending:true}` when no booking carries the order id, or it is on another event, or the phone differs (why: an order id alone must never reveal a booking, `:68-72`).
- 200 `{success:true,data:TicketPayload}` with `paymentId` = the stored one (may be `null`) and `orderId` = `booking.paymentOrderId ?? orderId` (`:74-80`). `amountPaid` is not tested.
- Errors: 400 `Invalid JSON body`; 400 `Invalid request data`; 429; 404 `EVENT_NOT_FOUND` (unknown, draft or cancelled); 500 `Could not check the payment. Please try again.`
- Limiter `paymentStatusRateLimit`. A re-paid ticket that kept an older `paymentOrderId` is never found by the new order id, so it stays `pending`.

#### Register
- `POST /api/public/events/[slug]/register`, file `admin:src/app/api/public/events/[slug]/register/route.ts`. For free events, and paid events with a complimentary code. Body (`:13-17`): buyer fields + `code?` (max 50) + `requestId?` (`/^[A-Za-z0-9-]{8,64}$/`, the site's id for one submit).
- 201 new, 200 replay: `{success:true,message:"Registration successful!",data}` with the 10 keys in §7.9 (`:19-44`, `:179`).
- Checks in order: 400 `Invalid JSON body` -> 400 `Validation failed` + `fieldErrors` -> 429 -> 404 `EVENT_NOT_FOUND` -> replay: same event + `requestId` + phone answers 200 with the first booking, even if booking closed or the code ran out since (`:102-107`) -> 410 closed text -> 400 competition text -> paid event without `code`: 400 `This is a paid event — use the payment endpoint`; unknown or used-up code: 400 `COUPON_INVALID` `Invalid or fully-used code` (`:128-142`) -> 410 `Event is full` -> create -> 409 `PHONE_ALREADY_REGISTERED` (`:188-193`) -> 500 `Registration failed. Please try again.`
- Writes (`:162-177`): `registerParticipant` with `amountPaid: true` and `entryType` `COMPLIMENTARY` or `FREE`; the complimentary `usedCount` goes up by 1, only for a new booking.
- Gotchas: a free event ignores `code`. Without `requestId` there is no idempotency: a double submit makes two bookings and uses the code twice. One complimentary use covers a whole booking of up to 10 seats. The `usedCount` update is a read-modify-write of the embedded array, so two redemptions at once can exceed `maxUses`.
- Limiters `registerRateLimit` + `registerIpRateLimit`; both must pass.

#### Participants check
- `GET /api/public/participants/check?ticketCode=<code>`, file `admin:src/app/api/public/participants/check/route.ts`. The code is trimmed and upper-cased (`:23`). The ticket code is the only credential.
- 200 `data`: the 12 keys in §7.9. `amountPaid` and `paymentId` exist so the site's ticket mail refuses unpaid bookings and prints the recorded payment id (`:56-59`).
- Errors: 429; 400 `ticketCode query parameter is required`; 404 `Ticket code not found`; 500 `Internal server error`.
- Limiter `checkTicketRateLimit`. Callers: the site's two ticket-mail routes; the browser client has no helper for it.

#### My tickets
- `POST /api/public/participants/my-tickets`, file `admin:src/app/api/public/participants/my-tickets/route.ts`. Body `{ ticketCodes }`: array of 1..20 non-empty strings (`MAX_CODES = 20`, `:9-16`).
- 200 `{success:true,data:{tickets}}`; ticket and `event` keys in §7.9. Unknown codes are left out without an error. Codes are NOT trimmed or upper-cased (`:53`), so a lower-case code matches nothing.
- Errors: 429; 400 `Invalid JSON body`; 400 `At least one ticket code required`, `Maximum 20 ticket codes per request`, zod's default text (missing or non-array `ticketCodes`, an empty-string code) or `Invalid request` (`:44-50`); 500 `Failed to fetch tickets`.
- Limiter `myTicketsRateLimit`. Bookings are pruned 14 days after the event date at the earliest (§10); a pruned code silently drops out, check answers 404 and payment status answers `pending`.

#### My tickets by user
- `POST /api/public/participants/my-tickets-by-user`, file `admin:src/app/api/public/participants/my-tickets-by-user/route.ts`. Body (`:8-13`): `email?` (valid address), `phone?` (10 digits); at least one.
- 200 `{success:true,data:{ticketCodes}}`: de-duplicated, phone matches first, newest first within each; the e-mail is matched case-insensitively, the phone exactly (`:50-54`, `admin:src/repositories/participant.repository.ts:137-151`).
- Errors: 429; 400 `Invalid JSON body`; 400 `Invalid email address`, `email or phone is required` or `Invalid request` (a malformed phone gives only the last; a non-string `email` gives zod's default text, `:41-47`); 500 `Failed to fetch tickets`.
- Limiter `myTicketsByUserRateLimit`. No proof of identity: anyone who knows a phone or address gets its ticket codes, and a code opens check and my-tickets. Any identity check has to happen before the site calls here.

#### Brand partners
- `GET /api/public/brand-partners`, file `admin:src/app/api/public/brand-partners/route.ts`. 200 `{success:true,data:{partners:[{id,name,logoUrl}]}}` (`:27-47`).
- The 200 carries `Cache-Control: no-store` (why: the site's edge is the one cache; a second cache here could not be purged, `:41-44`). Its 429 and 500 carry none.
- Errors: 429; 500 `Internal server error`. Limiter `brandPartnersRateLimit`. Edge profile `PARTNERS`.
- This GET can write: `getSettings()` creates the Settings row when none exists (`admin:src/repositories/settings.repository.ts:8-16`).

### 7.4 Razorpay webhook

`POST /api/razorpay/webhook` (`admin:src/app/api/razorpay/webhook/route.ts`) finishes a paid booking when the browser never reaches payment verify. No CORS, no rate limiter, no `OPTIONS`. Bare `:N` below is a line of this file.

- **Event handled**: only `payment.captured` (`:56-59`). The Razorpay dashboard must send that event to `<admin origin>/api/razorpay/webhook`; whether deliveries succeed in production is **unverified**.
- **Signature** (`:40-47`): header `x-razorpay-signature` must equal hex `HMAC-SHA256(RAZORPAY_WEBHOOK_SECRET, <raw body text>)`, compared with `safeHexEqual` (constant time; a missing or non-hex value is a plain mismatch, `admin:src/lib/razorpay.ts:120-133`). The body is read as text first, so the bytes checked are the bytes signed.
- **Fast path** (`:72-77`): `findPaymentStateByOrderId` selects `{ id, amountPaid }`; a paid booking answers `{status:"ok"}` from one indexed read, with no Razorpay call. By design this is the normal case (verify usually runs first); how often it happens in production is **unverified**.
- **Slow path**: `fetchOrderBooking(orderId, 3000)` reads the ORDER notes (why not the payment's own notes: the payer can set those at Checkout, `:79-83`). Then one of: (1) re-payment (`:92-127`): settle the unpaid ticket with the same fields as verify; a ticket already paid with another payment id only gets the duplicate-payment log; (2) a booking for this event and order exists (`:131-155`): mark it paid if it is not; (3) otherwise `registerParticipant` from the notes (`:157-200`), idempotent on the order id.
- **What it writes**: the `Participant` row (new or settled). After the response, through `after()` (`:27-31`): an activity log (`adminUsername: "razorpay-webhook"`, `adminRole: "SYSTEM"`, action `PARTICIPANT_ADDED` or `PARTICIPANT_UPDATED`) and the ticket-mail call (§7.5).
- **Ticket mail** is requested only when the webhook itself created the booking or settled an unpaid one (why: then no browser received the booking). The browser can mail the same ticket; the 60 s dedupe lives in one site instance, so a ticket may be e-mailed twice (open item, §17).

| HTTP | Body | When |
|---|---|---|
| 500 | `{error:"Webhook not configured"}` | `RAZORPAY_WEBHOOK_SECRET` is unset (`:34-38`) |
| 401 | `{error:"Invalid signature"}` | Signature mismatch (`:44-47`) |
| 400 | `{error:"Invalid JSON"}` | Body does not parse (`:49-54`) |
| 200 | `{status:"ignored"}` | Any other event type |
| 200 | `{status:"skipped"}` | No `order_id`; order notes unusable; re-payment ticket missing (why 200: Razorpay stops retrying a case that cannot recover) |
| 200 | `{status:"ok"}` | Already paid, settled now, or created now |
| 500 | `{error:"Processing failed"}` | Any thrown error, including the order-fetch timeout (`:201-204`) |

- **Failure modes**: (a) a booking must be created but the stored event status is not `PUBLISHED` (booking closed by staff, event cancelled, or the sweep stored `COMPLETED`) or the event was deleted: `registerParticipant` throws and every retry answers 500, so money is taken and no ticket exists; `admin:scripts/report-unrecorded-payments.ts` lists such payments (the owner runs it, §2). (b) `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` unset: the order fetch throws, 500. (c) `paymentId` is stored as `null` when the event carries no payment id (`:64`, `:109`). (d) The ticket-mail call is not retried.
- **Timeouts**: `ORDER_FETCH_TIMEOUT_MS = 3000` (`:19`; the comment says Razorpay waits about 5 s and retries a failed delivery, which is **unverified**); `maxDuration = 15` s (`:20`; why: the log and the mail call run after the response); ticket-mail call 5000 ms.
- The staff counter writes the same order notes (`admin:src/actions/payment.actions.ts:84-92`), so the webhook also completes counter payments.

### 7.5 Signed server-to-server call

The admin asks the site to e-mail a ticket. Caller: `requestTicketMail` (`admin:src/lib/site-ticket-mail.ts:25-52`), called only from the webhook. Receiver: `site:src/pages/api/internal/ticket-mail.js`; check: `adminSignatureProblem` (`site:src/lib/backend.js:78-88`).

| Item | Exact value |
|---|---|
| URL | `POST <SITE_URL>/api/internal/ticket-mail`; ADMIN `SITE_URL` defaults to `https://www.ulsaaham.com`, trailing slashes removed |
| Headers | `content-type: application/json`; `x-ulsaham-timestamp` (Unix epoch MILLISECONDS as a decimal string); `x-ulsaham-signature` |
| Signed string | the timestamp, one dot, then the exact body bytes: `${timestamp}.${rawBody}` |
| Algorithm and key | HMAC-SHA256, lowercase hex; key = `PROXY_SHARED_SECRET` (must be identical in both Vercel projects) |
| Time window | `SIGNATURE_WINDOW_MS = 5 * 60 * 1000` either way; the timestamp must match `/^\d{1,16}$/` |
| Body | `JSON.stringify({ ticketCode, email })`, in that key order |

- Receiver, in order (`site:src/pages/api/internal/ticket-mail.js:19-88`): 503 `Ticket mail is not configured.` (no secret) -> 401 `Unauthorized.` (the log names the reason: `unsigned`, `bad timestamp`, `stale`, `bad signature`) -> 503 `Email is not configured.` -> 400 `Invalid request body.`, `Valid ticket code is required.`, `Valid email is required.` -> the lookup of §7.2: 404, 429 or 502 `Could not confirm the ticket right now.` -> 409 `This booking is awaiting payment.` unless `amountPaid === true` -> 422 `This booking has no email address.` with `code: "NO_EMAIL"` -> 200 `{success:true,duplicate:true}` when the same code and address were mailed within 60 s -> 500 `Failed to send the ticket email.` -> 200 `{success:true}`.
- Caller: timeout `TICKET_MAIL_TIMEOUT_MS = 5000`; skips the call silently when the booking has no e-mail (`admin:src/lib/site-ticket-mail.ts:28`) and with an error log when `PROXY_SHARED_SECRET` is unset (`:29-33`); never throws; a non-2xx answer or a network error is only logged; no retry.
- Gotchas: the signature covers bytes, not parsed JSON, so re-serialising the body on either side breaks it; a timestamp in seconds reads as stale; uppercase hex and base64 are refused. A different secret in the two projects gives 401 here and one shared rate-limit bucket (§7.1), while bookings keep working, so nothing a visitor sees points at it.
- Both sides pin the same fixed vectors: `admin:test/payment-routes.test.ts:627-636`, `site:tests/mail/internal-ticket-mail.test.mjs:157-207`. Delivery in production after the 2026-10-04 fix is **unverified**; so is whether the site function keeps running once the admin's 5 s timeout has fired.

### 7.6 Error codes

The site shows the admin's `error` text as sent, except on 429 (replaced in `site:src/lib/api.js`) and on status 0 (no answer: `Network error. Please try again.`; after verify the panel reads `Your payment went through, but we could not confirm your booking yet.`). `code` changes site behaviour only for `COUPON_INVALID` and `EVENT_NOT_FOUND` (`site:src/lib/payment-flow.js:65-73`, `site:src/components/RegistrationForm.jsx:619-638`).

| Code | HTTP | Raised by | Meaning | What the customer sees |
|---|---|---|---|---|
| `EVENT_NOT_FOUND` | 404 | apply-coupon, order, register, status | No such slug, or a draft (status: also cancelled) | `Event not found` as a message (order, register) or under the promo box; the status poll stops silently |
| `EVENT_NOT_FOUND` | 404 | verify | Unknown slug, or the event was cancelled after payment | Verify-failed panel: `Event not found. Please contact support with your payment ID.` or `This event has been cancelled. Please contact support with your payment ID.` |
| `COUPON_INVALID` | 404 or 400 | apply-coupon (404 unknown; 400 the three texts in §7.3), order (404), register (400) | The code cannot be used | Text under the promo box; on order or register the code is dropped and the banner reads `Promo code rejected. Please review and try again.` |
| `AMOUNT_TOO_LOW` | 400 | order | Total under 100 paise | Banner `The total must be at least ₹1.`; the event is refetched |
| `GATEWAY_UNAVAILABLE` | 502 | order | Razorpay did not create the order; nothing charged | `The payment gateway is busy. Please try again.` on the summary |
| `GATEWAY_UNAVAILABLE` | 502 | verify | The order could not be fetched; the webhook finishes the booking | Retried after 1, 3 and 6 s, then the verify-failed panel: `We could not confirm your payment yet. If money was taken, your booking will be completed automatically — please check My Bookings shortly.` |
| `PHONE_ALREADY_REGISTERED` | 409 | order, register, verify | A legacy unique index on phone is still in the database (§11) | Order: `This phone number already has a booking for this event.`; register: `This phone number is already registered for this event`; verify: panel with `Payment received but this phone number already has a booking on this event. Please contact support with your payment ID.` |
| `SIGNATURE_INVALID` | 400 | verify | Checkout signature does not match | Panel: `Payment verification failed. Please contact support.`; retrying gives the same answer |
| `ORDER_MISMATCH` | 400 | verify | The order notes name another event or ticket | Panel: `This payment does not match this booking. Please contact support with your payment ID.` |
| `REGISTRATION_FAILED` | 500 | verify | Key secret unset; booking closed after the order; any other failure | Retried, then the panel: `Payment configuration error`, `Payment received, but booking for this event has closed, so no ticket was issued. Please contact support with your payment ID.` or `Registration failed. Please contact support with your payment ID.` |
| `NO_EMAIL` | 422 | site `/api/internal/ticket-mail` | No `email` in the signed body. The fallback to the booking's own address never applies, because the check lookup returns no address (§7.9) | Nothing (server to server) |
| none | 410 | apply-coupon, order, register | Booking closed (texts in §7.3) | Banner with the text; the event is refetched and the form usually becomes Booking Closed |
| none | 400 + `fieldErrors` | order, register | Field validation | Back on the form: `Please check the details below.` plus per-field texts |
| none | 429 | any route | Rate limit | Replaced text: payments `Too many attempts. Please wait before trying again.`; status poll, GETs and my-tickets-by-user `Too many requests. Please try again in a moment.`; other POSTs `Too many requests. Please try again later.` |
| none | 503, 504 | site proxy | Admin unreachable or too slow | The proxy texts of §7.2 |

- The verify-failed panel never offers a Pay button (why: paying again would charge twice). Final answers (4xx except 429) clear the pending-payment record; 5xx, 429 and status 0 keep it so a reload polls payment status (§8). My Bookings (re-payment) shows an order error as the `error` text sent, with no promo or refetch handling (`site:src/components/AccountPage.jsx:107`).
- Same code, different status: unknown coupon is 404 on apply-coupon and order; a coupon worth the whole per-person price is 400 on apply-coupon but 404 on order.

### 7.7 Rate limits

| Limiter | Limit | Window | Key | Applies to | When the store is down |
|---|---|---|---|---|---|
| `registerRateLimit`, `paymentOrderRateLimit` | 10 | 1 h | `<ip>:<phone>` | register; payment order | Request allowed (fail open) |
| `registerIpRateLimit`, `paymentOrderIpRateLimit` | 60 | 1 h | IP | register; payment order | Same |
| `eventsListRateLimit`, `eventDetailRateLimit` | 60 | 1 m | IP | events list; event detail | Same |
| `checkTicketRateLimit`, `verifyRateLimit`, `couponValidateRateLimit` | 20 | 1 m | IP | participants check; payment verify; apply-coupon | Same |
| `paymentStatusRateLimit`, `myTicketsRateLimit`, `brandPartnersRateLimit` | 30 | 1 m | IP | payment status; my-tickets; brand-partners | Same |
| `myTicketsByUserRateLimit` | 10 | 1 m | IP | my-tickets-by-user | Same |
| `otp:ip:<ip>` | 8 | 1 h | IP | send-otp | No store: see below |
| `otp:email:<email>` | 5 | 1 h | E-mail | send-otp | Same |
| `otp:verify-ip:<ip>` | 30 | 1 h | IP | verify-otp, wrong guesses only | Same |
| `otp:verify:<email>` | 10 | 10 min | E-mail | verify-otp, wrong guesses only | Same |
| `ticket-mail:ip:<ip>` | 12 | 1 h | IP | send-ticket | Same |
| `ticket-mail:code:<CODE>` | 6 | 1 h | Ticket code | send-ticket | Same |
| `ticket-mail:sent:<CODE>:<email, lower case>` | 1 | 60 s | Code + address | send-ticket (429) and internal ticket-mail (200 `duplicate`) | Same |
| `otp_session` cookie: cooldown | 1 | 60 s | The cookie | send-otp | Lost when the cookie is dropped |
| `otp_session` cookie: sends | 3 | 1 h | The cookie | send-otp | Same; the cookie itself lasts only 600 s |
| `otp_session` cookie: attempts | 5 | Per code | The cookie | verify-otp | Reset by replaying the first cookie, hence the server caps |

- ADMIN rows (`admin:src/lib/ratelimit.ts:25-130`): Upstash `Ratelimit.slidingWindow`, `analytics: false`. Every named limiter is its own bucket, prefix `ulsaham:` + `register`, `register-ip`, `events-list`, `event-detail`, `check-ticket`, `payment-order`, `payment-order-ip`, `payment-verify`, `payment-status`, `my-tickets`, `coupon-validate`, `my-tickets-by-user`, `brand-partners`. A pair on one route is asked in parallel and both must pass (why two: buyers behind one NAT do not use up each other's attempts, while one address cannot cycle through phone numbers, `:146-164`).
- ADMIN fail-open (`:137-144`): an Upstash error allows the request and logs `Rate limiter unavailable; allowing the request:` (why: otherwise every public route would answer 500 during an Upstash outage). Limiter `timeout`: 2000 ms for events-list, event-detail, check-ticket, payment-status and brand-partners, 3000 ms for the rest (`:19-20`); that a limiter slower than its timeout lets the request through relies on the `@upstash/ratelimit` option and is **unverified**. Redis client: `retries: 1`, backoff 50 ms (`:8-12`).
- SITE rows (`site:src/lib/rate-limit.js:10-45`): fixed window from the first call, kept in a `Map` inside one function instance: lost on a cold start, not shared between instances; at `MAX_KEYS = 10000` expired keys are swept and, if still over, everything is cleared. A missing IP is keyed `unknown`. These refusals answer 429 with `Retry-After` (seconds). A slot is handed back when the guarded work did not happen (`releaseLimit`, `:48-53`). Why this is acceptable: the authoritative booking and payment limits are the ADMIN ones.
- Constants: send-otp `site:src/pages/api/auth/send-otp.js:13-14`; verify-otp `site:src/pages/api/auth/verify-otp.js:16-17`; ticket mail `site:src/pages/api/send-ticket.js:11-12`, `site:src/lib/ticket-mail.js:18-19`; cookie counters `site:src/lib/otp.js:65-69`.
- A missing or different `PROXY_SHARED_SECRET` puts every site visitor in one ADMIN bucket keyed by the site's egress IP (§7.1).

### 7.8 Edge cache policy

The site's CDN is the only cache for public data and `site:src/lib/edge-cache.js` is the whole policy. An answer is stored only when ALL hold: method `GET`, upstream status 200, upstream content-type JSON, no `x-astro-path` request header (`:40-42`, `site:src/pages/api/public/[...path].js:125-129`).

| Request shape (after `/api/public/`) | Profile | Fresh for | Stale-while-revalidate | Worst-case age | Header used |
|---|---|---|---|---|---|
| `events` + canonical query not ending `&past=true` | `LIVE` | 60 s | 240 s | 5 min | `vercel-cdn-cache-control: max-age=60, stale-while-revalidate=240` |
| `events` + canonical query ending `&past=true` | `PAST` | 600 s | 3000 s | 1 h | `vercel-cdn-cache-control: max-age=600, stale-while-revalidate=3000` |
| `events/<one segment>`, empty query | `DETAIL` | 15 s | 45 s | 1 min | `vercel-cdn-cache-control: max-age=15, stale-while-revalidate=45` |
| `brand-partners`, empty query | `PARTNERS` | 300 s | 3300 s | 1 h | `vercel-cdn-cache-control: max-age=300, stale-while-revalidate=3300` |
| Anything else | none | Never cached | Never | 0 | `cache-control: no-store` |

- Canonical query (`site:src/lib/edge-cache.js:25`): `^\?page=[1-9]\d{0,3}&limit=[1-9]\d{0,3}(?:&featured=(?:true|false))?(?:&upcoming=true)?(?:&past=true)?$`. Matching is character for character, so the parameter order written by `eventsPath` (`site:src/lib/api.js:95-102`) is a contract; a reordered or extra parameter still works but is never cached. `?fresh=1` on the detail URL relies on exactly this to bypass the cache (`:113-115`).
- Cached answers also carry `cache-control: public, max-age=0, must-revalidate`, so browsers always revalidate (`site:src/lib/edge-cache.js:62-69`).
- Never cached: `HEAD`, `POST`, `OPTIONS`; any status other than 200; `participants/*` (personal data); every `events/<slug>/...` sub-path; non-JSON bodies (why: an HTML page reached through a redirect must not stand in for data); requests with `x-astro-path` (the Vercel adapter then runs a different route than the URL names).
- Why these numbers: owner decision of 2026-09-27 (detail within 1 minute, upcoming and featured lists within 5 minutes, past lists and partners within 1 hour). `site:tests/proxy/proxy.test.mjs:89-99` pins the four profiles and asserts LIVE <= 300 s and DETAIL <= 60 s, so changing a lifetime fails a test on purpose.
- Why stale data is safe: the admin re-checks capacity and booking state on every booking and payment call, so a stale card costs a retry, never an overbooking (`site:src/lib/edge-cache.js:6-9`).
- Production check 2026-10-11: the upcoming list answered `x-vercel-cache: MISS`, then `HIT` (§12). Fallback if the CDN ever ignores the header: `Cache-Control: public, max-age=0, s-maxage=<maxAge>, stale-while-revalidate=<swr>` (`site:src/lib/edge-cache.js:58-60`).

### 7.9 Public data contracts

Every public payload is an allow-list (why: a new `Event` column stays private until someone adds it, `admin:src/types/event.types.ts:73-77`).

| Payload | Built at | Exact keys |
|---|---|---|
| Event list item (20) | `admin:src/repositories/event.repository.ts:173-193`, `admin:src/services/event.service.ts:246-251` | `id, name, slug, bannerImageUrl, venue, venueLink, date, startTime, endTime, isFree, amount, earlyBirdAmount, isEarlyBird, isCompetition, participationType, featured, status, isFull, bookingOpen, bookingClosedReason` |
| Event detail (31) | `toPublicEvent`, `admin:src/services/event.service.ts:178-212` | `id, name, slug, description, bannerImageUrl, galleryImageUrls, venue, venueLink, date, startTime, endTime, status, featured, isFree, amount, earlyBirdAmount, isEarlyBird, effectiveAmount, gstEnabled, platformFeeEnabled, isCompetition, participationType, groupExtraAmount, competitionInstructions, competitionNotes, capacity, registeredCount, isFull, bookingOpen, bookingClosedReason, bookingClosedMessage` |
| `TicketPayload` (11): verify, status | `admin:src/lib/ticket-payload.ts:6-44` | `ticketCode, participantName, eventName, eventDate, eventVenue, numberOfParticipants, isCompetition, competitionNumber, isGroupRegistration, paymentId, orderId` |
| Register `data` (10) | `admin:src/app/api/public/events/[slug]/register/route.ts:29-40` | `ticketCode, participantName, eventName, eventDate, eventVenue, numberOfParticipants, isFree, isCompetition, competitionNumber, isGroupRegistration` |
| Check `data` (12) | `admin:src/app/api/public/participants/check/route.ts:45-60` | `ticketCode, participantName, eventName, eventDate, eventVenue, numberOfParticipants, attended, registeredAt, competitionNumber, isGroupRegistration, amountPaid, paymentId` |
| My-tickets ticket (9 + `event`) | `admin:src/app/api/public/participants/my-tickets/route.ts:55-91` | `ticketCode, participantName, numberOfParticipants, amountPaid, attended, enteredCount, registeredAt, competitionNumber, isGroupRegistration, event` |
| My-tickets `event` (21) | Same | `id, name, slug, date, startTime, endTime, status, venue, bannerImageUrl, isFree, amount, earlyBirdAmount, isEarlyBird, effectiveAmount, groupExtraAmount, gstEnabled, platformFeeEnabled, isCompetition, participationType, competitionInstructions, competitionNotes` |

- Hidden on purpose: `couponCodes` and `complimentaryCodes` (they are discounts and free entry), `lastCompetitionNumber`, `bannerImageId` and `galleryImages` (Cloudinary ids; only URLs go out), `archivedParticipantCount`, `archivedRevenuePaise`, `createdAt`, `updatedAt`, `_count`, `participants`. No ticket payload carries the buyer's phone or e-mail; check carries no order id; partners omit `logoId`.
- A list item has no `effectiveAmount`, `gstEnabled`, `platformFeeEnabled`, `groupExtraAmount`, `capacity`, `registeredCount` or `description`, so it cannot be priced: fetch the detail.
- Derived values: `status` is the EFFECTIVE status (`COMPLETED` once the end time has passed, even before the sweep stores it); `registeredCount` = seats summed over live bookings, else `archivedParticipantCount`, else 0; `isFull = capacity !== null && registeredCount >= capacity` (`admin:src/services/event.service.ts:140-143`). Dates arrive as ISO strings.
- Guards: `admin:test/public-event.test.ts:23-68` holds the exact detail key set and the private-field list its tests assert. `site:tests/contract/public-event.json` copies the list, detail and my-tickets `event` lists plus 6 forbidden names, and `site:tests/contract/public-event.test.mjs` fails when a site component reads a field that is not sent. Change the admin list and that JSON in one change, and deploy ADMIN first (§2).
- `toPublicEvent` takes and returns the same type, so only the call in the detail route (`admin:src/app/api/public/events/[slug]/route.ts:42`) and the test keep the list in force. Never remove that call.

### 7.10 External APIs the code calls

| Service | Call | Made from | Env keys | Timeout | Failure handling |
|---|---|---|---|---|---|
| Razorpay Orders API | `orders.create` | `admin:src/app/api/public/events/[slug]/payment/order/route.ts:164`; staff counter `admin:src/actions/payment.actions.ts:80` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | 8000 ms (`RAZORPAY_TIMEOUT_MS`); none on the staff counter | Public: 502 `GATEWAY_UNAVAILABLE`. Staff: the action returns the error text |
| Razorpay Orders API | `orders.fetch` | `admin:src/lib/razorpay.ts:116`, called from `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:128`, `admin:src/app/api/razorpay/webhook/route.ts:84` and the staff counter `admin:src/actions/payment.actions.ts:133` | Same | 8000 ms; 3000 ms in the webhook | Verify 502; webhook 500 (Razorpay retries); staff action error text |
| Razorpay Checkout script | `https://checkout.razorpay.com/v1/checkout.js`, then `new window.Razorpay(options).open()` | `site:src/lib/razorpay.js:4`; `site:src/components/RegistrationForm.jsx:736`; `site:src/components/AccountPage.jsx:116`; `admin:src/components/participants/enroll-dialog.tsx:56` | None on the site: `key` is `keyId` from the order answer | Site: `LOAD_TIMEOUT_MS = 15000`; admin: none | Site: the failed tag is removed and the form shows `Could not load the payment gateway. Please check your connection and try again.` |
| Google OAuth | 302 to `https://accounts.google.com/o/oauth2/v2/auth` | `site:src/pages/api/auth/google.js:23` | `GOOGLE_CLIENT_ID` | Not a server call | A missing id is sent as the text `undefined`; the error shows on Google's page |
| Google OAuth | `POST https://oauth2.googleapis.com/token` | `site:src/pages/api/auth/google/callback.js:32` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | None (function ceiling 60 s) | 302 `/login?error=google_token` |
| Google OAuth | `GET https://www.googleapis.com/oauth2/v2/userinfo` | `site:src/pages/api/auth/google/callback.js:53` | None (bearer token) | None | 302 `/login?error=google_profile` |
| SMTP relay (Brevo, `site:.env.example:11-12`) | `nodemailer` pooled transport, `sendMail` | `site:src/lib/mailer.js:60-79`, `:86-106` | `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `OTP_EMAIL_FROM`, `TICKET_EMAIL_FROM` | Connection 10000, greeting 10000, socket 20000 ms | One retry on a fresh transport for `ECONNECTION`, `ESOCKET`, `ETIMEDOUT`, `ECONNRESET`, `EPIPE`, `EAI_AGAIN`; otherwise the route answers 500 |
| Cloudinary | `uploader.upload_stream` | `admin:src/lib/cloudinary.ts:28-36`, from the upload route (§7.11) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | None | 500 `Upload failed. Please try again.` |
| Cloudinary | `uploader.destroy(publicId, { invalidate: true })` | `admin:src/lib/cloudinary.ts:48`, from `admin:src/services/housekeeping.service.ts:66` | Same | None | Returns false; the image stays queued and is dropped from the queue once a week overdue |
| Upstash Redis (REST) | `limiter.limit(id)`; `SET ulsaham:job:<name> NX EX <seconds>` | `admin:src/lib/ratelimit.ts:139`, `:175` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 2000 or 3000 ms per limiter | Fail open: the request is allowed, the throttled job runs anyway |

- No Razorpay Payments or Refunds API call exists. A payment is proven by the Checkout signature (a local HMAC) and by the `payment.captured` webhook; refunds are done by hand in the Razorpay dashboard.
- Checkout options on the site: `key`, `amount`, `currency`, `name: "Ulsaham Entertainments"`, `description` (event name), `order_id`, `prefill: { name, email, contact }`, `theme.color`, `handler`, `modal.ondismiss`; the prefill hands name, e-mail and phone to Razorpay. Behaviour on a real phone (UPI app switch, dismiss timing) is **unverified**.
- SMTP senders: one per mail kind (`"otp"`, `"ticket"`); the fallback sender literals are at `site:src/lib/mailer.js:37-38`. A `from` in a message is always overwritten; the SMTP login is never a sender.

### 7.11 Staff-only HTTP routes

- `POST /api/admin/upload` (`admin:src/app/api/admin/upload/route.ts:16-61`): multipart body, field `file`; optional `?folder=brand-partners` (Cloudinary folder `ulsaham/brand-partners`, otherwise `ulsaham/events`). Checks in order: no session -> 401 `{error:"Unauthorized"}`; role not in `UPLOAD_ROLES` (`SUPER_ADMIN`, `ADMIN`) -> 403 `{error:"Forbidden"}`; 400 `No file provided`; 400 `Invalid file type. Only JPG, PNG, and WEBP are allowed.` (`image/jpeg`, `image/png`, `image/webp`); 400 `File size must be less than 4MB` when `file.size > 4 * 1024 * 1024`; 500 `Upload failed. Please try again.` Success 200 `{ url, publicId }`.
- Why 4 MB: the code comment says Vercel rejects function request bodies over 4.5 MB before the route runs (`admin:src/constants/index.ts:6-10`; the platform limit itself is **unverified** here). Stored as WebP: `resource_type: "image"`, `format: "webp"`, `quality: "auto:good"`, `fetch_format: "auto"` (`admin:src/lib/cloudinary.ts:19-25`).
- Gotchas: the middleware runs on this path but lets it through (its check only guards paths starting with `/admin`, `admin:auth.config.ts:43-60`), so the route's own checks are the only guard. The MIME type is the one the browser declares, not sniffed. A file of exactly 4 MB passes. The upload happens before the form is saved, so an abandoned upload stays in Cloudinary. `ADMIN` may upload although the pages that upload (event form, settings) are `SUPER_ADMIN` only. Callers: `admin:src/components/shared/image-upload.tsx:72`, `admin:src/components/shared/multi-image-upload.tsx:28`, `admin:src/components/settings/brand-partners-section.tsx:50`.
- `GET` and `POST /api/auth/*` (`admin:src/app/api/auth/[...nextauth]/route.ts:1-3`): the Auth.js (`next-auth`) handlers exported by `admin:src/lib/auth.ts:20` (credentials provider, JWT session). Excluded from the middleware matcher. Sign-in rules, session lifetime and roles: §10.
- Everything else staff do goes through server actions, not HTTP routes: §10.

---

## 8. Feature guide

One subsection per feature, each with four parts: Files, Behaviour, Rules, Gotchas. A bare `:N` cites the file named just before it; 8.4 and 8.7 fix one file for the whole subsection.
8.1-8.9 are the customer site (`site:` paths); 8.10-8.19 are the admin panel (`admin:` paths).
Not repeated here: endpoints, error codes and rate limits (§7); storage keys, cookies and the client API layer (§6); design tokens and reusable components (§9).

### 8.1 Home page
**Files**: `site:src/pages/index.astro` (four slides; hero script `:65-112`, CTA rotator `:121-145`, sound toggle `:156-181`, pager script `:256-432`); `site:src/components/HomeEventsSection.jsx`, `site:src/components/HomeEvents.jsx`, `site:src/components/PastEventsRunner.jsx`, `site:src/components/PastEventsCoverflow.jsx`; `site:src/lib/page-data.js:10-11,18`; `site:src/styles/global.css:90-147` (pager), `:461-503` (strip), `:513-624` (coverflow). Partners slide: §8.9. Card: §8.2.

**Behaviour**
1. Four full-screen slides moved by a CSS transform, never by scrolling: 1 hero, 2 events (`#gallery`), 3 partners (`#testimonials`), 4 connect and footer (`#connect`) (`site:src/pages/index.astro:45-244`). The start slide comes from the URL hash (`:263,308-311`); the hash is never updated afterwards.
2. Slide changes: mouse wheel, one-finger swipe, ArrowDown / PageDown / ArrowUp / PageUp, the four dots, and any `a[href^="#"]` pointing at one of the three anchors, including links that islands render later (`:319-406`). Tabbing to a link on another slide moves the pager there and undoes the browser's own scroll (`:408-430`).
3. Hero: two Cloudinary clips (mobile width 720, desktop 1280); only the clip for the current breakpoint ever gets a `src`. Its poster (frame at 1 s, because the first frame can be black) is the first paint and is preloaded per breakpoint (`:10-24,47-64,93-106`). The pager pauses the clip off slide 1 through `window.ulsHero.setActive` (`:275`). The sound button toggles `muted` on the visible clip only (`:156-181`). The CTA label and href rotate through the three anchors (`:121-145`).
4. Events slide: `HomeEvents` loads `HOME_UPCOMING` (`{ upcoming: true, limit: 8 }`; no `featured` filter, so featured events have no section of their own here and sit among the upcoming cards with the "Featured" tag, in the API's date order); `PastEventsRunner` loads `HOME_PAST` (limit 30) and keeps events that have a `bannerImageUrl` (`site:src/components/PastEventsRunner.jsx:59-61`). With upcoming events (or an upcoming error) past posters run as a strip under the cards; with none they take the slide as a coverflow. The variant stays `null` until upcoming has loaded, so the layout never swaps in view (`site:src/components/HomeEventsSection.jsx:13`; `site:src/components/PastEventsRunner.jsx:44-46`).
5. Fit: a layout effect drops one card at a time while the slide's `scrollHeight - clientHeight > 1`, never below 1 card. Dropped cards become a "+N more" tile linking to `/events`. It runs again when the strip arrives and after a real window resize (`site:src/components/HomeEvents.jsx:46-72,77-78,117-122`).
6. Empty and failed states: upcoming failed = error text + Retry, strip still shown (`site:src/components/HomeEvents.jsx:104-108`); no upcoming and no past posters = "New events coming soon." + "View All Events", plus "Couldn't load past events · Retry" when the past read failed (`site:src/components/PastEventsRunner.jsx:20-41,91-96`).
7. Connect slide: "Connect With Us", an e-mail pill (opens Gmail web compose, not `mailto:`), a WhatsApp pill, footer links (About, Instagram, Privacy, Terms) and a year that is set again in the browser because the page is prerendered (`site:src/pages/index.astro:197-244`).
8. Slides 2 and 3 hydrate with `client:idle={{ timeout: 1500 }}` because they are off screen at load; their data is already prefetched in the head (`site:src/pages/index.astro:27,187-194`).

**Rules**
- Four slides are hard-coded in three places: CSS `400%` / `25%` (`site:src/styles/global.css:96,101`), the four dots (`site:src/pages/index.astro:249-252`) and `anchorIndex` (`:263`). Change all three together.
- The JS lock of `800` ms (`site:src/pages/index.astro:284`) must equal the CSS `transition: transform 0.8s` (`site:src/styles/global.css:97`). Why: a mismatch lets a second slide change start mid-animation or stalls input.
- One gesture moves one slide: the gesture lock is released only after 150 ms of input silence, re-checked every 100 ms while animating (`site:src/pages/index.astro:292-306`). Why: one trackpad swipe fires many wheel events.
- Never hijack zoom: the pager ignores a `ctrlKey` wheel, a sideways wheel (`abs(deltaY) <= abs(deltaX)`), two-finger touches and any page with `visualViewport.scale > 1.01` (`:315-317,324,350,363`). Swipe threshold `SWIPE_THRESHOLD = 40` px (`:345`).
- The hero breakpoint `768px` lives in three places: preload media (`:23-24`), script (`:72`), CSS (`site:src/styles/global.css:179-183`). Out of sync, the wrong poster preloads or the hidden clip gets the `src`.
- Poster only, no clip fetch, when `navigator.connection.saveData` is true or `effectiveType` matches `/2g/` (`site:src/pages/index.astro:79`); unmuting overrides it (`:170-175`). CTA rotation: 3000 ms, 250 ms fade, only while slide 1 is current (`:133-143`).
- Strip: list duplicated (copies `aria-hidden`), loop `60s` linear to `translateX(-50%)`, starts after `min(3, n)` original posters have loaded or 2000 ms, pauses on hover (`site:src/components/PastEventsRunner.jsx:73-88,107-117`; `site:src/styles/global.css:466,469-472`).
- Coverflow constants (`site:src/components/PastEventsCoverflow.jsx:4-29`): `AUTOPLAY_MS = 3000`, `SWIPE_PX = 40`, `ENTRANCE_MS = 1600` (stagger `dist * 120` ms), `HOVER_HOLD_MS = 2500`, `VISIBLE = 2`, `NEAR = 3`, poster widths `[360, 480, 640]`. Auto-scroll needs 2 or more posters, intersection ratio >= 0.35, entrance finished, a visible tab and no pause (`:106-135`). Only a moving mouse over a card or keyboard focus pauses it (`:70-81,207-210`); why: the strip spans the screen, so a resting cursor would stop it for good. Controls: a sideways swipe of 40 px or more, a sideways wheel (`abs(deltaX) >= 8`, one card per gesture), ArrowLeft / ArrowRight; a click on a side card centres it and only the centre card opens the event (`:146-195,247-250`). The sideways wheel and swipe call `stopPropagation`, so the pager does not act on them too. The fan-out entrance starts at intersection ratio >= 0.9, or 900 ms after the slide first intersects (`:106-118`).
- Posters are windowed: a card gets its `src` only once it is within `NEAR` steps of the centre, and keeps it (`site:src/components/PastEventsCoverflow.jsx:58-64,253-254`). Why: up to 30 past events must not all download at once.
- No code in `site:src/` queries `prefers-reduced-motion`. For the coverflow this is an owner decision of 2026-09-27 (§2): its animation and auto-scroll run even when the OS asks for reduced motion. Do not add the media query there unprompted.
- Slides never scroll (`.fp-section { overflow: hidden }`, `site:src/styles/global.css:100-104`): anything added must fit `100dvh`. A new endless animation must be added to the pause selector at `site:src/styles/global.css:118`, or it keeps running off screen.

**Gotchas**
- "+N more" counts only the 8 fetched events, not the server total (`site:src/components/HomeEvents.jsx:78`; `site:src/lib/page-data.js:10`).
- Past posters link to the event page here but not on `/events` (§8.2). The strip puts the raw slug in the href; the coverflow uses `encodeURIComponent` (`site:src/components/PastEventsRunner.jsx:117`; `site:src/components/PastEventsCoverflow.jsx:233`).
- Islands inside `.fp-section` depend on `.fp-section > astro-island > * { min-height: 0; min-width: 0 }` (`site:src/styles/global.css:109-114`), because `astro-island` renders as `display: contents`.
- Wheel, touch and key handlers do nothing while `window.scrollY > 0` (`site:src/pages/index.astro:325,351,362,377,390`). Whether a collapsing mobile URL bar can leave the pager unresponsive is **unverified**.
- `navigator.connection` is missing in Safari and Firefox, so the clip always loads there: **unverified** on a device.
- The contact values on the connect slide are literals (`site:src/pages/index.astro:207-216,231`; see §8.9). No test covers the pager, hero or coverflow scripts.

### 8.2 Events list
**Files**: `site:src/pages/events/index.astro` (static shell, `EventsList client:load`, prefetch `EVENTS_PREFETCH`); `site:src/components/EventsList.jsx`; `site:src/components/EventCard.jsx`; `site:src/lib/page-data.js:14-16,19`.

**Behaviour**
1. Three sections from `SECTIONS` (`site:src/components/EventsList.jsx:103-115`): "Featured Events" (`EVENTS_FEATURED`), "Upcoming Events" (`EVENTS_UPCOMING`, plus client filter `!ev.featured`), "Past Events" (`EVENTS_PAST`, 4-column grid, cards are not links).
2. The three first pages load in one `Promise.all` and render together; until then three skeleton cards under `aria-busy="true"` (`:117-136`). Why: a section that turns out empty must not shift the others.
3. A section with nothing to show and no pager renders nothing (`:58`). Pager: "← Prev", `page / totalPages`, "Next →"; later pages are live fetches and show 3 skeletons while loading (`:39-52,64,78-96`).
4. Card (`site:src/components/EventCard.jsx`): poster, "Featured" tag, name, price line (only while the event has not ended: "Free Entry", early-bird strike-through, competition entry price, or the amount "per person"), date and start time, venue, and CTA "Book Now →" when `isBookingOpen(event)`, else "View Details →". A "Booking Closed" badge shows when the event has not ended and is not bookable (`:17-18,41,46-69`).

**Rules**
- The queries are exact and shared with the prefetch and the edge cache: featured `{ featured: true, limit: 12 }`, upcoming `{ featured: false, upcoming: true, limit: 12 }`, past `{ past: true, limit: 8 }` (`site:src/lib/page-data.js:14-16`). Never write a list query inline; add it to `site:src/lib/page-data.js`. Why: a one-character difference misses both `window.__ulsPre` and the CDN (§6, §7).
- Keep the `!ev.featured` filter: it only matters while an admin panel that ignores `featured=false` is live (`site:src/components/EventsList.jsx:105-107`). A page the filter emptied keeps its pager so the next page stays reachable (`:57`).
- Only the first two posters of Featured and Upcoming load eagerly, and only Featured's first has `fetchPriority="high"` (the likely LCP) (`:101-107`).
- Event links are always `/events/detail?slug=` + slug (`site:src/components/EventCard.jsx:22`). Why: one static page serves every event (§8.3).
- A list item has 20 fields and no `effectiveAmount`, `capacity`, `registeredCount`, `gstEnabled`, `platformFeeEnabled` or `groupExtraAmount` (§7). Never pass one to `calcFees` or `RegistrationForm`: it would be priced without GST and with the 2% fee.

**Gotchas**
- A failed section shows its heading and the error text only; `/events` has no Retry button (`site:src/components/EventsList.jsx:66-68`), unlike the home slides.
- `event.status` from the API is the admin's effective status: it reads `COMPLETED` once the end time has passed (`admin:src/lib/event-status.ts:25-28`). Use `isBookingOpen(event)`, never `status === "PUBLISHED"`.
- Past cards are not links (`linkable: false`, `site:src/components/EventsList.jsx:111`), but with a `venueLink` their venue text becomes an external link (`site:src/components/EventCard.jsx:64-66`). `EventCard` puts the raw slug in the href; safe only because slugs are `[a-z0-9-]+`.

### 8.3 Event detail
**Files**: `site:src/pages/events/detail.astro` (one static shell for every event; `ApiPrefetch eventSlug`, `:10`); `site:src/components/EventDetail.jsx` (`ImageGallery` `:35-182`, page `:184-307`); `site:src/lib/event-status.js`; `site:src/lib/event-time.js`; `site:src/lib/format-date.js`.

**Behaviour**
1. Reads `?slug=`; none shows "No event specified." (`site:src/components/EventDetail.jsx:190-191`). `getEvent(slug)` takes the prefetched answer; a failure shows `data.error` or "Event not found." with "← Back to Events" (`:192-207`).
2. Renders in order: gallery, "← All Events", badges "Featured" and "Competition", name, date (`formatDateFull`) with `startTime – endTime`, venue (a link when `venueLink`), competition line, price line (hidden when ended or cancelled), seats line, description, then the cancelled notice or `RegistrationForm` (`:239-303`).
3. Gallery: images = banner + `galleryImageUrls`; arrows and an "i / n" counter when there is more than one; ArrowLeft / ArrowRight work anywhere on the page unless the focus is in a field; click to zoom; Escape or a backdrop click closes; body scroll is locked while zoomed (`:35-182,237`).
4. `refreshEvent` refetches with `getEvent(slug, { fresh: true })` (`?fresh=1` skips the edge cache) and replaces the event only on success. The booking form calls it through `onEventStale` when the server refused a booking because the event changed (`:212-216`).

**Rules**
- Booking-closed reason, first match wins (`site:src/lib/event-status.js:7-16`): no event `CLOSED`; `status === "CANCELLED"` `CANCELLED`; `hasEventEnded` `ENDED`; `"ANNOUNCED"` `NOT_PUBLISHED`; `"BOOKING_CLOSED"` `CLOSED`; `isFull` `FULL`; `bookingOpen === false` gives `bookingClosedReason || "CLOSED"`; otherwise open. Why the clock is re-checked in the browser: it keeps running on a page left open (`:3-6`).
- Visitor text (`:24-34`): heading always "Booking Closed"; detail `ENDED` "This event has ended.", `CANCELLED` "This event has been cancelled.", `NOT_PUBLISHED` "Booking has not opened for this event yet.", `CLOSED` "This event is no longer accepting bookings.", `FULL` "This event has reached its capacity."; an unknown reason uses the `CLOSED` text.
- Time: `event.date` is UTC midnight of the Indian calendar day; `startTime` and `endTime` are "hh:mm AM/PM" in IST. Missing or unparsable end = 23:59 IST; an end at or before the start rolls to the next day (`site:src/lib/event-time.js:26-46`). Always format with `site:src/lib/format-date.js` (pinned to `Asia/Kolkata`) and test "ended" with `hasEventEnded`; never compare `event.date` to "now" (§6).
- Seats line: `spotsLeft = max(0, capacity - registeredCount)` when `capacity != null` (clamped, because an event can be oversold); shown only when the event has not ended and booking is open; red at 20 or fewer (`site:src/components/EventDetail.jsx:222-226,281-285`).
- Gallery auto-advance every 5000 ms, paused while zoomed, restarted by manual navigation (`:56-61`). Image widths: 900 inline, 1400 zoomed (`:84,118`).
- A cancelled event stays reachable by its link and shows "Event Cancelled" in place of the form (`:221,294-298`).
- A slug must match `[a-z0-9-]+`: the proxy answers anything else with its own 404 (§7).

**Gotchas**
- Every event shares one title ("Event Details — Ulsaham Entertainments"), description and share image; nothing sets `document.title`. There is no canonical on purpose: it would fold every event into one URL (`site:src/pages/events/detail.astro:9`; `site:src/layouts/BaseLayout.astro:11-15`).
- A 24-hour time such as "18:00" does not parse (`site:src/lib/event-time.js:5`): the start becomes 00:00 and the end 23:59 IST, silently.
- Two seats-left computations on one page: `site:src/components/EventDetail.jsx:225` (clamped at 0, "spots remaining") and `site:src/components/RegistrationForm.jsx:518,902` (truthy test, not clamped, "spots left").
- The site's closed texts differ from the admin's 410 messages (for example "Event is full"); both can appear.
- No inline `position` on `.event-detail__poster` and no `overflow-x: hidden` on `body`: either breaks the sticky poster (`site:src/components/EventDetail.jsx:79-80`; `site:src/styles/global.css:76-78`).
- A cancelled event never mounts the form, so no pending-payment check (§8.5) runs on that page.

### 8.4 Booking and payment
**Files**: `site:src/components/RegistrationForm.jsx` (1025 lines; `TicketSuccess` `:77-192`, `CompleteProfileStep` `:194-246`, main `:248-1025`); `site:src/lib/payment-flow.js` (pure decisions); `site:src/lib/razorpay.js` (script loader); `site:src/lib/fees.js` (display price, mirror of `admin:src/lib/pricing.ts`); `site:src/lib/api.js:128-164`; tests `site:tests/lib/payment-flow.test.mjs`, `site:tests/lib/api-payments.test.mjs`, `site:tests/lib/razorpay.test.mjs`, `site:tests/lib/fees.test.mjs`. In 8.4 a bare `:N` is always a line of `site:src/components/RegistrationForm.jsx`.

**Behaviour**

| Phase (`:259-260`) | Screen | Leaves to |
|---|---|---|
| `form` | "Book" form | `paying` (free submit, `:645`) or `breakdown` (paid submit, `:671`) |
| `breakdown` | "Order Summary" fee table, "Pay ₹total →", "← Edit Details" | `paying` (`:682`) or `form` (`:873`) |
| `paying` | Spinner: "Registering…" (free) or "Opening payment gateway…" with Cancel (paid); it stays under the open Razorpay window | `success`, `form`, `breakdown`, `verifying` |
| `verifying` | Spinner "Confirming your payment…" | `success` or `verify-failed` |
| `verify-failed` | `VerifyFailed` panel (§8.5) | `verifying` (Retry) |
| `success` | `TicketSuccess` (§8.8) | terminal |

- Render order, first match wins (`:434-508,764,794`): `success`, `verify-failed`, `verifying` or the recovery panel (§8.5), Booking Closed (§8.3), sign-in check spinner, guest gate ("Login Required", link `/login?next=` + encoded path and query), `CompleteProfileStep` (until the stored user has name, phone and age; it requires a name of 2 or more characters, a 10-digit phone and an integer age 1-120, and saves them to `ulsaham_user`, `:194-246,495-506`), `paying`, `breakdown`, form. Why the first three outrank Booking Closed: the money has moved and the visitor needs the ticket or the Payment ID (`:432-433`).
- Free event (`event.isFree`) or complimentary code applied (`:641-662`): validate, `paying`, `registerForEvent` with a `requestId`; success -> `showTicket`; failure -> `form` + `applyBookingError`. The submit button reads "Book — Free" or "Register — Free →".
- Paid event, `handlePay` (`:677-718`):
  1. Bump `attemptRef`, stop any recovery check, phase `paying`.
  2. In parallel: `loadRazorpay()` and either the reusable order or `createPaymentOrder`.
  3. A new order is kept even if Cancel was pressed meanwhile; an answer for an older attempt is dropped.
  4. Order refused -> `breakdown` + `applyBookingError`. Script missing -> "Could not load the payment gateway. Please check your connection and try again."
  5. When `order.amount !== (quote ? quote.amount : fees.totalPaise)`: show the server's breakdown and "The price changed to ₹x. Please review.", refetch the event, and let the next Pay reuse this same order.
  6. `openCheckout` (`:725-761`) writes the pending record (§8.5), then opens Razorpay Checkout.
- After Checkout: `handler` stores the `paymentId` in the pending record and runs `confirmPayment` (`:386-397`) = `verifyWithRetry(verifyPayment)`, sending Razorpay's `razorpay_*` response fields plus the booking body (`:747`); success -> clear the record, `showTicket`; failure -> `verify-failed`. Window dismissed (`ondismiss`) -> `breakdown` plus a status check (§8.5).
- `showTicket` (`:332-338`): forget the kept order, `addTicket` into `ulsaham_user.tickets`, start the ticket e-mail without waiting for it, phase `success`.
- Promo codes (`:585-616,953-1002`): shown only when `!event.isFree`; input upper-cased; Apply calls `validateCode` and stores `{ type, code, discount, remainingUses }`. `coupon` = a flat rupee amount off the whole order, sent as `couponCode` on the order (`:685`). `complimentary` = the whole booking is free, sent as `code` to `register`. A refusal shows `data.error` or "Invalid code."; HTTP 410 also calls `onEventStale`.
- Competition (`:250-254`): `INDIVIDUAL` hides the count field and forces 1; `GROUP` needs at least 2; `BOTH` shows the hint "1 = individual · 2+ = group". Price = entry price + `groupExtraAmount` per extra member (the entry price when it is `null` or missing; the fallback is `??`, so a stored `0` would be charged as 0, although the admin form only accepts a positive value) (`site:src/lib/fees.js:29-31`). The booking gets a chest number (§8.8).
- Refused order or registration: `bookingErrorAction` (`site:src/lib/payment-flow.js:65-73`) feeds `applyBookingError` (`:619-638`):
  - `coupon` (`code === "COUPON_INVALID"`, or 404 with a code applied and not `EVENT_NOT_FOUND`): code dropped, server text under the promo box, banner "Promo code rejected. Please review and try again."
  - `fields` (400 with `fieldErrors`): back to `form` with the per-field texts, banner "Please check the details below."
  - `stale` (410, or any other 400): `onEventStale()` + the server's text; the refetched event usually turns the form into Booking Closed.
  - `message` (everything else: 409, 429, 5xx, status 0): the text, or "Something went wrong. Please try again."

**Rules**
- Client validation (`:548-569`): name not empty; phone `/^\d{10}$/`; age an integer 1-120; participants a whole number from `minMembers` to `MAX_PARTICIPANTS = 10` (`:33`; same value as `admin:src/constants/index.ts:13`); a complimentary code's `remainingUses` caps the count. Promo input `maxLength={32}` (`:972`; the server allows 50).
- Body (`buildBody`, `:571-582`): `{ name, phone, age, numberOfParticipants }`, plus `email` when filled, plus `code` only for a complimentary code on a paid event.
- The charge is the server's `order.amount` (paise); `site:src/lib/fees.js` is display only. Keep the exact comparison at `:711` and the quote path. A rate or rounding change must be made in `admin:src/lib/pricing.ts`, `site:src/lib/fees.js` and both copies of the fee fixture (`admin:test/fixtures/fee-cases.json`, `site:tests/fixtures/fee-cases.json`) together (fee rules: §3 and §6).
- Order reuse: `ORDER_REUSE_MS = 15 * 60 * 1000`, key `JSON.stringify([slug, body])`, strict `<` (`site:src/lib/payment-flow.js:10-21`). Why: the admin allows 10 orders per hour per IP and phone (`admin:src/lib/ratelimit.ts:65-71`) and Razorpay accepts several attempts on one order. The kept order is a React ref: a reload, or any change to the form or the applied code, forgets it (`:283,302-304`).
- Verify retry: delays `[1000, 3000, 6000]` ms, only for status `0, 500, 502, 503, 504`, so at most 4 attempts (`site:src/lib/payment-flow.js:26-49`); with the 20 s verify timeout the spinner can last about 90 s. Why it is safe: the admin answers an order it has already recorded with the same booking.
- Final answer = `status >= 400 && status < 500 && status !== 429` (`site:src/lib/payment-flow.js:36`): asking again will not change it. After a failed verify only a final answer clears the pending record (`:394`).
- Browser timeouts: order 25000 ms, verify 20000 ms, status 10000 ms; `register` has no browser timeout; repeating it is safe because of `requestId` (`site:src/lib/api.js:12-14,128-130`).
- `requestId`: one per unchanged slug and body (`:651-653`); `crypto.randomUUID()` with a fallback for non-secure pages and old phones (`site:src/lib/payment-flow.js:76-83`); must match the server's `/^[A-Za-z0-9-]{8,64}$/`. The server replays the first booking for the same event, id and phone (`admin:src/app/api/public/events/[slug]/register/route.ts:16,104-107`).
- Razorpay script: `https://checkout.razorpay.com/v1/checkout.js`, `LOAD_TIMEOUT_MS = 15000`, one shared download, a failed tag is removed so the next tap starts afresh (`site:src/lib/razorpay.js:4-41`). It starts loading when `breakdown` appears (`:297-299`).
- The Razorpay key comes only from `order.keyId` (`:737`). Never hard-code a key or the support address: `site:tests/lib/contact.test.mjs:37-54` fails when a payment component spells the address out.
- A coupon must be worth less than the per-person price, so only a complimentary code makes a booking free (`admin:src/lib/coupon.ts:25`).
- `deliverTicketEmail`, `showTicket`, `startCheck` and `confirmPayment` must stay above the early `return`s (`:306-310,345-348`). Why: the mount effect calls them, and a first render that returns early (Booking Closed) would otherwise reach an uninitialised `const`.

**Gotchas**
- `astro dev` cannot book: the dev proxy forwards only GET and HEAD to production and answers every POST with a local 403 (`site:astro.config.mjs:35-43`; §13). Why: a booking made while developing would land in the production database.
- API helpers never throw, and the payload is `res.data.data` (`:657,710`); on a 429 the server's text and `code` are replaced by per-call text (§6).
- Client and server drift: the name needs 1 character here but 2 on the server; the e-mail is not checked (`noValidate`, `:887`); the phone field is editable per booking but never updates the stored profile (`:919`).
- `site:src/lib/fees.js:34-35`: a missing `gstEnabled` means no GST, a missing `platformFeeEnabled` means the 2% fee is charged. Any event field the site starts reading must be added to the admin allow-lists and to `site:tests/contract/public-event.json` in the same change (§7).
- `apply-coupon` can accept a coupon that the order then refuses with `AMOUNT_TOO_LOW` (total under 100 paise); the form treats it as `stale`.
- If booking is closed between order and payment, verify answers 500 `REGISTRATION_FAILED` (`admin:src/app/api/public/events/[slug]/payment/verify/route.ts:246-256`): money taken, no ticket. The site retries, then shows the verify-failed panel. Do not close booking while payments are in flight (§17).
- There is no `payment.failed` listener. Checkout behaviour, UPI app switching and `ondismiss` timing are **unverified** on a real device. `isSubmitting` (`:884`) is never true where it is used.

### 8.5 Payment recovery
**Files**: `site:src/lib/pending-payment.js`; `site:src/components/RegistrationForm.jsx:340-430,782-791` (status check, triggers, notes); `site:src/components/VerifyFailed.jsx`; `site:src/components/AccountPage.jsx:59-213,392-395,549-573,644-654` (`RepayPanel`, kept failure); `site:tests/lib/pending-payment.test.mjs`.

**Behaviour**
1. Record: written to `localStorage["ulsaham_pending_payment"]` just before the Razorpay window opens, as `{ slug, orderId, phone, total, createdAt, email? }`; `paymentId` is added in the Razorpay handler and `checkedAt` once a full check found nothing (`site:src/lib/pending-payment.js:6-9`; `site:src/components/RegistrationForm.jsx:728-735,746,374`).
2. A check starts when `isRecoverable(record, slug)` (same slug, younger than 30 min) on: form mount, for a signed-in visitor only because the effect returns early for a guest (`:400-401,415-416`), Razorpay window dismissed (`:753-757`), tab visible again while the phase is `form` or `breakdown` and no check is running (`:419-423`).
3. On mount the check replaces the form with a panel ("Checking your last payment…", "This takes up to a minute. Please don't pay again meanwhile.") when the record was never fully checked or carries a `paymentId` (`:416,452-460`). Why: after a reload a new Pay would create a second order and a second charge (`:412-414`). The other triggers show a one-line note beside the form or summary.
4. `startCheck` (`:349-381`) calls `getPaymentStatus(slug, { orderId, phone })`:
   - Ticket found -> clear the record, `showTicket`.
   - HTTP 400 or 404 (a record the server cannot match, or an event that is gone) -> clear the record, stop silently.
   - Anything else (pending, 429, 5xx, status 0) -> ask again 3 s after each answer until 60 s have passed, then stamp `checkedAt` and show a note (`:783-791`). With a Payment ID: "We could not find a booking for your last payment (Payment ID …) yet. If you were charged, please contact" `SUPPORT_EMAIL` "with that ID before paying again." Without one: "No completed payment found — you can book again."
5. Verify-failed panel (`site:src/components/VerifyFailed.jsx:9-35`): `role="alert"`; "Payment received — booking not confirmed yet"; the server's text, or "Your payment went through, but we could not confirm your booking yet." when no answer arrived (`site:src/lib/payment-flow.js:51-56`); the Payment ID; "Keep this ID, and please don't pay again."; button "Retry confirmation"; a `mailto:` to `SUPPORT_EMAIL` (`site:src/lib/contact.js:4`) with subject "Payment " + the ID; a My Bookings link unless `accountLink={false}`.
6. Repay from My Bookings (`RepayPanel`, `site:src/components/AccountPage.jsx:59-213`), opened by "Complete Payment →" on an unpaid card:
   - Priced at once with `calcFees(ev, count)` from the ticket's own event (no coupon). Body = the stored profile's `name`, `phone`, `age` + the ticket's `numberOfParticipants` + `ticketCode` (+ `email`); `ticketCode` tells the backend to settle this ticket, and the server uses the ticket's own quantity (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:83-96`). Same order reuse, attempt counter, price-changed quote and `verifyWithRetry` as the form (`site:src/components/AccountPage.jsx:83-146`).
   - Success -> `handleRepaid` (`:549-563`): card marked paid at once, list reloaded, ticket mailed to the profile e-mail.
   - Failure -> held in `AccountPage` state `payIssue`, so closing the panel keeps the Payment ID and the verify-failed panel stays above the list (`:392-395,644-654`); `retryPayIssue` asks again (`:566-573`).
7. Server side: the booking may be made by verify or by the Razorpay webhook (webhook delivery in production is **unverified**, §17). `payment/status` answers `{ success: true, pending: true }` both when nothing is recorded and when the phone does not match (`admin:src/app/api/public/events/[slug]/payment/status/route.ts:68-72`). Why: an order id alone must never reveal a booking.

**Rules**
- `RECOVER_FOR_MS = 30 * 60 * 1000` (strict `<`); `KEEP_FOR_MS = 24 * 60 * 60 * 1000` (the record is removed on read when older or malformed) (`site:src/lib/pending-payment.js:13-14,53-77`). Poll every `CHECK_EVERY_MS = 3000` for `CHECK_FOR_MS = 60_000` (`site:src/components/RegistrationForm.jsx:35-36`); the admin allows 30 status calls per minute per IP (`admin:src/lib/ratelimit.ts:90-98`).
- Never add a Pay button to the verify-failed panel and never bypass the recovery panel. Why: paying again would charge twice (`site:src/components/VerifyFailed.jsx:5-8`).
- Clear the record only on success or on a final answer (4xx except 429). After status 0, 5xx or 429 it must survive, so that a reload polls for the booking (`site:src/components/RegistrationForm.jsx:386-397`).
- Storage errors are swallowed: with storage blocked the payment simply goes unrecorded and the booking still works (`site:src/lib/pending-payment.js:16-24,34-50`).
- `RepayPanel` for a free event shows "Awaiting the organiser…" and no Pay button (`site:src/components/AccountPage.jsx:63,171-174`); its close button is disabled while a payment is being confirmed (`:157-164`).

**Gotchas**
- There is one record for all events (`site:src/lib/pending-payment.js:9`): opening Checkout for another event overwrites it.
- After a final refusal the record is deleted and the Payment ID lives only in React state; a reload loses it (`site:src/components/RegistrationForm.jsx:394-395`).
- `RepayPanel` writes no pending record and its `ondismiss` starts no status check (`site:src/components/AccountPage.jsx:143`); recovery there relies on the 30 s poll (§8.7) and the webhook.
- A ticket found by the status check is e-mailed only if an e-mail was on the form when Pay was pressed: `record.email || ""` does not trigger the default parameter (`site:src/components/RegistrationForm.jsx:311,361,734`).
- Logout does not clear `ulsaham_pending_payment`. Another person who signs in and opens the same event within 30 min triggers the check, and a found booking is added to their tickets (§17).
- `RepayPanel` posts the profile's name, phone and age, and the order route validates them even for a repay: a profile without phone or age gets "Validation failed" with no field shown (`site:src/components/AccountPage.jsx:91-98,107`).
- The server refuses a repay with 410 once the event has ended or is cancelled (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:70-78`), yet the card still offers "Complete Payment →" for an ended event (§8.7). `total` in the record is written and never read.

### 8.6 Customer sign-in screens
**Files**: `site:src/pages/login.astro` (static shell, `noindex`, its own copy of the nav); `site:src/components/AuthForm.jsx` (`GoogleButton` `:31-41`, `EmailStep` `:45-89`, `OtpStep` `:95-213`, root `:217-294`); `site:src/pages/auth/complete.astro` + `site:src/lib/google-complete.js` (completion page); `site:src/lib/auth.js`; `site:src/lib/next-path.js`. Server routes `/api/auth/*`: §7. Sign-in lifecycle and cookies: §6.

**Behaviour**
1. `/login?next=` + path: `next = safeNextPath(?next)`, default `/account`; a visitor who is already signed in is sent there at once (`site:src/components/AuthForm.jsx:226-230`).
2. Google: a plain link to `/api/auth/google?next=` + next (`:31-41`). The callback redirects to the static `/auth/complete`, whose script reads and clears the `google_auth_result` cookie, stores the user and replaces the location with the safe path (`site:src/pages/auth/complete.astro:16-22`; `site:src/lib/google-complete.js:49-63`). The same e-mail as the stored user keeps what the device holds; anyone else starts as `{ tickets: [], ...profile }` (`:39-46`).
3. E-mail: the address is trimmed, lower-cased and checked with `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (`site:src/components/AuthForm.jsx:51-52`). An address flagged `hasGoogle` in `ulsaham_accounts` is sent to Google instead (`:61-64,281-284`). Otherwise `POST /api/auth/send-otp` with `{ email }`, then the code step (`:240-256`).
4. Code step: 6 digits, `POST /api/auth/verify-otp` with `{ email, otp }`; success stores `knownAccount ? { ...knownAccount, ...data.data } : data.data` through `setUser` and replaces the location with `next` (`:133-168`). "Resend code" sends `{ email, resend: true }` after a 60 s countdown (`:93,117-131`).
5. `?error=` codes map to messages (`:232-237`): `google_denied` "Google sign-in was cancelled."; `google_token` and `google_profile` "Google sign-in failed. Please try again."; `google_state` (expired, or started in another browser); `google_unverified` (the Google address is not verified); `auth_failed` and `no_auth_result` "Sign-in failed. Please try again."
6. A code sign-in yields only `{ email, tickets: [] }`; name, phone and age are asked for later by the booking form (§8.4).

**Rules**
- There is no server session. "Signed in" means `localStorage["ulsaham_user"]` parses to an object (`site:src/lib/auth.js:7-9`); every gate is client-side on a static page. Never put anything sensitive behind it (§6).
- UI constants mirror the server (`site:src/lib/otp.js:64-69`) with no shared source: `RESEND_COOLDOWN = 60` s (`site:src/components/AuthForm.jsx:93`), "It expires in 10 minutes." (`:174`), attempts line shown when `attemptsLeft < 5` (`:98,194`), code `/^\d{6}$/` (`:135`). Change both sides together.
- Send the code as a string (`site:src/components/AuthForm.jsx:146`). Why: a number loses leading zeros and fails the 6-digit check.
- Every post-sign-in destination goes through `safeNextPath` (Google start, callback, completion page, `AuthForm`): same-site paths only, fallback `/account` (`site:src/lib/next-path.js:7-28`). Why: open redirects and `javascript:` URLs.
- `/auth/complete` must stay static and free of `is:inline`, `define:vars`, `set:html` and `Astro.cookies`; nothing from the cookie is written into the page (`site:src/lib/google-complete.js:4-7`; `site:tests/auth/google-complete.test.mjs:195-201`).
- Logout = `clearUser()` + `location.replace("/")` (`site:src/components/AccountPage.jsx:543`): it removes `ulsaham_user` and keeps only `{ hasGoogle: true }` flags in `ulsaham_accounts`. Why: on a shared phone the next person must not find earlier visitors' names, phones or ages (`site:src/lib/auth.js:2-4,35-40`).

**Gotchas**
- A new hostname must be added to `security.allowedDomains` (`site:astro.config.mjs:14-21`), or Google sign-in redirects to localhost (broken 2026-09-28 to 2026-10-04; §19).
- Google sign-in must finish within 10 minutes and in one tab: the nonce cookie lasts 600 s (`site:src/lib/google-oauth.js:14-20`), and a second start overwrites it, so the first tab ends at `google_state`.
- `/login` has a hand-copied nav with no avatar menu: at 640 px and below only the logo link is left (`site:src/pages/login.astro:11-25`; `site:src/styles/global.css:850-852`), **unverified** in a browser. A logo or brand change must be made in `site:src/components/SiteNav.astro` and in `site:src/pages/login.astro`.
- The button reads "Verify & Create Account →" for anyone without a Google flag (`site:src/components/AuthForm.jsx:199`), although no account is created on any server.
- The client e-mail check is looser than the server's `EMAIL_RE` (`site:src/lib/mailer.js:51`), so the server can answer 400 for an address the form accepted. Google's e-mail is stored as returned, while the code flow lower-cases it.

### 8.7 My Bookings
**Files**: `site:src/pages/account.astro` (static shell, `noindex`, `SiteNav avatarHref="/account"`); `site:src/components/AccountPage.jsx` (712 lines: `StatusBadge` `:33-51`, `RepayPanel` `:59-213`, `TicketCard` `:217-378`, page `:382-712`); `site:src/lib/auth.js`. In 8.7 a bare `:N` is always a line of `site:src/components/AccountPage.jsx`.

**Behaviour**
1. Mount: no stored user -> `location.replace("/login?next=/account")`; otherwise `loadTickets()` and a `visibilitychange` listener that reloads when the last load is older than 30 s (`:503-523`).
2. `loadTickets` (`:419-501`) is single-flight (a call during a load runs right after it). In parallel: `getTicketCodesByIdentifier(u.phone || u.email)` and `fetchMyTickets` for the first 20 stored codes. Codes the backend knows and the device does not are appended as `{ ticketCode }` and saved; when the code list changed, details are fetched again for the first 20.
3. Pruning: a code that was asked about and did not come back is removed from localStorage (`:469-475`). Why: the admin deletes bookings 14 days after their event (§10).
4. Polling: while any booking is unpaid and its event is not cancelled, reload every 30 s (ticks are skipped while the tab is hidden) and stop after 10 min; the next load that still finds one pending starts it again. Banner: "Auto-refreshing every 30 s for pending payments." (`:477-490,689-693`).
5. Badge, first match wins (`:33-51`): "Cancelled" (`event.status === "CANCELLED"`), "Payment Required" (`!amountPaid`), "Attended ✓" (`attended`), "n of m entered" (`0 < enteredCount < numberOfParticipants`), "Not Attended" (the event has ended), else "Confirmed".
6. Card (`:314-375`): paid -> QR or chest number, code, download, and "Email Ticket" when the profile has an e-mail (§8.8); unpaid and cancelled -> "This event has been cancelled."; unpaid -> "Complete Payment →" (§8.5) and "If you already paid, wait 30 s and refresh."
7. Profile: "Edit Profile" changes name (at least 2 characters), e-mail (optional) and age (1-120) in localStorage only; "Logout" (§8.6) (`:529-543`).
8. A "↻ Refresh" button calls `loadTickets` on demand (`:636-640`). States (`:671-707`): "No bookings yet." + "Browse Events →"; "Could not load booking details. Tap to retry." + Retry; "Could not load live booking details." when codes are stored but none came back.

**Rules**
- `MAX_CODES = 20` (`:18`; equals `admin:src/app/api/public/participants/my-tickets/route.ts:9`), `POLL_EVERY_MS = 30_000`, `POLL_FOR_MS = 10 * 60_000`, `RELOAD_AFTER_MS = 30_000` (`:21-24`). Why the 10 min cap: a tab left open in the background must not poll for ever.
- The lookup identity is ONE value: the profile phone when present, else the e-mail; sent as `{ phone }` when it matches `/^\d{10}$/`, else as `{ email }` (`:436`; `site:src/lib/api.js:195-202`).
- New bookings go to the front of the stored list (`site:src/lib/auth.js:47-55`), looked-up codes to the end. Only the first 20 are shown; codes past 20 are neither shown nor pruned (`:430,443-446,459`).
- Dates use `formatDateMedium`; "ended" always uses `hasEventEnded`, never `event.date` alone (`:46-48`).

**Gotchas**
- This is not authentication: the backend returns ticket codes for any phone or e-mail, and booking details for any codes, limited only by per-IP rate limits (§7; open decision in §17).
- The profile phone is set only by `CompleteProfileStep` and cannot be changed here. A person with a profile phone will not find bookings made under their e-mail with a different phone.
- The profile e-mail can be replaced with any text without a new code; for a profile without a phone it becomes the lookup identity, and text that is not an address makes the lookup fail quietly (`:441,536`).
- A code sign-in user has no name: `form.name` is `undefined`, so "Save Changes" without typing a name throws in `handleSave` (`:508,532`); the heading is empty and the nav avatar shows "?". Found by reading, not reproduced.
- Age accepts non-integers here (`:535`), while the booking form and the server need an integer; `RepayPanel` then sends it as stored.
- An unpaid booking for an event that has ended (not cancelled) still shows "Payment Required" and "Complete Payment →" and keeps the poll going; the server answers 410 (`:26-29`).
- Card order is whatever the backend returns (no `orderBy`): **unverified** in production.
- In `astro dev` both lookups are POSTs and get the local 403: the page shows "No bookings yet." or the retry message (§13).

### 8.8 Tickets
**Files**: on screen `TicketSuccess` (`site:src/components/RegistrationForm.jsx:77-192`) and `TicketCard` (`site:src/components/AccountPage.jsx:217-378`); PNG `site:src/lib/generate-ticket.js`; PDF `site:src/lib/participation-card-pdf.js`; e-mail `site:src/lib/api.js:175-192`, `site:src/pages/api/send-ticket.js`, `site:src/pages/api/internal/ticket-mail.js`, `site:src/lib/ticket-mail.js`, `site:src/lib/mailer.js` (routes, statuses and limits: §7).

**Behaviour**
1. A booking is a participation card when `competitionNumber != null` (a chest number of `0` counts), else a ticket (`site:src/components/RegistrationForm.jsx:81`; `site:src/components/AccountPage.jsx:237`; `site:src/lib/ticket-mail.js:61`).
2. On screen: a ticket shows a QR (`react-qr-code`, value = the ticket code), the code and "Download Ticket"; a card shows a "CHEST NO" block, the code and "Download Participation Card (PDF)". On My Bookings the whole block shows only when `amountPaid` (`site:src/components/AccountPage.jsx:314`).
3. PNG (`site:src/lib/generate-ticket.js:65-220`): clones the on-screen QR `<svg>` at 260 x 260, loads the poster (Cloudinary width 804) and `/brand_logo.avif`, and draws a canvas 600 px wide: green header with logo, yellow body, poster, "EVENT TICKET", Name / Event / Admits / Venue / Date, QR box, code, contact footer. Saved as `ticket-` + code + `.png`.
4. PDF (`site:src/lib/participation-card-pdf.js:38-155`): A4, margin 18 mm; "PARTICIPATION CARD", chest number, rows Participant / Event / Date / Venue / Entry / Reference Code, then the event's `competitionInstructions` and `competitionNotes` with page breaks. Saved as `participation-card-` + code + `.pdf`.
5. E-mail from the browser: after a booking `deliverTicketEmail` posts `{ ticketCode, email }` to `/api/send-ticket` without holding up the success screen; states `sending`, `sent`, `failed` (server text + "Send again") and `skipped` (no address) (`site:src/components/RegistrationForm.jsx:44-75,311-328`). My Bookings has "Email Ticket" on each paid card and sends automatically after a repay (`site:src/components/AccountPage.jsx:226-231,557-562`).
6. E-mail without a browser: when the Razorpay webhook itself completes a booking, the admin calls the signed `/api/internal/ticket-mail` (§7). Both routes build the mail with `buildTicketMail` (`site:src/lib/ticket-mail.js:60-125`): subject "Your ticket for EVENT — CODE" or "Your participation card for EVENT — Chest No N"; QR PNG attached as `cid:ticket-qr` (tickets only); rows Name, Event, Date (IST), Venue, Participants or Members, Reference Code (cards), Payment ID; a link to `SITE_URL` + `/account`.

**Rules**
- Only the ticket code and the recipient travel from the browser; the mail is built from the booking the backend holds, never from the request body (`site:src/lib/api.js:170-174`; `site:src/pages/api/send-ticket.js:49-52`). Why: the route must not be usable to send made-up tickets or to inject markup.
- `/api/send-ticket` refuses an unpaid booking with 409 (`amountPaid === false`, `site:src/pages/api/send-ticket.js:73-77`) and a cross-site caller with 403 (`:18`). Its limits (12 per IP per hour, 6 per ticket per hour, 1 per ticket and address per 60 s) are owned by §7.
- `qrcode` must stay a static import (`site:src/lib/ticket-mail.js:1-4`). Why: loaded through `createRequire` it was left out of the Vercel function and every send failed (no ticket mail from 2026-06-12 to 2026-10-04).
- jsPDF must arrive only through `import("jspdf")` (`site:src/lib/participation-card-pdf.js:8-18`). Why: about 130 KB gzip; a static import breaks the page budgets (§13, §18). It is warmed while a card is on screen (`:25-27`).
- QR value = the ticket code. Sizes: 130 px on screen, copied at 260 px for the PNG so it stays sharp (`site:src/components/RegistrationForm.jsx:116-121,169`); the mail QR is generated 220 px wide and shown at 160 px (`site:src/lib/ticket-mail.js:48,68-72`).
- PNG image loads resolve `null` after 6000 ms (a slow poster must not block the ticket); the object URL is revoked 1000 ms after the click, because revoking at once can cancel the download (`site:src/lib/generate-ticket.js:47,216-218`).
- Dates in the mail and on screen are pinned to `Asia/Kolkata` (`site:src/lib/ticket-mail.js:26-30`; `site:src/lib/format-date.js:7-11`). Why: the server runs in UTC and the stored day is UTC midnight.

**Gotchas**
- Ticket e-mail delivery in production after the 2026-10-04 fix is **unverified**. Customers who booked between 2026-06-12 and 2026-10-04 got no ticket mail (§17). `keepalive: true` on the browser send is what lets it outlive navigation (`site:src/lib/api.js:184-185`): **unverified** on a device.
- A ticket can be mailed twice, by the webhook and by the browser: the 60 s de-dupe is kept per function instance (§17).
- The PNG is 1241 px tall with a poster and 991 px without; a poster that fails or times out changes the height of the same ticket (`site:src/lib/generate-ticket.js:84-89`).
- The PNG's bottom corners are transparent: the body is rounded on all four corners (`:3-15,104`), although the comment says "top". **unverified** on a rendered ticket.
- The PNG needs AVIF decoding for the logo (it falls back to text) and CORS headers from the image host for the poster (`crossOrigin = "anonymous"`, `:46`): **unverified** on devices. Name and event are cut to 10 characters (`:141,158-159`).
- A contact phone and an Instagram handle are typed into the PNG and PDF footers (`site:src/lib/generate-ticket.js:200-201`; `site:src/lib/participation-card-pdf.js:152`), apart from `site:src/lib/contact.js`.
- A failed download shows a browser `alert`; a stale jsPDF chunk after a deploy asks for a page refresh (`site:src/lib/participation-card-pdf.js:42-49`).
- On an SMTP failure only the 60 s de-dupe slot is handed back; the hourly slots stay spent (`site:src/pages/api/send-ticket.js:91-95`).

### 8.9 Brand partners, static pages, navigation, SEO and the 404 page
**Files**: `site:src/components/BrandPartners.jsx` (home slide 3); `site:src/components/SiteNav.astro`; `site:src/layouts/BaseLayout.astro`; `site:src/pages/about.astro`, `site:src/pages/privacy.astro`, `site:src/pages/terms.astro`, `site:src/pages/404.astro`; `site:public/robots.txt`, `site:public/meta-share.jpg` and the icons in `site:public/`.

**Behaviour**
1. Partners (`site:src/components/BrandPartners.jsx:10-93`): `getBrandPartners()` gives `data.data.partners` (`id`, `name`, `logoUrl`). A marquee (list duplicated, `42s` loop) runs only with 6 or more partners on a viewport wider than 899 px; otherwise a static centred row. Loading = 6 round skeletons; failed = "Couldn't load our partners." + Retry; empty = "Your brand could be the first here." + "Partner with us" to `#connect`.
2. Static pages: `/about`, `/privacy` (8 sections) and `/terms` (10 sections) are prerendered with no island: `SiteNav`, copy, and a footer that is copy-pasted in each file.
3. Navigation (`site:src/components/SiteNav.astro`): props `links` (default Events `/events`, Connect `/#connect`) and `avatarHref` (default `/login`), plus a slot beside the logo (the home sound button) (`:11-18`). Its script reads `getUser()`: when signed in the avatar shows the first letter of the name and leads to `/account`, and the menu label reads "Hi, " + first name (`:53-72`). At 640 px and below the inline links are hidden and the avatar toggles a drop-down that holds them (`:76-97`).
4. SEO (`site:src/layouts/BaseLayout.astro:7-54`): props `title`, `description`, `image` (default `/meta-share.jpg`, 1200 x 630), `canonical`, `noindex`. It writes the description, Open Graph and Twitter tags, icons and `theme-color #023301`; the canonical link and `og:url` only when `canonical` is set, with the trailing slash removed except on `/`.
5. 404 (`site:src/pages/404.astro:2-23`): prerendered; the adapter adds a catch-all route so the CDN serves it for unknown paths (`:2-3`; **unverified** in production); `noindex`; no nav, no script; links "Back to home" and "Browse events".

**Rules**
- Canonical on `/`, `/events`, `/about`, `/privacy`, `/terms`; `noindex` on `/account`, `/login`, `/auth/complete` and the 404 page (keeps sign-in and account pages out of search results); `/events/detail` has neither (§8.3).
- `MIN_FOR_MARQUEE = 6`; mobile = `(max-width: 899px)` (`site:src/components/BrandPartners.jsx:22,37-38`). Why: with few partners the duplicated list makes the repeat obvious, and on mobile the wide gaps leave empty stretches. The slide must always render something, because it stays in the pager (`:29-30`).
- `SiteNav` uses fixed ids (`hero-auth`, `profile-menu-wrap`, `mobile-nav-dropdown`, `mobile-account-link`, `mobile-account-label`, `site:src/components/SiteNav.astro:34-41`): one instance per page. The mobile breakpoint 640 px is in the script (`:79`) and in CSS (`site:src/styles/global.css:850-854`).
- Every page is `prerender = true` and fetches its data in the browser. Speed Insights tags are emitted only when `import.meta.env.PROD` (`site:src/layouts/BaseLayout.astro:56-63`).
- A link on a light or accent background needs its own hover colour, because of the global `a:hover { color: #ffffff }` (`site:src/styles/global.css:149-155`; `site:src/pages/404.astro:15`).
- Legacy names are load-bearing and must not be renamed: `#gallery` = events slide, `#testimonials` = partners slide, `.hero-video__menu` = site nav, `#hero-auth` = avatar, `client-carousel` = partners strip (§9).

**Gotchas**
- No sitemap and no `Sitemap:` line in `site:public/robots.txt` (two lines: `User-agent: *`, `Allow: /`); no structured data; no per-event metadata.
- The support address is typed out in `site:src/pages/index.astro`, `site:src/pages/about.astro`, `site:src/pages/privacy.astro` and `site:src/pages/terms.astro` instead of importing `SUPPORT_EMAIL`; `site:tests/lib/contact.test.mjs:29-35` checks that they match the constant. The WhatsApp number and the Instagram URL have no shared constant (`site:src/pages/index.astro:207-216,231`; footers at `site:src/pages/about.astro:44-53`, `site:src/pages/privacy.astro:70-79`, `site:src/pages/terms.astro:75-84`). A change means editing every copy.
- "Last updated: June 2025" is literal text (`site:src/pages/privacy.astro:14`; `site:src/pages/terms.astro:14`), although both files were last changed on 2026-09-27.
- `site:src/pages/privacy.astro:43` says the site uses local storage and no advertising cookies; the sign-in flows also set short-lived functional cookies (§6). Wording gap.
- `site:src/components/BrandPartners.jsx:25` uses `mq.addEventListener` with no legacy fallback: **unverified** on old Safari.
- The comment at `site:src/components/SiteNav.astro:2` says the bar is on every page except `/login`; `/auth/complete` and the 404 page do not render it either. The mobile menu has no Escape-to-close, and there is no skip link.

### 8.10 Staff sign-in, navigation and role-based screens

**Files** `admin:auth.config.ts`, `admin:src/middleware.ts`, `admin:src/lib/auth.ts`, `admin:src/actions/auth.actions.ts`, `admin:src/app/(auth)/login/page.tsx`, `admin:src/components/auth/login-form.tsx`, `admin:src/app/admin/layout.tsx`, `admin:src/app/admin/error.tsx`, `admin:src/components/admin/sidebar.tsx`, `admin:src/components/admin/header.tsx`, `admin:src/config/nav.ts`. Sessions, the cookie, the 24 h cap, the path-by-role matrix and the server-action table are in §10.

**Behaviour**
- `/login`: `LoginForm` posts `username` and `password` (both `required`) to `loginAction` through `useActionState` (`admin:src/components/auth/login-form.tsx:13-41`). Success redirects USER to `/admin/events` and every other role to `/admin/dashboard` (`admin:src/actions/auth.actions.ts:47`); a signed-in visit to `/login` or `/` gets the same redirect from the middleware (`admin:auth.config.ts:44,62-66`).
- Errors shown under the form: "Invalid username or password.", "Authentication failed. Please try again.", "An unexpected error occurred." (`admin:src/actions/auth.actions.ts:28-33`). The typed username is sent back and refilled because React clears the form after every submit (`admin:src/actions/auth.actions.ts:10-11`).
- Shell (`admin:src/app/admin/layout.tsx:9-33`): session re-check, then `Sidebar` (`lg` and up), `Header`, `MobileNav` (below `lg`; icons only, labels `sr-only`) and the only `Toaster`. Nav items: Dashboard, Events, QR Scanner (`/admin/scan`), Activity Logs; USER sees only Events (`admin:src/components/admin/sidebar.tsx:18,36-42,75,101-103`). Accounts and Settings exist only in the header profile menu, for SUPER_ADMIN; Logout is there for every role and posts to `logoutAction` (`admin:src/components/admin/header.tsx:140-164`).
- Pages that change by role inside the page: events list and detail modal (§8.11), participants (§8.12), dashboard (§8.16). USER is shown as "Counter staff" in the header and the logs (`ROLE_LABELS`, `admin:src/constants/index.ts:87-92`) and as "User" on the Accounts page.

**Rules**
- Three guards, all required: middleware `authorized()`, each page's own `auth()` + `redirect`, and a role check inside every server action. Why: any signed-in browser can call an action, and the middleware lets ADMIN through to `/admin/settings` and `/admin/admins`; only the page guards stop them (`admin:src/app/admin/settings/page.tsx:13` sends to `/admin/events`, `admin:src/app/admin/admins/page.tsx:12-14` to `/admin/dashboard`; pinned by `admin:test/auth-config.test.ts:30-33`).
- A new `page.tsx` under `admin:src/app/admin/` needs a row in that test's matrix, or the test fails (`admin:test/auth-config.test.ts:73-88`).
- Usernames match exactly: case-sensitive, no trimming (`admin:src/actions/auth.actions.ts:15`, `admin:src/lib/auth.ts:35`).
- `LOGIN` is logged inside `authorize()` and the redirect role is read from the database (`admin:src/lib/auth.ts:46-55`, `admin:src/actions/auth.actions.ts:36-47`). Why: `auth()` cannot see the cookie set in the same request. `logoutAction` logs `LOGOUT`, then calls `signOut({ redirectTo: "/login" })` (`admin:src/actions/auth.actions.ts:50-64`).
- Keep `prefetch={false}` on rarely opened links: Activity Logs (`admin:src/config/nav.ts:60`), Accounts and Settings (`admin:src/components/admin/header.tsx:141,148`). Keep the profile menu a hand-built disclosure with Escape, outside-click and tab-out closing (`admin:src/components/admin/header.tsx:61-104`). Why: a Radix dropdown cost about 20 KB of JS on every admin page.
- Desktop header title = label of the nav item whose `href` equals the path, else of the first item whose `href + "/"` prefixes it, else "Dashboard" (`admin:src/components/admin/header.tsx:17-23`). Every `/admin/events/...` page is therefore titled "Events".

**Gotchas**
- `toast()` shows nothing on `/login`: the `Toaster` is mounted only in the admin layout, to stay out of the login page's JS (`admin:src/app/admin/layout.tsx:31-32`).
- A session with no `role` is treated as `"ADMIN"` by the layout (`admin:src/app/admin/layout.tsx:19`) and passes every guard written as a deny-list (`role === "USER"`: dashboard, participants, both scan pages, logs). Write new guards as allow-lists.
- `admin:src/config/nav.ts` flags are partly stale: Settings is flagged `adminOnly` (`admin:src/config/nav.ts:49-54`) but is SUPER_ADMIN only. The role flags on `headerOnly` items are never read (the sidebar skips those items, the header menu checks the role itself, `admin:src/components/admin/header.tsx:74,140-152`); the items only supply the desktop header title, which reads "Admin Accounts" on the page titled "Accounts".
- `admin:src/app/admin/error.tsx:21-27` treats a render error matching `/unauthori[sz]ed/i` as an ended session and goes to `/login`; whether production builds keep that message text is **unverified**. A thrown action call shows `ACTION_FAILED_MESSAGE` = "Could not reach the server. Check your connection, refresh the page and try again." (`admin:src/constants/index.ts:30-31`).
- Failed sign-ins have no rate limit, no lockout and no log row (§17).

### 8.11 Event management

**Files** `admin:src/app/admin/events/page.tsx`, `admin:src/app/admin/events/new/page.tsx`, `admin:src/app/admin/events/[id]/edit/page.tsx`, `admin:src/components/events/` (`event-form.tsx`, `event-edit-actions.tsx`, `event-table.tsx`, `events-filter.tsx`), `admin:src/validators/event.validator.ts`, `admin:src/services/event.service.ts`, `admin:src/actions/event.actions.ts`, `admin:src/components/shared/image-upload.tsx`, `admin:src/components/shared/multi-image-upload.tsx`, `admin:src/lib/image-resize.ts`, `admin:src/lib/slug.ts`.

**Behaviour**
- List `/admin/events` (all roles): 10 per page, newest-created first; search (Enter) matches name, venue or slug, case-insensitive; status select; a filter change drops `page`; `page` is clamped 1..1000 and an unknown `status` lists all (`admin:src/app/admin/events/page.tsx:29-49`, `admin:src/components/events/events-filter.tsx:18-33`, `admin:src/repositories/event.repository.ts:137-147`). A row tap opens a detail modal: banner, status, venue, IST date and times, price (regular price struck through beside an active early-bird price), seats, and the buttons Edit (SUPER_ADMIN), Guests (the participants page) and Scan (ADMIN, SUPER_ADMIN), or Enroll (USER) (`admin:src/components/events/event-table.tsx:127-249`). USER rows carry no `registeredCount` or `capacity`, and "New Event" is SUPER_ADMIN only (`admin:src/app/admin/events/page.tsx:51-54,96-103`).
- Create and edit (SUPER_ADMIN) share `EventForm`. Save calls `createEventAction` or `updateEventAction`, toasts "Event created successfully" or "Event updated successfully" with `WEBSITE_UPDATE_NOTE_EVENTS` ("The website shows this within about a minute (past events: within an hour).", `admin:src/constants/index.ts:20`; the site serves from its edge cache, §7), then opens the list (`admin:src/components/events/event-form.tsx:171-193`). The edit page adds quick buttons: Publish / Unpublish (ANNOUNCED to PUBLISHED and back; hidden while BOOKING_CLOSED), Close Booking (PUBLISHED to BOOKING_CLOSED), Reopen Booking (back to PUBLISHED); none for CANCELLED or COMPLETED; Delete Event is always shown (`admin:src/components/events/event-edit-actions.tsx:33-36,89-143`). Quick-button toasts: "Event published", "Event unpublished", "Booking closed — the event stays listed", "Booking reopened", each with the same website note (`admin:src/components/events/event-edit-actions.tsx:37-58,108,118`).
- Images: JPEG, PNG or WebP. JPEG and WebP are shrunk in the browser to a 2400 px long edge and re-encoded as JPEG quality 0.85 on white; PNG is sent untouched (logo transparency); one photo is resized at a time (phone memory) while uploads run in parallel (`admin:src/lib/image-resize.ts:1-14,84-92`). The 4 MB limit (`MAX_IMAGE_SIZE_MB`, kept under Vercel's 4.5 MB body limit, `admin:src/constants/index.ts:6-10`) applies to the result. The file goes to `POST /api/admin/upload` (§7) at once; the event stores `{url, publicId}` only on save.
- Gallery: files beyond 10 are skipped with "Only 10 gallery images allowed — some files were skipped"; `Promise.allSettled` keeps the ones that did upload (`admin:src/components/shared/multi-image-upload.tsx:64-91`).
- Form fields (`createEventSchema`, `admin:src/validators/event.validator.ts:55-175`):

| Field | Rule |
|---|---|
| `name`, `slug` | 2-200 each; slug `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `description`, `venue`, `venueLink` | 10-5000; 2-500; optional URL (empty = none) |
| `date` | required ("Event date is required"); today or later in IST ("Event date must be today or in the future") |
| `startTime`, `endTime` | text `h:mm AM/PM`, `^\d{1,2}:\d{2}\s?(AM\|PM)$`, case-insensitive ("Invalid time format"); form defaults "10:00 AM" and "05:00 PM" |
| `isCompetition`, `participationType` | default false; `INDIVIDUAL` (default), `GROUP`, `BOTH` |
| `competitionNotes`, `competitionInstructions` | max 5000, shown on the public event page; max 10000; the participation card PDF prints both (`admin:src/lib/participation-card-pdf.ts:108-112`) |
| `isFree`, `amount`, `groupExtraAmount` | default free; amounts are positive rupees; "Amount is required for paid events"; group price = price of each extra member of a competition group, "Extra member amount is required for paid group competitions" (fee formulas: §3) |
| `earlyBirdAmount`, `isEarlyBird` | optional positive rupees; a manual switch, not a date rule; clearing the amount switches the flag off |
| `gstEnabled`, `platformFeeEnabled`, `capacity` | "Apply GST (18%)", default false; "Apply Platform Fee (2%)", default true; optional positive integer, blank = unlimited |
| `couponCodes[]`, `complimentaryCodes[]` | inputs shown for paid events only; `code` 1-50, upper-cased; `discount` positive rupees; `maxUses` positive integer |
| `bannerImageUrl`, `bannerImageId`, `galleryImages[]` | banner required; gallery max 10 (`MAX_GALLERY_IMAGES`) |
| `status`, `featured` | default `ANNOUNCED`; default false |

**Rules**
- Statuses a person may pick: Announced (draft, not on the site), Published, Booking Closed (listed, not bookable), Cancelled. Completed is automatic: disabled in the select, refused by the schema before the end time ("Completed is set automatically once the event ends") and by the service for saves and quick buttons (`COMPLETED_IS_AUTOMATIC` = "Completed is set automatically once the event ends — pick another status") (`admin:src/components/events/event-form.tsx:884-891`, `admin:src/validators/event.validator.ts:163-175`, `admin:src/lib/event-status.ts:15-16`, `admin:src/services/event.service.ts:114-122,476-483`).
- Free events are normalised on save: `amount`, `earlyBirdAmount`, `groupExtraAmount` null, `isEarlyBird` false, `gstEnabled` false, `platformFeeEnabled` true; an UPDATE saved as free also empties `couponCodes` and `complimentaryCodes` (a create stores whatever codes the form still holds, `admin:src/services/event.service.ts:311-312`); switching `isCompetition` off resets the type to `INDIVIDUAL` and clears group price, instructions and notes (`admin:src/services/event.service.ts:270-273,297-302,398-420`).
- Slug: filled from the name only while creating (`admin:src/components/events/event-form.tsx:216-221`). Create silently appends `-` plus the last 5 base-36 characters of `Date.now()` to a taken slug; update refuses with `SLUG_IN_USE_MESSAGE` ("Another event already uses this slug. Choose a different one."), and a unique-index clash maps to the same message (`admin:src/services/event.service.ts:279-284,316-323,342-347,444-450`). The form marks the Slug field by comparing the error text with that constant (`admin:src/components/events/event-form.tsx:183`).
- Coupon = fixed rupee amount off. The Add button trims and upper-cases the code and requires discount > 0, discount below the current price (early-bird price when active) and no duplicate (`admin:src/components/events/event-form.tsx:141-169`).
- Complimentary code: `usedCount` is never taken from the form on update; the database count is kept, a new code starts at 0, codes match case-insensitively (`admin:src/services/event.service.ts:363-376`, `admin:src/validators/event.validator.ts:177-186`). Why: the edit page loads the count once, so a save would undo redemptions made meanwhile.
- Delete versus cancel is decided on the server from the current booking-row count (`admin:src/services/event.service.ts:459-474`, `admin:src/actions/event.actions.ts:102-149`). More than 0: status `CANCELLED`, images kept, log `EVENT_STATUS_CHANGED` with `Cancelled event (N booking(s), so not deleted): <name>`, toast "Event cancelled". 0: the event is deleted, its banner and gallery ids are queued for deletion 2 h later (§10), log `EVENT_DELETED`, redirect to the list, toast "Event deleted".
- A successful delete reaches the browser as a redirect error, and `isNavigationError` must swallow it (`admin:src/components/events/event-edit-actions.tsx:19-27,75-82`). Why: rethrowing navigates twice, and returning instead of redirecting would re-render the edit page of a deleted event as a 404 (`admin:src/actions/event.actions.ts:145-148`).
- Dates are stored as UTC midnight of the IST day, and an unchanged date is not rewritten on update (`admin:src/services/event.service.ts:262-263,330-334,356`; time rules: §6). Images a save lets go of are queued only after the update succeeds (`admin:src/services/event.service.ts:422-452`). Why: a failed save must not leave the event pointing at deleted images. Name, description, venue and both competition texts are stored through `sanitizeString`, which strips HTML tags and trims (`admin:src/lib/sanitize.ts:7-11`).
- `admin:src/validators/event.validator.ts:5-9`: Prisma enums are imported as types only. Why: the form runs this file in the browser and value imports add about 16 KB gzip. `AdminEventListItem` must never carry coupon or complimentary codes (`admin:src/types/event.types.ts:6-11`). Why: list rows reach every role's browser.

**Gotchas**
- Past events: the edit form validates with the CREATE schema (`admin:src/components/events/event-form.tsx:75`), whose date rule refuses any day before today in IST, so a past-dated event cannot be re-saved from the form unless its date is moved. The server-side `updateEventSchema` has no such rule (`admin:src/validators/event.validator.ts:134-145,182-217`). Quick buttons and Delete still work; a COMPLETED event shows only Delete.
- The list filters on the STORED status but shows the effective one: a Published event past its end time reads "Completed" yet is found under "Published" until the sweep stores it (`admin:src/services/event.service.ts:218-224`; sweep: §10). The edit page reads the stored status too.
- Moving an event away from Published (Unpublish, Close Booking, Cancel) while a payment is in flight takes the money and issues no ticket, because booking creation tests the stored status (`admin:src/services/participant.service.ts:86`; §7, §17). Renaming a slug mid-sale breaks the browser confirmation of in-flight payments (§7).
- After the 14-day booking prune (§10) an event has no booking rows, so Delete really deletes it and its `archivedParticipantCount` and `archivedRevenuePaise` leave the dashboard totals (§8.16). The confirm text counts the rows loaded with the page (`admin:src/app/admin/events/[id]/edit/page.tsx:36`); the server decides again.
- Coupon checks exist only in the Add handler: the schema checks just length and `discount > 0` (`admin:src/validators/event.validator.ts:37-44`), so lowering the price later is not re-checked. Nothing requires the end time to be after the start (an end at or before the start means past midnight, §6) or early-bird to be below the regular price. Copy mismatch: "Each code grants one free entry" (`admin:src/components/events/event-form.tsx:735-737`) beside a per-code "Entries" count; one use covers a whole booking of up to 10 seats (§7).
- PNG is never shrunk, so a PNG over 4 MB fails with "Image must be smaller than 4MB" while a larger JPEG passes after resizing; a 413 from Vercel shows "Image too large" (`admin:src/components/shared/image-upload.tsx:64-67,77-78`). An upload that is never saved (banner replaced twice, form abandoned) stays in Cloudinary: only saved-then-released images are queued.
- `generateSlug` drops every non-ASCII character (`admin:src/lib/slug.ts:5`), so a name in a non-Latin script gives an empty slug that fails validation until one is typed.

### 8.12 Participants

**Files** `admin:src/app/admin/events/[id]/participants/page.tsx`, `admin:src/components/participants/` (`participant-table.tsx`, `participant-form.tsx`, `lazy-participant-form.tsx`, `add-participant-dialog.tsx`, `qr-code-modal.tsx`), `admin:src/lib/entry-type.ts`, `admin:src/lib/participation-card-pdf.ts`, `admin:src/lib/ticket-contacts.ts`, `admin:src/actions/participant.actions.ts`, `admin:src/services/participant.service.ts`.

**Behaviour**
- ADMIN and SUPER_ADMIN. A row is a booking (one ticket, 1-10 seats), not a person. Every booking of the event is loaded in one query, oldest first; there is no search, filter, sort or pagination (`admin:src/repositories/participant.repository.ts:165-188`). The header count is seats, not rows (`admin:src/app/admin/events/[id]/participants/page.tsx:83`).
- Desktop table (`md` and up): Participant (name, e-mail), Ticket Code (with a `#chest` badge), Phone, Participants (seats), Entry Type, Attendance, Registered (IST date), Actions = QR or chest-card button (a lock when unsettled), mark or unmark attendance, Edit and Delete (SUPER_ADMIN) (`admin:src/components/participants/participant-table.tsx:253-356,393-400`).
- Mobile list (below `md`): serial number, `#chest` + name, phone, "N person(s)", Entry Type badge. A row tap opens a detail dialog with contact, age, seats, registered date, attended time, chest number, ticket code, badges, the QR or card button, and Edit and Delete for SUPER_ADMIN (`admin:src/components/participants/participant-table.tsx:115-184,723-869`).
- Attendance by hand: the tick shows at once (`useOptimistic`); the server sets `attended`, `attendedAt` and `enteredCount` = all seats, or `false`, `null` and 0 on unmark (`admin:src/services/participant.service.ts:360-375`); toasts "Attendance marked" / "Attendance unmarked"; a failed call reverts the tick (`admin:src/components/participants/participant-table.tsx:458-464,533-557`).
- Attendance Mode: a switch "Entry Type" / "Attendance Mode" appears only on the event's IST day; in that mode the mobile list shows a "Present" checkbox for settled bookings and "Unpaid" text for the rest (`admin:src/components/participants/participant-table.tsx:162-176,639-660`).
- Add Participant (ADMIN, SUPER_ADMIN): name, phone, e-mail, age, seats; toast "Participant added successfully". Edit (SUPER_ADMIN): name, e-mail, age, seats; the phone cannot be edited; toast "Participant updated" (`admin:src/components/participants/participant-form.tsx:31-33,59,84`). Delete (SUPER_ADMIN): confirm dialog, hard delete, toast "Participant deleted" (`admin:src/components/participants/participant-table.tsx:515-531`); the log row carries only the booking id (`admin:src/actions/participant.actions.ts:125-151`).
- QR modal (`admin:src/components/participants/qr-code-modal.tsx:132-294,331-423`): an ordinary booking shows a QR of the ticket code (180 px) and "Download Ticket", a 600 px wide PNG drawn on a canvas (logo, optional banner, name, event, admits, venue, date, QR, the code as text, contact lines), saved as `ticket-<ticketCode>.png`. A competition booking (`competitionNumber != null`) shows "CHEST NO" with the number and "Download Participation Card (PDF)": A4, no QR, the ticket code printed as "Reference Code", then Instructions and Notes when set, saved as `participation-card-<ticketCode>.pdf` (`admin:src/lib/participation-card-pdf.ts:35-144`).
- WhatsApp link, mobile list only: tapping the phone opens a dialog with "WhatsApp Message" (`https://wa.me/<number>`: 10 digits get `91` in front, otherwise a leading 0 becomes `91`; no prefilled text) and "Call" (`tel:`) (`admin:src/components/participants/participant-table.tsx:83-87,872-901`). The desktop table shows the phone as plain text.

**Rules**
- Fields (`admin:src/validators/participant.validator.ts:4-28`): name 2-100; phone `^\d{10}$` ("Phone number must be exactly 10 digits"); e-mail optional; age integer 1-120; seats integer 1-10 (`MAX_PARTICIPANTS_PER_REGISTRATION`, `admin:src/constants/index.ts:13`).
- Entry Type is read-only, set once at creation (`admin:prisma/schema.prisma:85-90`) and computed by `entryStatusOf` (`admin:src/lib/entry-type.ts:19-27`): not settled = UNPAID; else the stored `entryType`; else a Razorpay reference = PAID; else FREE on a free event and PAID otherwise. Labels: Paid, Complimentary, Free, Unpaid.
- Every booking staff add is settled and `COMPLIMENTARY`, never FREE or PAID, with a random ticket code, so it adds nothing to revenue (`admin:src/actions/participant.actions.ts:53-60`, `admin:src/lib/revenue.ts:24-28`).
- Add works only while the STORED status is `PUBLISHED` ("Event is not accepting registrations"), then applies the competition quantity rule and the capacity ("Event is full") (`admin:src/services/participant.service.ts:86-100`). It accepts a repeated phone, because a phone may hold several bookings (§11); the Excel import skips one (§8.13).
- Seat edit: never below the people already let in (`N people have already entered on this ticket, so it needs at least N seats`), competition rule applied, `isGroupRegistration` recomputed, capacity NOT checked (`admin:src/services/participant.service.ts:178-192`).
- Double-tap guard: `pendingRef` is tested before React re-renders, the control is disabled while the request runs, and the flag clears inside a transition so the control re-enables together with the refreshed rows (`admin:src/components/participants/participant-table.tsx:466-470,535,550-553`). `isEventDay` is decided after mount, in IST (`admin:src/components/participants/participant-table.tsx:495-500`). Why: deciding it during render disagreed between the UTC server and the phone from 00:00 to 05:30 IST.
- Razorpay references stay on the server: the page computes `entryStatus` and drops `paymentId` and `paymentOrderId`, and `toggleAttendanceAction` returns only `{attended}` (`admin:src/app/admin/events/[id]/participants/page.tsx:45-57`, `admin:src/actions/participant.actions.ts:175-177`). Rows are memoised by value, so every `ParticipantRow` field must stay a plain value (`admin:src/components/participants/participant-table.tsx:89-97`).
- QR and card stay locked until `amountPaid` (`admin:src/components/participants/participant-table.tsx:294-315,805-825`). Their contact lines are the Settings phone and Instagram handle, each falling back to the constant at `admin:src/lib/ticket-contacts.ts:13` (§8.19). SheetJS, jsPDF and the form load on demand (bundle check: §13).

**Gotchas**
- A partly entered group shows "Not Attended": `attended` flips only when the last member enters, and `enteredCount` is not selected for this page (`admin:src/repositories/participant.repository.ts:165-188,322-325`). A manual tick overrides the gate counts (all seats in, or 0).
- Desktop and mobile differ: the desktop attendance button is always there, any day, settled or not (`admin:src/components/participants/participant-table.tsx:316-330`); the mobile checkbox exists only in Attendance Mode and only for settled bookings.
- The `eventId` passed to the update, delete and toggle actions is not checked against the booking; it only feeds the revalidated path and the log (§10).
- Ticket PNG: participant and event names are cut to 10 characters plus "..." (`admin:src/components/participants/qr-code-modal.tsx:243-248`); banner and logo have a 6000 ms load timeout and the ticket is drawn without them on failure (`admin:src/components/participants/qr-code-modal.tsx:70-79`). It prints the code "for the gate to type in" (`admin:src/components/participants/qr-code-modal.tsx:275-278`), but no screen accepts a typed code (§8.14).
- Bookings are deleted 14 days after the event (§10). A deleted paid booking can be re-created by replaying its verify call (D26, §17).
- On phone browsers these are **unverified**: the ticket PNG download (blob + `a.download`), the card PDF (`doc.save`), drawing the AVIF logo and the Cloudinary banner onto the canvas, and the WhatsApp link opening the app.

### 8.13 Excel import and export

**Files** `admin:src/components/participants/import-participants-dialog.tsx`, `admin:src/components/participants/import-participants-form.tsx`, `admin:src/components/participants/participant-table.tsx` (export), `admin:src/actions/participant.actions.ts:378-458`, `admin:src/services/participant.service.ts:197-351`.

**Behaviour**
- Import (SUPER_ADMIN; "Import Excel" on the participants page): upload, preview, result. First sheet only; an empty sheet stops with "The file appears to be empty or has no data rows". The template `participants-template.xlsx` has the headers `Name`, `Phone`, `Email (optional)`, `Age`, `Number of Participants`; also read: `name`, `phone`, `age`, `Email`, `email`, `Participants`, `participants`; seats default to 1 (`admin:src/components/participants/import-participants-form.tsx:45-73,151-158`).
- Each row is checked in the browser with `participantSchema` and previewed with valid and invalid counts; only valid rows go to `bulkAddParticipantsAction`, which re-validates every row and names the first bad one as `Row N: <message>` (`admin:src/components/participants/import-participants-form.tsx:75-106,181-187`, `admin:src/actions/participant.actions.ts:398-421`).
- Result tiles: Added, Duplicate (skipped), Failed with a reason per row. One log row `PARTICIPANT_ADDED`, "Bulk imported N participants from Excel (x skipped, y failed)", only when N > 0 (`admin:src/actions/participant.actions.ts:436-446`).
- Export (ADMIN, SUPER_ADMIN; "Export Excel"): loads SheetJS and `exportParticipantsAction` together and writes `participants-<eventId>.xlsx`, sheet "Participants", columns `Competition No.` (only when present), `Ticket Code`, `Name`, `Phone`, `Email`, `Age`, `No. of Participants`, `Entry Type`, `Attended` (Yes / No), `Attended At`, `Registered At` (IST); toasts "Excel file exported successfully" or "Failed to export Excel file" (`admin:src/components/participants/participant-table.tsx:588-620`).

**Rules**
- `MAX_IMPORT_ROWS = 1000`, enforced only on the server and before any database read: "One import can add at most 1,000 rows. Split the file and import each part." (`admin:src/actions/participant.actions.ts:393-400,420-421`). Why: one import must stay inside the function time limit.
- Rows are written `IMPORT_BATCH_SIZE = 200` at a time, and `registeredAt` is stamped 1 ms apart so the list keeps the file's order. Every row becomes a settled `COMPLIMENTARY` booking with a random ticket code; competition chest numbers are reserved in one call, in row order (`admin:src/services/participant.service.ts:198,283-324`).
- De-duplication: a phone already booked on the event, or repeated earlier in the file, counts as "Duplicate (skipped)" (`admin:src/services/participant.service.ts:258-267,278`). Why: re-running an import must not duplicate people.
- Per-row refusals, in this order: stored status not `PUBLISHED` = "Event is not accepting registrations"; the competition quantity message; capacity counted row by row = "Event is full" (`admin:src/services/participant.service.ts:268-272`).
- Phone: non-digits are stripped, then exactly 10 digits are required, so a number typed with a country code is rejected, not trimmed (`admin:src/components/participants/import-participants-form.tsx:62-64`).
- A batch refused by a unique index is retried row by row with up to 3 ticket codes (`TICKET_CODE_ATTEMPTS`, `admin:src/services/participant.service.ts:37,221-236,325-347`). A failure part-way answers "The import stopped part-way. Refresh the page to see who was added; importing the same file again skips them." (`admin:src/actions/participant.actions.ts:426-434`); a call that throws or times out shows "Import failed or timed out. Refresh the page to see who was added; importing the same file again skips them." (`admin:src/components/participants/import-participants-form.tsx:194-196`).

**Gotchas**
- "Row N" counts data rows from 1, so it is one less than the Excel row number (`admin:src/components/participants/import-participants-form.tsx:160`). The template's two sample rows are valid data: delete them or they are imported (`admin:src/components/participants/import-participants-form.tsx:50-53`).
- ".xlsx files only" is enforced only by the file picker's `accept` attribute; `XLSX.read` has no format restriction (`admin:src/components/participants/import-participants-form.tsx:151,244`). What the picker allows on phones is **unverified**.
- The export sends whole `Participant` rows to the browser, `paymentId`, `paymentOrderId` and `requestId` included (`admin:src/actions/participant.actions.ts:454-458`, `admin:src/repositories/participant.repository.ts:153-158`), because the sheet computes Entry Type client-side (`admin:src/components/participants/participant-table.tsx:601`). The comment at `admin:src/app/admin/events/[id]/participants/page.tsx:45-46` is true for the page only.
- `exportParticipantsAction` returns the array or throws "Forbidden"; it is not an `ActionResult`. For a partly entered group the sheet can show Attended "No" with an "Attended At" time (§8.14).
- Saving the file with `XLSX.writeFile` on phone browsers is **unverified**.

### 8.14 Gate scanner

**Files** `admin:src/app/admin/events/[id]/scan/page.tsx`, `admin:src/app/admin/scan/page.tsx`, `admin:src/components/participants/qr-scanner.tsx`, `admin:src/components/participants/global-qr-scanner.tsx`, `admin:src/lib/gate-scanner.ts`, `admin:src/actions/participant.actions.ts:184-376`, `admin:src/repositories/participant.repository.ts:291-346`, `admin:public/zxing/zxing_reader-3.0.3.wasm`, `admin:next.config.ts`.

**Behaviour**
- Two scanners, both for ADMIN and SUPER_ADMIN: per-event `QRScanner` at `/admin/events/[id]/scan` (the ticket must belong to that event) and `GlobalQRScanner` at `/admin/scan` (any event; shows event name, date and venue).
- Flow: the camera reads a QR, the lookup (`scanAttendanceAction(code, eventId)` or `scanGlobalAttendanceAction(code)`) returns `fullyEntered`, `remaining` and `needsCountInput`; a one-seat ticket is confirmed at once with count 1, a multi-seat ticket asks "How many entering now?" (1..remaining); the confirm (`confirmEntryAction` or `confirmGlobalEntryAction`) runs `addEnteredCount` (`admin:src/components/participants/qr-scanner.tsx:77-159`).
- Group entries: each confirm adds `count` to `enteredCount`; `attendedAt` is stamped at the first entry; `attended` turns true only when the ticket is full; a later scan offers what is left (`admin:src/repositories/participant.repository.ts:313-329`).
- Reset: the per-event scanner clears its result after 4000 ms and ignores the same code until then (`admin:src/components/participants/qr-scanner.tsx:57-60,80`). The global scanner waits for a tap ("Tap anywhere to scan next"); only "already" closes itself, after `AUTO_CLOSE_SECS = 10`, and other codes are still read meanwhile (`admin:src/components/participants/global-qr-scanner.tsx:58,77-100`).
- Outcomes (server texts: `admin:src/actions/participant.actions.ts:204-211,300-307`, `admin:src/repositories/participant.repository.ts:310-316,339`; UI texts: `admin:src/components/participants/qr-scanner.tsx:124,153,179-185,277-289`, `admin:src/components/participants/global-qr-scanner.tsx:144,176,305,330-336,386,398-423`):

| Situation | Server answer | Per-event UI | Global UI |
|---|---|---|---|
| Unknown code (per-event: also another event's ticket) | "Invalid ticket code for this event"; global: "Invalid ticket code" | red "Invalid Code" + text | "Invalid Ticket" + text |
| Fully entered: `enteredCount >= numberOfParticipants`, or legacy `attended && enteredCount === 0` | success, `fullyEntered: true` | yellow "Already Attended", `<name> is already fully checked in.` | red "Already Checked In", name, phone, "All N member(s) have entered", countdown |
| One seat, not entered | success; the client confirms 1 | green "Checked In", `<name> — <entered>/<seats> member(s) entered` | "Checked In!", "Attendance marked successfully", details card |
| Several seats, some left | success, `needsCountInput: true` | count card, Confirm Entry / Cancel | "Group Ticket" card, Confirm Entry, x to cancel |
| Confirm refused | `Entry count must be between 1 and <remaining>`, "Just scanned at another gate — rescan", "Participant does not belong to this event", "Participant not found" | red "Invalid Code" + text | "Invalid Ticket" + text |
| Call threw (offline, session ended) | none | "Failed to process scan. Try again." or "Failed to confirm entry." | same |
| Camera error | none | "Camera permission denied. Please allow camera access and try again." when the message contains "permission", else `Camera error: <msg>`; Retry Camera | same |

**Rules**
- QR payload = the raw ticket code and nothing else; the lookup is an exact, case-sensitive `findUnique({ where: { ticketCode } })` with no trimming (`admin:src/repositories/participant.repository.ts:292,298-299`). The site encodes the same value (`site:src/components/AccountPage.jsx:323`, `site:src/components/RegistrationForm.jsx:169`, `site:src/lib/ticket-mail.js:68`). Change both sides together or not at all.
- Two gates at once: the write is a compare-and-set `updateMany` filtered on the `enteredCount` just read; zero rows written with a changed count means another gate wrote first, and the loser is told to rescan (`admin:src/repositories/participant.repository.ts:318-345`). Why: two phones must never admit more people than the ticket covers. No unit test covers `addEnteredCount`, and two phones on one ticket are **unverified** on real devices.
- Scan confirms must not call `revalidatePath` (`admin:src/actions/participant.actions.ts:254-256,361`). Why: it would re-render the scan page inside every scan response. Each confirm logs `ATTENDANCE_MARKED`; lookups log nothing.
- `GATE_SCANNER_PROPS`: `formats: ["qr_code"]`, `retryDelay: 150`, `settleDelayMs: 0`; camera `facingMode: "environment"` (`admin:src/lib/gate-scanner.ts:25-36`, `admin:src/components/participants/qr-scanner.tsx:187`). Why: decoding one format per frame is cheap enough to retry every 150 ms instead of 500 ms.
- The zxing wasm is self-hosted at `/zxing/zxing_reader-<version>.wasm` and served with `Cache-Control: public, max-age=31536000, immutable` (`admin:src/lib/gate-scanner.ts:8-23`, `admin:next.config.ts:66-70`). Why: scanning at the gate must not depend on a third-party CDN. The name must carry the installed `zxing-wasm` version (3.0.3, a transitive dependency): `admin:next.config.ts:11-19` throws when the file is missing; after an upgrade copy `admin:node_modules/zxing-wasm/dist/reader/zxing_reader.wasm` to the new name under `admin:public/zxing/` and delete the old copy. zxing must stay out of every non-scan page (§13).
- Global scanner: keep the camera mounted under the result cards (`admin:src/components/participants/global-qr-scanner.tsx:184-187`). Why: remounting made every ticket wait for a camera restart. `sound={showCamera}` also restarts the library's detection loop (v2.6, per the code comment), so the ticket still in view is read again after a dismiss (`admin:src/components/participants/global-qr-scanner.tsx:201-207`); a library upgrade can change this silently.
- `Permissions-Policy` must keep `camera=(self)` (`admin:next.config.ts:63`). Why: tightening it to `camera=()` would block the camera on the scan pages.

**Gotchas**
- `admin:src/lib/gate-scanner.ts` holds only scanner settings and the wasm URL; the admit and refuse logic is in the actions and the repository listed under Files.
- The scanner never checks payment, event status or date: an unsettled booking's code scans in (only its QR display is locked), and the global scanner admits tickets of past or cancelled events (`admin:src/repositories/participant.repository.ts:291-306`).
- Competition bookings have no QR anywhere (admin modal, card PDF, site, ticket e-mail), so neither scanner can admit them; tick them by hand on the participants page. There is no typed-code entry either, although the ticket PNG prints the code for that purpose (§17).
- Legacy hole: a booking stored before `enteredCount` existed cannot match the compare-and-set filter and is written unguarded (`admin:src/repositories/participant.repository.ts:333-344`).
- Per-event scanner: a failed scan of a ticket cannot be retried until the 4 s reset clears `lastCode` (`admin:src/components/participants/qr-scanner.tsx:69-80`). Global scanner: the event date uses `toLocaleDateString("en-IN")` with no time zone (`admin:src/actions/participant.actions.ts:324-328`), unlike every other date (IST, §6).
- On real devices these are **unverified**: the camera permission prompt, rear-camera choice, decode speed and torch on iOS Safari and Android Chrome; the beep; the wasm loading from `/zxing/` with no CDN request; a real site ticket scanning, including the inverted-colour QR of the ticket e-mail read from a phone screen.

### 8.15 Counter enrolment and counter payments

**Files** `admin:src/components/events/event-table.tsx`, `admin:src/components/participants/enroll-dialog.tsx`, `admin:src/lib/counter-checkout.ts`, `admin:src/actions/payment.actions.ts`, `admin:src/actions/participant.actions.ts:32-78`, `admin:src/types/razorpay.d.ts`.

**Behaviour**
- USER (Counter staff) taps an event, then "Enroll" in the detail modal, which opens `EnrollDialog` ("Register as Guest"): name, phone, e-mail, age, seats. An individual-only competition hides seats and forces 1; a group-only one needs at least 2 (`admin:src/components/participants/enroll-dialog.tsx:76-77,113-119,345-369`).
- Fee box: a client preview with the same `calculateTicketFees` / `calculateCompetitionFees` the server uses, coupon 0, early-bird price when active (`admin:src/components/participants/enroll-dialog.tsx:78-102,225-266`; formulas: §3).
- Free event ("Enroll for Free"): `addParticipantAction` creates a `COMPLIMENTARY` booking. Paid event (`Pay <total> & Enroll`): the Razorpay script `https://checkout.razorpay.com/v1/checkout.js` is added on demand ("Failed to load payment gateway. Please check your connection and try again." when it cannot load), then `createPaymentOrderAction`, `runCounterCheckout` (theme colour `#014421`), `verifyAndEnrollAction`, and the success step "You're Enrolled!" (`admin:src/components/participants/enroll-dialog.tsx:120-195`).
- Outcomes (`admin:src/lib/counter-checkout.ts:10-53`, `admin:src/components/participants/enroll-dialog.tsx:180-194`): `enrolled`; `failed` = error toast, and when money was taken it stays until closed and shows `Payment ID: <id>`; `dismissed` = "Payment cancelled".
- After a success the event id is stored in localStorage key `ulsaham_user_enrollments` (JSON array of event ids), and the modal shows a disabled "Enrolled" button for that event on that device (`admin:src/components/events/event-table.tsx:49,56-77,214-218`).

**Rules**
- `createPaymentOrderAction` (`admin:src/actions/payment.actions.ts:34-103`) checks in order: `participantSchema`; "Event not found"; booking closed by status AND clock (messages at `admin:src/lib/event-status.ts:7-13`); "This is a free event"; competition quantity; capacity "Event is full"; "Payment gateway not configured" (no `RAZORPAY_KEY_ID`). It then prices on the server (no coupon) and creates an INR order of `Math.round(total * 100)` paise, receipt `evt_<last 8 of eventId>_<Date.now()>`, notes `eventId`, `eventName`, `phone`, `name`, `email`, `age`, `numberOfParticipants`.
- `verifyAndEnrollAction` (`admin:src/actions/payment.actions.ts:105-189`) checks in order: "Payment configuration error" (no `RAZORPAY_KEY_SECRET`); HMAC-SHA256 over `order_id|payment_id`, constant-time compare ("Payment verification failed. Please contact support."); the order re-read from Razorpay ("Could not confirm the payment with Razorpay yet. If money was taken, the booking will be completed automatically."); the order must be a new booking for this event ("This payment does not match this enrolment. Please contact support with the payment ID."). It then books from the ORDER NOTES, never the form, as `PAID` with `amountPaidPaise`, `paymentOrderId` and `paymentId`, idempotent on the order id. Why: the signature proves only that the payment belongs to the order, so form values would let one payment be replayed into another booking.
- USER may call `addParticipantAction` only when `event.isFree || !event.amount`; otherwise "Forbidden" (`admin:src/actions/participant.actions.ts:38-43`). Why: a paid enrolment must go through Razorpay. There is no coupon, cash or "mark paid" path at the counter.
- `runCounterCheckout` always settles, so the button never sticks on "Processing...": confirmed, refused, window closed, checkout could not open ("Could not open the payment window. Please try again."), or the confirmation call failed after payment (`CONFIRMATION_LOST` = "Payment received — confirmation didn't reach the server. Check the participant list before charging again.") (`admin:src/lib/counter-checkout.ts:4-5,25-53`).
- Capacity is checked when the order is created and never after payment (`admin:src/services/participant.service.ts:91-95`). Why: the money is already taken. The same order notes let the Razorpay webhook finish a counter payment whose confirmation was lost (§7).
- A new paid booking logs `PARTICIPANT_ADDED` with `Self-enrolled (paid): <name> (<code>) — Payment: <id>` (`admin:src/actions/payment.actions.ts:163-181`). `EnrollDialog` loads through `next/dynamic` (`ssr: false`) and is pre-warmed for USER only (`admin:src/components/events/event-table.tsx:32-37,58-59`).

**Gotchas**
- Per-device lock: after one enrolment the Enroll button for that event stays disabled in that browser; nothing clears the key, so a counter can enrol one booking per event per device until site data is cleared. The wording ("Register as Guest", "You're Enrolled!", "Self-enrolled") reads like an earlier self-service design. Whether the lock is intended is **unverified** (§17).
- "Enroll" is offered on every event whatever its status; the server decides. The free path tests the STORED status (`admin:src/services/participant.service.ts:86`), the paid order tests status and clock, and `verifyAndEnrollAction` then meets the stored-status test again: an event moved away from Published between Pay and confirmation gives a failed enrolment with money taken (the sticky toast names the payment). The webhook hits the same refusal (§7).
- Both payment actions accept any signed-in role, and their fallback for a session without a role is `"USER"`, not `"ADMIN"` as elsewhere (`admin:src/actions/payment.actions.ts:23`).
- Unlike the public order route, the counter order has no timeout wrapper and no minimum-amount check (`admin:src/actions/payment.actions.ts:73-93`; §7). `verifyAndEnrollAction` ignores its third argument (`admin:src/actions/payment.actions.ts:112-114`).
- Live Razorpay Checkout at the counter, the dropped-connection path and the sticky toast are **unverified**.

### 8.16 Dashboard and revenue

**Files** `admin:src/app/admin/dashboard/page.tsx`, `admin:src/components/admin/stats-card.tsx`, `admin:src/components/admin/activity-feed.tsx`, `admin:src/repositories/event.repository.ts:369-421`, `admin:src/lib/revenue.ts`.

**Behaviour**
- ADMIN and SUPER_ADMIN; the page sends USER to `/admin/events` (`admin:src/app/admin/dashboard/page.tsx:27`). Tiles: Total Events, Published, Upcoming, Participants, Revenue. The Revenue tile and the "Create Event" button are SUPER_ADMIN only, so ADMIN sees four tiles (`admin:src/app/admin/dashboard/page.tsx:51-99`).
- Recent Activity: the 20 newest log rows of the last 15 days (`admin:src/app/admin/dashboard/page.tsx:45`). Reading the page also schedules the COMPLETED sweep after the response (`admin:src/services/event.service.ts:256-259`; §10).

**Rules**
- Total Events = every event, any status. Published = stored status `PUBLISHED` or `BOOKING_CLOSED`. Upcoming = those with `date` on or after today's IST day, `toEventDay(new Date())` (`admin:src/repositories/event.repository.ts:370-386`). Why: dates are UTC midnight of their IST day, so an event stays upcoming all of its day, not only until 05:30 IST.
- Participants = seats (not rows) of all live bookings + `archivedParticipantCount` of pruned events (`admin:src/repositories/event.repository.ts:388-390,418`).
- Revenue in rupees = (sum of `amountPaidPaise` on settled bookings + `archivedRevenuePaise` + estimate) / 100 (`admin:src/repositories/event.repository.ts:392-419`). Estimate = seats x the event's base `amount` for settled bookings with no recorded charge whose entry status is PAID; it ignores early-bird, coupons, group rates and fees (`admin:src/lib/revenue.ts:18-28`). Why: those bookings are older than the `amountPaidPaise` field.
- `NO_RECORDED_CHARGE` must match both a missing field and `null` (`admin:src/lib/revenue.ts:8-10`). Why: MongoDB keeps "missing" apart from `null` (§11). Amounts render through `<Amount />` (§9).

**Gotchas**
- Revenue is what Razorpay charged, GST and platform fee included; complimentary and free entries add nothing; no code records a refund, so the figure never drops for one.
- The aggregates have no status filter: bookings of cancelled events still count in Participants and Revenue (`admin:src/repositories/event.repository.ts:388-392`).
- Deleting an event removes its archived totals from both figures (§8.11).

### 8.17 Activity logs

**Files** `admin:src/app/admin/logs/page.tsx`, `admin:src/components/admin/logs-feed.tsx`, `admin:src/components/admin/logs-filter.tsx`, `admin:src/repositories/activity-log.repository.ts`, `admin:src/lib/activity-logger.ts`, `admin:src/constants/index.ts:41-92`.

**Behaviour**
- ADMIN and SUPER_ADMIN. Read-only list, newest first, 20 per page, last 30 days only (`admin:src/app/admin/logs/page.tsx:37-42`, `admin:src/repositories/activity-log.repository.ts:23-35`). Filters: username search (case-insensitive contains, Enter) and an action select built from `LOG_ACTION_LABELS` (18 actions); a filter change drops `page`; `page` is clamped 1..1000 and an unknown `action` lists all (`admin:src/app/admin/logs/page.tsx:28-35`, `admin:src/components/admin/logs-filter.tsx:19-35,55-60`).
- A row tap opens "Log Detail": action badge, description, username, role label, IST timestamp, entity and id, IP address. Role labels come from `ROLE_LABELS` (Super Admin, Admin, Counter staff, System) with the fallback "Admin" (`admin:src/components/admin/logs-feed.tsx:74-143`). `metadata` is stored but never sent to the browser (`admin:src/app/admin/logs/page.tsx:48-58`).

**Rules**
- Retention is 30 days: opening the page schedules `pruneOldActivityLogs` after the response, at most once an hour across instances (job `prune-activity-logs`, `admin:src/app/admin/logs/page.tsx:25-26`; §10).
- Every state-changing action writes one row with `await logActivity(...)`. It never throws (`admin:src/lib/activity-logger.ts:36-39`), so a missing row is silent and a forgotten `await` is caught only by lint (`@typescript-eslint/no-floating-promises`, `admin:eslint.config.mjs:35`). Which action writes which row: §10.
- IP = first `x-forwarded-for` entry, else `x-real-ip`, else "unknown" (`admin:src/lib/activity-logger.ts:19-22`).

**Gotchas**
- Not every row comes from staff: rows with `adminRole: "SYSTEM"` are written by the Razorpay webhook (`razorpay-webhook`) and the public verify route (`payment-verify`), and the username search matches them like any name (§7).
- Creating a USER account logs `ADMIN_CREATED`; `USER_CREATED`, `USER_UPDATED` and `USER_DELETED` appear in the action select but nothing writes them. Failed sign-ins and scan lookups leave no row; deleting a booking logs only its id.
- Pruning needs someone to open the page; the list still shows 30 days because the query applies its own window. The repository accepts `dateFrom` and `dateTo` (`admin:src/repositories/activity-log.repository.ts:5-12`), but the UI has no date filter.
- The page passes the literal 20; changing `LOGS_PAGE_SIZE` alone changes nothing on screen (the same holds for the events list's literal 10 and `DEFAULT_PAGE_SIZE`, `admin:src/constants/index.ts:11-12`).

### 8.18 Staff accounts

**Files** `admin:src/app/admin/admins/page.tsx`, `admin:src/components/admin/admin-table.tsx`, `admin:src/components/admin/create-admin-dialog.tsx`, `admin:src/components/admin/reset-password-dialog.tsx`, `admin:src/actions/admin.actions.ts`, `admin:src/validators/admin.validator.ts`, `admin:src/repositories/admin.repository.ts`.

**Behaviour**
- Route `/admin/admins`, page title "Accounts", SUPER_ADMIN only. It lists ADMIN and USER accounts, newest first; SUPER_ADMIN accounts are never listed (`admin:src/repositories/admin.repository.ts:4-17`). Columns: Username, Role badge ("User" or "Admin"), Status switch with an Active / Inactive badge, Last Login (IST date or "Never"), Created (`admin:src/components/admin/admin-table.tsx:44-49,95-130`).
- "Add User" and "Add Admin" dialogs call `createAdminAction` (toast `<Admin|User> account "<name>" created`). The row menu has Reset Password (new + confirm; toast `Password reset for "<name>"`) and Delete (confirm, permanent; "Account deleted"). The switch activates or deactivates ("Account activated" / "Account deactivated").

**Rules**
- Username 3-50 characters, `^[a-z0-9_]+$`; password 8-100; confirm must match ("Passwords do not match"); a taken name answers "Username already taken"; hash = bcryptjs cost 12 (`admin:src/validators/admin.validator.ts:3-37`, `admin:src/actions/admin.actions.ts:18,50-53`).
- Only `ADMIN` and `USER` can be created here (`admin:src/validators/admin.validator.ts:18`); SUPER_ADMIN comes from the seed (§11). There is no role change: delete and re-create.
- Toggle, reset and delete refuse a SUPER_ADMIN target: "Cannot modify a Super Admin account" (toggle, reset) and "Cannot delete a Super Admin account" (`admin:src/actions/admin.actions.ts:88-90,138-140,171-173`). Why: the owner account cannot be locked out from the UI.
- All four actions answer "Unauthorized: Super Admin access required" to any other caller, signed in or not (`admin:src/actions/admin.actions.ts:20-26`). Log rows: `ADMIN_CREATED` (both roles), `ADMIN_UPDATED` (activate, deactivate, password reset), `ADMIN_DELETED`.

**Gotchas**
- Deactivating, deleting or resetting the password does not end an open session: the JWT is never re-checked against the database, so the account keeps working until the 24 h cap; only a new sign-in is refused (`admin:src/lib/auth.ts:36-39`; §10).
- The super admin's password can only be changed by re-running the seed, which also re-activates the account (§11).
- The on-screen copy is wrong: the page says "Admins have full access; users can only view events and participants." (`admin:src/app/admin/admins/page.tsx:24`) and the create dialogs repeat it in other words (`admin:src/components/admin/create-admin-dialog.tsx:96-97`). In code an ADMIN cannot create or edit events, edit or delete bookings, import, or open Settings or Accounts, and a USER cannot open participants but can enrol people (§10).

### 8.19 Settings and brand partners

**Files** `admin:src/app/admin/settings/page.tsx`, `admin:src/components/settings/` (`settings-form.tsx`, `brand-partners-section.tsx`, `logo-crop-dialog.tsx`), `admin:src/actions/settings.actions.ts`, `admin:src/validators/settings.validator.ts`, `admin:src/repositories/settings.repository.ts`, `admin:src/lib/ticket-contacts.ts`.

**Behaviour**
- SUPER_ADMIN only; the page guard sends everyone else to `/admin/events` (`admin:src/app/admin/settings/page.tsx:13`). Company Details: company name, address, e-mail, phone. Social Media: facebook, instagram, youtube, linkedin. Save calls `updateSettingsAction`; toast "Settings updated successfully".
- Brand Partners: "Add Partner", then name + logo file, 1:1 crop, 512 x 512 PNG, `POST /api/admin/upload?folder=brand-partners` (file name `logo.png`, Cloudinary folder `ulsaham/brand-partners`), `addBrandPartnerAction` (id from `crypto.randomUUID()`) (`admin:src/components/settings/brand-partners-section.tsx:47-59,163-198`). Remove asks for confirmation and queues the stored logo for deletion 2 h later (§10). No edit and no reorder. Partner toasts carry `WEBSITE_UPDATE_NOTE_PARTNERS` ("The website shows this within an hour.").

**Rules**
- `settingsSchema` (`admin:src/validators/settings.validator.ts:3-21`): company name 2-200, default "Ulsaham Entertainments"; address max 500; e-mail must be valid; phone `^\d{10,15}$` ("Phone must be 10-15 digits", no `+`); each social link must be a URL ("Invalid URL"). Empty strings are saved as `null` (`admin:src/actions/settings.actions.ts:34-37`).
- Settings phone and Instagram feed the contact lines on ticket PNGs and participation cards (§8.12). `ticketContacts` falls back field by field to the constant at `admin:src/lib/ticket-contacts.ts:13`; the handle is read from a profile URL on `instagram.com`, `www.`, `m.` or `instagr.am`, must match `^[A-Za-z0-9._]{1,30}$`, and a post or reel URL gives none (`admin:src/lib/ticket-contacts.ts:15-49`).
- Logo source: JPEG, PNG or WebP, at most 4 MB before cropping ("Image must be smaller than 4MB"); the crop starts at 80% width centred with `aspect={1}` and `minWidth={40}`; the output is always a 512 x 512 PNG (`admin:src/components/settings/brand-partners-section.tsx:123-142`, `admin:src/components/settings/logo-crop-dialog.tsx:30-36,49-50,120-121`).
- The logo queued on removal is the one stored with the partner, never an id sent by the browser, and a partner already removed counts as success (`admin:src/actions/settings.actions.ts:92-97`). Add and remove are one atomic `push` / `deleteMany` each (`admin:src/repositories/settings.repository.ts:42-72`). Why: two changes at the same moment must both stay.
- One Settings row by convention: every read and write takes the oldest row, and `getSettings()` creates it on first use (`admin:src/repositories/settings.repository.ts:4-16`; §11).

**Gotchas**
- `BrandPartnersSection` keeps its own state copy of the list (`admin:src/components/settings/brand-partners-section.tsx:62`), so `revalidatePath` does not refresh it; another tab's change appears only after a reload.
- `addBrandPartnerAction` stores `name`, `logoUrl` and `logoId` exactly as sent, with no server-side validation (`admin:src/actions/settings.actions.ts:58-69`); only the browser checks that the name is not empty.
- A logo uploaded for an add that then fails stays in Cloudinary. The remove dialog says the logo is deleted "from storage" (`admin:src/components/settings/brand-partners-section.tsx:384`); the delete runs about 2 h later and only when someone opens `/admin/events` (§10).
- `admin:src/components/settings/logo-crop-dialog.tsx:98-100` swallows a crop failure with a comment that the parent shows a toast; the parent has no such path, so the dialog just stays open.

---

## 9. UI foundation and coding conventions

Not repeated here: feature behaviour (§8), browser storage shapes (§6.4), env keys (§6.7, §10.5), lint rules (§13.3), bundle budgets (§13.4). A bare `:N` cites the file named just before it.

### 9.1 Customer site design tokens

Only four colours, two font families and one animation are Tailwind theme values (`site:tailwind.config.mjs:9-25`). Everything else is a raw value in `site:src/styles/global.css` or an inline `style`. There is no token scale for radii, shadows or `z-index`.

| Value | Token or class | Role |
|---|---|---|
| `#023301` | `primary` (`bg-primary`, `text-primary`) | Page background (`site:src/styles/global.css:72,85`), `theme-color` meta (`site:src/layouts/BaseLayout.astro:51`), text on accent buttons |
| `#9bca3b` | `accent`; `rgba(155, 202, 59, a)` in CSS | Links, CTAs, highlights, focus rings, active pager dot |
| `#ffffff` | `light`, used with opacity (`text-light/80`) | Body text |
| `#2591d0` | `info` | Defined, but no class uses it; only `rgba(37, 145, 208, 0.12)` at `site:src/styles/global.css:326` |
| `rgba(255, 255, 255, 0.08)` | `.hero-video__menu` (with `backdrop-filter: blur(12px)`), `.event-card` (no blur) | Glass nav bar and card surfaces (`site:src/styles/global.css:197-199,892`) |
| `#050505`; `#021401`; `#0b2a0a`, `#021c01` | `.partners-section`; `.mobile-nav-dropdown`; `.past-cf__card` and its `::after` | Partners slide, mobile menu, coverflow card and its dim layer (`site:src/styles/global.css:317,836,547,592`) |
| `#fca5a5`, `rgba(220, 38, 38, a)`; `#4ade80`, `rgba(34,197,94,a)` | `.reg-error`, `.reg-field-error`; `.coupon-*` | Errors (`site:src/styles/global.css:1324-1328,1356`); coupon applied (`:1552-1560`) |
| `#014421`; `#FEE715` | constants, not classes | Green: ticket PNG, card PDF (`site:src/lib/participation-card-pdf.js:1`), on-screen chest number, Razorpay Checkout theme. Yellow: ticket PNG only (`site:src/lib/generate-ticket.js:74-75`). This is the admin palette (§9.5) |
| Inline hex | none | Booking-status pills and price notices are `style` props (`site:src/components/AccountPage.jsx:34-50`): the theme colours are not the whole palette |

- **Fonts.** `font-sans` = Plus Jakarta Sans (variable, weights 400-700); `font-serif` = Playfair Display (400 normal and italic only), used for headings (`.section-title`, `.hero-quote__text`, `.event-card__title`). Each is followed by its `Fallback` face, then Tailwind's default stack (`site:tailwind.config.mjs:9-14`).
- **Loading.** Self-hosted woff2 in `site:src/assets/fonts/`, declared with `font-display: swap` (`site:src/styles/global.css:15-38`). Only the body font is preloaded, through a `?url` import so the preload names the same hashed file as the `@font-face` (`site:src/layouts/BaseLayout.astro:3-5,50`). The `Fallback` faces are local Arial and Times New Roman resized with `size-adjust` (104.96%, 112.45%, italic 105.15%) plus ascent and descent overrides, so text barely moves on swap (`site:src/styles/global.css:39-67`).
- **Subset.** Every face has one `unicode-range`: Basic Latin, Latin-1, dashes, curly quotes, bullet, ellipsis, the rupee sign, minus (`site:src/styles/global.css:5-11,21`). Malayalam, arrows and emoji fall to system fonts by design; another script needs new font files. The ticket PNG (Arial, Courier New) and the card PDF (jsPDF `helvetica`, `courier`) do not use the web fonts.
- **Breakpoints.** Tailwind defaults; only `sm:` 640, `md:` 768 and `lg:` 1024 appear in `site:src`. `site:src/styles/global.css` adds max-widths 1024, 768, 767, 640, 480, 440, min-widths 480, 640, 900, 1024 and max-heights 900, 650, 460 (events slide only, `:994,1013,1051`). JS repeats 640 (nav, `site:src/components/SiteNav.astro:79`), 768 (hero, §8.1) and 899 (partners, `site:src/components/BrandPartners.jsx:22`).
- **Radii, shadows, stacking.** Radii: `999px` pills, `50%` circles, `1.5rem` panels, `1.25rem` cards and skeletons, `1rem` detail poster and ticket card, `0.65rem` inputs, `20px` coverflow card, `14px` dropdown, `8px` runner tile. Shadows: card `0 4px 24px rgba(0,0,0,0.25)`, hover `0 8px 32px rgba(0,0,0,0.35)` (`site:src/styles/global.css:897,903`); dropdown `0 10px 36px rgba(0,0,0,0.5)` (`:841`); coverflow `0 18px 40px -18px rgba(0,0,0,0.7)` (`:549`). `z-index`: dropdown 200, nav bar 100, photo lightbox 100 (inline), pager dots 90, repay dialog 60 (inline, so it sits under the nav).
- **Keyframes** in `site:src/styles/global.css`: `fade-up` (`:654`; hero copy `1.2s ease backwards`, Tailwind `animate-fade-up` = `0.9s ease forwards`), `chevron-cascade` (`:748`, 1.5 s ease-in-out infinite), `scroll-clients-horizontal` (`:419`, 42 s linear infinite), `scroll-past-horizontal` (`:500`, 60 s linear infinite), `dropdown-in` (`:845`, 0.18 s), `spin` (`:1311`, 0.7 s linear infinite). Both marquees end at `translateX(-50%)` because the list is rendered twice. CSS custom properties: only `--cf-w` and `--cf-dim` (`:520-524,593`). One duplicate outside the stylesheet: the sign-in spinner page defines its own `spin` (`site:src/pages/auth/complete.astro:25-38`).

### 9.2 Customer site CSS conventions

- **One stylesheet.** `site:src/styles/global.css` (1651 lines) is imported once, by the layout (`site:src/layouts/BaseLayout.astro:2`). It opens with the three `@tailwind` directives because the integration runs with `applyBaseStyles: false` (`site:astro.config.mjs:27`). No CSS modules, no `@apply`, no `@layer`, no CSS-in-JS. The only scoped `<style>` is the spinner in `site:src/pages/auth/complete.astro`.
- **Split of work.** Tailwind utilities do layout, spacing and type in the markup. Anything with states, pseudo-elements, media queries or animation is a named class in `site:src/styles/global.css`. One-off values go in an inline `style`, which the `.jsx` islands use heavily.
- **Class names** are BEM-like, `block__element--modifier`, one prefix per feature: `fp-` (full-page pager); `hero-`, `nav-chevron` (hero); `hero-video__menu*`, `topbar-*`, `hero-logo-link*`, `profile-menu-wrap`, `mobile-nav-dropdown*` (the nav bar of every page); `section-title`, `section-subtitle`; `partners-section`, `client-carousel*` (partners); `past-runner*`; `past-cf*` (coverflow); `event-card*`, `event-card-skeleton*`, `home-events-*`; `event-detail*`, `event-gallery__*`; `reg-*`, `fee-breakdown*`, `coupon-*`; `auth-*`; `account-*`, `my-ticket*`; `spinner`. Three event-page classes carry no prefix: `back-link`, `badge-featured`, `event-meta`. State classes are toggled from JS: `is-current` (slide on screen), `is-active` (pager dot, centre card), `is-near` (coverflow card with its own layer), `is-open` (mobile menu).
- **Tailwind config**: no plugins, no custom breakpoints, `content` = `./src/**/*.{astro,html,md,mdx,js,ts,jsx,tsx}` (`site:tailwind.config.mjs:6,28`). Add a theme colour only when utilities need it; the stylesheet writes hex values directly.
- **Global link colour.** `a { color: #9bca3b }`, `a:hover { color: #ffffff }` (`site:src/styles/global.css:149-155`). A link on a light or accent background needs an explicit override, as `hover:text-primary` in `site:src/pages/404.astro:15`.
- **Never put `overflow-x: hidden` on `body`.** Why: `body` would become a scroll container and the event page's sticky poster would stick to it instead of the window. Sideways overflow is stopped on `html` and by `overflow-x: clip` on `main` (`site:src/styles/global.css:76-81`, `site:src/layouts/BaseLayout.astro:66`). For the same reason, no inline `position` on `.event-detail__poster` (`site:src/components/EventDetail.jsx:79-80`).
- **Home slides.** A new endless animation must join the pause selector at `site:src/styles/global.css:118`, or it keeps running off screen. Islands placed directly in `.fp-section` rely on `.fp-section > astro-island > *` (`site:src/styles/global.css:109-114`), because `astro-island` renders as `display: contents`. Other slide rules: §8.1.

### 9.3 Customer site reusable components

| Component | File | Props (default) | Used by |
|---|---|---|---|
| `BaseLayout` | `site:src/layouts/BaseLayout.astro:7-18` | `title`, `description`, `image` (`/meta-share.jpg`), `canonical` (`false`), `noindex` (`false`); slots: default, `head` | Every page |
| `SiteNav` | `site:src/components/SiteNav.astro:11-17` | `links` (Events `/events`, Connect `/#connect`), `avatarHref` (`/login`); default slot beside the logo | Every page except `/login`, `/auth/complete`, 404 |
| `ApiPrefetch` | `site:src/components/ApiPrefetch.astro:12` | `paths` (`[]`), `eventSlug` (`false`) | `/`, `/events`, `/events/detail`, always in the `head` slot |
| `EventCard` | `site:src/components/EventCard.jsx:12` | `event`, `linkable` (`true`), `layout` (`"vertical"`, or `"horizontal"`), `imgWidth` (`600`), `eager` (`false`), `priority` (`false`) | `EventsList`, `HomeEvents` |
| `VerifyFailed` | `site:src/components/VerifyFailed.jsx:9` | `message`, `paymentId`, `onRetry`, `retrying` (`false`), `accountLink` (`true`) | `RegistrationForm`, `AccountPage` |
| `RegistrationForm` | `site:src/components/RegistrationForm.jsx:248` | `event`, `onEventStale` | `EventDetail` |
| `HomeEvents` | `site:src/components/HomeEvents.jsx:11` | `onResult("some", "none" or "error")`, `fitKey` | `HomeEventsSection` |
| `PastEventsRunner` | `site:src/components/PastEventsRunner.jsx:49` | `variant` (`"runner"`; also `"coverflow"` or `null`), `onPosters(count)` | `HomeEventsSection` |
| `PastEventsCoverflow` | `site:src/components/PastEventsCoverflow.jsx:38` | `posters`: events with `id`, `slug`, `name`, `bannerImageUrl` | `PastEventsRunner` |
| Page islands | `site:src/components/`: `HomeEventsSection`, `BrandPartners`, `EventsList`, `EventDetail`, `AccountPage`, `AuthForm` (`.jsx`) | none | One page each (§6.3) |

- `EventCard`: the root is an `<a>` to `/events/detail?slug=` when `linkable`, else a `<div>` with `event-card--static`; `priority` implies `eager` and adds `fetchPriority="high"`; with `linkable={false}` and a `venueLink` the venue text becomes an external link (`site:src/components/EventCard.jsx:20-33,64-66`). The slug is interpolated raw there (`:22`) and at `site:src/components/PastEventsRunner.jsx:117`, but encoded at `site:src/components/PastEventsCoverflow.jsx:233`: safe only while slugs stay URL-safe.
- `SiteNav` uses fixed element ids, so one per page. `/login` carries a hand-copied nav (`site:src/pages/login.astro:11-25`): change the logo or brand in both. The inner-page footer is likewise copied into `about`, `privacy` and `terms`.
- Each `.jsx` file has one default export; helpers stay file-local (`Section`, `Skeletons`, `ImageGallery`, `GalleryArrow`, `StatusBadge`, `RepayPanel`, `TicketCard`, `TicketSuccess`, `CompleteProfileStep`). Islands share no React state (§6.4).

### 9.4 Images and media rules

- **Helper.** `optimizeCloudinary(url, width = 600)` inserts `c_limit,f_auto,q_auto,w_<width>` after the first `/upload/`. It returns the URL unchanged when it is falsy, not on `res.cloudinary.com/`, or already holds `/upload/f_` or `/upload/c_limit,` (`site:src/lib/image.js:8-12`). `cloudinarySrcSet(url, widths)` gives `"<url> <w>w, ..."`, or `undefined` when the URL cannot be resized (`:19-22`). Tests: `site:tests/lib/image.test.mjs`.
- **Why these transforms.** `c_limit` never scales an image up. There is no `dpr_auto` on purpose: pick a width that already covers dense screens (about 2 to 3 times the slot) or use a `srcSet` (`site:src/lib/image.js:4-6`). A URL carrying any other leading transform gets a second one chained in front; a non-Cloudinary URL passes at full size.

| Caller | Width requested | Slot | Loading |
|---|---|---|---|
| `EventCard` on `/events` | 600 | 4:5 card poster | Lazy; the first 2 of Featured and of Upcoming eager; Featured's first `fetchPriority="high"` (`site:src/components/EventsList.jsx:101-107`) |
| Home slides: `EventCard`; `PastEventsRunner`; `BrandPartners` | 360; 400; 192 | 110-160 px poster; tile up to 190 px; 96 px logo | Lazy (off screen at load) |
| `PastEventsCoverflow` | `src` 640; `srcSet` 360, 480, 640; `sizes="(min-width: 640px) 400px, 64vw"` | Centre card up to 400 px | Eager within 2 of the centre, else lazy; `fetchPriority` `auto` centre, `low` others; no `src` until within 3 |
| `EventDetail` gallery | 900 inline, 1400 zoomed | Poster, lightbox | Inline poster eager, `fetchPriority="high"` (`site:src/components/EventDetail.jsx:84-90`); the zoomed image loads when the lightbox opens |
| Ticket banner on screen; ticket PNG | 600; 804 (`site:src/lib/generate-ticket.js:69`) | Ticket card; 402 px canvas box | Lazy; canvas image with `crossOrigin = "anonymous"` |

- **Every `<img>` in the page flow carries intrinsic `width` and `height`, and every Cloudinary one `decoding="async"`**: cards and ticket banners 480 x 600, runner 200 x 267, coverflow 400 x 500, logos 96 x 96, detail 900 x 1125, nav logo 38 x 38. Why: the box is reserved before the image arrives (no layout shift). The one exception is the zoomed lightbox image, a fixed overlay sized by inline `style` (`site:src/components/EventDetail.jsx:117-129`). `priority` is meant for the one poster likely to be the page's largest paint (`site:src/components/EventCard.jsx:9-10`); anything on home slides 2 to 4 stays lazy.
- **Static files.** The nav logo is imported with `?url` from `site:src/assets/` (hashed name). `site:public/` holds the icons, the share image, `robots.txt` and `brand_logo.avif`, which only the ticket canvas loads (`site:src/lib/generate-ticket.js:70`).
- **Video.** Both hero `<video>` tags carry only `data-src` and `data-poster`, with `preload="none" muted loop playsinline` (`site:src/pages/index.astro:47-64`). A script gives a `src` to the one clip for the current breakpoint, so the hidden clip is never fetched. Transforms: clip `f_auto,q_auto:eco,vc_auto,w_<720 or 1280>` as `.webm`; poster `so_1,f_auto,q_auto,w_<w>` as `.jpg` (frame at 1 s, because the first frame can be black) (`:10-16`). The poster is preloaded per breakpoint; on Save-Data or 2G only the poster shows (**unverified** on a device; `navigator.connection` is missing in Safari and Firefox, where the clip always loads). Full rules: §8.1.
- **Why the Astro image service is passthrough.** Nothing uses `astro:assets`. With `passthroughImageService()` and no remote patterns, `/_image` cannot fetch and re-encode outside images with sharp (`site:astro.config.mjs:29-34`); production answers 403 there (§4.5). Do not add `<Image>` or `getImage()`.

### 9.5 Admin UI foundation

- **Stack.** Tailwind 3 with shadcn/ui: style `default`, `rsc: true`, base colour `neutral`, CSS variables (`admin:components.json:3-10`), Radix primitives, `lucide-react` icons, `cn()` = `twMerge(clsx())` (`admin:src/lib/utils.ts:4-6`). Light theme only: `darkMode: ["class"]` is set but no dark tokens exist. `plugins: []` (`admin:tailwind.config.ts:77`): without `tailwindcss-animate`, dialogs and menus have no enter or exit animation. Breakpoints: sidebar from `lg`, bottom bar below it (`admin:src/components/admin/sidebar.tsx:18,75`); participants switch between list and table at `md`.
- **shadcn files**, 19 in `admin:src/components/ui/`: `alert-dialog`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `native-select` (project-specific), `scroll-area`, `select`, `separator`, `skeleton`, `sonner`, `switch`, `table`, `textarea`.
- **Local deviations.** `button` and `badge` variants hard-code `#014421`, `#FEE715`, `#DC2626` (`admin:src/components/ui/button.tsx:11-16`, `admin:src/components/ui/badge.tsx:10-17`). `badge` adds `success`, `warning`, `info`, `muted`; `warning` and `info` are the same class string, so they look identical. Button sizes: default `h-10`, `sm` `h-9`, `lg` `h-11`, `icon` 10 x 10. Literal hex in class names (`bg-[#014421]`) is the house habit; the `brand.*` Tailwind colours exist but no class uses them.

| CSS variable (`admin:src/app/globals.css:6-41`) | HSL value | Role |
|---|---|---|
| `--background`, `--card`, `--popover`, `--secondary`, `--accent` | `54 99% 54%` (`#FEE715`) | Yellow page, cards, popovers, highlights |
| every `--*-foreground` except the two below, `--border`, `--input` | `0 0% 0%` | Black text and borders |
| `--primary`, `--ring` | `149 97% 13%` (`#014421`) | Dark green buttons, checks, focus ring |
| `--primary-foreground`, `--destructive-foreground` | `0 0% 100%` | White text on green and red |
| `--muted`; `--destructive` | `54 99% 45%`; `0 72% 51%` (`#DC2626`) | Darker yellow for skeletons and menu dividers (the `separator` component uses `--border`); danger |
| `--radius` | `0.5rem` | `lg`; `md` is 2 px less, `sm` 4 px less (`admin:tailwind.config.ts:53-57`) |

- **Other global CSS and font.** Placeholder text forced to `hsl(0, 0%, 45%) !important`; autofill background repainted yellow; utilities `.sidebar-item-active`, `.sidebar-item-hover`, `.no-scrollbar` (`admin:src/app/globals.css:54-85`). Font: Inter through `next/font/google`, `subsets: ["latin"]`, `variable: "--font-inter"`, `display: "swap"` (`admin:src/app/layout.tsx:6-10`); `fontFamily.sans` = `var(--font-inter), system-ui, sans-serif`.
- **Rupee.** Render the sign with `<Rupee />` and amounts with `<Amount value={n} />` (`admin:src/components/shared/rupee.tsx:7-19`); `formatAmount` uses `en-IN` grouping with 0 to 2 decimals (`admin:src/lib/utils.ts:45-53`). Why: Inter's latin subset has no rupee sign, so a raw one makes the browser fetch the latin-ext font file (85 KB per the comment, not measured). `admin:src/components/events/event-form.tsx` still holds raw signs on 8 lines.
- **Native select versus Radix.** `NativeSelect` (extra prop `wrapperClassName`) serves the two filter bars: no extra JS, and phones open their own picker (`admin:src/components/ui/native-select.tsx:10-13`). Radix `Select` is used only in the event form, Radix `DropdownMenu` only in `admin:src/components/admin/admin-table.tsx`. The header profile menu is a hand-built disclosure because the Radix dropdown "cost ~20 KB of JS on every admin page" (`admin:src/components/admin/header.tsx:61-66`).
- **Toasts.** sonner `Toaster`: `theme="light"`, `position="top-right"`, `richColors` (`admin:src/components/ui/sonner.tsx:10-23`). It is mounted only in `admin:src/app/admin/layout.tsx:31-32` to keep it out of the login page's JS, so a `toast()` on `/login` shows nothing.
- **Loading.** A `loading.tsx` sits in `admin:src/app/admin/` (the default: `PageHeaderSkeleton` + `TableSkeleton rows={6} cols={1}`) and in its `dashboard/`, `events/[id]/edit/`, `events/[id]/participants/`, `admins/` and `settings/` folders. Events and logs wrap their list in `<Suspense key={JSON.stringify(params)}>` (`admin:src/app/admin/events/page.tsx:112`, `admin:src/app/admin/logs/page.tsx:99`), so a new filter or page shows the skeleton, not stale rows. Skeletons mirror the real layout so nothing shifts.
- **Errors.** `admin:src/app/admin/error.tsx` keeps the nav. It treats `/unauthori[sz]ed/i` in `error.message` as an ended session and pushes `/login` (`:21-27`; **unverified** in production, where Next may hide server messages); retry is `router.refresh()` then `reset()` (`:29-35`); it prints `error.digest`. `admin:src/app/global-error.tsx` replaces the root layout: own `<html>`, inline styles, because the stylesheet may be missing (`:5-9`). `admin:src/app/admin/not-found.tsx` exists; there is no root `not-found.tsx`.

| Shared component | Props (default) |
|---|---|
| `ConfirmDialog` (`admin:src/components/shared/confirm-dialog.tsx:17-43`) | `title`, `description`, `onConfirm` (sync or async), `trigger?`, `open?`, `onOpenChange?`, `onCloseAutoFocus?`, `confirmLabel` (`"Confirm"`), `cancelLabel` (`"Cancel"`), `variant` (`"destructive"`) |
| `Pagination`, `TableEmpty` (`admin:src/components/shared/data-table.tsx:7-12,102-110`; the file holds no table) | `page`, `totalPages`, `baseUrl`, `searchParams` (`{}`); renders nothing when `totalPages <= 1`. `message` (`"No records found"`), `description` (`"Try adjusting your search or filters."`) |
| `ImageUpload`; `MultiImageUpload` (`admin:src/components/shared/image-upload.tsx:12-18`, `admin:src/components/shared/multi-image-upload.tsx:11-18,43`) | `value?`, `onChange(url, publicId)`, `onClear?`, `disabled?`, `className?`; `images: {url, id}[]`, `onAdd(images)`, `onRemove(index)`, `disabled?`, `max` (`10`), `className?` |
| `TableSkeleton`, `FormSkeleton`, `DashboardSkeleton`, `StatsCardSkeleton`, `PageHeaderSkeleton` (`admin:src/components/shared/skeleton-loaders.tsx`) | `rows` (`5`), `cols` (`5`), `toolbar` (`true`); `fields` (`6`); `cards` (`5`, or `4`); none; none |
| `StatsCard` (`admin:src/components/admin/stats-card.tsx:6-26`) | `title`, `value`, `icon`, `description?`, `className?`, `iconClassName?`; `trend` is declared but ignored |

### 9.6 Coding conventions, both repos

| Topic | SITE | ADMIN |
|---|---|---|
| Language | Plain JavaScript ES modules with JSDoc. No `.ts` is tracked. Why: `node --test` runs the real source files (§13.5) | TypeScript, `strict`, target `ES2022` (`admin:tsconfig.json:6,23`) |
| File names | Components `PascalCase.jsx` and `.astro`; `site:src/lib` `kebab-case.js`; route files `.js` exporting `GET`, `POST`, `ALL`; tooling `.mjs`, except `site:eslint.config.js` and `site:postcss.config.cjs`; tests `site:tests/<area>/<name>.test.mjs` | Everything kebab-case, with layer suffixes `*.actions.ts`, `*.service.ts`, `*.repository.ts`, `*.validator.ts`, `*.types.ts`; tests `admin:test/<theme>.test.ts`, grouped by theme, not by source file |
| Exports | One default export per component; `site:src/lib` uses named exports | Named exports (components in PascalCase); default exports only where a tool demands one (Next `page`, `layout`, `loading`, `error`, `not-found`, `global-error`, `admin:src/middleware.ts`, configs) |
| Formatting | Double quotes, semicolons, 2 spaces; unused names start with `_` | Double quotes, no semicolons, 2 spaces; unused names start with `_`, fields are dropped with rest destructuring |
| Imports | Relative, with the file extension (`"../lib/image.js"`). Why: Node's ES module loader, which the tests use, needs it | Alias `@/*` = `admin:src/*` (`admin:tsconfig.json:20-22`); `import type` for types; only `admin:auth.config.ts` at the root is reached by `../` |
| Server versus client | No marker. Server-only: `site:src/pages/api/**` and the `site:src/lib` modules only they import (`backend`, `mailer`, `otp`, `google-oauth`, `rate-limit`, `http`, `edge-cache`, `ticket-mail`). Never import one from an island or a page `<script>`: its env reads would land in the browser bundle, which `site:tests/mail/client-bundle.test.mjs` scans after a build | Server Components by default; `"use client"` heads 41 files; `"use server"` heads the six `admin:src/actions/*.actions.ts`; the `server-only` package is not used |
| Env | `import.meta.env.NAME ?? process.env.NAME` with the literal name, server code only (§6.7) | Parsed once with zod: import `env` from `admin:src/lib/env.ts:3-9`. Razorpay keys, `RAZORPAY_WEBHOOK_SECRET`, `NODE_ENV` and `SERVER_TIMING` are read from `process.env` where used (§10.5) |
| Error shape | Browser helpers never reject: `{ ok, status, data }` (§6.5). Routes answer with `jsonOk` or `jsonErr`: `{ success: true, ...data }` or `{ success: false, error, ...extra }`, always `Cache-Control: no-store`, optional `Retry-After` (`site:src/lib/http.js:3-15`) | Actions return `ActionResult<T>` = `{ success: true, data }` or `{ success: false, error }` (`admin:src/types/index.ts:5-7`). Services throw `Error`; actions copy `error.message` into the result. A refusal a caller must recognise uses an exported message constant (`EVENT_FULL`, `PHONE_ALREADY_REGISTERED`, `SLUG_IN_USE_MESSAGE`), which the caller compares as a string. Public envelope: §7.1 |
| Calling side | Test `ok` and `status`; a `try/catch` around a helper is dead code | Wrap each action call in `try/catch` and toast `ACTION_FAILED_MESSAGE` on a throw (`admin:src/constants/index.ts:30-31`); `isChunkLoadError` spots a failed lazy chunk (`admin:src/lib/utils.ts:59-65`) |
| Logs | `[area]` prefix (`[proxy]`, `[backend]`, `[send-otp]`, ...), `err?.message` only, never request data | Same style: `[env]`, `[index-guard]` |
| Dates | `formatDateShort`, `formatDateMedium`, `formatDateFull`: `en-IN`, `timeZone: "Asia/Kolkata"`, formatters built once (`site:src/lib/format-date.js:7-33`) | `formatDate`, `formatDateTime`: `en-US` `formatToParts` in `Asia/Kolkata`, joined by hand (`admin:src/lib/utils.ts:8-43`) |

- **Dates, why.** Functions run in UTC while events and staff are in IST, so every display format names the zone; never call `toLocale*` on an event date. The admin joins the parts by hand because `en-IN` separators differ between Node and browsers (`admin:src/lib/utils.ts:10-11`). One exception still unfixed: `admin:src/actions/participant.actions.ts:324-328`. Time and money rules: §6.9.
- **Comments record why**, usually naming the failure or incident behind the rule; script and test files open with a block stating the rule; test titles are full sentences. Neither `src` tree holds a `TODO`, `FIXME` or `HACK`: open work goes to §17. Comments are mostly in British spelling ("centre", "colour"); identifiers keep what exists (`Enroll*`). There is no formatter, git hook or CI (§13.3): match the surrounding file by hand, line endings included (§13.7).
- **Browser-run admin code imports Prisma enums as types only.** Why: a value import pulls the Prisma browser runtime, about 16 KB gzip per the comment, into the form bundle (`admin:src/validators/event.validator.ts:5-9`). The same idea keeps the scanner library out of shared chunks: `admin:src/lib/gate-scanner.ts:1-6` imports its types only.
- **Site decisions live in `site:src/lib`** as pure functions so `node --test` can run them; `.jsx` and `.astro` files are never executed by a test. Inline (`is:inline`) scripts are shipped as written and cannot import; a plain `<script>` is bundled.
- **Lazy loading, SITE.** jsPDF arrives only through `import("jspdf")`, about 130 KB gzip per the comment, warmed by `warmParticipationCardPdf()` (`site:src/lib/participation-card-pdf.js:3-27`); a static import fails the budget test. Razorpay Checkout is a script tag added by `loadRazorpay()` when the order summary appears, `LOAD_TIMEOUT_MS = 15000` (`site:src/lib/razorpay.js:8-41`). Home islands below the fold use `client:idle={{ timeout: 1500 }}`; inner pages `client:load`.
- **Lazy loading, ADMIN.** Anything behind a dialog or one role loads with `next/dynamic` and `ssr: false`, or a bare `import()`: `EnrollDialog`, `ParticipantForm` (through `LazyParticipantForm`), `ImportParticipantsForm`, `LogoCropDialog`, the scanner, `react-qr-code`, `xlsx`, `jspdf`. Warm a chunk with `import(...).catch(() => {})` once its trigger is likely (`admin:src/components/events/event-table.tsx:32-37,58-59`). Rarely opened links set `prefetch={false}` (`admin:src/config/nav.ts:19-20,60`, `admin:src/components/admin/header.tsx:141,148`). Server work that must not delay a response runs in `after()`. Guard: §13.4.

### 9.7 Misspelled-but-real names

Never "correct" any of these. Renaming one breaks a wire contract, stored data or a script lookup.

| Name | Where | Why it must stay |
|---|---|---|
| "Ulsaham Entertainments" (one a) | `site:src/layouts/BaseLayout.astro:8`, `admin:src/constants/index.ts:1`, all visible copy | Client brand; fixed app-wide in `3edf8f2` (2026-06-08). "Ulsaaham Celebrations" in `root:README.md:1,3` is the stale older brand: never copy it into UI |
| `ulsaaham.com` (double a) | `site:astro.config.mjs:8,16-17`, `admin:src/lib/env-schema.ts:32`; placeholder `ulsaaham.invalid` at `site:src/lib/next-path.js:5` | The registered domain: canonical URLs, allowed hosts, default `SITE_URL` |
| `ulsaham-admin-panel.vercel.app` (one a) | `site:astro.config.mjs:40`, `site:src/lib/backend.js:13`, `site:tests/lib/backend-url.test.mjs:28`; `admin:.env.example:7,43` | The real admin host (three copies in the SITE repo, §6.7) |
| `far-fusion`; `web-app`; `ulsaham-admin` | folder `root:apps/site/far-fusion`, `site:package.json:2`, `root:vercel.json` build command; `root:package.json:2`; `admin:package.json:2` | Package names. The build command hard-codes the folder path. `far-fusion` is unrelated to the brand; its origin is unknown |
| `ulsaham_user`, `ulsaham_accounts`, `ulsaham_pending_payment`; `ulsaham_user_enrollments` | `site:src/lib/auth.js:1,5`, `site:src/lib/pending-payment.js:9`; `admin:src/components/events/event-table.tsx:49` | localStorage keys. A rename signs every visitor out and orphans pending payments (§6.4); the admin key holds the per-device "Enrolled" flags of counter staff |
| `otp_session`, `g_oauth_nonce`, `google_auth_result` | `site:src/lib/otp.js:64`, `site:src/lib/google-oauth.js:8`, `site:src/lib/google-complete.js:8` | Cookie names carry no brand prefix. The last is also a literal at `site:src/pages/api/auth/google/callback.js:80` |
| `window.__ulsPre`, `window.ulsHero` | `site:src/components/ApiPrefetch.astro:16`, `site:src/pages/index.astro:107` | Globals shared by inline scripts and bundled code; tests name `__ulsPre` |
| `x-ulsaham-timestamp`, `x-ulsaham-signature` | `admin:src/lib/site-ticket-mail.ts:42-43`, `site:src/pages/api/internal/ticket-mail.js:31-32` | Wire names shared by both repos (§7.5) |
| `ulsaham:<limiter>`, `ulsaham:job:<name>` | `admin:src/lib/ratelimit.ts:30-129,175` | Upstash key prefixes: a rename resets every rate-limit window and job throttle |
| `ulsaham/events`, `ulsaham/brand-partners` | `admin:src/constants/index.ts:4-5` | Cloudinary folders that hold the existing uploads |
| `Admin`, `Event`, `Participant`, `Settings`, `ActivityLog`; index `Participant_eventId_phone_key` | `admin:prisma/schema.prisma:10,27,108,167,184`, `admin:src/lib/index-guard.ts:5,67` | No `@@map`, so each model name is the MongoDB collection name; the guard lists indexes of `"Participant"` by that literal. The `_key` name is the legacy unique index of the 2026-10-04 incident (§11) |
| `#gallery`, `#testimonials`, `#connect` | `site:src/pages/index.astro:186,198,263`, `site:src/components/BrandPartners.jsx:42` | Events, partners and connect slides: keys of `anchorIndex`; `/#connect` is linked from other pages |
| `.hero-video__menu*`, `#hero-auth`, `client-carousel*` | `site:src/components/SiteNav.astro:21,32-35`, `site:src/styles/global.css:186-231,330-426` | The nav bar on every page, the account avatar, the partners strip: scripts and CSS look them up |
| `amountPaid` | `admin:prisma/schema.prisma:120,135` | A Boolean, "is settled"; the money is `amountPaidPaise` |
| `Participant`, `numberOfParticipants` | `admin:prisma/schema.prisma:108-116` | A booking (one ticket, 1 to 10 seats) and its seat count, not a person |
| role `USER`; `adminUsername`, `adminRole`; `ADMIN_CREATED` | `admin:src/constants/index.ts:54,86-92`, `admin:src/actions/admin.actions.ts:58-66` | `USER` is counter staff, not a customer. Log fields cover every role and `SYSTEM`; creating a `USER` also logs `ADMIN_CREATED` |
| `ANNOUNCED` | `admin:src/repositories/event.repository.ts:9-10` | Means draft: not in the statuses the public site may see |
| `competitionNumber` | `admin:src/constants/index.ts:14-15`, `site:src/lib/participation-card-pdf.js:39` | The "chest number" (`chestNumber` in PDF data); such a booking is an "entry card" with a "Reference Code" |
| `Enroll*`, `scanAttendanceAction`, `data-table.tsx`, `MobileNav`, `/admin/admins`, `DollarSign` | `admin:src` (§8.10-8.19): `admin:src/actions/participant.actions.ts:195,232`, `admin:src/components/shared/data-table.tsx`, `admin:src/components/admin/sidebar.tsx:70`, `admin:src/app/admin/admins/page.tsx:7,22`, `admin:src/components/events/event-table.tsx:170` | In order: US spelling against "enrol" in comments; only looks a ticket up (`confirmEntryAction` writes); holds no table; lives in `sidebar.tsx`; page titled "Accounts"; icon shown beside rupee amounts |
| `TICKET_CODE_PREFIX` = `"UE"`; `brand_logo_440.avif` | `admin:src/constants/index.ts:3`, `admin:next.config.ts:42-43` | Prefix of every issued ticket code; the width in the file name is its cache version |
| `apply-coupon`, body key `couponCode` | §7.3 | Serves coupons and complimentary codes alike; the UI says "promo code" |
| "booking" in copy, "ticket" in code | `my-ticket*`, `ticketCode`, `ticket-<code>.png` (`site:src/components/AccountPage.jsx:284,331`, `site:src/lib/generate-ticket.js:133`) | Only user-facing wording changed (`7116953`, 2026-06-12); "Download Ticket" and "EVENT TICKET" remain |
| `site:tests/mail/support/` | all 25 SITE test files import from it | Holds the helpers of every test area, not only mail (§13.5) |

### 9.8 Accessibility and performance rules

| Rule the code encodes | Where | Why |
|---|---|---|
| The pager never hijacks zoom: a `ctrlKey` wheel, two fingers, or `visualViewport.scale > 1.01` are left to the browser | `site:src/pages/index.astro:313-324,342-365` | A zoomed visitor must be able to pan |
| Focus repairs the pager: a scroll of the clipped boxes is undone and `focusin` on another slide moves the pager there | `site:src/pages/index.astro:408-430` | Tabbing would leave slides half shifted |
| Coverflow: `role="region"`, `aria-roledescription="carousel"`; only the centre card is tabbable; focus follows it; focus pauses auto-scroll and turns on `aria-live="polite"` only when it is `:focus-visible` | `site:src/components/PastEventsCoverflow.jsx:137-142,201-210,243-245,267-269` | A mouse click also focuses the link, so plain focus must not stop the carousel |
| Marquee copies are `aria-hidden` and are not links | `site:src/components/PastEventsRunner.jsx:115-117`, `site:src/components/BrandPartners.jsx:71` | The list is rendered twice for the loop |
| Visible focus rings (`outline: 2px solid #9bca3b`); labelled icon controls (`aria-label`, `aria-expanded`, `role="menu"`); `role="alert"` and `role="status"` on payment states | `site:src/styles/global.css:227-231,608-611`, `site:src/components/SiteNav.astro:35-39,82`, `site:src/components/VerifyFailed.jsx:11` | Keyboard and screen-reader use |
| First reads start in the `head`, before the stylesheet | `site:src/components/ApiPrefetch.astro:2-7` | They overlap the island JS download; an inline script after the CSS would wait for it |
| Off-screen home islands hydrate at idle, 1500 ms cap; endless animations pause on slides that are not current | `site:src/pages/index.astro:187-194`, `site:src/styles/global.css:115-120` | The hero settles first; every slide stays rendered |
| Coverflow: only cards within 3 of the centre get `will-change` and a poster; the lift animates `opacity` on `::before` only | `site:src/styles/global.css:557-583`, `site:src/components/PastEventsCoverflow.jsx:20-22,58-64` | Few layers and requests; no repaint of the card |
| `/events` shows its three first pages together; skeletons are sized like real cards | `site:src/components/EventsList.jsx:117-128`, `site:src/styles/global.css:1160-1162` | No layout shift |
| Pages are prerendered; `404` comes from the CDN; `/auth/complete` needs no function | `site:src/pages/404.astro:2-3`, `site:src/pages/auth/complete.astro:2-3` | No server time on page views |
| Images, fonts, video, lazy chunks | §9.1, §9.4, §9.6 | As stated there |
| ADMIN: long phone lists use `[content-visibility:auto] [contain-intrinsic-size:auto_62px]`; rows are memoised by value | `admin:src/components/participants/participant-table.tsx:89-97,117-120` | Every dialog's scroll lock otherwise lays out the whole list again |
| ADMIN: a disabled pagination step is a `<span aria-disabled="true">`; the phone bar is icons with `sr-only` labels and `aria-current="page"`; the header title is a `<p>` | `admin:src/components/shared/data-table.tsx:14-17`, `admin:src/components/admin/sidebar.tsx:98-103`, `admin:src/components/admin/header.tsx:48-49` | `disabled` does nothing on a link; each page has its own `h1` |
| ADMIN: the profile menu closes on Escape and returns focus; loading and error blocks carry `role="status"` and `role="alert"` | `admin:src/components/admin/header.tsx:61-66`, `admin:src/app/admin/loading.tsx:7`, `admin:src/app/admin/error.tsx:38` | A hand-built menu gets no keyboard handling for free |

- **Reduced motion, the deliberate exception.** No code in either repo reads `prefers-reduced-motion` (zero hits in `site:src`, `site:tests`, `admin:src`; no commit ever held it). For the home page past-events coverflow this is an owner decision of 2026-09-27 (§2.5, rule G32): it animates and auto-scrolls whatever the OS setting. Why: the owner's Windows has "Animation effects" off, so their Chrome reports `reduce`, and a carousel that honours it looks frozen to them. No comment or commit records this; it is written down only in this handbook.
- Everywhere else (marquees, hero `fade-up`, chevrons, the 0.8 s slide transition, `scroll-smooth`) the preference is ignored only because nobody added handling: a gap, not a decision. If handling is added, leave the coverflow out, and expect anything that honours the setting to look static on the owner's machine.
- **Gaps seen in the code, not decided**: no skip link; no Escape-to-close on the site's mobile menu; form inputs use `outline: none` with only a border-colour change (`site:src/styles/global.css:1350,1354`).

---

## 10. Admin panel and backend internals

The ADMIN repo is one Next.js App Router app with two jobs: the staff panel (`/admin/*`, `/login`) and the backend: the API the customer site calls (`/api/public/*`) and the webhook Razorpay calls (`/api/razorpay/webhook`). HTTP contracts are in §7, screens in §8.10-8.19, the schema in §11, versions in §4. A bare `:N` continues the file cited just before it.

### 10.1 Layering and request paths

Paths in the diagram are relative to `admin:`.

```
staff browser: page request, server-action call     customer site proxy, Razorpay: HTTP
  v                                                   v
src/middleware.ts -> authorized()                   (no middleware: the matcher skips these paths)
  v                                                   v
src/app/admin/**/page.tsx                           src/app/api/public/**/route.ts
src/actions/*.actions.ts                            src/app/api/razorpay/webhook/route.ts
src/app/api/admin/upload/route.ts                     |
  +--------------------------+------------------------+
                             v
  src/services/*.service.ts  ->  src/repositories/*.repository.ts  ->  src/lib/prisma.ts  ->  MongoDB
  (rules; uses src/lib/*)        (every Prisma query)
```

| Layer | Files | Belongs here | Does not belong |
|---|---|---|---|
| Middleware | `admin:src/middleware.ts`, `admin:auth.config.ts` | First gate by path and role; the 24 h session cap | Database access (`providers: []`, `admin:auth.config.ts:95`) |
| Pages | `admin:src/app/admin/**/page.tsx` | Server components: `auth()` + `redirect()` guard, reads, dropping fields a role must not receive, starting housekeeping with `after()` | Writes |
| Server actions | `admin:src/actions/*.actions.ts` | The staff write path: session, role check, zod parse, one service or repository call, `logActivity`, `revalidatePath`, an `ActionResult<T>` | Business rules, Prisma calls |
| Route handlers | `admin:src/app/api/**/route.ts` | HTTP only: CORS, rate limit, zod, status codes (§7) | Pricing or booking rules |
| Services | `admin:src/services/{event,participant,housekeeping}.service.ts` | Rules: booking creation, import, status sweep, image release, public allow-lists | Session or HTTP objects |
| Repositories | `admin:src/repositories/{admin,event,participant,settings,activity-log}.repository.ts` | Prisma queries, atomic updates, aggregates | Decisions that need the session |
| Validators, lib | `admin:src/validators/*.validator.ts`, `admin:src/lib/*` | zod schemas shared by forms, actions and routes; pure rules (pricing, coupon, event-time, event-status, ticket-code); integrations (auth, prisma, env, ratelimit, cloudinary, razorpay) | Page or action code |

- There is no admin REST API. Staff writes are server actions returning `ActionResult<T>` = `{ success: true, data }` or `{ success: false, error }` (`admin:src/types/index.ts:5-7`); the only staff HTTP routes are the upload route and the Auth.js handlers (§7.11).
- Layer exceptions as of 2026-10-11: accounts, settings and logs have no service, so `admin:src/actions/admin.actions.ts`, `admin:src/actions/settings.actions.ts` and several pages and routes call repositories directly (for example `admin:src/app/admin/logs/page.tsx:10`). Prisma is called outside the repositories in four files: `admin:src/lib/auth.ts:35,44`, `admin:src/lib/activity-logger.ts:24`, `admin:src/lib/index-guard.ts:67`, `admin:src/lib/server-timing.ts:50`.
- `findEventById` is wrapped in React `cache()`: one read per page render, a straight call in actions and routes; a malformed id returns `null` instead of throwing (`admin:src/repositories/event.repository.ts:12-28`).

### 10.2 Staff sign-in and sessions

| Item | Value | Where |
|---|---|---|
| Library | Auth.js v5 (`next-auth`, a pre-release), one Credentials provider with fields `username` and `password` | `admin:src/lib/auth.ts:20-28` |
| Config split | `admin:auth.config.ts` holds pages (`signIn` and `error` both `/login`), session, cookie and callbacks with no provider; `admin:src/lib/auth.ts` adds the provider. Why (inferred): the middleware bundle must not import Prisma or bcrypt | `admin:auth.config.ts:21-96` |
| Strategy and claims | `jwt`, no session collection in the database. Claims: `id`, `role`, `username`, `loginAt` (epoch ms) | `admin:auth.config.ts:26-29,70-76` |
| Session fields | `session.user.id`, `.role`, `.username`; `.name` also holds the username | `admin:auth.config.ts:86-93`, `admin:src/lib/auth.ts:57` |
| Lifetime | `maxAge` = `SESSION_MAX_AGE_SECONDS` = `24 * 60 * 60` s. Hard cap: the `jwt` callback returns `null` once `Date.now() - loginAt > 86 400 000` ms; exactly 24 h is still valid | `admin:auth.config.ts:19,28,82-83` |
| Cookie options | `httpOnly: true`, `sameSite: "strict"`, `secure` only when `NODE_ENV === "production"` | `admin:auth.config.ts:30-38` |
| Cookie name | Not set in code. The Auth.js default `authjs.session-token`, prefixed `__Secure-` over HTTPS, is **unverified** | n/a |
| Password hash | `bcryptjs`, cost 12 | `admin:src/actions/admin.actions.ts:18`, `admin:prisma/seed.ts:20` |

- **Why the 24 h cap:** the middleware re-issues the cookie with a fresh expiry on every request, so `maxAge` alone would let a busy session live forever, including one whose account was deactivated since (`admin:auth.config.ts:77-81`). A token issued before the rule gets `loginAt` stamped the first time it is seen. Pinned by `admin:test/auth-config.test.ts:91-148`.
- **Consequence:** role and identity live in the token and nothing re-reads the database. Deactivating, deleting or re-roling an account, or resetting its password, does not end its open session; it lasts until the cap (§17).

Login action, step by step:

1. `LoginForm` posts to `loginAction` (§8.10). The action reads `username` and `password` as strings, unchanged: no trim, no lower-casing (`admin:src/actions/auth.actions.ts:15-16`).
2. `signIn("credentials", { username, password, redirect: false })` (`:19-23`) runs `authorize()` (`admin:src/lib/auth.ts:29-58`).
3. zod requires both values non-empty, else `null` before any database call (`:30-31`). Then `prisma.admin.findUnique({ where: { username } })` (`:35`).
4. Unknown or inactive account: one `bcrypt.compare` against a fixed cost-12 hash, then `null` (`:36-39`; the constant at `:18` is a hard-coded bcrypt hash of a random string, not a credential). Why: a refusal must take as long as a wrong password, so timing does not reveal which usernames exist.
5. Wrong password: `null` (`:41-42`). Success: `lastLoginAt = now` (`:44`), activity row `LOGIN` (`:48-55`), return `{ id, name: username, email: null, role }`.
6. The `jwt` callback stamps the four claims (`admin:auth.config.ts:70-76`).
7. Errors mapped by the action (`admin:src/actions/auth.actions.ts:24-34`): `AuthError` of type `CredentialsSignin` -> "Invalid username or password."; any other `AuthError` -> "Authentication failed. Please try again."; anything else -> "An unexpected error occurred."
8. The role is read from the database with `findAdminRoleByUsername`, then `redirect()`: USER to `/admin/events`, every other role to `/admin/dashboard` (`:40-47`). Why not `auth()`: it reads the incoming request, which does not carry the cookie `signIn` just set. The same reason puts the `LOGIN` row inside `authorize()`. If the lookup throws, the redirect goes to the dashboard and the middleware sends a USER on.

- **Every later request:** the `jwt` callback applies the cap, the `session` callback copies `id`, `role`, `username` onto `session.user`, and `admin:src/app/admin/layout.tsx:9-13` redirects to `/login` when there is no session. **Sign-out:** the header menu posts a form to `logoutAction` (`admin:src/actions/auth.actions.ts:50-64`), which writes `LOGOUT` when a session exists, then calls `signOut({ redirectTo: "/login" })`.
- **Gaps:** no rate limit, no lockout and no log row for a failed sign-in. `/api/auth` is outside the middleware matcher and neither `loginAction` nor `authorize()` calls a limiter; only the bcrypt cost slows guessing (§17). With `sameSite: "strict"`, a link to the panel opened from another site or a mail should arrive without the cookie and show the login page first: **unverified** on a device.

### 10.3 Role matrix

All staff are rows of the `Admin` model with one `AdminRole` (`admin:prisma/schema.prisma:10-25`). Customers have no account in this database.

| Role | UI name | Created by | In short |
|---|---|---|---|
| `SUPER_ADMIN` | "Super Admin" | The seed only (§11.6). The UI cannot create, list, change or delete one (`admin:src/repositories/admin.repository.ts:6`, `admin:src/actions/admin.actions.ts:88-90,138-140,171-173`) | Everything |
| `ADMIN` | "Admin" | A SUPER_ADMIN on the Accounts page (default role, `admin:src/validators/admin.validator.ts:18`) | Dashboard without the revenue card, events (read), participants, logs, both scanners, attendance, complimentary bookings, export |
| `USER` | "Counter staff" in the header and the logs (`ROLE_LABELS`, `admin:src/constants/index.ts:87-92`); "User" on the Accounts page | Same | Only the events list, without seat counts, and counter enrolment: free events directly, paid ones through Razorpay (§8.15) |

Middleware outcome, then the page's own guard. "->" is a redirect: 302 from the middleware (`admin:test/auth-config.test.ts:58`), Next `redirect()` from a page. A signed-out request to any `/admin*` path goes to `/login`.

| Path prefix | SUPER_ADMIN | ADMIN | USER | Page guard |
|---|---|---|---|---|
| `/admin/dashboard` | allow | allow | -> `/admin/events` | `admin:src/app/admin/dashboard/page.tsx:27`; revenue card SUPER_ADMIN only (`:79-87`) |
| `/admin/events` | allow | allow | allow | Seat counts dropped for USER (`admin:src/app/admin/events/page.tsx:51-54`) |
| `/admin/events/new` | allow | -> `/admin/events` | -> `/admin/events` | `admin:src/app/admin/events/new/page.tsx:13` |
| `/admin/events/<id>/edit` | allow | -> `/admin/events` | -> `/admin/events` | `admin:src/app/admin/events/[id]/edit/page.tsx:20` |
| `/admin/events/<id>/participants` | allow | allow | -> `/admin/events` | `admin:src/app/admin/events/[id]/participants/page.tsx:30`; import dialog SUPER_ADMIN only (`:74`) |
| `/admin/events/<id>/scan` | allow | allow | -> `/admin/events` | `admin:src/app/admin/events/[id]/scan/page.tsx:21` |
| `/admin/scan` | allow | allow | -> `/admin/events` | `admin:src/app/admin/scan/page.tsx:10` |
| `/admin/logs` | allow | allow | -> `/admin/events` | `admin:src/app/admin/logs/page.tsx:82` |
| `/admin/settings` | allow | middleware allows; the page -> `/admin/events` | -> `/admin/events` | `admin:src/app/admin/settings/page.tsx:13` |
| `/admin/admins` | allow | middleware allows; the page -> `/admin/dashboard` | -> `/admin/events` | `admin:src/app/admin/admins/page.tsx:12-14` |
| Any other `/admin/*` | allow | allow | allow | Layout session check only |
| `/login` and `/`, signed in | -> `/admin/dashboard` | -> `/admin/dashboard` | -> `/admin/events` | n/a |
| `/api/admin/upload` | 200 | 200 | 403 from the route | The middleware lets every caller through (§7.11) |

- **Middleware:** `admin:src/middleware.ts:4` runs `authorized()` from `admin:auth.config.ts:40-69`. USER is blocked on `USER_RESTRICTED` = dashboard, scan, logs, settings, admins, each with its sub-paths (`:3-6`), and on `/admin/events/<id>/(edit|participants|scan)` (`:8`). Non-SUPER_ADMIN is blocked on `/admin/events/new` and `/admin/events/<id>/edit` (`:12-17`).
- **Matcher** (`admin:src/middleware.ts:8`): skips `api/public`, `api/auth`, `api/razorpay`, `_next/static`, `_next/image`, `favicon.ico` and every path ending `.png`, `.jpg`, `.svg`, `.avif`, `.webp` or `.wasm`. A new route whose last segment ends in one of those extensions gets no middleware check.
- **Pages:** each repeats its check with `auth()` + `redirect()`. **Actions:** each checks the role itself (§10.4). Why three lines: any signed-in browser can call any server action whatever page it can open, and the middleware alone lets ADMIN into Settings and Accounts. `admin:test/auth-config.test.ts:21-41` pins the matrix and fails when a new `page.tsx` under `admin:src/app/admin/` has no row (`:73-88`); its comment at `:30-31` says both pages send ADMIN to `/admin/events`, but the Accounts page sends to `/admin/dashboard`.

### 10.4 Server actions

Every file starts with `"use server"`. SA = SUPER_ADMIN, A = ADMIN, U = USER. P = `/admin/events/<eventId>/participants`.

| Action | File | Roles allowed | What it does | Activity-log entry | Revalidation |
|---|---|---|---|---|---|
| `loginAction(prev, formData)` | `admin:src/actions/auth.actions.ts:14` | public | §10.2 | `LOGIN`, written by `authorize()` | none; `redirect()` |
| `logoutAction()` | `admin:src/actions/auth.actions.ts:50` | public | Logs, then signs out | `LOGOUT` when a session exists | none |
| `createAdminAction(formData)` | `admin:src/actions/admin.actions.ts:28` | SA | `createAdminSchema`; refuses a taken username; cost-12 hash; creates an active `ADMIN` or `USER` | `ADMIN_CREATED` "Created user account: ..." or "Created admin account: ..."; `{ username }` | `/admin/admins` |
| `toggleAdminActiveAction(adminId, isActive)` | `admin:src/actions/admin.actions.ts:79` | SA | Sets `isActive`; refuses a SUPER_ADMIN target | `ADMIN_UPDATED` "Activated ..." or "Deactivated admin account: ..."; `{ isActive }` | `/admin/admins` |
| `resetAdminPasswordAction(formData)` | `admin:src/actions/admin.actions.ts:115` | SA | `resetPasswordSchema`; new hash; refuses a SUPER_ADMIN target | `ADMIN_UPDATED` "Reset password for admin: ..." | `/admin/admins` |
| `deleteAdminAction(adminId)` | `admin:src/actions/admin.actions.ts:165` | SA | Hard delete; refuses a SUPER_ADMIN target | `ADMIN_DELETED`; `{ username }` | `/admin/admins` |
| `createEventAction(data)` | `admin:src/actions/event.actions.ts:27` | SA | `createEventSchema`, then `createNewEvent` | `EVENT_CREATED`; `{ slug }` | `/admin/events` |
| `updateEventAction(data)` | `admin:src/actions/event.actions.ts:61` | SA | `updateEventSchema`, then `updateExistingEvent`; released images are queued (§10.6) | `EVENT_UPDATED` | `/admin/events`, `/admin/events/<id>/edit` |
| `deleteEventAction(id)` | `admin:src/actions/event.actions.ts:102` | SA | Deletes and redirects to `/admin/events`. An event with bookings is set to `CANCELLED` instead and returns `{ outcome: "cancelled" }` | `EVENT_DELETED`, or `EVENT_STATUS_CHANGED` "Cancelled event (n bookings, so not deleted): ..." with `{ newStatus: "CANCELLED", bookings }` | `/admin/events`; plus the edit page when cancelled |
| `toggleEventStatusAction(id, status)` | `admin:src/actions/event.actions.ts:151` | SA | `toggleEventStatus`; `COMPLETED` is refused unless the event has ended | `EVENT_STATUS_CHANGED`; `{ newStatus }` | `/admin/events` |
| `addParticipantAction(eventId, data)` | `admin:src/actions/participant.actions.ts:32` | SA, A; U only when the event is free (`isFree` or no `amount`) | `participantSchema`, then `registerParticipant` with `amountPaid: true`, `entryType: "COMPLIMENTARY"`, random ticket code | `PARTICIPANT_ADDED`; `{ eventId, phone }` | P |
| `updateParticipantAction(id, eventId, data)` | `admin:src/actions/participant.actions.ts:80` | SA | Edits `name`, `email`, `age`, `numberOfParticipants` only; seats cannot drop below `enteredCount` | `PARTICIPANT_UPDATED` | P |
| `deleteParticipantAction(id, eventId)` | `admin:src/actions/participant.actions.ts:125` | SA | Hard-deletes the booking; nothing else is cleaned up | `PARTICIPANT_DELETED` "Deleted participant ID: ..."; `{ eventId }` | P |
| `toggleAttendanceAction(id, eventId, attended)` | `admin:src/actions/participant.actions.ts:153` | SA, A | Mark: `attended: true`, `attendedAt: now`, `enteredCount` = all seats. Unmark: `false`, `null`, `0`. Returns only `{ attended }` | `ATTENDANCE_MARKED` or `ATTENDANCE_UNMARKED`; `{ eventId, ticketCode }` | P |
| `scanAttendanceAction(ticketCode, eventId)` | `admin:src/actions/participant.actions.ts:195` | SA, A | Read-only lookup of a ticket on one event; `ScanEntryData` | none | none |
| `confirmEntryAction(participantId, eventId, count)` | `admin:src/actions/participant.actions.ts:232` | SA, A | `markEntry`: compare-and-set adds `count` to `enteredCount` | `ATTENDANCE_MARKED`; `{ eventId, ticketCode, count, enteredCount }` | none, on purpose (`:254-256`) |
| `scanGlobalAttendanceAction(ticketCode)` | `admin:src/actions/participant.actions.ts:291` | SA, A | Read-only lookup across events; `GlobalScanData` includes phone, email and age | none | none |
| `confirmGlobalEntryAction(participantId, eventId, count)` | `admin:src/actions/participant.actions.ts:339` | SA, A | Same as `confirmEntryAction` | `ATTENDANCE_MARKED`, same metadata | none |
| `bulkAddParticipantsAction(eventId, rows)` | `admin:src/actions/participant.actions.ts:413` | SA | Re-validates at most `MAX_IMPORT_ROWS = 1000` rows (`:393`), then `importParticipants` | `PARTICIPANT_ADDED` only when `added > 0`; `entityId` is the event id; `{ eventId, added, skipped, failed }` | P, also after a part-way failure |
| `exportParticipantsAction(eventId)` | `admin:src/actions/participant.actions.ts:454` | SA, A; U gets a thrown "Forbidden" | Returns every `Participant` row of the event, all columns, oldest first; not an `ActionResult` | none | none |
| `createPaymentOrderAction(eventId, data)` | `admin:src/actions/payment.actions.ts:34` | any signed-in role | Counter checkout, step 1: validate, booking open by status and clock, paid event, competition quantity, capacity, then a Razorpay order whose notes carry the booking. Returns `{ orderId, amount, currency, keyId }`, amount in paise. No coupon at the counter | none | none |
| `verifyAndEnrollAction(payment, eventId, _formData)` | `admin:src/actions/payment.actions.ts:105` | any signed-in role | Step 2: HMAC-SHA256 check, booking read back from the order notes, order must be a new booking for this event, then `registerParticipant` as `PAID`, idempotent on the order id | `PARTICIPANT_ADDED` "Self-enrolled (paid): ..." only for a new booking; `{ eventId, phone, paymentId, orderId }` | P, also when the booking already existed |
| `updateSettingsAction(data)` | `admin:src/actions/settings.actions.ts:21` | SA | `settingsSchema`; empty strings stored as `null`; `upsertSettings` | `SETTINGS_UPDATED` "Updated company settings" | `/admin/settings` |
| `addBrandPartnerAction({ name, logoUrl, logoId })` | `admin:src/actions/settings.actions.ts:58` | SA | Id from `crypto.randomUUID()`; atomic push; the three fields are stored as sent, unvalidated | `SETTINGS_UPDATED` "Added brand partner: ..." | `/admin/settings` |
| `removeBrandPartnerAction(partnerId)` | `admin:src/actions/settings.actions.ts:87` | SA | Atomic remove; queues the STORED `logoId` for deletion; an already-removed partner is a success with no log | `SETTINGS_UPDATED` "Removed brand partner: ..."; `{ partnerId }` | `/admin/settings` |

- **Shape of an action** (`admin:src/actions/event.actions.ts:18-59`): `getSession()` -> role check -> zod `safeParse` (the first field error becomes `error`) -> service call (a thrown `Error.message` becomes `error`) -> `await logActivity(...)` -> `revalidatePath(...)` -> `{ success: true, data }`. A new action also needs a row in `MATRIX` in `admin:test/action-roles.test.ts`: the test fails when an exported action has no row (`:461-471`) and asserts that a refused call reaches no write (`:473-492`).
- **Refusals differ by file.** Signed out: `getSession()` throws `Error("Unauthorized")`, so the call rejects; most screens then show `ACTION_FAILED_MESSAGE` (§8.10). Wrong role: `{ success: false, error: "Forbidden" }`, except `exportParticipantsAction`, which throws. The four account actions answer `{ success: false, error: "Unauthorized: Super Admin access required" }` to signed-out and wrong-role callers alike (`admin:src/actions/admin.actions.ts:20-26,71-73`).
- **Role-less token:** `getSession()` is copied into four files with different fallbacks: `"ADMIN"` in event, participant and settings actions, `"USER"` in payment actions (`admin:src/actions/event.actions.ts:23`, `admin:src/actions/participant.actions.ts:28`, `admin:src/actions/settings.actions.ts:17`, `admin:src/actions/payment.actions.ts:23`). Deny-list checks (`role === "USER"`) let such a token through; write new checks as allow-lists.
- **`eventId` is not verified** in `updateParticipantAction`, `deleteParticipantAction` and `toggleAttendanceAction`: the services act on the booking id alone and `eventId` only feeds the revalidated path and the log. It IS checked by `scanAttendanceAction` (a ticket of another event reads as not found, `admin:src/repositories/participant.repository.ts:291-295`) and by the two confirm actions ("Participant does not belong to this event", `:308-311`).
- **Export leaks more than the page:** `exportParticipantsAction` sends `paymentOrderId`, `paymentId` and `requestId` to the browser, while the participants page drops the Razorpay references on the server (`admin:src/app/admin/events/[id]/participants/page.tsx:45-57`).
- **Callers:** `admin:src/components/auth/login-form.tsx:13`; `admin:src/components/admin/header.tsx:156` (logout); `admin:src/components/events/event-form.tsx:175-176`; `admin:src/components/events/event-edit-actions.tsx:41,62`; `admin:src/components/participants/participant-form.tsx:51-52`; `admin:src/components/participants/participant-table.tsx:519,542,592` (delete, attendance, export); `admin:src/components/participants/qr-scanner.tsx:88,110,137`; `admin:src/components/participants/global-qr-scanner.tsx:106,125,158`; `admin:src/components/participants/import-participants-form.tsx:187`; `admin:src/components/participants/enroll-dialog.tsx:122,145,178`; `admin:src/components/admin/create-admin-dialog.tsx:53`; `admin:src/components/admin/reset-password-dialog.tsx:49`; `admin:src/components/admin/admin-table.tsx:57,72`; `admin:src/components/settings/settings-form.tsx:55`; `admin:src/components/settings/brand-partners-section.tsx:176,202`.

### 10.5 Admin env keys

Values live in the git-ignored `.env.local` on a dev machine and in the Vercel project environment. On the owner's machine `.env.local` holds PRODUCTION credentials (`admin:vitest.config.ts:8-10`), so anything run locally with it acts on live data. Template: `admin:.env.example`. `admin:src/lib/env.ts:3-7` parses `process.env` once with `runtimeEnvSchema` (`admin:src/lib/env-schema.ts:7-35`) and on failure throws `Environment validation failed:` plus one `NAME: message` line per key, never a value. That throw is the "load failure" below.

| Key | Required | Used by | Behaviour when missing |
|---|---|---|---|
| `DATABASE_URL` | Yes, runtime and seed | Prisma (`admin:prisma/schema.prisma:7`) | Load failure |
| `AUTH_SECRET` | Yes | Auth.js itself; no repo code reads it (**unverified** library behaviour) | Load failure |
| `NEXTAUTH_URL` | No; a URL when set | Auth.js | Nothing, per the comment at `admin:.env.example:6`: on Vercel the deployment URL is detected (**unverified**). When set it must be this app's own address |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes | `admin:src/lib/cloudinary.ts:5-7`; the cloud name also in `admin:next.config.ts:25` | Load failure; with no cloud name at build time the image optimizer accepts any Cloudinary path |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Only a build-time fallback (`admin:next.config.ts:25`) | Load failure |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Yes; the first must be a URL | `admin:src/lib/ratelimit.ts:9-10` | Load failure. Present but wrong: limiters fail open (§7.7) |
| `FRONTEND_URL` | No | CORS (`admin:src/lib/cors.ts:4`) | Defaults to `http://localhost:3001`, which becomes the allowed origin |
| `NEXT_PUBLIC_APP_URL` | No; a URL when set | Second CORS origin (`admin:src/lib/cors.ts:4`) | One allowed origin |
| `RAZORPAY_KEY_ID` | Optional in the schema; needed for payments | `admin:src/lib/razorpay.ts:9`, `admin:src/actions/payment.actions.ts:70`, `admin:src/app/api/public/events/[slug]/payment/order/route.ts:158` | Public order 500, verify 502, webhook 500 when it must fetch the order (§7); counter: "Payment gateway not configured" |
| `RAZORPAY_KEY_SECRET` | Same | `admin:src/lib/razorpay.ts:10`, `admin:src/actions/payment.actions.ts:118`, `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:86`, `admin:src/lib/ticket-code.ts:25` | Verify 500 and counter "Payment configuration error"; order 502; webhook 500 when it must fetch the order; seeded ticket codes fall back to a hard-coded HMAC key literal (`admin:src/lib/ticket-code.ts:25`) |
| `RAZORPAY_WEBHOOK_SECRET` | Optional in the schema; needed in production | `admin:src/app/api/razorpay/webhook/route.ts:34` | Webhook answers 500 `{ error: "Webhook not configured" }`, so paid bookings have no crash recovery; one warning at load |
| `PROXY_SHARED_SECRET` | Optional in the schema; needed in production; identical to the site's | `admin:src/lib/ratelimit.ts:189`, `admin:src/lib/site-ticket-mail.ts:29` | `x-client-ip` is never trusted, so all site visitors share one rate-limit bucket; the webhook's ticket mail is not sent; one warning at load |
| `SITE_URL` | No | `admin:src/lib/site-ticket-mail.ts:38` | Unset or empty: `https://www.ulsaaham.com`. A non-URL value: load failure |
| `NODE_ENV` | Set by Next and Vercel; never by hand (`admin:.env.example:44`) | Cookie `secure` flag, Prisma log level and client caching | Default `development` |
| `SERVER_TIMING` | No; not in the schema | `admin:src/lib/server-timing.ts:11` | Off. Only `"1"` adds a `Server-Timing` header to three public GET routes (events list, event detail, brand partners); it exposes internal timings, so leave it unset |
| `VERCEL_REGION`, `NEXT_PHASE`, `ZXING_WASM_VERSION` | Set by the platform; the last is injected by `admin:next.config.ts:30-32` | `admin:src/lib/server-timing.ts:53`, `admin:src/lib/prisma.ts:19`, `admin:src/lib/gate-scanner.ts:13` | Region reads `"local"`; the early database connect is not skipped; the third is never missing (§8.14) |
| `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD` | Seed only (`seedEnvSchema`, `admin:src/lib/env-schema.ts:38-42`): non-empty name, password of at least 8 characters | `admin:prisma/seed.ts:13-18` | Seed throws `Seed environment validation failed`. The running app never reads them; the owner was told to remove them from production after seeding (not confirmed done) |

- **Validation is lazy, not a boot check.** `admin:src/lib/env.ts` throws when a module that imports it first loads: `ratelimit.ts`, `cors.ts`, `cloudinary.ts`, `site-ticket-mail.ts` in the same folder. That covers every public route, the webhook, the upload route and the events and logs pages, but not `/login`. So a missing Cloudinary or Auth key takes the whole public API down. Whether `next build` fails on a missing key is **unverified**.
- **Empty-string trap:** only `SITE_URL` reads `""` as unset (`admin:src/lib/env-schema.ts:30-33`). `NEXTAUTH_URL=""`, `NEXT_PUBLIC_APP_URL=""` or `FRONTEND_URL=""` fails the URL check and causes a load failure. `admin:.env.example:31,46` ships the webhook and proxy secrets as `""`: they pass, then count as missing and trigger the warning `[env] <NAME> is not set: <effect>.`, logged once per instance through `Symbol.for("ulsaham.env.missingSecretsWarned")` (`admin:src/lib/env.ts:14-26`).
- **Read time:** keys read through the parsed `env` object (Cloudinary, Upstash, `FRONTEND_URL`, `NEXT_PUBLIC_APP_URL`, `PROXY_SHARED_SECRET`, `SITE_URL`) are fixed at module load. The Razorpay keys are read from `process.env` at call time (the SDK instance is then cached, `admin:src/lib/razorpay.ts:5-17`), so a missing one shows as a run-time error text, not at load. Either way a changed value needs a redeploy (§12).
- The URL values in `admin:.env.example:7,36,40,43` are deployed addresses, not localhost. The scripts and the seed read `.env.local` themselves; the Prisma CLI does not (§11.4).

### 10.6 Housekeeping jobs

There is no cron: `admin:vercel.json:3-4` sets only `fluid` and `regions`. Every job is started by a page view or an API read and runs after the response through `after()`; the one exception is the sweep the public past list waits for.

| Job | Started by | Throttle | Effect |
|---|---|---|---|
| COMPLETED sweep, `autoCompleteExpiredEvents` (`admin:src/repositories/event.repository.ts:257-275`) | Admin events list, dashboard stats and the public live list schedule it; the public past list awaits it (`admin:src/services/event.service.ts:215,238-239,257`) | `SWEEP_INTERVAL_MS = 60_000`, in memory, per server instance (`admin:src/services/event.service.ts:57-70`) | Events stored `PUBLISHED` or `BOOKING_CLOSED` with `date <= now + 24 h` whose end instant has passed are set to `COMPLETED` in one `updateMany`. Drafts are never swept |
| Booking prune, `pruneOldEventParticipants` (`admin:src/repositories/participant.repository.ts:261-289`) | Every render of the `/admin/events` list, by any role (`admin:src/app/admin/events/page.tsx:40`) | Once per `60 * 60` s across instances: Upstash key `ulsaham:job:events-housekeeping` | For each event dated more than 14 days ago that still holds bookings: write the archive counters, then delete all its bookings |
| Image deletes, `deleteDueImages` (`admin:src/services/housekeeping.service.ts:46-78`) | The same run, after the prune; each task has its own try and catch (`:86-98`) | Same key | Deletes up to 25 due Cloudinary images |
| Log prune, `pruneOldActivityLogs` (`admin:src/repositories/activity-log.repository.ts:61-67`) | Every render of the `/admin/logs` list (`admin:src/app/admin/logs/page.tsx:26`) | Once per hour: `ulsaham:job:prune-activity-logs` | Deletes rows with `createdAt` older than 30 days |

- **`runThrottled(name, seconds, job)`** (`admin:src/lib/ratelimit.ts:172-186`): Upstash `SET ulsaham:job:<name> <now> NX EX <seconds>`; the job runs only on the reply `"OK"`. When Upstash is unreachable the job runs anyway, so during an outage every such page view runs it. Job errors are caught and logged. If nobody opens those pages, nothing is pruned: the retention periods are the earliest moment, not a deadline.
- **Sweep:** reads stay correct without it because the status is derived from the clock (`getEffectiveStatus`); only the STORED status lags. What depends on the stored value: the public past list (an ended event joins it up to about a minute later) and `registerParticipant`, which tests `status !== "PUBLISHED"`. A failure is logged as `COMPLETED sweep failed:` and swallowed. The public event detail does not start a sweep.
- **Prune cut-off:** `new Date()` minus 14 days on the server clock, compared with `Event.date`, which is UTC midnight of the event day. So the 14 days count from that midnight, not from the end time. The prune is one-shot and destructive: a booking added to an event after it was archived is deleted on the next run without being counted.
- **Archive counters:** `Event.archivedParticipantCount` = seats summed; `Event.archivedRevenuePaise` = recorded `amountPaidPaise` of settled bookings plus an estimate, seats x `Event.amount` x 100, for paid bookings with no recorded charge (`admin:src/repositories/participant.repository.ts:235-259`, `admin:src/lib/revenue.ts:18-28`). They are written with `updateMany` guarded by `NOT: { archivedParticipantCount: { gt: 0 } }`. Why: a repeated or overlapping run must not replace the totals with those of leftover rows; the `NOT` form also matches documents that lack the field.
- **After a prune:** `participants/check` answers 404, `my-tickets` omits the ticket and `payment/status` answers pending (§7). `registeredCount` falls back to the archived seats only when no live bookings remain; the dashboard ADDS the archive counters to the live sums (`admin:src/services/event.service.ts:141,223,247`, `admin:src/repositories/event.repository.ts:388-419`).
- **Image queue:** `Settings.pendingImageDeletes`, entries `{ publicId, deleteAfter }`. `scheduleImageDeletes` (`admin:src/services/housekeeping.service.ts:26-38`) adds them, always AFTER the database write that let go of the image succeeded: an event update that replaced the banner or removed gallery images (`admin:src/services/event.service.ts:422-452`), an event delete (`:472`), a partner removal (`admin:src/actions/settings.actions.ts:97`). It never throws; on failure the image simply stays in Cloudinary.
- **Queue constants** (`admin:src/services/housekeeping.service.ts:14-18`): `IMAGE_DELETE_DELAY_MS = 2 * 60 * 60 * 1000` (why: longer than the site's edge cache and Cloudinary's CDN keep a page that still shows the image); `IMAGE_DELETES_PER_RUN = 25`; `IMAGE_DELETE_GIVE_UP_MS = 7 * 24 * 60 * 60 * 1000`.
- **One run:** due entries, oldest first, de-duplicated, first 25. An id that an event banner, a gallery or a partner logo uses again is kept and dequeued. Otherwise `deleteImage` calls Cloudinary `destroy` with `invalidate: true`; "not found" counts as deleted. A failure stays queued until it is 7 days overdue, then it is dropped with a log line. Dequeueing removes only entries with `deleteAfter <= now`, so an image released again keeps its later entry. Other `after()` calls in the app are one-off deferred work, not jobs: the webhook's log row and ticket mail, and the verify route's duplicate-payment log.

### 10.7 Rate limiting and visitor IP trust

Everything is in `admin:src/lib/ratelimit.ts`. Limits, windows and keys are in §7.7; the headers the site proxy sends are in §7.1.

- **Store and calls:** Upstash Redis over REST with `retry: { retries: 1 }` and a 50 ms backoff (`:6-12`; why: the SDK default of 5 retries could hold a request for about 4.3 s while Upstash is unreachable). `allow(limiter, id)` (`:137-144`) fails open: an Upstash error lets the request through. `allowBooking` (`:154-164`) asks a per-IP-and-phone bucket and a per-IP bucket in parallel and needs both. Booking and payment routes call it only after the body validates, so a malformed request costs nothing.
- **`getClientIP(request)`** (`:209-225`), in order: (1) when `PROXY_SHARED_SECRET` is set and the `x-proxy-key` header equals it (same length, then `timingSafeEqual`, `:188-195`), the trimmed `x-client-ip`; (2) the first `x-forwarded-for` entry; (3) `x-real-ip`; (4) `"127.0.0.1"`.
- **Why the handshake:** the site relays every call server to server, so requests arrive from the site's egress address; without a matching secret every visitor shares one bucket. That Vercel overwrites `x-forwarded-for` on ingress is stated only in the code comment (`:202-208`): **unverified**.
- **Mismatch signal:** an `x-client-ip` without a valid key is ignored and logged once per instance (`Symbol.for("ulsaham.ratelimit.untrustedRelayLogged")`, `:199-219`). The secret must be identical in both Vercel projects; change both, then redeploy both.
- **Not rate limited:** staff sign-in, every server action, the upload route, and the Razorpay webhook (its guard is the signature, §7.4).
- **Adding a limiter:** `Ratelimit.slidingWindow`, `analytics: false`, prefix `ulsaham:<name>`, `timeout` of `READ_TIMEOUT_MS = 2000` for reads or `WRITE_TIMEOUT_MS = 3000` otherwise (`:14-20`). Tests need no change: `admin:test/setup.ts:69-81` replaces every export that has a `limit` method.

### 10.8 Uploads and Cloudinary

The HTTP contract, the size and type limits and their gotchas are in §7.11.

- **Flow:** the browser posts the file to `POST /api/admin/upload`; the route buffers the whole file in memory (`admin:src/app/api/admin/upload/route.ts:47-48`), calls `uploadImage(buffer, folder)` and answers `{ url, publicId }` (Cloudinary's `secure_url` and `public_id`). The form keeps both and they are saved with the event or the partner. The SDK is configured from the parsed `env` with `secure: true` (`admin:src/lib/cloudinary.ts:4-9`), so importing the module validates the environment.
- **Folders:** `ulsaham/events` by default, `ulsaham/brand-partners` only for `?folder=brand-partners` (`admin:src/constants/index.ts:4-5`, `admin:src/app/api/admin/upload/route.ts:50-52`).
- **Upload options** (`admin:src/lib/cloudinary.ts:19-25`): `resource_type: "image"`, `format: "webp"`, `quality: "auto:good"`, `fetch_format: "auto"`, sent through `upload_stream`. Cloudinary picks the public id; the optional third argument of `uploadImage` is never passed.
- **Where ids are stored:** `Event.bannerImageUrl` + `bannerImageId`; `Event.galleryImages[]` as `{ url, id }`, at most `MAX_GALLERY_IMAGES = 10` (`admin:src/validators/event.validator.ts:53`); `BrandPartner.logoUrl` + `logoId`. Only the URLs leave through the public API (§7.9).
- **Deleting is always deferred.** `deleteImage` (`admin:src/lib/cloudinary.ts:46-56`) never throws and has one caller, the queue in §10.6. Why: cached pages on the site keep showing the old image for up to an hour. The id deleted is the one stored in the database, never one the browser names (`admin:src/actions/settings.actions.ts:92-97`).
- **Orphans:** the upload happens before the form is saved, and only saves, deletes and partner removals feed the queue. An image uploaded and then abandoned stays in Cloudinary; no clean-up exists.
- **Image optimizer** (`admin:next.config.ts:21-45`): `remotePatterns` allows only `https://res.cloudinary.com/<cloud name>/**` (why: the optimizer is public, so anyone could otherwise spend the image quota on another account's files); `qualities: [75]`; `minimumCacheTTL: 2678400` (31 days; safe because every upload gets a new URL).

### 10.9 Activity logging

- **Writer:** `logActivity(params)` (`admin:src/lib/activity-logger.ts:16-40`) with `adminUsername`, `adminRole`, `action`, `entity`, `entityId?`, `description`, `metadata?` (stored as `{}` when absent). One call writes one `ActivityLog` row (§11.2).
- **It never throws:** a failed write is only `console.error("Failed to log activity:")`, so a missing audit row is silent. Always `await` it; a forgotten `await` is caught only by lint (`@typescript-eslint/no-floating-promises`, §13.3).
- **Who:** an action passes the session's `username` and `role`. Entities used: `Admin`, `Event`, `Participant`, `Settings`.
- **SYSTEM rows:** `adminRole: "SYSTEM"` with `adminUsername` `razorpay-webhook` or `payment-verify`; the column is a String, not the enum, so this fits. The webhook writes `PARTICIPANT_ADDED` "Auto-enrolled via Razorpay webhook (browser crash recovery): ..." and `PARTICIPANT_UPDATED` "Payment confirmed via webhook: ..." (`admin:src/app/api/razorpay/webhook/route.ts:113-124,141-152,187-198`). Both sources write `PARTICIPANT_UPDATED` "Duplicate payment ... for already-paid ticket ... refund it in Razorpay" (`admin:src/lib/duplicate-payment.ts:9-30`); nothing refunds automatically. All are written after the response.
- **What is logged:** 15 of the 18 `LogAction` values, as listed in §10.4. `USER_CREATED`, `USER_UPDATED` and `USER_DELETED` exist in the schema and the label maps but nothing writes them; creating a `USER` account logs `ADMIN_CREATED`. The comment at `admin:src/constants/index.ts:86` names only the webhook as a SYSTEM writer; the verify route is one too. A new `LogAction` value needs an entry in `LOG_ACTION_LABELS` and `LOG_ACTION_VARIANTS` (`admin:src/constants/index.ts:41-84`).
- **Not logged:** failed sign-ins, scanner lookups, exports, counter order creation, uploads, housekeeping runs, and an ordinary site booking (the register and verify routes write no row).
- **IP column:** the first `x-forwarded-for` entry, else `x-real-ip`, else `"unknown"` (`admin:src/lib/activity-logger.ts:19-22`). It does not use `getClientIP`, so on SYSTEM rows the address should be Razorpay's or the site proxy's, not the buyer's: **unverified** on a live request. **Personal data:** descriptions hold names, ticket codes and Razorpay payment ids, shown to ADMIN and SUPER_ADMIN on `/admin/logs` and the dashboard; `metadata` (phone numbers, order ids) is stored but never sent to the browser (`admin:src/app/admin/logs/page.tsx:48-58`).
- **Retention and reading:** rows older than 30 days are deleted, but only when someone opens `/admin/logs` (§10.6). The list shows the last 30 days, 20 per page, with filters for action and username (`contains`, case-insensitive, so it matches the SYSTEM names too) (`admin:src/repositories/activity-log.repository.ts:14-49`). The dashboard shows 20 rows from the last 15 days (`admin:src/app/admin/dashboard/page.tsx:45`).

---

## 11. Database schema

One MongoDB database holds staff accounts, events, bookings, settings and the audit log. Customers have no account row. The jobs that delete data are in §10.6. A bare `:N` continues the file cited just before it.

### 11.1 Engine and access

- **Engine:** MongoDB through Prisma (`provider = "mongodb"`, `url = env("DATABASE_URL")`, `admin:prisma/schema.prisma:1-8`). That one file is the whole model. There is no `admin:prisma/migrations` folder: indexes are synced with `prisma db push` (§11.4).
- **Ids:** every model has `id String @id @default(auto()) @map("_id") @db.ObjectId`. `findEventById` answers `null` for a value that is not 24 hex characters instead of letting Prisma throw (`admin:src/repositories/event.repository.ts:12,23`).
- **Client** (`admin:src/lib/prisma.ts:3-21`): one `PrismaClient`, kept on `globalThis` outside production; logs `query`, `error`, `warn` in development and `error` otherwise. `prisma.$connect()` runs at module load so the engine start and the MongoDB handshake overlap the rate-limit call. It is skipped when `NEXT_PHASE === "phase-production-build"`, because the build loads route modules but must not reach the database. A failed early connect is retried by the first query.
- **Generated client:** `prisma generate` runs in `postinstall` and at the start of `build` (`admin:package.json:7,13`); it only writes client code. Queries live in `admin:src/repositories/` (§10.1). Raw commands go through `prisma.$runCommandRaw`: `findAndModify` (chest numbers), `listIndexes` (index guard), `ping` (server timing).
- **No transactions:** `$transaction` is used nowhere. Atomicity comes from single-document operations (`push` and `deleteMany` on embedded lists, `$inc`, compare-and-set `updateMany`) and from the `ticketCode` unique index.
- **Missing is not null.** MongoDB keeps a missing field apart from `null`. A filter on a field that was added after documents existed must cover the missing case: `{ isSet: false }` (`admin:src/lib/revenue.ts:8-10`) or `NOT: { ... gt: 0 }` (`admin:src/repositories/participant.repository.ts:284`). Prisma reads a missing field that has a `@default` as that default, but a filter on the default value does not match the document (`admin:src/repositories/participant.repository.ts:333-344`).

### 11.2 Models

Line numbers are in `admin:prisma/schema.prisma`; `?` marks an optional field. Not repeated in the tables: every model has the ObjectId `id`; `Admin` and `Event` have `createdAt` and `updatedAt`, `Participant` has `registeredAt` (the list order) and `updatedAt`, `Settings` only `updatedAt`, `ActivityLog` only `createdAt`.

| `Admin` field (`:10-19`) | Type | Notes |
|---|---|---|
| `username` | String, unique | All staff live here, role `USER` (counter staff) included. Matched exactly at sign-in, case included. UI-created names: 3 to 50 characters of `[a-z0-9_]` (`admin:src/validators/admin.validator.ts:5-12`) |
| `passwordHash` | String | `bcryptjs`, cost 12 |
| `role` | `AdminRole` | No default |
| `isActive` | Boolean, default `true` | Checked only at sign-in (§10.2) |
| `lastLoginAt?` | DateTime | Set by `authorize()` |

| `Event` field (`:27-69`) | Type | Notes |
|---|---|---|
| `name`, `description`, `venue`, `venueLink?` | String | HTML tags are stripped from the first three on save (`sanitizeString`) |
| `slug` | String, unique | The event's web address; its first 6 alphanumerics go into ticket codes |
| `bannerImageUrl`, `bannerImageId` | String | Cloudinary URL and public id; only the URL is public |
| `date` | DateTime | A calendar day only: UTC midnight of the day in India (`toEventDay`, `admin:src/lib/event-time.ts:36-38`) |
| `startTime`, `endTime` | String | `hh:mm AM/PM`, India time (§6.9) |
| `isFree`, `featured` | Boolean | Defaults `true`, `false`. A free event is stored with `amount` and `earlyBirdAmount` null |
| `amount?`, `earlyBirdAmount?`, `groupExtraAmount?` | Float | RUPEES |
| `isEarlyBird`, `gstEnabled`, `platformFeeEnabled` | Boolean | Defaults `false`, `false`, `true` |
| `isCompetition`, `participationType`, `competitionInstructions?`, `competitionNotes?` | Boolean, `ParticipationType`, String, String | Defaults `false`, `INDIVIDUAL` |
| `status` | `EventStatus`, default `ANNOUNCED` | Stored value; readers use the effective status (§6.9) |
| `capacity?` | Int | `null` = unlimited; counted in seats, not rows |
| `couponCodes`, `complimentaryCodes`, `galleryImages`, `participants` | Embedded lists; relation | Codes never leave through the public API (§7.9) |
| `lastCompetitionNumber`, `archivedParticipantCount` | Int, default `0` | Chest-number counter (§11.5); seats of pruned bookings (§10.6) |
| `archivedRevenuePaise?` | Int `@db.Long` | Paise. Long because one event can pass the 32-bit limit, about 2.1 crore rupees (`:58-62`) |

| `Participant` field (`:108-150`) | Type | Notes |
|---|---|---|
| `eventId`, `event` | ObjectId, relation | No `onDelete` rule declared; code never deletes an event that still has bookings (§10.4) |
| `name`, `phone`, `email?`, `age` | String, String, String, Int | One row = one BOOKING (one ticket), not one person. Phone and e-mail are deliberately not unique per event (`:142-144`) |
| `numberOfParticipants` | Int, default `1` | Seats on this ticket, 1 to 10 |
| `ticketCode` | String, unique | §11.5 |
| `competitionNumber?`, `isGroupRegistration` | Int, Boolean default `false` | Chest number, from 1001; `isCompetition && seats > 1` |
| `amountPaid` | Boolean, default `false` | Means "settled". It is NOT an amount |
| `entryType?` | `EntryType` | Optional because older rows lack it (§11.5) |
| `paymentOrderId?`, `paymentId?` | String | Razorpay ids; the order id is the paid idempotency key |
| `requestId?` | String | The site's id for one free or complimentary submit |
| `amountPaidPaise?` | Int | What Razorpay charged, in paise, fees included; unset on free, complimentary and older rows |
| `attended`, `attendedAt?`, `enteredCount` | Boolean, DateTime, Int default `0` | Gate state; `enteredCount` = people let in so far |

| `Settings` field (`:167-182`) | Type | Notes |
|---|---|---|
| The row itself | n/a | One row by convention only: every read and write takes the oldest row (`admin:src/repositories/settings.repository.ts:4-6`); `getSettings()` creates it when absent, so a read can write |
| `companyName` | String, default "Ulsaham Entertainments" | |
| `address?`, `email?`, `phone?`, `facebook?`, `instagram?`, `youtube?`, `linkedin?` | String | Empty form values are stored as `null` |
| `brandPartners`, `pendingImageDeletes` | Embedded lists | Changed with atomic `push` and `deleteMany`; the second is the image-delete queue (§10.6) |

| `ActivityLog` field (`:184-199`) | Type | Notes |
|---|---|---|
| `adminUsername`, `adminRole` | String, String | The role is a String, not the enum, so `SYSTEM` fits (§10.9) |
| `action`, `entity`, `entityId?`, `description` | `LogAction`, String, String, String | Entities: `Admin`, `Event`, `Participant`, `Settings` |
| `metadata?`, `ipAddress` | Json, String | Metadata is written as `{}` when the caller gives none. Rows are pruned after 30 days |

| Enum or embedded type | Values or fields |
|---|---|
| enum `AdminRole` (`:21-25`) | `SUPER_ADMIN`, `ADMIN`, `USER` |
| enum `EventStatus` (`:71-77`) | `ANNOUNCED` (draft), `PUBLISHED`, `BOOKING_CLOSED`, `CANCELLED`, `COMPLETED` |
| enums `ParticipationType` (`:79-83`), `EntryType` (`:85-90`) | `INDIVIDUAL`, `GROUP`, `BOTH`; `PAID`, `COMPLIMENTARY`, `FREE` |
| enum `LogAction` (`:201-220`) | 18 values; `USER_CREATED`, `USER_UPDATED`, `USER_DELETED` are never written |
| types `CouponCode` (`:92-95`), `ComplimentaryCode` (`:97-101`) | `code`, `discount` (Float, rupees off the whole order); `code`, `maxUses`, `usedCount` |
| types `EventImage` (`:103-106`), `PendingImageDelete` (`:162-165`) | `url`, `id` (Cloudinary public id); `publicId`, `deleteAfter` |
| type `BrandPartner` (`:152-157`) | `id` (UUID string), `name`, `logoUrl`, `logoId` |

### 11.3 Indexes

Line numbers are in `admin:prisma/schema.prisma`. Every collection also has the implicit `_id` index; `Settings` has no other index.

| Model | Index | Unique | Why |
|---|---|---|---|
| `Admin` | `username` (`:12`) | Yes | Sign-in lookup; one account per name |
| `Event` | `slug` (`:30`) | Yes | Public lookup by slug; a clash is reported as `SLUG_IN_USE_MESSAGE` |
| `Event` | `date` (`:67`) | No | Upcoming filter, sweep and prune candidates |
| `Event` | `status` (`:68`) | No | Public lists filter on the stored status |
| `Participant` | `ticketCode` (`:117`) | Yes | Ticket lookups, and the idempotency backstop: a duplicate booking collides here |
| `Participant` | `eventId` (`:145`) | No | Participant lists and seat sums |
| `Participant` | `eventId, phone` (`:146`) | No | `requestId` replay lookup, import duplicate check, index guard |
| `Participant` | `phone` (`:147`), `email` (`:148`) | No | My Bookings lookup by phone or e-mail |
| `Participant` | `paymentOrderId` (`:149`) | No | Verify fast path, the webhook's first read, the status poll |
| `ActivityLog` | `createdAt` (`:196`), `adminUsername` (`:197`), `action` (`:198`) | No | List window and prune; the two filters |

- Exactly three unique indexes exist by design; any other unique index on `Participant` is a leftover and breaks bookings (§11.4). `requestId` has no index on purpose: it is always looked up together with `eventId` and `phone` (`admin:prisma/schema.prisma:128-131`).

### 11.4 Rules for changing the schema

- **Needs a database push:** adding, removing or changing `@unique`, `@@unique` or `@@index`. **Needs none:** plain fields, optional fields, defaults, embedded types and lists; the regenerated client is enough (example: `pendingImageDeletes`, "No index, so it needs no `prisma db push`", `admin:prisma/schema.prisma:178-180`). A new optional field of a new enum type (`entryType`) also needed none.
- **The build never pushes.** `build` is `prisma generate && next build` (`admin:package.json:7`). An index change must be pushed by hand to EVERY database, before the code that relies on it is merged (§14.4). Why this is a golden rule: commit `b75d66c` (2026-09-13, multi-booking) removed `@@unique([eventId, phone])` and `@@unique([eventId, email])` and added the plain `@@index([eventId, phone])` and `@@index([paymentOrderId])`, but production kept the unique index `Participant_eventId_phone_key`; on 2026-10-04 a second booking by the same phone was charged and then refused. The owner ran the push the same day; it dropped that index and created three plain ones (§19).
- **Prisma CLI env-file trap:** the ADMIN repo root has `.env.example` and the git-ignored `.env.local`, no `.env`. `npm run db:push` and `npm run db:studio` are bare CLI calls (`admin:package.json:15,17`) and the Prisma CLI reads only `.env`, so they stop with "Environment variable not found: DATABASE_URL" and change nothing. This is library behaviour, observed on 2026-10-04, not provable from repo code.
- **The form that worked,** run by the owner from the ADMIN repo root: `node -e "require('dotenv').config({path:'.env.local',quiet:true});require('child_process').execSync('npx prisma db push --skip-generate',{stdio:'inherit'})"`. It acts on whatever database `.env.local` names, which is production on the owner's machine. An AI session never runs it; it hands the command over (§2).
- **Never add a nullable `@unique` field on MongoDB.** Why: a MongoDB unique index treats a missing value as one value, so the second document without the field is refused (database behaviour, **unverified** from repo code). The schema follows this: optional `paymentOrderId` and `requestId` carry a plain index or none, and uniqueness per order comes from the non-null `ticketCode` derived from the order id. The schema once had one, `@@unique([eventId, email])` on the optional `email`; `b75d66c` removed it.
- **Adding a field to a model that already has documents:** make it optional or give it a `@default`, then write every filter with the missing case in mind (§11.1). Examples: `entryType`, `amountPaidPaise`, `archivedRevenuePaise` (optional); `enteredCount`, `archivedParticipantCount` (default).
- **Legacy unique index guard** (`admin:src/lib/index-guard.ts`): runs `listIndexes` on `Participant` and treats any unique index whose key is not exactly `_id` or `ticketCode` as legacy (`:29-44`). The answer is cached per instance for `CHECK_TTL_MS = 10 * 60_000`; a failed check is retried after `FAILED_CHECK_TTL_MS = 60_000`; `CHECK_TIMEOUT_MS = 3000` (`:11-18`). The payment order route refuses a repeated phone with 409 `PHONE_ALREADY_REGISTERED` BEFORE any money moves; the register route only logs (§7.3). The log line starts `[index-guard] LEGACY UNIQUE INDEX on Participant:` and names the fix (`:77-81`). Limits: a failed or slow check counts as "no legacy index", so the guard can switch itself off; it tests only the phone, so a legacy unique index on e-mail would still fail after payment. `registerParticipant` reports a unique clash on phone or e-mail as `PHONE_ALREADY_REGISTERED` (`admin:src/services/participant.service.ts:153-157`).

### 11.5 Data rules

- **Ticket code:** `UE-<SLUG6>-<RAND6>`, 16 characters (`admin:src/lib/ticket-code.ts:41-51`; `TICKET_CODE_PREFIX = "UE"`, `admin:src/constants/index.ts:3`). `SLUG6` = the slug upper-cased, everything outside `A-Z0-9` removed, first 6 characters, right-padded with `X`. `RAND6` = 6 characters of `A-Z0-9`: random bytes, or, when a seed is given, the first 6 bytes of HMAC-SHA256(key, seed), each taken modulo 36.
- **Seeded codes are the idempotency mechanism.** The same seed always gives the same code, so two concurrent writes for one order collide on the `ticketCode` unique index and the second gets the first booking back (`admin:src/services/participant.service.ts:106-151`). The HMAC key is `RAZORPAY_KEY_SECRET`, so a code cannot be derived from a leaked order id; a hard-coded fallback key literal sits at `admin:src/lib/ticket-code.ts:25`. Rotating that secret changes what a seed produces from then on, so the concurrent-duplicate protection lapses for orders in flight; stored codes are untouched.
- **Paid key, the order id:** `registerParticipant` first looks up `(eventId, paymentOrderId)` and returns the existing booking, BEFORE any status check, so a retry after booking closed still finds the ticket (`admin:src/services/participant.service.ts:79-82`). The seed is the order id. `paymentOrderId` is indexed, not unique.
- **Free and complimentary key, the request id:** `/^[A-Za-z0-9-]{8,64}$/` (`admin:src/app/api/public/events/[slug]/register/route.ts:16`), stored in `requestId`, looked up with `eventId` and `phone`, seed `request:<eventId>:<requestId>` (`admin:src/services/participant.service.ts:106`). It is optional and ignored when an order id is present (`:76-77`). Without it a double submit creates two bookings.
- **Random codes:** staff-added and imported bookings, and site submits without a `requestId`. Every booking gets up to `TICKET_CODE_ATTEMPTS = 3` tries: a random code is drawn again; a seeded code that a different booking holds retries with the seed suffixed `#1`, `#2` (`:37,115-118`).
- **Entry type:** set once at creation, never by hand (`admin:prisma/schema.prisma:85`). `PAID` = Razorpay, on the site or at the counter; `COMPLIMENTARY` = a complimentary code on the site, or anything staff add or import, even on a free event; `FREE` = a free event booked on the site. For rows without one, `entryStatusOf()` infers: not settled -> `UNPAID`; a Razorpay id -> `PAID`; free event -> `FREE`; otherwise `PAID` (`admin:src/lib/entry-type.ts:19-27`). As of 2026-10-11 every writer in `admin:src/` sets `amountPaid: true`, so rows with `false` can only be older data; whether production still has any is **unverified**.
- **Money units:** `Event.amount`, `earlyBirdAmount`, `groupExtraAmount` and `CouponCode.discount` are rupees (Float). `Participant.amountPaidPaise` and `Event.archivedRevenuePaise` are integer paise. The dashboard divides the paise total by 100 (`admin:src/repositories/event.repository.ts:411-419`).
- **Seats:** "registered" always means the SUM of `numberOfParticipants`, never the row count. Capacity counts unsettled rows too and is checked without a transaction, so two buyers can both take the last seat.
- **Counters:** `Event.lastCompetitionNumber` is raised with one atomic `findAndModify` `$inc`; chest number = `COMPETITION_NUMBER_BASE` (1000) + counter, so the first is 1001 (`admin:src/repositories/event.repository.ts:325-336`). A lost race burns a number. `ComplimentaryCode.usedCount` is a read-modify-write of the whole list and can lose an increment (`:293-306`); an event save keeps the stored count (`admin:src/services/event.service.ts:363-376`). `Participant.enteredCount` uses compare-and-set, so two gates cannot admit more people than the ticket covers (`admin:src/repositories/participant.repository.ts:318-345`).
- **What is deleted over time:** bookings, 14 days after the event date, with totals kept in the two archive counters; activity logs after 30 days; released Cloudinary images after 2 hours (all §10.6). An event is hard-deleted only when it has no booking row, otherwise it becomes `CANCELLED`. Staff accounts and single bookings are hard-deleted on request. Nothing else is removed. The 14 days are a literal in `admin:src/repositories/participant.repository.ts:263` and `PRUNE_AFTER_DAYS = 14` in `admin:scripts/lib/payment-pairing.ts:51`: change both together.

### 11.6 Seed and maintenance scripts

The tool table with arguments and write targets is in §13.6. All of these open a database connection: owner only (§2).

- **Seed:** `npm run db:seed` = `tsx prisma/seed.ts`. It loads `.env.local` itself through `dotenv` (`admin:prisma/seed.ts:1-2`), so unlike the Prisma CLI it finds `DATABASE_URL`. It validates `seedEnvSchema`, upserts the named account as an active `SUPER_ADMIN` with a fresh cost-12 hash, and creates the `Settings` row when none exists (`:13-49`). `admin:package.json` has no `prisma.seed` block.
- **Seed side effects:** a re-run resets that account's password to the env value and re-activates it. It is the only way to create a SUPER_ADMIN or change its password, because the UI neither lists nor edits such accounts (§10.3). A different username creates a second super admin.
- **New empty database:** push first (indexes), then seed. `admin:README.md:1-5` lists neither `npm install` nor the push, and puts the seed before the env file; following it leaves the three unique indexes missing.
- **Scripts:** `admin:scripts/backfill-entry-type.ts` (dry run unless `--apply`) and `admin:scripts/report-unrecorded-payments.ts` (read-only; prints personal data). Both read `.env.local` with their own loader, and a variable already set in the shell wins (`admin:scripts/backfill-entry-type.ts:26-36`).

---

## 12. Deployment and infrastructure

Both apps run on Vercel, one project each. A push to `main` deploys that project to production (release steps: §14.4). A setting that lives only in a dashboard is marked **unverified** unless it was seen in production on 2026-10-11 (commands: §18.6). In citations a bare `:N` continues the file cited just before it.

### 12.1 The two Vercel projects

| Project | Repo and branch | Region | Domains | Function settings |
|---|---|---|---|---|
| Customer site | SITE repo, `main`; config `root:vercel.json` (`framework: "astro"`); Root Directory is the repo root | `bom1` (`root:vercel.json:4`); seen live | `www.ulsaaham.com`; `ulsaaham.com` (308 to www); preview hosts under `vercel.app` | One function, `_render.func`, serves the 7 route files under `site:src/pages/api/`; `maxDuration: 60` seconds (`site:astro.config.mjs:24`). The 10 pages are static files |
| Admin panel and API | ADMIN repo, `main`; config `admin:vercel.json` | `bom1` (`admin:vercel.json:4`); seen live | `ulsaham-admin-panel.vercel.app`; no custom domain appears in either repo | `fluid: true` (`admin:vercel.json:3`). Only the webhook sets a limit: `maxDuration = 15` seconds (`admin:src/app/api/razorpay/webhook/route.ts:20`) |

- Why `bom1` (Vercel's Mumbai region): the database is in Mumbai (owner, 2026-09-27). Before the pin the functions ran in `iad1` and a warm `/api/public` call took 0.95 to 1.33 s, with spikes of 4.2 to 4.6 s (measured 2026-09-27).
- Seen on 2026-10-11: `x-vercel-id` starts `bom1::` on the site home page and reads `bom1::bom1::...` on `/api/public` calls to both hosts, so edge and function are both in Mumbai.
- Why 60 s on the site: the proxy gives up after 8 s on reads and 25 s on writes (`site:src/pages/api/public/[...path].js:27-28`), and nothing should run for the platform's default minutes (`site:astro.config.mjs:22-23`). Why 15 s on the webhook: Razorpay waits about 5 s and retries, the order fetch gives up after 3 s, and the work left for after the response still fits (`admin:src/app/api/razorpay/webhook/route.ts:15-20`).
- Neither `vercel.json` has `crons`, `headers`, `redirects`, `rewrites`, `functions` or `outputDirectory`.
- **unverified**, dashboard only: the Root Directory of each project (the SITE value is known from the message of commit `a4c2a9e`); the production-branch setting; the Node version of the functions; the Bun and Node versions of the build image; the time limit of ADMIN routes other than the webhook; the plan. Hobby forbids commercial use, so a move to Pro with Skew Protection was suggested to the owner; neither is confirmed (§16, §17).

### 12.2 How the site build reaches Vercel

Vercel first runs `installCommand`, `bun install --frozen-lockfile` (`root:vercel.json:5`; a lockfile that does not match fails the deploy, §4.4). Then `buildCommand` (`root:vercel.json:6`), four steps joined with `&&`:

| # | Step | Result | Why |
|---|---|---|---|
| 1 | `bun run build` | Turbo runs `astro build` in the app folder (`root:package.json:9`, `site:package.json:7`). The adapter writes the deployable Build Output to `site:.vercel/output`: `static/`, `functions/_render.func/`, `config.json`. `site:dist/` is only Astro's own `outDir` | The only step that builds anything |
| 2 | `mkdir -p .vercel/output` | A Build Output folder at the repo root | Vercel looks under the project's Root Directory, which is the repo root, not the app folder |
| 3 | `cp -r apps/site/far-fusion/.vercel/output/. .vercel/output/` | Static files, function and `config.json` copied to the root | Same |
| 4 | `node apps/site/far-fusion/scripts/fix-vercel-routes.mjs .vercel/output/config.json` | The ROOT `config.json` is patched: the immutable `/_astro` cache rule moves ahead of the filesystem step and three security headers are added | §13.1; it fails the build on purpose when the adapter's layout changes |

- **The deployable output is not `dist/`.** Until 2026-07-30 `outputDirectory` pointed at `site:dist`: static routes answered 404 and every API route answered `FUNCTION_INVOCATION_FAILED` (fix: `a4c2a9e`). Never add `outputDirectory` back.
- **Turbo outputs rule:** `root:turbo.json:6` must list both `dist/**` and `.vercel/output/**`. Why: on a cache hit Turbo skips `astro build` and restores only the folders listed there.
- The incident behind it (until 2026-08-01, fix `fd0ff33`): Turbo cache files (`root:.turbo/`) and an incomplete `site:.vercel/output` had been committed. Vercel's clone therefore arrived with a warm Turbo cache, Turbo replayed the build and restored only `dist/**`, and the stale committed `_render.func`, which had no server bundle, was copied and deployed. Pages worked; every function call crashed.
- Guards in place: `.turbo` and `.vercel` are ignored at both levels (`root:.gitignore:36-40`, `site:.gitignore:26-30`), and `git ls-files .vercel .turbo` printed nothing on 2026-10-11. Never commit build output or the Turbo cache.
- Step 4 patches only the root copy, so a local build has neither the moved cache rule nor the headers. Steps 2 to 4 are POSIX shell and are not needed locally (§14.1).
- The build runs no tests, no lint, no bundle budget and no function smoke test (§18).

### 12.3 Domains and redirects, allowed hosts, preview deployments

| Host | Role | Set where |
|---|---|---|
| `www.ulsaaham.com` | The site; canonical origin | Domain attached in the Vercel dashboard. `site` in `site:astro.config.mjs:8` feeds canonical and share URLs (`site:src/layouts/BaseLayout.astro:20-24`) |
| `ulsaaham.com` | 308 to `https://www.ulsaaham.com/` (seen 2026-10-11) | Vercel dashboard only; no redirect exists in `root:vercel.json` or in code |
| `ulsaham-admin-panel.vercel.app` | Staff panel, `/api/public/*`, `/api/razorpay/webhook` | The Vercel project's own host. Written in `site:src/lib/backend.js:13`, `site:astro.config.mjs:40`, `site:tests/lib/backend-url.test.mjs:28` |

- **Allowed hosts:** `security.allowedDomains` lists `https://www.ulsaaham.com`, `https://ulsaaham.com` and `https://**.vercel.app` (`site:astro.config.mjs:14-21`). Why: since Astro 5.18 an on-demand route trusts `Host` and `X-Forwarded-Host` only for listed hosts; any other host turns `request.url` into `https://localhost`. From 2026-09-28 to 2026-10-04 that sent Google sign-in back to localhost and made `/api/send-ticket` refuse the site's own pages with 403.
- **Adding a site host:** add it to `allowedDomains`; register `https://<host>/api/auth/google/callback` in the Google OAuth client (§15); attach the domain in Vercel. If it replaces `www`, also change `site` (`site:astro.config.mjs:8`), the two `SITE_URL` defaults (`site:src/lib/mailer.js:41`, `admin:src/lib/env-schema.ts:32`) and `SITE_HOST` in `site:tests/build/function-smoke.test.mjs:27`.
- **Changing the admin host:** the three places in the table, the Razorpay webhook URL (§15), and `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` if they are set (`admin:.env.example:6-7,43`).
- **Response headers:** the site gets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy: strict-origin-when-cross-origin` from the route patch (seen on `/` on 2026-10-11; on `/api/*` answers **unverified**). The admin sets five in `admin:next.config.ts:54-65`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(self), microphone=(), geolocation=()` (the camera stays allowed for the scanner); live values **unverified**. Neither app sends CSP or HSTS from code.
- **Preview deployments** (Vercel builds other branches as previews; whether that is switched on for either project is **unverified**):
  - A SITE preview is a production build (`import.meta.env.PROD` is true). With `BACKEND_URL` unset it talks to the LIVE admin, so a booking made on a preview is written to production (`site:src/lib/backend.js:13-24`). Test writes on a preview only when its `BACKEND_URL` names a non-production admin.
  - Preview hosts match `**.vercel.app` (`site:astro.config.mjs:18-19`), so request URLs should be correct there (read from the config, not tried on a preview: **unverified**); Google sign-in still needs the preview's callback URL registered.
  - An ADMIN preview reads the variables of Vercel's Preview scope. Whether they name the production database is **unverified**: treat a preview as production.
  - Preview URLs are reported to sit behind Vercel sign-in: **unverified**.

### 12.4 Edge caching in production

- **What is cached:** only proxied reads on the SITE project, `GET /api/public/...` with status 200 and a JSON body: event lists, one event, brand partners. The four profiles and their lifetimes are the table in §7.8. Bookings, payments, ticket look-ups and any other query string are never stored.
- **Where:** Vercel's CDN in front of the site function, and nowhere else. The function answers with `vercel-cdn-cache-control: max-age=N, stale-while-revalidate=M`, which by the code comment only the CDN reads and then strips, plus `cache-control: public, max-age=0, must-revalidate` so browsers always revalidate (`site:src/lib/edge-cache.js:53-69`). The admin sends no CDN lifetimes (`:3-4`).
- **Static files:** pages are prerendered files. Hashed files under `/_astro/` carry `public, max-age=31536000, immutable` once the route patch has moved the adapter's rule (§13.1); before the patch they went out as `max-age=0, must-revalidate`, about 180 ms per revalidation (measured 2026-09-27). The header on a live asset was not re-checked on 2026-10-11: **unverified**. On ADMIN, `/zxing/*` is immutable for a year and the image optimizer keeps its variants 31 days (`admin:next.config.ts:41-44,66-70`).
- **How to check** (GET only): run `curl -s -o /dev/null -D - "https://www.ulsaaham.com/api/public/events?page=1&limit=8&upcoming=true"` twice. `x-vercel-cache` reads `MISS`, then `HIT`; `STALE` means the copy is past its fresh time and is being refreshed in the background. Seen on 2026-10-11: `MISS`, then `HIT`.
- **If it stays `MISS`:** the query is not written in the exact canonical order (§7.8), or the CDN ignores the header. The fallback for the second case is one header, `Cache-Control: public, max-age=0, s-maxage=<maxAge>, stale-while-revalidate=<swr>` (`site:src/lib/edge-cache.js:58-60`).
- **What empties it:** time (worst case 1 minute for an event page, 5 minutes for upcoming and featured lists, 1 hour for past lists and partners) and a new SITE deployment (`root:README.md:167`; not re-checked on 2026-10-11, **unverified**). Nothing else: a purge hook from the admin panel was considered and rejected, so a staff edit appears when the window ends. `?fresh=1` on an event URL skips the cache for that one request and empties nothing (`site:src/lib/api.js:108-115`).
- Tied to these windows: the admin waits 2 hours before deleting a replaced image, longer than any page that could still show it (`admin:src/services/housekeeping.service.ts:9-14`).

### 12.5 Environment variables on Vercel

- Each project has its own variables in the Vercel dashboard. No env file with real values is tracked in either repo: only `site:.env.example` and `admin:.env.example`, which hold placeholders. Key lists and defaults: §6.7 (SITE), §10 (ADMIN).
- **Frozen per deployment:** a deployment keeps the values that existed when it was created. A variable added or changed later reaches no existing deployment, so **every change needs a redeploy**. Evidence: SMTP and Google variables added after a deployment was built stayed undefined until an empty commit forced a new one (`aff0b98`, 2026-08-01).
- **Build time versus run time on the SITE:**

| Read form | Value is fixed | Notes |
|---|---|---|
| `import.meta.env.PROD` | At build | True in any `astro build`, previews included. Decides `Secure` cookies, production defaults and refusals |
| `import.meta.env.NAME` | Possibly at build | The first half of every secret read |
| `process.env.NAME` | At run time, from the deployment's variables | The fallback half; `SITE_URL` uses only this form (`site:src/lib/mailer.js:19-22`) |

- Rule: server code reads `import.meta.env.NAME ?? process.env.NAME` with the literal name (§6.7). Why both halves: a private `import.meta.env` value can be captured at build, so a deployment built before a variable existed served `undefined` for good; the fallback was added in `1fa4929` (2026-08-08).
- Which half supplies a given key on Vercel is **unverified**: `site:.env.example:32-33` says a `BACKEND_URL` present at build is baked in, while `site:tests/mail/client-bundle.test.mjs:5-9` says a Vercel build emits `process.env` references and a local build writes this machine's `.env` values into the server chunks as literals (so delete local build output after use, §18.3). Whether a Turbo cache hit can replay output built with older values is **unverified** too (`root:turbo.json` declares no `env`). After any change: redeploy, then test the feature.
- A dashboard field keeps wrapping quotes that dotenv would strip. Only `OTP_EMAIL_FROM` and `TICKET_EMAIL_FROM` are cleaned of one pair (`site:src/lib/mailer.js:25-31`); paste every other value bare.
- **ADMIN:** `admin:src/lib/env.ts:3-7` validates `process.env` at run time, when the first module that imports it loads in an instance. The Razorpay keys and the webhook secret are read straight from `process.env` where they are used; the Razorpay SDK client is built on first use and kept for the instance (`admin:src/lib/razorpay.ts:5-17`). Fixed at build: the image optimizer's Cloudinary path, from `CLOUDINARY_CLOUD_NAME`, and `ZXING_WASM_VERSION` (`admin:next.config.ts:25-32`). Never set `NODE_ENV` by hand (`admin:.env.example:44`).
- **Keys that must agree across the two projects:**

| Key | SITE project | ADMIN project | When they disagree |
|---|---|---|---|
| `PROXY_SHARED_SECRET` | Required | Required, identical value | Bookings keep working, so no visitor-facing error points at it. All site visitors share one admin rate-limit bucket (sudden 429s), and webhook ticket mail is refused: 401 when the values differ, 503 when the site has none |
| `BACKEND_URL` | Optional in production; must lead to the ADMIN host's `/api/public`; default `https://ulsaham-admin-panel.vercel.app/api/public` (`site:src/lib/backend.js:13`) | Not read | The proxy answers 503 for everything when the value does not lead to `/api/public` |
| `SITE_URL` | Optional; base of the links in mail; default `https://www.ulsaaham.com` (`site:src/lib/mailer.js:41`) | Optional; where webhook ticket mail is posted; same default (`admin:src/lib/env-schema.ts:30-33`) | Ticket mail for bookings the webhook completes goes to the wrong host and is never sent |
| `FRONTEND_URL` | Not read | Site origin; default `http://localhost:3001` (`admin:src/lib/env-schema.ts:17`) | Only CORS for browsers that call the admin directly; the site goes through its proxy |

- Changing `PROXY_SHARED_SECRET`: set it in both projects and redeploy both; the symptoms in the first row apply until the second redeploy is live. With no value on ADMIN the ticket-mail request is never sent and only a log line says so (`admin:src/lib/site-ticket-mail.ts:29-33`).
- Housekeeping of values: remove `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` from the production environment after seeding, because only the seed reads them (not confirmed done); keep `SERVER_TIMING` unset outside a measurement window; the Razorpay keys exist only on ADMIN; secrets are generated in the owner's terminal, never in a chat (§2).

### 12.6 The admin deployment

- **Build command:** `admin:vercel.json` sets none, so Vercel's Next.js defaults apply (**unverified**): `npm install`, whose `postinstall` runs `prisma generate` (`admin:package.json:13`), then the `build` script, `prisma generate && next build` (`:7`).
- **The build stops on:** a type error (`ignoreBuildErrors: false`, `admin:next.config.ts:46-48`) and a missing `admin:public/zxing/zxing_reader-<installed zxing-wasm version>.wasm` (`:11-19`). It does not stop on lint (`ignoreDuringBuilds: true`, `:49-53`), tests or the bundle check. That a missing required env key stops it is **unverified**, because validation is lazy (§10).
- **No database push.** The build never runs `prisma db push`, so indexes and unique constraints change only through a manual push, made BEFORE the code that relies on them is merged (rule: §11; command: §14.4). The incident: a unique index on (eventId, phone) was dropped from the schema on 2026-09-13 but stayed in production until 2026-10-04, and a second booking with the same phone was charged and then refused.
- **No database connection during the build.** `prisma generate` needs none, and the eager connect is skipped while `NEXT_PHASE` is `phase-production-build` (`admin:src/lib/prisma.ts:15-21`). Why: the build loads route modules but must not reach the database.
- **No seed, no data script, no cron.** Housekeeping runs from page views (§10); `admin:vercel.json` registers no schedule.
- **Region and functions:** `bom1` and `fluid: true` (`admin:vercel.json:3-4`); `x-vercel-id: bom1::bom1::...` was seen on `/api/public/events?limit=1` on 2026-10-11. Uploads are capped at 4 MB because Vercel rejects a function request body over 4.5 MB before the route runs (`admin:src/constants/index.ts:6-9`).
- **Work after the response:** the webhook's activity-log row and ticket mail (`admin:src/app/api/razorpay/webhook/route.ts:15-31`), the duplicate-payment log row and the housekeeping started from page views (§10) are scheduled with `after()`: they run once the answer has gone out and must fit in the function's time limit. Staff actions await their own log write. That this work always completes on the platform is **unverified**.
- **Outside Vercel:** MongoDB Atlas in Mumbai (the owner's statement, 2026-09-27); the Upstash region should be Mumbai too (**unverified**).
- **Order:** when the API contract changes, deploy ADMIN first, then SITE (§14.4).

### 12.7 Monitoring and logs

| What exists | What it gives | Where |
|---|---|---|
| Vercel Speed Insights, SITE only | Page timing from real visitors | A stub and `/_vercel/speed-insights/script.js`, emitted in production builds only (`site:src/layouts/BaseLayout.astro:55-63`). Data appears only if the feature is enabled on the project: **unverified** |
| Vercel build and function logs | Every `console.*` line and uncaught error, per deployment | Vercel dashboard of each project. Retention depends on the plan: **unverified** |
| Activity log | Audit trail of staff actions, plus `SYSTEM` rows written by the webhook and by duplicate payments | `ActivityLog` collection through `logActivity` (`admin:src/lib/activity-logger.ts:16-40`); page `/admin/logs`; kept 30 days (§10) |
| `Server-Timing` on ADMIN public GET routes | Rate-limit time, database phases, one MongoDB ping, region, cold start | Opt-in: set `SERVER_TIMING=1` and redeploy; remove it afterwards because it exposes internals (`admin:src/lib/server-timing.ts:3-11`) |
| `x-vercel-id`, `x-vercel-cache` | Edge and function region; cache state | Any GET (§18.6) |
| Third-party dashboards | Razorpay payments and webhook deliveries, the mail relay's log, Upstash, Atlas, Cloudinary | Each console (§15); nothing in code links to them |

- **Log lines to search for, SITE:** `[proxy] BACKEND_URL does not lead to ...`, `[backend] PROXY_SHARED_SECRET is not set ...`, `[send-otp] mail error:`, `[send-ticket] mail error:`, `[ticket-mail] refused: <reason>`, `[ticket-mail] mail error:`, `[google/callback] token error:`. Site logs carry the error message only, never request data.
- **ADMIN:** `[Razorpay Webhook] ...`, `[index-guard] LEGACY UNIQUE INDEX on Participant: ...`, `[ratelimit] A request relayed a visitor IP ...`, `[env] <KEY> is not set: ...`, `[ticket-mail] The site answered <status> for ticket ...`, `Rate limiter unavailable; allowing the request:`, `Public payment verify error:`, `Failed to log activity:`.
- The activity log is not an error log: `logActivity` swallows its own failures (`admin:src/lib/activity-logger.ts:36-39`), a failed staff sign-in writes no row, and a customer booking made on the site is logged only when the webhook completes it.
- **What does not exist:** no error tracker (no such dependency in either manifest), no uptime monitor, no alerting, no log drain, no health-check route, no Speed Insights on ADMIN, and no CI: neither repo has a workflow folder or git hooks, and neither Vercel build runs a test.
- Consequence: a production fault is noticed only when a customer or a staff member reports it, or when someone reads the logs. Ticket mail was broken for about 16 weeks (2026-06-12 to 2026-10-04) and Google sign-in for 6 days (2026-09-28 to 2026-10-04) before anyone saw it. Until monitoring exists, run §18.6 after every deploy.

---

## 13. Patches and tooling

### 13.1 Patches

- **No dependency is patched in either repo.** There is no `patch-package`, no `patches/` folder, and no `overrides`, `resolutions`, `patchedDependencies` or `trustedDependencies` in `root:package.json`, `site:package.json` or `admin:package.json`. Every registry range is a caret except `@types/bun`, which is `latest` (`root:package.json:12`); the lockfiles (`root:bun.lock`, `admin:package-lock.json`) are the only pin (versions: §4).
- Two things look like patches and are not: `xlsx` is installed from a tarball URL instead of the npm registry (`admin:package.json:51`), and the scanner's wasm file is a tracked copy named after the installed `zxing-wasm` version (`admin:public/zxing/zxing_reader-3.0.3.wasm`, checked at build by `admin:next.config.ts:5-19`).
- **The one patch is applied to build output:** `site:scripts/fix-vercel-routes.mjs`, the last step of `root:vercel.json:6`, run on the ROOT copy `root:.vercel/output/config.json` (first argument; the same relative path under the current folder is the default, `:78-79`). Bare line numbers in the rest of §13.1 are in this script.

| Step | What `fixRoutes(config)` does | Lines |
|---|---|---|
| 1 | Drops the security rule of an earlier run, so a second run changes nothing | `:53-54` |
| 2 | Finds the adapter's asset rule: `src` contains `_astro` and the `cache-control` header contains the word `immutable`. The adapter (`@astrojs/vercel` 8.2.11) writes `^/_astro/(.*)$`, `public, max-age=31536000, immutable`, `continue: true` | `:33-36,56` |
| 3 | If that rule sits after `{ handle: "filesystem" }`, moves it, unchanged, directly in front of the handle | `:64-68` |
| 4 | Inserts `{ src: "^/(.*)$", headers, continue: true }` directly in front of the handle (at index 0 when there is no handle) | `:70-73` |
| 5 | Returns a copy and leaves the input untouched; the command line writes it back tab-indented and logs the three indexes | `:75,83-90` |

- Why: Vercel serves a static file at the filesystem step and later routes run only when no file matched, so the adapter's rule never applied and every hashed file went out as `max-age=0, must-revalidate` (`:3-6`). `continue: true` is required because a header rule without it ends routing (`site:tests/build/fix-vercel-routes.test.mjs:59`).
- Headers added (`SECURITY_HEADERS`, `:22-26`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`. No CSP, HSTS or Permissions-Policy. `root:vercel.json` has no `headers` block, so removing the patch step silently drops all three. The three headers were seen live on 2026-10-11 (§12); the cache header on a hashed asset is **unverified** in production.
- It fails the build on purpose: any error prints its message and sets exit code 1, which breaks the `&&` chain (`:109-113`). Cases: the file is missing or is not valid JSON; `routes` is not an array (`fix-vercel-routes: config.json has no routes array`, `:49-51`); no immutable `_astro` rule exists (`fix-vercel-routes: @astrojs/vercel no longer writes the immutable /_astro rule. ...`, `:56-62`). Why: an adapter upgrade that changes the layout must be noticed, not silently lose the cache (`:14-15`). Expect this after a bump of `@astrojs/vercel`.
- `main()` runs only when the script is the entry point. Both paths go through `realpathSync` and are lower-cased on Windows, because a symlinked checkout would otherwise skip `main()` and exit 0 without patching (`:93-107`). A local build is never patched: `bun run build` is only `astro build` (`site:package.json:7`) and the patch step exists only in `root:vercel.json:6`, so a local `site:.vercel/output/config.json` keeps the adapter's order and has no security rule.
- Test: `site:tests/build/fix-vercel-routes.test.mjs`, 10 tests in the default run: rule order, exact headers, other routes keep their order, idempotence, no mutation, an already-correct order, no filesystem handle, both throw cases, Vercel's own `normalizeRoutes` (skips itself when `@vercel/routing-utils` cannot be resolved, test lines 108-116), and the command line exiting 1 with the message on stderr (test lines 122-141).

### 13.2 Dev proxy

- `site:astro.config.mjs:35-43` maps `/api/public` under `astro dev` to `readOnlyProxy("https://ulsaham-admin-panel.vercel.app")`, which is the Vite proxy options `{ target, changeOrigin: true, secure: true, bypass: readOnlyBypass }` (`site:scripts/dev-proxy.mjs:28-30`). Bare line numbers in the next three bullets are in that script.
- Passes: `GET` and `HEAD`. `readOnlyBypass` returns `undefined` and Vite forwards the request to the production admin panel (`:8,11`).
- A write gets a local answer. Every other method (`POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) receives status `403` with `Content-Type: application/json; charset=utf-8`, `Content-Length`, `Cache-Control: no-store` and the body `{ "success": false, "error": "Local dev only reads from the production API; <METHOD> requests are refused so nothing is written there." }`. The function returns `req.url`, which Vite treats as handled, so the request never leaves the machine (`:13-25`).
- Why: Vite's proxy runs ahead of Astro's own `/api/public` route, so without the guard a booking, payment or coupon request made while developing would be written to the production database (`:3-6`).
- Consequences: read-like POSTs are refused too (for example `POST /api/public/participants/my-tickets`), and there is no switch to aim the proxy at a local admin (§14.3). The admin origin is written in three places that change together: `site:astro.config.mjs:40`, `site:src/lib/backend.js:13`, `site:tests/lib/backend-url.test.mjs:28`.
- Test: `site:tests/dev/dev-proxy.test.mjs`, 4 tests: unit checks, plus a real Vite server proxying to a local stand-in that must see only `GET` and `HEAD` (skips itself when `vite` cannot be imported, `:61-68`).

### 13.3 Lint and type tooling

| Topic | SITE | ADMIN |
|---|---|---|
| Config and command | `site:eslint.config.js` (ESLint 9 flat config); `bun run lint` = `eslint .` in the app folder | `admin:eslint.config.mjs` (flat config, presets loaded through `FlatCompat`); `npm run lint` = `eslint .` |
| Rule sets | `@eslint/js` recommended; `eslint-plugin-react-hooks` `flat["recommended-latest"]` on `src/**/*.jsx`; `eslint-plugin-astro` `flat/recommended`; an inline plugin `local` | `next/core-web-vitals`, `next/typescript` |
| Fails the run | recommended errors, `react-hooks/rules-of-hooks`, `local/jsx-uses-vars`, the Astro preset's errors | preset errors; `@typescript-eslint/no-floating-promises` (type-aware, on `**/*.ts` and `**/*.tsx`) |
| Warns only | `no-unused-vars` (names starting with `_` and caught errors exempt), `no-empty` (an empty `catch` is allowed), `no-useless-escape`, every other react-hooks rule | `@typescript-eslint/no-unused-vars` (names starting with `_` exempt, `ignoreRestSiblings: true`) |
| Ignored paths | `.vercel/**`, `.astro/**`, `dist/**` | `.next/**`, `node_modules/**`, `coverage/**`, `public/**`, `next-env.d.ts` |
| Not linted | JSON, CSS, and everything at the repo root (the root has no lint script) | `public/**` and non-code files |
| Type check | None. No `.ts` file is tracked; `site:tsconfig.json` (extends `astro/tsconfigs/strict`) serves the editor only and `root:tsconfig.json` applies to nothing | `npm run typecheck` = `tsc --noEmit`, `strict`. `include` is `**/*.ts` and `**/*.tsx`, so `admin:test/`, `admin:scripts/*.ts` and `admin:prisma/seed.ts` are checked too (`admin:tsconfig.json:25`) |
| Gates a deploy | No | Lint no (`eslint.ignoreDuringBuilds: true`, `admin:next.config.ts:51-53`); type errors yes (`ignoreBuildErrors: false`, `:46-48`) |

- SITE whys: `local/jsx-uses-vars` exists because ESLint 9 does not count `<Card />` as a use of `Card`, so `no-unused-vars` would flag every component import (`site:eslint.config.js:11-13`). The other hooks rules only warn because they come from the React Compiler, which the site does not use (`:30-32`). Tidiness rules warn so a lint run never blocks on style (`:3-5`). Globals: Node for `scripts/**`, `tests/**` and `*.config.{js,mjs,cjs}`; CommonJS for `**/*.cjs`; browser plus Node for `src/**/*.{js,jsx}` (`:54-72`).
- ADMIN why: `no-floating-promises` is an error because an un-awaited database write or log call fails silently (`admin:eslint.config.mjs:26-36`). Neither repo has Prettier, git hooks or CI, so lint runs only when someone runs it. Current warning counts: §18.

### 13.4 Bundle-size guards

| Topic | SITE `site:tests/build/bundle-budget.test.mjs` | ADMIN `admin:scripts/check-bundle.mjs` |
|---|---|---|
| Run | after `bun run build`, with `BUNDLE_CHECK=1` (§14.2) | after `npm run build`: `npm run check:bundle` |
| Reads | the first that exists of `site:.vercel/output/static` and `root:.vercel/output/static` (`:42-45,209`) | `admin:.next/app-build-manifest.json`, `admin:.next/build-manifest.json` and the chunks they name (`:57-65`) |
| Unit | bytes, gzip level 9, per built `.html` page (`:110`) | KB with 1 KB = 1000 bytes, gzip level 9, per page route (`:25,72,100`) |
| Sums | the page's static-import closure: `astro-island` URLs (`component-url`, `renderer-url`, `before-hydration-url`), `<script type="module">` sources and inline imports, then every static `import` or `export ... from` of a `.js` file (`:47-51,76-107`) | `rootMainFiles`, the chunks of every `layout`, `template`, `error`, `loading` and `not-found` above the page, and the page's own chunks; `.js` only (`:55,86-98`) |
| Leaves out | `import()` targets, classic scripts, island and script URLs that do not start with `/`, bare import specifiers, CSS, fonts, images | polyfills (`:9-10`), CSS |
| Extra rules | no page may load jsPDF up front (file name `/jspdf/i` or content `/%PDF-\|jsPDF/`, `:39-40`); a referenced file missing from the build fails | the participants page must not first-load SheetJS (`/SheetJS\|XLSX\.version/`) or jsPDF (`/%PDF-/`); only `/admin/scan` and `/admin/events/[id]/scan` may reference `zxing` (`:47-53,116-130`) |
| New or removed page | a page with no entry in `BUDGETS` fails, and so does an entry whose page was not built (`:119-121,134`) | a new page gets the largest existing budget until it has its own (`:44-45`) |

- When to change a budget (numbers and headroom: §18): both sets were fixed about 5% above the build they were measured from. Raise one only for a deliberate size increase, in the same commit as the change (`admin:scripts/check-bundle.mjs:19`), to about 5% above the new measurement, and update the measured figure in the trailing comment. Lower it the same way when a page shrinks on purpose (as was done at `admin:scripts/check-bundle.mjs:28-29`). An unexpected failure usually means one stray static import: fix the import, not the budget (`site:tests/build/bundle-budget.test.mjs:1-4`).
- The SITE gate is `BUNDLE_CHECK === "1"`, not `CI`, because Vercel sets `CI` in every build and the plain test run would then fail before any output exists (`site:tests/build/bundle-budget.test.mjs:8-10`). Two self-tests of the walker on a temporary fixture always run (`:170-201`).
- Neither guard runs on Vercel or anywhere automatically, and each checks whatever build output is on disk, which may be stale. ADMIN totals are a little larger than Next's "First Load JS" column (`admin:scripts/check-bundle.mjs:10-11`); with no build the script exits 1 with ``No build found in .next/: run `npm run build` first.`` (`:60-63`).

### 13.5 Test support code

SITE: `site:tests/mail/support/` holds the helpers of every test area (the mail suite came first). All 25 test files import from it, so moving or renaming the folder breaks the whole suite. Line numbers in the table are in the module named in the first column.

| Module | Provides | Why |
|---|---|---|
| `paths.mjs` | `APP_ROOT`, `REPO_ROOT`, `SRC_URL`, `appFileUrl`, `appPath`, `repoPath`, all derived from the file's own location | A hard-coded drive letter is a second module identity on Windows (`f:` against `F:`); a patch installed through one spelling is invisible to the other (`:4-6`) |
| `env.mjs` | `setTestEnv(overrides)` deletes 15 managed keys, sets dummies with per-run random secrets (`makeSecret`) and the sentinel `ULSAHAM_TEST_ENV=1`; `hasTestEnv()` | A value from the shell or a stray `--env-file` never reaches the code under test (`:5-6`). The default `BACKEND_URL` is `http://127.0.0.1:9/api/public`: the discard port refuses at once, so an unstubbed request never reaches the live admin panel (`:33-36`) |
| `load.mjs` | registers the hooks with `module.register()`; `loadSource(rel)` imports a `src` module as `...?v=<n>` and throws `call setTestEnv() before loadSource()` without the sentinel | `node --env-file=.env --test` cannot hand real credentials to a test (`:12-16`) |
| `hooks.mjs` | `resolve` carries `?v=` to every import under `src/`, so one load is a private copy of env, rate-limit buckets and transporter; `load` rewrites `import.meta.env.PROD` to `(process.env.NODE_ENV === "production")` and `import.meta.env.NAME` to `process.env.NAME`, and throws `bare import.meta.env in <url>` for `/lib/mailer.js` and `/lib/otp.js` | Astro resolves `import.meta.env` at build time and Node has no equivalent, so the real files run instead of edited copies (`:1-6`). A bare `import.meta.env` would make the bundler copy the whole build-time environment into the output (`:28-30`) |
| `context.mjs`, `fake-smtp.mjs`, `mime.mjs` | stand-ins for Astro's route context (`makeCookieJar`, `makeContext`, `readJson`); a throwaway SMTP server on `127.0.0.1`, port 0 (`startFakeSmtp`); a MIME reader (`parseMail`) | Mail goes to a local server and is asserted byte for byte. Port 0 because Node runs test files as parallel processes (`site:tests/mail/support/fake-smtp.mjs:7-8`) |

- The site has no database. What keeps a SITE test off the network is set per file, not globally: each suite that calls out replaces `globalThis.fetch` (for example `site:tests/proxy/proxy.test.mjs:22`), and each mail suite either patches `nodemailer.createTransport` (`site:tests/mail/mailer.test.mjs:9-20`) or points `SMTP_HOST` at `127.0.0.1` and the fake server's port (`site:tests/mail/routes.test.mjs:15-17`). The default `SMTP_HOST` in `setTestEnv` is the real relay's host name with a dummy login, so a new mail test MUST do one of the two.
- `.jsx` and `.astro` files are never executed; tests read their source text. `site:tests/mail/client-bundle.test.mjs` deliberately sets no test env: it searches browser output for the real shell values and reports only the variable name (`:11-12,46-52`).
- ADMIN: `admin:test/setup.ts` runs before every test file (`admin:vitest.config.ts:14`). It overwrites 13 env keys with dummies so shell secrets are never used (`:8-24`); defaults `DATABASE_URL` to a loopback address and stops the whole run with `Unit tests refuse to run: DATABASE_URL must point at localhost.` for any other host (`:29-39`); and stubs global `fetch` to throw `Network access in a unit test: mock fetch or the module that calls it` (`:43-48`).
- The same file replaces `@/lib/prisma` with a proxy that throws `DB access in a unit test (prisma.<key>): mock the repository instead` on any access (`admin:test/setup.ts:52-65`); every rate limiter with an always-allow stub and `runThrottled` with a no-op, keeping `getClientIP` and `allow` real (`:69-81`); and `@/lib/auth` with `auth()` returning `null` and no-op `signIn` and `signOut` (`:84-89`).
- `admin:vitest.config.ts:8-10` points `envDir` at `admin:test/` so Vite never loads `admin:.env.local`, which holds production credentials; `passWithNoTests: false` fails a run that finds no tests (`:15-17`). Never load `dotenv` or `admin:.env.local` in a test (`admin:test/setup.ts:4-5`).

### 13.6 Maintenance scripts as tools

| Script | Purpose | Arguments | Default mode | Writes to |
|---|---|---|---|---|
| `admin:prisma/seed.ts` (`npm run db:seed`) | Create or reset the super admin; create the settings row when none exists | none; reads `DATABASE_URL`, `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD` (8 or more characters) from `admin:.env.local` (`:1-2,13-18`) | Writes at once; no dry run | `Admin` (upsert: new bcrypt cost-12 hash, role `SUPER_ADMIN`, `isActive: true`); `Settings` (create only) |
| `admin:scripts/backfill-entry-type.ts` (`npx tsx <path>`) | One-off: settle unpaid bookings that never went through Razorpay (free event to `FREE`, paid event to `COMPLIMENTARY`) | `--apply`, `--free-only` | Dry run: prints the list | With `--apply` only: `Participant.amountPaid = true` and `entryType`, through `updateMany` filtered on `amountPaid: false`, so a re-run is safe (`:85-93`) |
| `admin:scripts/report-unrecorded-payments.ts` (`npx tsx <path>`) | List captured Razorpay payments that have no booking | `--days N` (default `90`) | Read-only | Nothing. It calls the live Razorpay API (keys from `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) and prints buyer names, phones, e-mails and payment ids: treat the output as personal data |
| `admin:scripts/lib/payment-pairing.ts` | Pure pairing logic of the report (`PRUNE_AFTER_DAYS = 14`, pairing window 30 minutes) | library, not run | n/a | Nothing; no database; unit-tested in `admin:test/content-forms.test.ts` |
| `admin:scripts/check-bundle.mjs` (`npm run check:bundle`) | Bundle guard (§13.4) | none | Read-only on `admin:.next/` | Nothing; no database |

- The first three open a database connection (their own `PrismaClient`) to whatever `DATABASE_URL` resolves to, and on the owner's machine `admin:.env.local` holds production credentials (`admin:vitest.config.ts:8-9`). They are run by the owner only, never by an AI session, which hands over the exact command instead (§2). `npm run db:push` and `npm run db:studio` are bare Prisma CLI calls (`admin:package.json:15,17`): see §11 and §14.4.
- The two `admin:scripts/*.ts` tools are run from the ADMIN repo root and read `admin:.env.local` with a hand-written loader that never overwrites a variable already set in the shell, so a shell value wins (`admin:scripts/backfill-entry-type.ts:13,26-36`, `admin:scripts/report-unrecorded-payments.ts:31-41`).
- Re-running the seed resets the super admin's password to the env value and re-activates the account; a different username creates a second super admin (`admin:prisma/seed.ts:23-36`). Read the dry-run list before `--apply`: on a paid event an unpaid staff-added booking may be someone who has not paid yet (`admin:scripts/backfill-entry-type.ts:19-20`).

### 13.7 Editor config, line endings and encoding

- `root:.editorconfig:1-5` is the only `.editorconfig` in either repo: `root = true` and `[*] charset = utf-8`. It sets no `end_of_line` and no indent rule. The ADMIN repo has none. The only other tracked editor files are `site:.vscode/extensions.json` and `site:.vscode/launch.json` (§14.1).
- BOM rule: text files are plain UTF-8 with no byte-order mark (`root:.editorconfig:1`); no tracked file has one. Why: a BOM in front of JSON breaks `JSON.parse` on a file read as text, as in `site:scripts/fix-vercel-routes.mjs:80` (inference). Windows PowerShell 5.1 writes one with `>` and `Out-File` (also with `-Encoding utf8`), so never create config, fixture or source files that way.
- Line endings: neither repo has a `.gitattributes`, and both clones on the dev machine run with `core.autocrlf=true`. The value comes from that machine's Git for Windows system config, not from either repo, so a new machine may differ. The git index is LF everywhere and the working tree is mixed: on 2026-10-11 `git ls-files --eol` showed 59 CRLF and 54 LF text files in SITE, 127 CRLF and 59 LF in ADMIN. A clone without `autocrlf` (the default on macOS and Linux) is LF throughout. Keep each file's existing ending and never run `sed -i` or a formatter over a CRLF file, or the diff covers the whole file. The byte-for-byte copy rule for `fee-cases.json` is checked at git blob level (the two blobs are identical); on disk the copies can differ in line endings.

---

## 14. Build, run and release

### 14.1 First-time setup on a new machine

The only declared tool version is `packageManager: bun@1.3.1` (`root:package.json:3`); neither repo has `engines`, `.nvmrc` or `.npmrc`, so Node is not pinned (open item, §17). Use what the §18 baselines were measured with: Node v20.11.0, Bun 1.3.14, npm. Production values of the keys below live only in the two Vercel project environments (§12) and the owner's local env files, never in the repo. Meaning and defaults of each key: §6 (SITE) and §10 (ADMIN). Generate secrets in your own terminal, never in a chat: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

#### SITE repo

1. Install Git, Bun 1.3.1 or later (`root:package.json:3`) and Node 20.6 or later. Node is required although no file says so: the tests run under `node --test` and need `module.register()` (`site:tests/mail/support/load.mjs:1,5`). `node --test tests/` on Node 21 or later is **unverified**.
2. Clone the repo (GitHub path in §1) and check out `dev2`.
3. At the repo root run `bun install`. Add `--frozen-lockfile` to mirror Vercel (`root:vercel.json:5`).
4. Copy `site:.env.example` to `site:.env` (gitignored) and fill it from the table below.
5. At the repo root run `bun run dev` (Turbo starts `astro dev`) and open `http://localhost:4321`. The port is Astro's default (`root:README.md:98`) and is not set in the config: **unverified**. The VS Code launcher `site:.vscode/launch.json:6` points at `./node_modules/.bin/astro`, which does not exist in the app folder on the dev machine (Bun puts the binary in the root `node_modules`); use `bun run dev` instead.
6. Confirm: the home page lists live events (read from production, §14.3). In the app folder, `bun run test` ends with 0 failures and 3 skipped tests (they need a build), and `bun run lint` with 0 errors.

| Keys in `site:.env.example` | Where the value comes from | Needed locally |
|---|---|---|
| `OTP_SECRET` | Generate a new one | No: outside a production build a placeholder is used (`site:src/lib/otp.js:17-22`). Never deploy the example's placeholder (`site:.env.example:6`): any non-empty value counts as configured (`site:src/lib/otp.js:5,13-15`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `OTP_EMAIL_FROM`, `TICKET_EMAIL_FROM` | Brevo dashboard: the SMTP settings and the verified senders (`site:.env.example:11-26`) | Only to send mail; without `SMTP_HOST`, `SMTP_USER` and `SMTP_PASS` the mail routes answer 503 (`site:src/lib/mailer.js:43-45`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud console, OAuth client | Only for Google sign-in |
| `PROXY_SHARED_SECRET` | Must equal the admin's value: your `admin:.env.local` locally, both Vercel projects in production | Only for per-visitor rate limits and `/api/internal/ticket-mail` |
| `BACKEND_URL`, `SITE_URL` | Not secrets: your local admin origin (`http://localhost:3000`) and the public site origin | No: both have defaults |

#### ADMIN repo

1. Install Git and Node 20 with npm (`admin:package-lock.json` is lockfile version 3). Clone the repo (GitHub path in §1) and check out `dev3`.
2. Run `npm install`. Its `postinstall` runs `prisma generate` (`admin:package.json:13`), which needs no database. `xlsx` is fetched from a tarball URL (`admin:package.json:51`), so that host must be reachable.
3. Copy `admin:.env.example` to `admin:.env.local` (gitignored) and fill it from the table below. Use a development database of your own: every local command acts on whatever `DATABASE_URL` points at, and the owner's `admin:.env.local` points at production.
4. For a new, empty database only: create the indexes with the push command in §14.4, then run `npm run db:seed` (§13.6). Both open a database connection, so a person runs them, never an AI session.
5. Run `npm run dev` and open `http://localhost:3000/login`; sign in with the seeded account. Port 3000 is Next's default (**unverified** in the repo; `site:src/lib/backend.js:16` assumes it).
6. Confirm: `npm run typecheck` reports 0 errors and `npm test` passes (the tests need no database, network or build).

| Keys in `admin:.env.example` | Where the value comes from | Notes |
|---|---|---|
| `DATABASE_URL` | MongoDB Atlas: a development database | Required |
| `AUTH_SECRET`, `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD` | Generate the secret; choose the account (password of 8 or more characters) | `AUTH_SECRET` is required; the other two are read only by the seed (`admin:src/lib/env-schema.ts:37-42`) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard | Required |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash console | Required |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay dashboard, API Keys: TEST keys (`rzp_test_...`) for development (`admin:.env.example:26-28`) | Needed for any payment |
| `RAZORPAY_WEBHOOK_SECRET`, `PROXY_SHARED_SECRET` | Razorpay dashboard, Webhooks; the same value as the site | May stay empty locally: one warning at load (`admin:src/lib/env.ts:11-26`) |
| `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `FRONTEND_URL`, `SITE_URL` | Not secrets; the example values are the deployed hosts | Locally delete the first three, do not blank them: an empty value fails URL validation, and an absent `FRONTEND_URL` defaults to `http://localhost:3001` (`admin:src/lib/env-schema.ts:10,17-18`) |
| `NODE_ENV`, `SERVER_TIMING` (comments only, no live line) | Set neither | Next and Vercel set `NODE_ENV` themselves (`admin:.env.example:44-50`) |

#### Windows versus macOS and Linux

- `root:vercel.json:5-6` runs only on Vercel. `installCommand` is `bun install --frozen-lockfile`; `buildCommand` is `bun run build && mkdir -p .vercel/output && cp -r apps/site/far-fusion/.vercel/output/. .vercel/output/ && node apps/site/far-fusion/scripts/fix-vercel-routes.mjs .vercel/output/config.json`. The copy and patch steps are POSIX shell (`mkdir -p`, `cp -r`, `&&`): they run on Vercel's Linux builder, not in cmd or Windows PowerShell 5.1; running the chain in Git Bash is **unverified**. Locally only `bun run build` is needed (why the copy exists: §12; the patch: §13.1).
- `VAR=1 command` is POSIX. In PowerShell write `$env:BUNDLE_CHECK = '1'; node --test tests/` and afterwards `Remove-Item Env:BUNDLE_CHECK`. Windows PowerShell 5.1 has no `&&`, and its `curl` is an alias: use `curl.exe`.
- On the dev machine `bun --cwd <dir> run <script>` printed help instead of running. Run scripts from inside the folder, or use `npm --prefix <dir> run <script>`. Line endings and the no-BOM rule also differ by platform: §13.7.

### 14.2 Everyday commands

The SITE app folder is `root:apps/site/far-fusion`. The repo root has only `dev` and `build` (`root:package.json:7-10`).

| SITE task | Command | Run from | Notes |
|---|---|---|---|
| Dev server | `bun run dev` | repo root or app folder | `astro dev`; data is read from production through the read-only proxy (§14.3) |
| Build | `bun run build` | app folder | `astro build`, about 35 s; output in `site:.vercel/output` and `site:dist`. From the root it goes through Turbo, where a cache hit replays old output without building |
| Tests | `bun run test` | app folder | `node --test tests/`; 3 tests skip without a build |
| Tests after a build, bundle check | `BUNDLE_CHECK=1 node --test tests/` | app folder | Adds the page budgets (§13.4) and the built-function smoke test (§18); the browser-bundle secret scan also stops skipping once build output exists. Use `tests/build/` as the path to run only the build tests |
| Lint | `bun run lint` | app folder | `eslint .`; warnings do not fail the run |
| Type-check, Prisma generate | none | | No TypeScript source and no database (§13.3) |

| ADMIN task | Command | Run from | Notes |
|---|---|---|---|
| Dev server | `npm run dev` | repo root | `next dev`; connects to the database as soon as a route loads (`admin:src/lib/prisma.ts:15-21`). Never from an AI session |
| Build | `npm run build` | repo root | `prisma generate && next build`; makes no database connection; stops on a type error or a missing zxing wasm file; skips lint |
| Tests | `npm test` | repo root | `vitest run`; needs no build |
| Lint, type-check | `npm run lint`, `npm run typecheck` | repo root | `eslint .`; `tsc --noEmit` |
| Tests after a build, bundle check | `npm run check:bundle` | repo root | Reads `admin:.next/` only; exits 1 without a build (§13.4). No ADMIN test needs a build |
| Prisma generate | `npm run db:generate` | repo root | Also part of `postinstall` and `build`; no database connection |
| Database commands | `npm run db:seed`, `npm run db:push`, `npm run db:studio`, `npm run start` | repo root | Each opens a database connection: owner only. `db:push` stopped on a missing `DATABASE_URL` as written (2026-10-04), because the Prisma CLI reads `admin:.env` and the repo has only `admin:.env.local` (§14.4); `db:studio` is the same kind of bare call (**unverified**) |

- Delete `site:.vercel/output` and `site:dist` after inspecting a local build: its server files hold this machine's `site:.env` values as literals (`site:tests/mail/client-bundle.test.mjs:5-9`). After changing only `site:.env`, build from the app folder: whether Turbo's cache notices a gitignored file is **unverified**. `bun run preview` with the Vercel adapter is **unverified** too. Neither repo has CI or git hooks, and the Vercel builds run no tests and no lint, so these commands run only when someone runs them.

### 14.3 What local development can and cannot exercise

| Area | With `astro dev` and the defaults | What it takes |
|---|---|---|
| Pages, lists and event detail with live data | Works: `GET` and `HEAD` go to the production admin through the read-only proxy (§13.2) | Nothing |
| Registration, coupons, payment order and verify, My Bookings look-ups (every `POST` under `/api/public`) | Refused locally with 403 | A local admin with its own database; call its API at `http://localhost:3000/api/public/...` or use the admin screens. The site has no switch to aim its dev proxy at a local admin (`site:astro.config.mjs:40`) |
| Site server routes `/api/auth/*`, `/api/send-ticket`, `/api/internal/ticket-mail` | Run locally with `site:.env`. Their look-ups go to `BACKEND_URL` (a local admin by default, `site:src/lib/backend.js:14-16`), not through the proxy | SMTP keys for mail, Google keys for Google sign-in, a running local admin for ticket look-ups |
| The site's own `/api/public` route, edge caching, the patched cache and security headers | Not reachable: Vite's proxy answers first, and the route patch runs only on Vercel | Unit tests (`site:tests/proxy/`, `site:tests/build/`) or a Vercel deployment |
| Payments | Need Razorpay TEST keys on the local admin (`admin:.env.example:26-28`) | Never test a payment with writes against production (§2) |
| Admin screens, staff sign-in, scanner, housekeeping | Need the local admin, its database and a seeded account (§14.1) | Razorpay cannot reach a local machine without a public tunnel, and none was ever tried (**unverified**); the webhook is covered by `admin:test/payment-routes.test.ts` |

- Never point `BACKEND_URL` at the production admin on a dev machine: server-side calls do not pass through the read-only proxy, which is why an unset value means a local admin outside a production build.

### 14.4 Release process

1. Work on `dev2` (SITE) or `dev3` (ADMIN). Before any write check `git status` and `git log -1`: commits made outside the current work have appeared mid-session (§2).
2. An AI session leaves its changes in the working tree and never commits, pushes or merges. The owner reviews the diff, runs the checks in §14.5, then commits and pushes the dev branch.
3. The owner opens a GitHub pull request from the dev branch to `main` and merges it in the GitHub UI with a merge commit.
4. The push to `main` starts the Vercel production deploy of that project. SITE runs `root:vercel.json:5-6`. `admin:vercel.json` sets no build command, so Vercel's default for Next.js applies (**unverified**): the `build` script, `prisma generate && next build` (`admin:package.json:7`).
5. Afterwards `main` holds a merge commit the dev branch lacks; the content is identical. Fast-forwarding the dev branch to `origin/main` before the next round avoids pull-request conflicts (the owner's step; done once, for SITE `dev2`, on 2026-09-27; ADMIN `dev3` holds no merge commit). The local `main` is stale in both clones, so compare against `origin/main`.

- **ADMIN first when the API contract changes** (a new or changed endpoint, field or error code that the site reads): merge and deploy ADMIN, then SITE. Why: the site proxies to the live admin, so site code that ships first calls something that does not exist yet.
- **An env change needs a redeploy.** Values are fixed into a deployment when it is created (§12): variables added after a build stayed missing until an empty commit forced a new deployment (SITE `aff0b98`, 2026-08-01). `PROXY_SHARED_SECRET` must be identical in both projects, so change and redeploy both.
- **A dependency change needs its lockfile in the same commit.** `bun install --frozen-lockfile` fails the SITE deploy when `root:bun.lock` does not match a `package.json`.
- **An index or `@unique` change needs a manual database push BEFORE the code that relies on it is merged** (rule: §11). The build never runs `prisma db push` (`admin:package.json:7`). A missed push left a legacy unique index in production, and a second booking was charged and then refused (2026-10-04, `admin:src/lib/index-guard.ts:4-8`).
- The push command: `npm run db:push` stops on a missing `DATABASE_URL`, because the Prisma CLI reads `admin:.env` and the repo has only `admin:.env.local`. The form that worked, run by the owner from the ADMIN repo root: `node -e "require('dotenv').config({path:'.env.local',quiet:true});require('child_process').execSync('npx prisma db push --skip-generate',{stdio:'inherit'})"`. It changes whatever database `admin:.env.local` points at (`dotenv` is a devDependency, `admin:package.json:61`). An AI session never runs it; it hands the owner the command.

### 14.5 Release checklist

#### SITE checklist

- [ ] On `dev2`; `git status` shows only the intended changes; `git log -1` is the expected commit.
- [ ] In the app folder: `bun run test` (0 failures) and `bun run lint` (0 errors).
- [ ] In the app folder: `bun run build`, then `BUNDLE_CHECK=1 node --test tests/` (0 failures; nothing skipped on the dev machine). Then delete `site:.vercel/output` and `site:dist`.
- [ ] A `package.json` changed: `root:bun.lock` is updated and in the commit.
- [ ] A page was added or removed: `BUDGETS` matches (`site:tests/build/bundle-budget.test.mjs:23-34`).
- [ ] The API contract changed: ADMIN is already live; `site:tests/fixtures/fee-cases.json` is a byte-for-byte copy of `admin:test/fixtures/fee-cases.json`; `site:tests/contract/public-event.json` lists the fields the admin allow-lists send (it has no admin twin file, `site:tests/contract/public-event.test.mjs:1-11`); a new endpoint is in `PATHS` (`site:src/pages/api/public/[...path].js:20-21`).
- [ ] A new env key is in `site:.env.example` and in the Vercel SITE project before the merge. A new host is in `security.allowedDomains` (`site:astro.config.mjs:14-21`).
- [ ] After the owner's merge and the deploy: the five SITE rows of the post-deploy table pass.

#### ADMIN checklist

- [ ] On `dev3`; `git status` and `git log -1` as above.
- [ ] `npm run typecheck` (0 errors), `npm test` (0 failures), `npm run lint` (0 errors).
- [ ] `npm run build`, then `npm run check:bundle` prints `Bundle check passed.` The owner runs these two: an AI session was blocked from building on 2026-10-11.
- [ ] `admin:prisma/schema.prisma` changed an index or `@unique`: the owner has run the push in §14.4 against production before the merge.
- [ ] A dependency update moved `zxing-wasm`: the wasm file is copied under the new name (`admin:next.config.ts:5-19`).
- [ ] A new env key is in `admin:.env.example`, `admin:src/lib/env-schema.ts`, the Vercel ADMIN project and, when the schema requires it, `admin:test/setup.ts`.
- [ ] The API contract changed: the SITE change that follows re-copies `fee-cases.json` and updates `public-event.json` (both named in the SITE checklist).
- [ ] After the owner's merge and the deploy: the ADMIN row of the post-deploy table passes.

#### Post-deploy checks

| Post-deploy check, GET or HEAD only | Expect |
|---|---|
| `https://www.ulsaaham.com/` | 200; `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`; `x-vercel-id` starts `bom1::` |
| `https://ulsaaham.com/` | 308 to `https://www.ulsaaham.com/` |
| `https://www.ulsaaham.com/api/public/events?page=1&limit=8&upcoming=true`, twice | `x-vercel-cache: MISS`, then `HIT` (`STALE` is also a pass); `x-vercel-id` is `bom1::bom1::...` |
| `https://www.ulsaaham.com/api/auth/google?next=/account` | A redirect to Google with `redirect_uri=https://www.ulsaaham.com/api/auth/google/callback` |
| `https://www.ulsaaham.com/_image?href=...` and `/robots.txt` | 403; served |
| `https://ulsaham-admin-panel.vercel.app/api/public/events?limit=1` | 200; `x-vercel-id` is `bom1::bom1::...` |

- All six passed on 2026-10-11. Command form: `curl -s -o /dev/null -D - "<url>"`. A redeploy empties the edge cache, so the first list request after it is a `MISS` (both from `root:README.md:167`).
- Not covered by read-only checks, so the owner confirms them by normal use: sign-in and ticket e-mail delivery (ticket mail is **unverified** in production since the 2026-10-04 fix), a payment, the Razorpay webhook, the gate scanner. Never send `POST`, `PUT` or `DELETE` to production as a test (§2).

### 14.6 Rollback and emergencies

- **Code, the repo way:** the owner reverts the pull-request merge on `main` (a merge commit, so `git revert -m 1 <merge hash>`) and pushes; Vercel deploys the revert like any push. A contract change rolls back in the reverse order, SITE first, then ADMIN (inference from the deploy order). Neither repo's history holds a revert commit, so this path has never been exercised: **unverified**.
- **Code, the dashboard way:** promoting an earlier deployment in the Vercel dashboard is **unverified** for these projects. An older deployment keeps the env values it was created with (§12).
- **Database:** there are no migrations and no down path. A code rollback restores no index and no data. Indexes change only through the manual push in §14.4, and bookings pruned 14 days after an event are gone (§10).
- **Edge cache:** the repo has no purge hook. A SITE redeploy is the only flush it documents (`root:README.md:167`); a purge from the Vercel dashboard is **unverified**. Otherwise wait out the cache windows (§12).
- **Builds that stop on purpose:** the route patch (§13.1), a stale `root:bun.lock`, a type error or a missing zxing wasm file in ADMIN. That a failed build leaves the previous deployment serving is **unverified**.
- **Stop sales for one event:** a SUPER_ADMIN sets the event status to `BOOKING_CLOSED` or `CANCELLED` in the admin panel (§8). No deploy is needed. The admin API refuses new bookings from then on (`admin:src/lib/event-status.ts:34-44`); the site may show the old state until its cache window ends (§12).
- **Leaked secret:** rotate it at the service, update the Vercel environment and redeploy. `PROXY_SHARED_SECRET` changes in both projects together. Rotating `OTP_SECRET` only breaks sign-in codes already in flight (`site:.env.example:3-5`).
- **Money taken, no ticket:** the owner runs the read-only payments report (§13.6) and issues the booking from the admin participants screen (`admin:scripts/report-unrecorded-payments.ts:103-107`). Diagnosis recipes: §18.

---

## 15. Third-party services and accounts

The accounts are held by the owner. No login, account name or secret is written here. Values of the keys below live in the Vercel project environment of the repo named, and in the git-ignored `site:.env` or `admin:.env.local` on a dev machine (never open them, G1). Full key tables: §6.7 (SITE) and §10 (ADMIN). Console settings already chosen: §16.

| Service | Used for | Configured where | Code entry points | Notes |
|---|---|---|---|---|
| Razorpay (payment gateway) | Orders, Checkout, payment confirmation, the `payment.captured` webhook, counter payments | ADMIN env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Razorpay dashboard: Settings, API Keys; Webhooks (`admin:.env.example:26-31`) | `admin:src/lib/razorpay.ts:7-17,112-118`; `admin:src/app/api/public/events/[slug]/payment/` (order, verify, status); `admin:src/app/api/razorpay/webhook/route.ts`; `admin:src/actions/payment.actions.ts`; checkout script at `site:src/lib/razorpay.js:4` and `admin:src/components/participants/enroll-dialog.tsx:56` | No key on the site. Test keys are meant for development (`admin:.env.example:27`); which kind the dev machine holds is unknown |
| MongoDB Atlas (database host) | The only data store: staff, events, bookings, settings, activity log | ADMIN env: `DATABASE_URL`. Atlas console for the cluster and its indexes | `admin:prisma/schema.prisma:5-8`; `admin:src/lib/prisma.ts`; `admin:src/repositories/` | Mumbai; indexes change by manual push only |
| Vercel (hosting, two projects) | SITE project (`www.ulsaaham.com`): static pages, one function, the edge cache. ADMIN project (`ulsaham-admin-panel.vercel.app`): the Next.js panel and API | `root:vercel.json`, `admin:vercel.json`; each project's dashboard for domains, env vars, production branch and plan (§12) | `site:astro.config.mjs:24`; `site:scripts/fix-vercel-routes.mjs`; `site:src/lib/edge-cache.js` | Both in `bom1`; plan **unverified** |
| Cloudinary (image and video CDN) | Event banners and galleries, partner logos, the home hero clips and their posters | ADMIN env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `admin:src/lib/cloudinary.ts:4-56`; `admin:src/app/api/admin/upload/route.ts`; `admin:next.config.ts:21-45`; `site:src/lib/image.js:8-22`; `site:src/pages/index.astro:10-16` | One account; the site has no Cloudinary key |
| Upstash Redis (rate-limit store) | The 13 public-API rate limiters and the once-an-hour housekeeping lock | ADMIN env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `admin:src/lib/ratelimit.ts:8-12,25-130,172-186` | Fails open |
| Brevo (SMTP relay) | Sign-in code mail and ticket mail | SITE env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `OTP_EMAIL_FROM`, `TICKET_EMAIL_FROM`. Brevo dashboard: Settings, SMTP and API, SMTP; verified senders (`site:.env.example:11-26`) | `site:src/lib/mailer.js:11-23,60-79`; `site:src/lib/ticket-mail.js`; `site:src/pages/api/auth/send-otp.js`; `site:src/pages/api/send-ticket.js`; `site:src/pages/api/internal/ticket-mail.js` | Delivery **unverified** since 2026-10-04 |
| Google OAuth (customer sign-in) | "Continue with Google" on `/login` | SITE env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Google Cloud console: the OAuth client and its authorised redirect URIs (`site:.env.example:38-40`) | `site:src/pages/api/auth/google.js`; `site:src/pages/api/auth/google/callback.js`; `site:src/lib/google-oauth.js`; `site:src/lib/google-complete.js` | One redirect URI per host |
| GitHub | Source hosting and pull requests for both repos; a push to `main` starts the Vercel deploy | Repository paths: §1. Branch flow: §19.1 | none: neither repo has a `.github` folder | No CI |
| Vercel Speed Insights (analytics) | Page-speed measurements of the customer site; the only analytics in the product | Vercel dashboard of the SITE project | `site:src/layouts/BaseLayout.astro:55-62` | SITE only |
| SheetJS CDN (spreadsheet library source) | Source of the `xlsx` package behind Excel import and export in the admin panel | `admin:package.json:51`: version 0.20.3 as a tarball URL | `admin:src/components/participants/import-participants-form.tsx:47,150`; `admin:src/components/participants/participant-table.tsx:592` | Not from the npm registry |

What people see when a key is missing or a service is down (status codes in full: §7.6):

| Service | Key missing | Service unreachable |
|---|---|---|
| Razorpay | No key id: `payment/order` answers 500. No key secret: `payment/verify` answers 500 "Payment configuration error". No webhook secret: the webhook answers 500 "Webhook not configured" | Order: 502 `GATEWAY_UNAVAILABLE` after 8 s, nothing charged. Verify: 502; the site retries and the webhook can still finish the booking |
| MongoDB Atlas, Cloudinary, Upstash | A missing required key makes env validation throw when a route loads, so EVERY public API route fails, bookings included (`admin:src/lib/env.ts:3-7`, `admin:src/lib/env-schema.ts:8-16`) | Database: 500 answers. Cloudinary: an upload fails with "Upload failed. Please try again." Upstash: rate limits switch off and housekeeping runs on every visit to the events page |
| Brevo | Without `SMTP_HOST`, `SMTP_USER` or `SMTP_PASS` the code and ticket mail routes answer 503; Google sign-in still works | One retry on a connection error (`site:src/lib/mailer.js:84-105`), then the route answers 500 |
| Google OAuth | No client id: the error shows on Google's page. No secret: back to `/login?error=google_token` | Back to `/login?error=google_token` or `google_profile` (`site:src/pages/api/auth/google/callback.js:45-60`) |

Other hosts a customer's browser contacts (the list to start from if a content security policy is ever added; none is set today):

| Host | Why | Where |
|---|---|---|
| `res.cloudinary.com` | Images and hero video; preconnected on every page | `site:src/layouts/BaseLayout.astro:48` |
| `checkout.razorpay.com` | Checkout script and payment window; DNS-prefetched on every page | `site:src/layouts/BaseLayout.astro:49`; `site:src/lib/razorpay.js:4` |
| `accounts.google.com` | Google consent screen, reached by a full-page redirect | `site:src/pages/api/auth/google.js:23` |
| Outbound links only: WhatsApp (`wa.me`), Instagram, Gmail compose, the venue map link staff type in | No script, no API call | the static pages and `admin:src/components/events/event-form.tsx:284` |

Detail per service:

- **Razorpay.** The public key reaches the browser as `keyId` in each order answer (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:158,201`). The webhook must point at `<admin origin>/api/razorpay/webhook`, be subscribed to `payment.captured` (G14) and use the secret in `RAZORPAY_WEBHOOK_SECRET`; without the secret it answers 500. `RAZORPAY_KEY_SECRET` also keys the ticket-code derivation (`admin:src/lib/ticket-code.ts:24-26`; a hard-coded fallback HMAC key string at `:25` is used when the env key is missing), so do not rotate it while payments are in flight. Refunds are made by hand in the dashboard. Auto-capture is expected to be on: **unverified**. The public order and verify routes cut an SDK call off after 8 s (`admin:src/lib/razorpay.ts:92`) and the webhook's order fetch after 3 s (`admin:src/app/api/razorpay/webhook/route.ts:19`); the counter's order creation has no timeout (`admin:src/actions/payment.actions.ts:80`).
- **MongoDB Atlas.** Only the ADMIN app connects, through Prisma; the site never does. The owner stated on 2026-09-27 that the cluster is in Mumbai (DEC-15; not checked from here). Indexes change only through a manual push (G24, §11). The database user must be allowed to run `listIndexes` on `Participant`, or the legacy-index guard reports "no legacy index" (`admin:src/lib/index-guard.ts:57-61,67`). Backups, cluster tier and network access rules are not recorded anywhere: unknown.
- **Vercel.** Both projects deploy from `main`. The SITE project's Root Directory is the repo root (DEC-02). Its env takes the 13 keys of `site:.env.example`, of which `BACKEND_URL` and `SITE_URL` may stay unset in production; what the dashboard holds is **unverified**. A changed value needs a redeploy (G20). The `.vercel` folder is git-ignored, so no project link travels with either repo. Open questions about the plan: §16.3.
- **Cloudinary.** Uploads go through the admin SDK into the folders `ulsaham/events` and `ulsaham/brand-partners`, stored as WebP (`admin:src/constants/index.ts:4-5`). The site only reads URLs and sizes them with a transform inside the URL (`c_limit,f_auto,q_auto,w_<n>`). The cloud name and the two hero clip ids are hard-coded at `site:src/pages/index.astro:12-14`. The admin image optimizer accepts this account's path only. Released images are deleted 2 hours later by housekeeping (§10); an upload that was never saved is never cleaned up.
- **Upstash Redis.** Keys use the prefix `ulsaham:` (`ulsaham:job:<name>` for the housekeeping lock). Every limiter gives up after 2 s or 3 s and lets the request through (G34). The site's own limits on sign-in and ticket mail are in memory per function instance, not in Upstash (`site:src/lib/rate-limit.js:1-11`). The region should be Mumbai: **unverified**.
- **Brevo.** Port 587 with `SMTP_SECURE` false. `SMTP_USER` is the SMTP login, a credential that must never appear as a sender; `SMTP_PASS` is the SMTP key, not the API key or the account password, and a stray space makes the relay answer 535 (`site:.env.example:15-20`). Each mail type has its own verified sender; the fallbacks are the constants at `site:src/lib/mailer.js:37-38`. One pooled transport, at most 3 connections (`:70-77`). The Brevo HTTP API is not used (§16.2).
- **Google OAuth.** Scope `openid email profile` (`site:src/pages/api/auth/google.js:18`). The client must list `https://www.ulsaaham.com/api/auth/google/callback` as a redirect URI, and one more for every extra host (G19). The function calls Google's token and userinfo endpoints (`site:src/pages/api/auth/google/callback.js:32,53`). A missing client id is not caught: the error shows on Google's page.
- **GitHub.** Hosting and pull requests only: no Actions and no CI. Branch protection settings are unknown.
- **Speed Insights.** The script tags are emitted only in a production build. The `@vercel/speed-insights` package is declared (`site:package.json:17`) but nothing imports it. Whether the feature is switched on for the project is **unverified**. The admin panel has no analytics, and neither repo has error tracking.
- **SheetJS.** Installed from the SheetJS CDN since `d3f60bd` (2026-09-27); the reason given in that round's work plan is known vulnerabilities in the npm build, 0.18.5 (no comment in the repo says so). `npm install` therefore needs that host reachable (inference). The library is loaded on demand in the browser, never on first load.
- **Deliberately not used:** Google Fonts (fonts are self-hosted in `site:src/assets/fonts/`), a public CDN for the scanner's wasm decoder (self-hosted in `admin:public/zxing/`), and the Astro image endpoint for remote images (`site:astro.config.mjs:29-34`).

---

## 16. Console and deployment decisions already made

Settings and choices that a clone of the repos does not show in full. Do not change one without the owner. "Confirmed" means seen in production on the date given (§18.6); "in code" means the repo proves it; **unverified** means it rests on notes or on the owner's word and should be checked in the dashboard. Product rules decided by the owner are in §2.5.

### 16.1 Decisions made

| ID | Decision | Date | Lives where | Status |
|---|---|---|---|---|
| DEC-01 | Production is the `main` branch of each repo; a push to `main` deploys that Vercel project. Work reaches `main` only by pull request from `dev2` (SITE) or `dev3` (ADMIN) | Agreed 2026-09-14; the last direct push to `main` was on 2026-08-09 | Vercel dashboard (Git, production branch); process | Confirmed by use (PR #27 and PR #30, 2026-10-04); the dashboard field is **unverified** |
| DEC-02 | The SITE project's Root Directory is the repo root and no `outputDirectory` is set; the build command copies the adapter output to the root | 2026-07-30 (`a4c2a9e`) | Vercel dashboard (Root Directory); `root:vercel.json:3-6` | Deploys work; the dashboard field is **unverified** |
| DEC-03 | Both projects are pinned to region `bom1` (Mumbai), next to the database | 2026-09-27 (owner) | `root:vercel.json:4`; `admin:vercel.json:4` | Confirmed 2026-10-11: `x-vercel-id` reads `bom1::bom1::` on both hosts |
| DEC-04 | The public host is `www.ulsaaham.com`; the apex domain redirects to it | unknown | Vercel dashboard (Domains); `site:astro.config.mjs:8,16-17` | Confirmed 2026-10-11 (308) |
| DEC-05 | The admin panel and API stay on the default Vercel host `ulsaham-admin-panel.vercel.app`, with no custom domain | unknown | Vercel dashboard; written into `site:src/lib/backend.js:13`, `site:astro.config.mjs:40`, `site:tests/lib/backend-url.test.mjs:28` | Confirmed 2026-10-11 (200) |
| DEC-06 | ADMIN runs with Fluid compute. Function ceilings: 60 s on the site, 15 s on the webhook | 2026-09-27; webhook 2026-10-04 | `admin:vercel.json:3`; `site:astro.config.mjs:24`; `admin:src/app/api/razorpay/webhook/route.ts:20` | In code; **unverified** in the dashboard |
| DEC-07 | The edge cache works by lifetime only, with no purge hook. Fresh plus stale seconds: detail 15 + 45, upcoming and featured lists 60 + 240, past lists 600 + 3000, partners 300 + 3300 | 2026-09-27 (owner) | `site:src/lib/edge-cache.js:13-20`, header `vercel-cdn-cache-control` (`:66-67`) | MISS then HIT confirmed 2026-10-11 for the upcoming list; the other three profiles **unverified** |
| DEC-08 | Security headers come from code, not the dashboard: on the site from the post-build route patch, on the admin from `next.config.ts`. Neither repo's code sets a CSP or an HSTS header | Site 2026-09-27; admin 2026-06-07 | `site:scripts/fix-vercel-routes.mjs:22-26`; `admin:next.config.ts:54-65` | Site `/` confirmed 2026-10-11; `/api/*` and the admin host **unverified** |
| DEC-09 | The Astro image endpoint is closed to outside images (passthrough service, no remote patterns) | 2026-09-27 | `site:astro.config.mjs:29-34` | Confirmed 2026-10-11: `/_image?href=...` answers 403 |
| DEC-10 | Hosts the site trusts: `www.ulsaaham.com`, `ulsaaham.com` and `**.vercel.app` (previews) | 2026-10-04 (`187547e`) | `site:astro.config.mjs:14-21` | Google redirect confirmed 2026-10-11 |
| DEC-11 | Env values live only in each Vercel project's environment. `PROXY_SHARED_SECRET` is the same in both; `SITE_URL` on the admin and `BACKEND_URL` on the site are left to their defaults; `NODE_ENV` is never set | Guidance given 2026-10-04 | both Vercel dashboards; defaults at `admin:src/lib/env-schema.ts:30-33`, `site:src/lib/backend.js:13,21` | **unverified** |
| DEC-12 | Razorpay has one webhook: `<admin origin>/api/razorpay/webhook`, event `payment.captured`, secret in `RAZORPAY_WEBHOOK_SECRET` | About 2026-10-04, when the owner added the secret | Razorpay dashboard; ADMIN env; `admin:src/app/api/razorpay/webhook/route.ts:34-59` | Secret added per the owner; successful deliveries **unverified** |
| DEC-13 | Mail goes through the Brevo SMTP relay on port 587, with one verified sender for sign-in codes and one for tickets. The single `EMAIL_FROM` key is retired | 2026-09-14 (`8ede162`) | Brevo dashboard; SITE env; `site:src/lib/mailer.js:33-39` | Sender verification and delivery **unverified** |
| DEC-14 | The Google OAuth client returns to `https://www.ulsaaham.com/api/auth/google/callback` | unknown; broken 2026-09-28, restored 2026-10-04 | Google Cloud console; `site:tests/build/function-smoke.test.mjs:131-135` | Redirect confirmed 2026-10-11; a complete sign-in was not re-run that day |
| DEC-15 | The database is MongoDB Atlas, in Mumbai | Owner's statement, 2026-09-27 | Atlas console | **unverified** from here |
| DEC-16 | Indexes change only through a manual `prisma db push` by the owner. The push of 2026-10-04 dropped the legacy unique index on (eventId, phone) and created three plain indexes | 2026-10-04 | the production database; `admin:prisma/schema.prisma:145-149` | The owner confirmed a second booking then worked; the index list is **unverified** from here |
| DEC-17 | Booking limits in Upstash: 10 per hour per IP and phone plus 60 per hour per IP, failing open | 2026-10-04 (`4f454da`); default accepted 2026-09-27 | Upstash console; `admin:src/lib/ratelimit.ts:22-39,65-79,133-144` | In code; the Upstash region is **unverified** |
| DEC-18 | One Cloudinary account; the admin image optimizer accepts that account's path only | 2026-09-27 (`d3f60bd`) | Cloudinary console; `admin:next.config.ts:21-26` | In code |
| DEC-19 | Speed Insights on the SITE project only, added from the Vercel dashboard offer | 2026-06-12 (`7cef99b`, PR #12) | Vercel dashboard; `site:src/layouts/BaseLayout.astro:55-62` | Tags are in the build; the dashboard switch is **unverified** |
| DEC-20 | No CI and no scheduled jobs: tests are run by hand and housekeeping runs on page views | never added | no `.github` folder; no `crons` in either `vercel.json` | In code |
| DEC-21 | Other defaults the owner accepted on 2026-09-27 and may flip: SMTP pool of 3; revenue recorded as the gross order amount; cancelled events keep a public page with a notice; the per-device "Enrolled" lock for counter staff stays; after sign-out only a Google flag stays in the browser | 2026-09-27 | `site:src/lib/mailer.js:73`; `admin:prisma/schema.prisma:132-135`; `site:src/components/EventDetail.jsx:294-298`; `admin:src/components/events/event-table.tsx:49-77`; `site:src/lib/auth.js:35-40` | In code |
| DEC-22 | Preview deployments sit behind Vercel sign-in. A throwaway test project exists on a second Vercel account | From the owner's notes | Vercel dashboard | **unverified** |

### 16.2 Options considered and rejected

| Option | Outcome | Reason |
|---|---|---|
| Preact instead of React | Rejected by the owner, 2026-09-27 | "Keep React" (G31) |
| A tick box, dropdown or manual marking for payment state | Tick box removed 2026-09-27 (`4a3f8a3`); the others rejected | Owner rule: Entry Type is read-only (G29) |
| Booking closes at the event START | Tried 2026-08-30, replaced 2026-09-13 | Owner rule: bookable until the end (G28) |
| One booking per phone or e-mail per event | Removed from the schema 2026-09-13; index dropped 2026-10-04 | It swallowed repeat paid bookings (G27) |
| Honouring reduced motion on the home coverflow | Written, then reverted before commit, 2026-09-27 | The owner wants visible motion (G32) |
| Cutting the coverflow to 12 posters | Rejected; it keeps 30 (`site:src/lib/page-data.js:11`) | Plan decision, 2026-09-27 |
| A purge hook from admin saves to the site edge | Not taken | Lifetime-only caching was chosen; a site redeploy is the only flush |
| The Brevo HTTP API for mail | Not taken | A new secret for about half a second saved on the sign-in mail only; an SMTP pool of 3 instead |
| Switching the Razorpay webhook to `order.paid` | Not taken | Without a code change every delivery would be answered `ignored` (G14) |
| Removing the per-device "Enrolled" lock for counter staff | Not taken; the lock stays | Plan decision, 2026-09-27 |
| Astro's image endpoint with remote patterns; Google-hosted fonts; the scanner's wasm from a public CDN | All replaced 2026-09-27 and 2026-09-28 | A public `/_image` re-encodes outside images; fonts cost two extra origins; no third party at the gate |
| `xlsx` from the npm registry | Replaced 2026-09-27 by the SheetJS CDN build | Known vulnerabilities in the npm build |
| Loading `qrcode` through `createRequire`; a Vercel `outputDirectory` of `dist` | Replaced 2026-10-04; removed 2026-07-30 | Each caused a production outage (G18, G17) |
| Event detail as server-rendered or ISR pages; caching at both edges; day-long stale windows; the native MongoDB driver, `aggregateRaw` or Prisma Accelerate; inlined CSS and tap-prefetch; paginated participants; framework major upgrades; a permanent `Server-Timing` header; removing `revalidatePath` from non-scan actions | The "not doing" list of the 2026-09-27 work plan | The reasons were written in that plan, which is in neither repo: ask the owner before reviving one |

- Dependency audit, 2026-10-04: 11 findings in ADMIN remain that need major upgrades (Tailwind 4, Next 16, Vitest 5). They are build-time or dev-time only and were left alone on purpose.

### 16.3 Actions handed to the owner and not confirmed done

All were raised with the owner on or around 2026-10-04. Each needs a dashboard, a production secret or a database connection, so an AI session cannot do them (G39). Tick one off here and in §17 when the owner confirms it.

| Action | Why it matters |
|---|---|
| Confirm that ticket e-mail is delivered in production | **unverified** since the fix of 2026-10-04 |
| Decide whether to re-send tickets to customers who booked from 2026-06-12 to 2026-10-04 | They never received one; a re-send was offered and not asked for |
| Confirm Razorpay webhook deliveries succeed, and that auto-capture is on | The webhook is the only recovery for a payment whose browser never returned |
| Run `npx tsx scripts/report-unrecorded-payments.ts --days 30` in the ADMIN repo | Finds payments that have no booking (read-only; output is personal data) |
| Run `npx tsx scripts/backfill-entry-type.ts`, read the list, then run it with `--apply` | Settles old unpaid bookings that never went through Razorpay (§13.6) |
| Move the Vercel plan from Hobby to Pro and enable Skew Protection | Hobby forbids commercial use; without Skew Protection an old tab cannot load new chunks after a deploy |
| Confirm the Upstash region is Mumbai | A far region adds delay to every public API call |
| Confirm `PROXY_SHARED_SECRET` is identical in both Vercel projects | G21 |
| Remove `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` from the production environment | Only the seed reads them (`admin:src/lib/env-schema.ts:37-42`) |
| Remove the obsolete worktree `../web-app-hotfix` and its branch `hotfix/ticket-mail-and-host` | Its three changes all shipped in PR #27; it only invites confusion (§19) |
| Run the Razorpay test-mode checklist on a preview, and the two-phone gate test | Asked for after PR #27 and PR #30; whether they were run is **unverified** |

---

## 17. Known issues and open items

Every open row was re-checked against the code on 2026-10-11 (site `dev2` `187547e`, admin `dev3` `ad5620c`). Each table is ordered by priority, highest first. Last column: `yes` means the owner must decide before any code changes, so do not implement it unprompted.

### 17.1 How to use this list

- IDs are stable and never reused or renumbered. `K1`-`K7` and `D26` come from the 2026-09-27 scan; a new item takes the next free number under `BLK-`, `SEC-`, `BUG-`, `DEBT-` or `UNV-`.
- Before working on a row, re-open its evidence (line numbers drift; the file and function name are the stable part) and read its last column.
- When a row is resolved or confirmed, delete it from its table and add it to §17.8 as the next `DONE-` number, with the date and the commit or PR (for a confirmation: who confirmed it and how).

### 17.2 Blockers

- **None known** on 2026-10-11. The site builds and all tests pass in both repos (§18.1); the admin build last passed on 2026-10-04 (UNV-15). The owner's live booking test passed on 2026-10-04 and the read-only production checks passed on 2026-10-11 (§18.6).
- A blocker (`BLK-`) is anything that, in production, takes money without issuing a ticket on the normal path, stops booking, sign-in or ticket delivery for every customer, exposes customer data with no workaround, or leaves `main` unable to build or deploy.
- Nearest candidates: UNV-01, UNV-02 and UNV-05 become blockers if their check fails; K2 becomes one on any day staff close booking during live sales.

### 17.3 Business rules awaiting the owner

| ID | Item | Impact | Evidence (path:line) | Next step | Needs owner decision |
|---|---|---|---|---|---|
| K1 | **My Bookings identity.** The lookup by phone or e-mail returns every ticket code with no proof of who asks | Anyone who knows a phone number can list that person's bookings and, through SEC-01, mail the QR ticket to any address | `admin:src/app/api/public/participants/my-tickets-by-user/route.ts:8-13,49-58`; `admin:src/lib/ratelimit.ts:116-122`; `site:src/components/AccountPage.jsx:436-438` | Owner picks an identity model (K1 note) | yes |
| K2 | **Payment captured after booking closed.** A paid booking is written only while the STORED status is `PUBLISHED` | Money taken, no ticket, when the status changes between order and payment | `admin:src/services/participant.service.ts:86`; `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:149-160,246-256`; `admin:src/app/api/razorpay/webhook/route.ts:201-204`; `admin:src/actions/payment.actions.ts:149-161` | Owner decides whether such payments are honoured (K2 note). Until then never change an event's status during live sales | yes |
| K3 | **Complimentary codes per seat, with an atomic counter.** One redemption counts as 1 use whatever the seat count, and the counter is not atomic | A code with `maxUses` 5 can admit 50 people; concurrent redemptions can pass `maxUses` | `admin:src/app/api/public/events/[slug]/register/route.ts:136-143,175-177`; `admin:src/repositories/event.repository.ts:293-306` | Owner decides per seat or per booking (K3 note) | yes |
| K4 | **Capacity reservation.** Capacity is count-then-insert with no transaction, and the paid path never re-checks after the order is created | Two buyers can both get the last seats | `admin:src/services/participant.service.ts:91-100`; `admin:src/app/api/public/events/[slug]/payment/order/route.ts:113-118`; `admin:src/app/api/public/events/[slug]/register/route.ts:148-156` | Owner decides how much oversell is acceptable (K4 note) | yes |
| K5 | **Staff sign-in lockout and `isActive` re-check.** Staff sign-in has no rate limit or lockout; `isActive` and the role are read only at sign-in | Unlimited password guessing; a deactivated account keeps working until the 24 h session cap | `admin:src/lib/auth.ts:29-58`; `admin:src/middleware.ts:8`; `admin:auth.config.ts:19,70-84` | Owner approves the limits (K5 note) | yes |
| K6 | **Past-event editing.** The edit form validates with the CREATE schema, which refuses any date before today (IST) | A past-dated event cannot be re-saved from the form unless its date is moved | `admin:src/components/events/event-form.tsx:75`; `admin:src/validators/event.validator.ts:134-145,182-217` | Owner confirms past events may be edited freely (K6 note) | yes |
| K7 | **Gate scan policy.** The scanners never look at `amountPaid`, the event status or the day | Unpaid, cancelled-event and wrong-day tickets are admitted without warning | `admin:src/actions/participant.actions.ts:195-230,291-337`; `admin:src/repositories/participant.repository.ts:291-306` | Owner decides warn, block or override (K7 note) | yes |
| D26 | **Refund versus ticket.** No refund event is handled, and a deleted paid booking can be re-created by replaying its original verify call | A refunded and deleted ticket can come back with a working QR | `admin:src/app/api/razorpay/webhook/route.ts:56-59`; `admin:src/repositories/participant.repository.ts:208-210`; `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:111-112,127-130,201-216`; `admin:src/services/participant.service.ts:106,117-118` | Owner decides whether a refund invalidates the ticket (D26 note) | yes |

- **K1 note.** `POST /api/public/participants/my-tickets-by-user` accepts a 10-digit phone or an e-mail; a returned code is then the only credential for `my-tickets` and `participants/check`. The only limit is 10 per minute per IP. Recommended, not decided: a verified e-mail cookie session; until then phone lookups return no codes and the admin route requires `x-proxy-key`; move the OTP limits to a shared store first (SEC-04).
- **K2 note.** Triggered when staff close, unpublish or cancel the event, or the sweep stores `COMPLETED`, between order and payment. Verify answers 500 `REGISTRATION_FAILED`, which the site retries after 1, 3 and 6 s before showing the Payment ID; a cancelled event, or one moved back to draft, gets 404 `EVENT_NOT_FOUND` with no retry. The webhook answers 500 on every Razorpay retry (UNV-19). The staff counter fails the same way. Recommended, not decided: honour the payment whenever an order id is present, log "Paid after booking closed", flag cancelled events for refund. Stranded payments are found with UNV-04.
- **K3 note.** The route tests `maxUses - usedCount <= 0` and adds 1 per booking of up to 10 seats. The write is a read-modify-write of the whole embedded code array, so two redemptions at once, or an event save at the same moment, can lose an increment. Recommended, not decided: count per seat with one atomic `$inc` by the seat count through `arrayFilters`.
- **K4 note.** The seat count sums `numberOfParticipants` over all rows, unpaid ones included (`admin:src/repositories/participant.repository.ts:212-218`). A paid booking is never refused for capacity after payment, on purpose: the money has moved. Recommended, not decided: an atomic `seatsTaken` counter for free registrations; accept rare oversell on paid bookings until a time-limited reservation exists. Any counter must follow edit, delete, import and prune (§10).
- **K5 note.** `api/auth` is outside the middleware matcher and `authorize()` calls no limiter, so only bcrypt cost 12 slows guessing; a failed sign-in writes no log row. Role and identity live in the JWT, so deactivate, delete, demote and password reset all wait for the cap. Recommended, not decided: 5 per 15 min keyed `ip:username` plus 20 per 15 min per IP; an `Admin.tokenVersion` field (no index, so no `db push`) bumped on deactivate, delete and reset and re-checked at most every 5 min. The timing-leak part is done (DONE-10).
- **K6 note.** The server-side update schema has no date rule, so only the form blocks the save (a typo fix, new gallery images). Recommended, not decided: a separate form schema for editing, without the date rule.
- **K7 note.** The scan actions check only the ticket code, the event id (event scanner only) and the entered count; the global scanner admits any event's ticket. As of 2026-10-11 no code path writes an unpaid booking (every create passes `amountPaid: true`; the schema default is `false`, `admin:prisma/schema.prisma:120`), so the unpaid case concerns legacy rows (UNV-13). Recommended, not decided: return `amountPaid`, the effective status and the IST event day from both scan actions; a red warning with an explicit override; a manual "enter code" field (also closes BUG-09).
- **D26 note.** The webhook ignores every event except `payment.captured`, and deleting a booking is a plain row delete that keeps no trace of its order. Order id, payment id and signature never expire, so a re-sent verify finds no booking and rebuilds it from the order notes with the same ticket code; the old QR works again while the event is `PUBLISHED`. Suggested, not decided: keep deleted order ids and refuse them in verify, or check the payment for a refund in verify. The scan's default was "flag the ticket, warn at the gate, staff decide".
- Owner decision of 2026-09-27: speed, bugs and payment reliability first, K1-K7 later. Each "Recommended" is the scan's default, not an instruction. Order matters: K1 before any server-side session; a K4 counter also touches K3's write.

### 17.4 Security

| ID | Item | Impact | Evidence (path:line) | Next step | Needs owner decision |
|---|---|---|---|---|---|
| SEC-01 | `/api/send-ticket` mails any PAID ticket to any address: there is no ownership check, and its same-site check trusts an `Origin` header a script can set | With K1 a stranger can obtain someone's QR ticket; also free mail from the company sender. Ceilings: 12 per hour per IP, 6 per hour per ticket, held in one instance's memory | `site:src/pages/api/send-ticket.js:11-12,18,24-28,73-77`; `site:src/lib/http.js:17-34` | Fix with K1: send only to the signed-in address or the address on the booking | yes, with K1 |
| SEC-02 | The admin public API never refuses a caller: CORS headers only, no Origin allow-list, no `x-proxy-key` requirement on POST routes | Any server-side client can call the admin host's `/api/public/*` directly, skipping the site proxy's path allow-list; a foreign Origin still gets a normal answer | `admin:src/lib/cors.ts:3-25`; `admin:src/lib/ratelimit.ts:188-195,209-225` | Answer 403 to a POST without a valid `x-proxy-key`, after UNV-03 is confirmed; deploy admin, then site | yes |
| SEC-03 | `PROXY_SHARED_SECRET` does two jobs: it marks trusted proxy requests and keys the ticket-mail signature, whose body carries a caller-chosen address | A leaked secret lets an attacker spoof visitor IPs and mail any paid ticket anywhere | `site:src/lib/backend.js:11,42-48,84`; `admin:src/lib/site-ticket-mail.ts:29,35-43` | Derive a separate signing key on both sides; deploy admin first | no |
| SEC-04 | The site has no server-side session, and its own limits (code send and verify, ticket mail) live in one function instance's memory | A cold start, or more than 10,000 keys, clears every limiter; "signed in" is a `localStorage` entry anyone can write | `site:src/lib/rate-limit.js:1-23`; `site:src/pages/api/auth/verify-otp.js:10-15` | Move the limits to a shared store before a code ever issues a session | yes, with K1 |
| SEC-05 | A session with no `role` is treated as ADMIN: the layout and three action files fall back to `"ADMIN"`, and several guards are deny-lists (`role === "USER"`) | Latent privilege escalation if a token ever lacks a role (as of 2026-10-11 `jwt()` always sets it, `admin:auth.config.ts:73`) | `admin:src/app/admin/layout.tsx:19`; `admin:src/actions/event.actions.ts:23`; `admin:src/actions/participant.actions.ts:28`; `admin:src/actions/settings.actions.ts:17` | One shared `getSession()` that refuses a missing role | no |
| SEC-06 | The participants export returns whole booking rows, Razorpay order and payment ids included, to ADMIN and SUPER_ADMIN browsers | Breaks the page's own rule that those references never reach the browser | `admin:src/actions/participant.actions.ts:454-458`; `admin:src/app/admin/events/[id]/participants/page.tsx:45-57` | Build the export columns on the server | no |
| SEC-07 | No Content-Security-Policy on either app; the site sets three headers only and no Permissions-Policy | No second line of defence against script injection on pages that open Razorpay Checkout | `site:scripts/fix-vercel-routes.mjs:22-26`; `admin:next.config.ts:54-65` | Start with a report-only policy (Razorpay, Cloudinary, Speed Insights), then enforce | no |
| SEC-08 | Upload and partner inputs are trusted: the upload route checks the browser-declared MIME type and allows ADMIN although both uploading pages are SUPER_ADMIN only; `addBrandPartnerAction` stores `name`, `logoUrl` and `logoId` unvalidated | Staff-only surface: a wrong file type or a foreign logo URL can be stored and then shown on the home page | `admin:src/app/api/admin/upload/route.ts:14,33`; `admin:src/actions/settings.actions.ts:58-69` | Check file signatures, restrict to SUPER_ADMIN, validate the partner with Zod | no |
| SEC-09 | Admin rate limits fail open: an Upstash error, or a limiter slower than 2000 ms (reads) or 3000 ms (writes), lets the request through | During an Upstash outage the booking and lookup routes have no limit. Chosen on 2026-09-27 so an outage does not turn every public route into a 500 (§16) | `admin:src/lib/ratelimit.ts:14-20,137-144` | Accepted risk; revisit with K1 | no |
| SEC-10 | The proxy follows upstream redirects, so `x-proxy-key` would travel to a redirect target | Low: the upstream is this project's own admin panel | `site:src/pages/api/public/[...path].js:115-119,150-155` | Add `redirect: "manual"` and answer 502 on a 3xx | no |
| SEC-11 | Rate limits key on the full client address | An IPv6 /64 could rotate addresses; **unverified** whether Vercel passes IPv6 client addresses | `admin:src/lib/ratelimit.ts:209-225` | Key IPv6 on its /64 prefix | no |
| SEC-12 | The example value of `OTP_SECRET` is a non-empty placeholder, and env files are only partly ignored (`.env.development` and `.env.staging` are ignored nowhere) | A deployment that copies the example unchanged counts as configured and signs cookies with a public value; a stray env file could be committed | `site:.env.example:6`; `site:src/lib/otp.js:5,13-15`; `root:.gitignore:19-23`; `site:.gitignore:17-18`; `admin:.gitignore:27-32` | Empty the example value or refuse the placeholder; ignore `.env*` except `.env.example` | no |
| SEC-13 | The HMAC that derives seeded ticket codes falls back to a hard-coded key literal when `RAZORPAY_KEY_SECRET` is unset, and the env schema marks that key optional | Latent: on a deployment without Razorpay keys a free booking's code can be computed from its event id and request id | `admin:src/lib/ticket-code.ts:25` (hard-coded fallback key); `admin:src/lib/env-schema.ts:20` | Throw when the key is missing, or give the derivation its own secret | no |

### 17.5 Bugs and risky behaviour

| ID | Item | Impact | Evidence (path:line) | Next step | Needs owner decision |
|---|---|---|---|---|---|
| BUG-01 | Customers who booked between 2026-06-12 and 2026-10-04 never got a ticket e-mail (the mail function could not load `qrcode`; fixed, DONE-01) | They hold a valid booking but no mail; each can still use Email Ticket or Download Ticket in My Bookings | `site:src/lib/ticket-mail.js:1-4`; button at `site:src/components/AccountPage.jsx:340` | A re-send was offered and not requested. If wanted: a one-off, owner-run script over paid bookings that have an address, calling the signed `/api/internal/ticket-mail` (§7). Bookings are pruned 14 days after their event | yes |
| BUG-02 | A ticket can be e-mailed twice: the webhook asks the site to mail a booking it completed and the browser may mail the same one; the de-dupe lasts 60 s and lives in one function instance | Duplicate mail only; no money effect | `site:src/lib/ticket-mail.js:15-19`; `site:src/lib/rate-limit.js:10`; `admin:src/app/api/razorpay/webhook/route.ts:27-31` | Options: a shared-store de-dupe key, or a "mailed at" field on the booking | yes |
| BUG-03 | Renaming an event's slug during live sales breaks payment confirmation: verify looks the event up by the slug in the URL | The browser is told 404 `EVENT_NOT_FOUND` after the money moved; the webhook still books by the `eventId` in the order notes, so the ticket appears later in My Bookings | `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:112,129,149-153` | Resolve the event from the order notes in verify, or refuse slug edits on a published event | no |
| BUG-04 | Lost-tab recovery only finds a booking that verify or the webhook has already written: `payment/status` never asks Razorpay. The site polls every 3 s for 60 s, looks a record up for 30 min (kept 24 h) and holds ONE record for all events | If the webhook is failing (UNV-02), a payment whose tab was lost has no ticket until staff reconcile it | `admin:src/app/api/public/events/[slug]/payment/status/route.ts:60-72`; `site:src/lib/pending-payment.js:9-14`; `site:src/components/RegistrationForm.jsx:35-36,349-381` | Let the status route fetch the order from Razorpay when nothing is recorded | no |
| BUG-05 | Sign-out does not clear `ulsaham_pending_payment` (phone, optional e-mail, order id, payment id; kept up to 24 h) | On a shared phone the next person who signs in and opens the same event within 30 min triggers the recovery check, and a found booking is added to THEIR bookings | `site:src/lib/auth.js:35-40`; `site:src/components/RegistrationForm.jsx:357-362,415-416` | Call `clearPendingPayment()` from `clearUser()` | no |
| BUG-06 | Save Changes on `/account` throws for a visitor who signed in by e-mail code and has no stored name: the field starts `undefined`, the form is `noValidate`, and the handler calls `.trim()` on it | The profile cannot be saved until a name is typed. Found by reading, not reproduced | `site:src/components/AccountPage.jsx:508,532,611` | Initialise the field with an empty string | no |
| BUG-07 | The staff counter creates its Razorpay order with no timeout and no ₹1 minimum, and recomputes the price inline; the public route has all three safeguards | A hung Razorpay call holds the server action until the platform kills it | `admin:src/actions/payment.actions.ts:73-80`; compare `admin:src/app/api/public/events/[slug]/payment/order/route.ts:150-184`, `admin:src/lib/razorpay.ts:92` | Reuse `withTimeout` (8000 ms), `MIN_ORDER_PAISE` and `getEffectiveAmount` | no |
| BUG-08 | Counter staff can enrol only one booking per event per browser: after a success the event id is stored under `ulsaham_user_enrollments`, the Enroll button stays disabled and nothing clears the key | A counter selling several tickets must clear site data. Kept as a default in the 2026-09-27 plan; whether it is wanted is **unverified** | `admin:src/components/events/event-table.tsx:49,56-77` | Owner confirms. If not wanted, drop the lock and reword the dialog ("Register as Guest", "You're Enrolled!") | yes |
| BUG-09 | Competition bookings cannot be scanned and no ticket code can be typed: they carry a chest number instead of a QR everywhere, neither scanner has a text input, and the participants page has no search | Attendance for competition entries is ticked by hand; the code printed on the ticket PNG "for the gate to type in" has nowhere to go | `admin:src/components/participants/qr-code-modal.tsx:275,319,414-423`; `admin:src/components/participants/qr-scanner.tsx`; `admin:src/components/participants/global-qr-scanner.tsx` | Add manual code entry together with K7 | yes, with K7 |
| BUG-10 | A partly entered group shows "Not Attended": `attended` flips only when the last member enters, and `enteredCount` is shown nowhere on the participants page | Staff misread the table; the export can say Attended "No" beside an "Attended At" time | `admin:src/components/participants/participant-table.tsx:283-287,602`; `admin:src/repositories/participant.repository.ts:322-325` | Show "entered of seats" | no |
| BUG-11 | The legacy-index guard is weak: it checks only the phone, is cached 10 min per instance, and switches itself off for 1 min when `listIndexes` fails or takes over 3000 ms | If an old unique index ever returns, some buyers are again charged and then refused (409 `PHONE_ALREADY_REGISTERED`) | `admin:src/lib/index-guard.ts:11-18,57-61,91-94`; `admin:src/services/participant.service.ts:153-157` | Low while UNV-05 holds; keep the manual push rule (§11) | no |
| BUG-12 | Re-payment of an unpaid ticket (legacy rows only, K7 note) has three gaps: profile without phone or age, ended events, replaced orders | Dead ends for holders of old unpaid tickets | `admin:src/app/api/public/events/[slug]/payment/order/route.ts:14-18,46-52,70-78`; `site:src/components/AccountPage.jsx:26-29,91-98,481-490`; `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:113-115,185` | Confirm unpaid rows exist (UNV-13), then fix as in the note below | no |
| BUG-13 | One duplicate payment can write several identical "duplicate payment" log rows (verify, each verify retry, the webhook); nothing refunds automatically. Two orders settling the same unpaid ticket in the same instant are both accepted and the second is not logged (**unverified**, a race) | Staff may refund twice or miss a refund | `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:179-192`; `admin:src/app/api/razorpay/webhook/route.ts:99-104` | De-duplicate the log on the payment id | no |
| BUG-14 | The 14-day prune deletes every booking of an event, Razorpay ids included, and writes the archive totals only once: a booking added after an event was archived is deleted on the next run without being counted | Reconciliation after 14 days needs Razorpay; totals can undercount | `admin:src/repositories/participant.repository.ts:261-289` | Decide whether order and payment ids are kept after the prune | yes |
| BUG-15 | My Bookings sends at most the first 20 stored ticket codes (later ones are neither shown nor pruned) and looks up by ONE identifier: the profile phone, else the e-mail | Bookings made under the other identifier, or beyond 20, are missing | `site:src/components/AccountPage.jsx:18,430,436,459` | Rework with K1 | yes, with K1 |
| BUG-16 | Dialogs loaded with `next/dynamic` (enrol, add or edit participant, import, logo crop) have no error fallback | A chunk that cannot be fetched (offline at the venue, or an old tab after a deploy, UNV-08) drops staff on the generic error screen | `admin:src/components/events/event-table.tsx:34-37`; `admin:src/components/participants/lazy-participant-form.tsx:8`; `admin:src/components/participants/import-participants-dialog.tsx:18`; `admin:src/components/settings/brand-partners-section.tsx:31` | Add a loader that offers a retry | no |
| BUG-17 | After an SMTP failure `/api/send-ticket` gives back only the de-dupe slot; the per-IP and per-ticket slots stay spent | Repeated mail failures lock a ticket's e-mail for the hour | `site:src/pages/api/send-ticket.js:91-95` | Release all three keys | no |
| BUG-18 | The "3 codes per hour" sign-in allowance is counted in the `otp_session` cookie, which lives 600 s, so it resets 10 min after the last send while the message says "try again in an hour" | Misleading text only; the limits that last an hour are in memory: 5 per e-mail, 8 per IP | `site:src/lib/otp.js:65-69`; `site:src/pages/api/auth/send-otp.js:13-14,67-71,120` | Align the text or drop the cookie counter | no |
| BUG-19 | Coupon answers are inconsistent: apply-coupon can accept a coupon that `payment/order` then refuses with 400 `AMOUNT_TOO_LOW` (total under 100 paise), and the same failure is 404 on one route and 400 on another, always with `code: "COUPON_INVALID"` | A rare dead end at Pay; clients must switch on `code`, never on the status | `admin:src/app/api/public/events/[slug]/payment/order/route.ts:137-156`; `admin:src/app/api/public/events/[slug]/apply-coupon/route.ts:68-71,84-87,108-111` | Put the minimum-total rule in the shared coupon check | no |
| BUG-20 | A free or complimentary registration sent without `requestId` is not idempotent: random ticket code, and a complimentary code is counted twice | The site always sends one; a direct caller (SEC-02) may not | `admin:src/app/api/public/events/[slug]/register/route.ts:104-107,175-177`; `admin:src/services/participant.service.ts:106` | Make `requestId` required | no |
| BUG-21 | PNG uploads over 4 MB are refused: PNGs are never downscaled (to keep transparency), while a much larger JPEG passes after resizing | Staff cannot upload a large PNG banner | `admin:src/lib/image-resize.ts:7-8,14,42`; `admin:src/constants/index.ts:6-9` | Tell staff to export JPEG, or downscale PNG keeping alpha | no |
| BUG-22 | Images uploaded but never saved stay in Cloudinary: the upload happens before the form is saved, and only images a saved event or partner later lets go of are queued for deletion | Slow storage growth | `admin:src/app/api/admin/upload/route.ts:54`; `admin:src/services/event.service.ts:452,472` | Queue every upload; drop it from the queue on save | no |
| BUG-23 | `upcoming=true` compares with the server's local midnight (UTC on Vercel), not the IST day | Between 00:00 and 05:30 IST an event dated yesterday whose stored status is still live can list as upcoming | `admin:src/repositories/event.repository.ts:215-223` | Use the IST day, as the dashboard does | no |
| BUG-24 | `participants/my-tickets` matches ticket codes as sent: it neither trims nor upper-cases them, unlike `participants/check` and `payment/order` | A lower-case code is silently left out | `admin:src/app/api/public/participants/my-tickets/route.ts:53` | Normalise in the schema | no |
| BUG-25 | `/login` shows no navigation links at 640 px and below: its hand-copied nav has two links, which the stylesheet hides there, and no drop-down | Only the logo link is left. Derived from the code; **unverified** in a browser | `site:src/pages/login.astro:21-24`; `site:src/styles/global.css:850-851` | Use `SiteNav` on the page | no |
| BUG-26 | Ticket PNG: all four corners of the body are rounded, so the bottom corners are transparent; a poster that fails or takes over 6000 ms changes the image height | Cosmetic; **unverified** on a rendered ticket | `site:src/lib/generate-ticket.js:47-49,84,102-104` | Round the top corners only | no |
| BUG-27 | Client and server validation differ: the booking form accepts a 1-letter name (server needs 2), does not validate the e-mail and caps promo codes at 32 characters (server 50); the profile age accepts decimals | The server answers 400 "Validation failed" after the visitor presses Pay | `site:src/components/RegistrationForm.jsx:550,887,972`; `site:src/components/AccountPage.jsx:535`; `admin:src/validators/participant.validator.ts:5-22` | Mirror the server rules | no |
| BUG-28 | The participation card PDF uses jsPDF core fonts (`helvetica`, `courier`), which cannot draw Malayalam or other Indic text | Names in those scripts do not render on competition cards (**unverified** on a real card) | `site:src/lib/participation-card-pdf.js:65,113` | Suggested: draw the card as a canvas PNG | yes |
| BUG-29 | Staff cannot add a booking to an event that is not stored as `PUBLISHED` or that is full (Add participant and Excel import) | A walk-in after booking closed needs the status changed first, which risks K2 | `admin:src/services/participant.service.ts:86,95-100,268-272` | Decide whether staff may override | yes |
| BUG-30 | A booking the customer's browser completes (free, complimentary, or paid through verify) leaves no activity-log row; of site bookings only webhook-completed ones and duplicate payments are logged | No audit trail for complimentary-code redemptions | no `logActivity` call in `admin:src/app/api/public/events/[slug]/register/route.ts`; verify logs duplicates only (`admin:src/app/api/public/events/[slug]/payment/verify/route.ts:191`) | Suggested: log complimentary redemptions only, after the response | yes |

- **BUG-12 detail.** (a) Complete Payment fails with "Validation failed" when the profile lacks phone or age, because `payment/order` validates the full buyer schema even when `ticketCode` is sent; relax it there, as verify already does. (b) An unpaid booking of an ENDED event still offers Complete Payment and polls every 30 s although the server answers 410; hide the button once the event has ended. (c) A ticket that already had an order id keeps the old one, so `payment/status` for the new order stays pending, and verify's fast path records no `amountPaidPaise`.

### 17.6 Tech debt and stale documentation

| ID | Item | Impact | Evidence (path:line) | Next step | Needs owner decision |
|---|---|---|---|---|---|
| DEBT-01 | No CI in either repo: nothing runs tests, lint, type-check or the build checks before a deploy; the Vercel builds run none of them and the admin build skips lint | Both October outages (DONE-01, DONE-02) are caught by `BUNDLE_CHECK=1` tests that nobody ran | no `.github` folder in either repo; `root:vercel.json:6`; `admin:package.json:7`; `admin:next.config.ts:51-53` | Add a pull-request workflow: site tests, build and `BUNDLE_CHECK=1` tests; admin type-check, tests and lint | yes (should tests gate a deploy) |
| DEBT-02 | No error tracking or alerting: failures show only in Vercel function logs; Speed Insights runs on the site only | Ticket mail was dead for 16 weeks before anyone noticed | no such dependency in `site:package.json:13-25` or `admin:package.json:19-53` | Pick a tool; at the least alert on the log prefixes `[send-ticket]`, `[index-guard]` and `[Razorpay Webhook]` | yes |
| DEBT-03 | A schema index change never reaches the database on its own: the build is `prisma generate && next build`, and `npm run db:push` fails because the Prisma CLI reads `.env` while only `.env.local` exists | Cause of DONE-03 (charged, then refused) | `admin:package.json:7,15`; `admin:src/lib/index-guard.ts:4-8` | Follow the manual push rule in §11; consider a release step that lists indexes | no |
| DEBT-04 | Node is not pinned: no `engines`, no `.nvmrc`. The site tests need Node 20.6 or newer; `node --test tests/` on Node 21 or newer is **unverified** (UNV-21) | A new machine or a Vercel image change can break tests or builds without warning | `root:package.json:1-18`; `site:package.json:9`; `admin:package.json:1-18` | Add `engines.node` and `.nvmrc` to both repos and match the Vercel project setting | no |
| DEBT-05 | The site README is stale in six places (note below) | Misleads a newcomer: wrong product, wrong output folder | `root:README.md:1-3,37-38,52,107,142-148,199` | Replace with a short README that points to this file | no |
| DEBT-06 | The admin README is five `#` lines in the wrong order (seed, run, then copy the env file) and documents nothing | Followed literally it seeds whatever database `.env.local` points at, which is production on the owner's machine (§10) | `admin:README.md:1-5` | Rewrite; point to this file | no |
| DEBT-07 | Two files are manual copies between the repos and nothing compares them: the fee table and the public-event field lists | Drift makes the site show a total the server does not charge, or read a field that arrives `undefined` | `site:tests/fixtures/fee-cases.json` and `admin:test/fixtures/fee-cases.json` (identical on 2026-10-11); `site:tests/contract/public-event.json:2` still names admin commit `d3f60bd` (content matches `ad5620c`) | Add a compare step to CI (DEBT-01); refresh the `_source` note | no |
| DEBT-08 | Obsolete worktree `../web-app-hotfix` on branch `hotfix/ticket-mail-and-host` (`c904ae3`; two modified files, one untracked; never pushed) | Everything in it shipped through `187547e`; it only invites edits in the wrong folder | `git worktree list` in the site repo | After the owner confirms: `git worktree remove ../web-app-hotfix`, then delete the branch | yes (confirm) |
| DEBT-09 | Stale refs: local `main` is behind `origin/main` in both clones (site 25 commits, admin 22); merged branches remain (site `dev`, `dev1`, `origin/vercel/install-vercel-speed-insights-xki5fb`; admin `dev`, `dev1`, `dev2`) | Comparing against local `main` gives wrong diffs | `git branch -a -vv` in each repo | Always compare with `origin/main`; the owner deletes the branches | yes (delete) |
| DEBT-10 | Broken editor launch config: it runs `./node_modules/.bin/astro dev` inside the app folder, but Bun hoists binaries to the repo root | "Development server" in VS Code cannot start | `site:.vscode/launch.json:6` | Change the command to `bun run dev`, or delete the file | no |
| DEBT-11 | Dead or doubtful dependencies. Site: `@vercel/speed-insights` is imported nowhere (the layout loads the script by URL); `@typescript-eslint/parser` is not named in the ESLint config (**unverified**: the Astro parser may load it). Root: the `typescript` peer dependency, `@types/bun` on `latest` and `root:tsconfig.json` are scaffold leftovers | Install weight and one floating version | `site:package.json:17,28`; `site:src/layouts/BaseLayout.astro:61`; `root:package.json:11-17` | Remove one at a time, then build, test and lint | no |
| DEBT-12 | Lint warnings: site 19, admin 2. Warnings never fail a run | New warnings hide in the noise | Site examples: `react-hooks/set-state-in-effect` at `site:src/components/RegistrationForm.jsx:401`, `no-useless-escape` at `site:src/lib/next-path.js:26`. Admin: `react-hooks/exhaustive-deps` at `admin:src/components/participants/global-qr-scanner.tsx:85` and `admin:src/components/participants/qr-scanner.tsx:130` | Fix or silence each with a reason; keep the counts in §18.1 | no |
| DEBT-13 | `npm audit` in the admin repo: 11 findings left on 2026-10-04; each needs a major upgrade (Tailwind 4, Next 16, Vitest 5) and all are build-time or dev-time only | Left on purpose (§4) | `admin:package.json:41,66,70` | Re-run at every dependency round | no |
| DEBT-14 | Two pages are almost at their JavaScript budget: `/events/detail` 86,178 of 87,500 bytes gzip (1,322 left), `/account` 81,712 of 83,500 (1,788 left) | The next feature on either page fails the budget test | `site:tests/build/bundle-budget.test.mjs:23-34` | Lazy-load, or raise the budget on purpose in the same change | no |
| DEBT-15 | Nothing runs on a timer: bookings are pruned and released images deleted only when someone opens `/admin/events` (at most hourly), logs only when `/admin/logs` is opened, and the COMPLETED sweep only when a list is read | "14 days" and "2 hours" are earliest moments, not exact ones | `admin:src/app/admin/events/page.tsx:38-40`; `admin:src/app/admin/logs/page.tsx:26`; `admin:src/services/housekeeping.service.ts:81-98`; no `crons` key in `admin:vercel.json` | A Vercel cron route, if the plan allows (UNV-08) | no |
| DEBT-16 | One value lives in several places with no shared source: GST 18% and platform fee 2% in UI labels; 10 seats per booking and 20 codes per lookup in both repos; the OTP 10 min, 60 s and 5 attempts in server, mail text and form; the admin origin | A change in one place leaves the others wrong | Admin origin: `site:astro.config.mjs:40`, `site:src/lib/backend.js:13`, `site:tests/lib/backend-url.test.mjs:28`. OTP: `site:src/lib/otp.js:65-69`, `site:src/components/AuthForm.jsx:93,98,174` | Search for the value and change every copy together | no |
| DEBT-17 | Six stale comments (note below) | Mislead the next reader | `site:src/pages/api/public/[...path].js:62-64`; `admin:src/constants/index.ts:86`; `admin:src/repositories/event.repository.ts:216`; `admin:test/auth-config.test.ts:30-31`; `admin:.env.example:9`; `site:src/lib/generate-ticket.js:102` | Correct when next touching the file | no |
| DEBT-18 | Staff-facing text contradicts the code in four places (note below) | Wrong expectations for staff | `admin:src/app/admin/admins/page.tsx:24`; `admin:src/components/admin/create-admin-dialog.tsx:96-97`; `admin:src/components/admin/admin-table.tsx:46`; `admin:src/constants/index.ts:20,90`; `admin:src/components/participants/import-participants-form.tsx:160` | Reword | no |
| DEBT-19 | The legal pages carry the literal "Last updated: June 2025" although both files last changed on 2026-09-27, and the privacy page's Cookies paragraph does not mention the short-lived sign-in cookies | Legal text may not match behaviour | `site:src/pages/privacy.astro:14,43`; `site:src/pages/terms.astro:14` | Owner supplies the wording | yes |
| DEBT-20 | Dead code and unreferenced files (note below) | Noise | `admin:src/validators/participant.validator.ts:30-35`; `admin:src/lib/slug.ts:10`; `admin:src/lib/event-time.ts:60`; `admin:src/actions/payment.actions.ts:112-114`; `admin:prisma/schema.prisma:217-219`; `site:src/components/EventsList.jsx:105-107` | Remove in a quiet change, with tests | no |
| DEBT-21 | The root ignore file holds mangled scaffold patterns (`_.log` and a `report` pattern with underscores where asterisks belong), so `*.log` is not ignored at the root | A stray log can be committed | `root:.gitignore:15-16` | Restore the asterisks | no |
| DEBT-22 | Sharing and search gaps: every event is served by one static page, so the title, description and share image are the same for all events; no sitemap, no structured data | An event link shared in a chat app shows the generic site preview | `site:src/pages/events/detail.astro:9`; `site:public/robots.txt:1-2` | Needs a design decision: server-rendered event pages were rejected in the speed round (§16) | yes |
| DEBT-23 | Copy-pasted markup and contact details: `/login` has its own copy of the nav, three inner pages copy the footer, and the support phone and Instagram handle are typed into several files with no shared constant | A brand or contact change must be made in many places | `site:src/pages/login.astro:11-25`; `site:src/lib/generate-ticket.js:200-201`; `site:src/lib/participation-card-pdf.js:152` | Move to shared components and `site:src/lib/contact.js` | no |

- **DEBT-05 detail.** `:1-3` old name and "luxury event planning company"; `:37-38` files deleted in 2026-06; `:52` lists Bun only (Node is needed too); `:107` says output goes to `dist/` (Vercel deploys `.vercel/output`); `:142-148` omits `test` and `lint`; `:199` a contact e-mail that differs from `SUPPORT_EMAIL` (`site:src/lib/contact.js:4`). Its caching and dev-proxy paragraphs are correct.
- **DEBT-17 detail.** In order: "5 bookings/hour" (now 10 per hour per IP and phone plus 60 per hour per IP, `admin:src/lib/ratelimit.ts:22-39`); only the webhook writes SYSTEM rows (verify does too); the `upcoming` boundary "matches" the sweep (it does not, BUG-23); the settings and Accounts pages both send an ADMIN to `/admin/events` (the Accounts page sends to `/admin/dashboard`, `admin:src/app/admin/admins/page.tsx:13`); the super admin is "seeded on first run" (only `npm run db:seed` seeds); "rounded top corners" (all four, BUG-26).
- **DEBT-18 detail.** The Accounts page and create dialog say admins have "full access" and users "cannot make changes" (an ADMIN cannot create or edit events or open Settings; a USER can enrol people but cannot open participants). The badge says "User" where the header says "Counter staff". The save toast promises the website "within about a minute" while upcoming lists may be 5 min old. Import errors number rows from 1, one less than the sheet row.
- **DEBT-20 detail.** Admin: `publicRegistrationSchema` and `isValidSlug` (no caller at all), `hasEventStarted` and `sanitizeObject` (`admin:src/lib/sanitize.ts:13`; both called by tests only), the unused third argument of `verifyAndEnrollAction`, and log actions `USER_CREATED`, `USER_UPDATED`, `USER_DELETED` (never written; keep the enum values because old rows may hold them). Tracked but unreferenced: `admin:public/brand_logo.png`, `admin:public/brand_logo.avif`, `admin:assets/*`. Site: the client-side `featured` fallback filter.

### 17.7 Unverified

Not confirmed on a real device, in production or by the owner. "owner acts" and "owner confirms" mean only the owner can close the row; AI sessions never run database scripts or write to production (§2).

| ID | Item | Impact | Evidence (path:line) | Next step | Needs owner decision |
|---|---|---|---|---|---|
| UNV-01 | Ticket e-mail delivery in production since the fix of 2026-10-04 | If it still fails, every buyer sees "We couldn't email your ticket" | Packaging is tested (`site:tests/build/function-smoke.test.mjs:76-87`); delivery is not | Make one real booking with an e-mail address, or press Email Ticket in My Bookings; check the inbox and the site function log for `[send-ticket] mail error` | owner acts |
| UNV-02 | Razorpay webhook deliveries: subscribed to `payment.captured`, pointing at `<admin origin>/api/razorpay/webhook`, with `RAZORPAY_WEBHOOK_SECRET` set | Without it a payment whose browser never returns gets no booking (BUG-04). 500 means the secret is missing or processing failed (K2), 401 a wrong secret; any other event is answered 200 "ignored" | `admin:src/app/api/razorpay/webhook/route.ts:34-47,56-59` | Read the delivery log on the Razorpay webhooks page | owner acts |
| UNV-03 | `PROXY_SHARED_SECRET` is identical in both Vercel projects | If not: every site visitor shares one rate-limit bucket and webhook ticket mail is refused with 401. Bookings keep working, so nothing a visitor sees points at it | `admin:src/lib/ratelimit.ts:213-219`; `site:src/lib/backend.js:57-64` | Search both function logs for `[ratelimit]`, `[backend]` and `[ticket-mail] refused` | owner acts |
| UNV-04 | Payments without a booking: until 2026-10-04 a repeat booking with the same phone was charged without a new ticket (DONE-03), plus any K2 case | Customers may be owed a ticket or a refund | `admin:scripts/report-unrecorded-payments.ts:1-17` (read-only; prints personal data and calls live Razorpay) | Run `npx tsx scripts/report-unrecorded-payments.ts --days 30` in the admin repo (§11) | owner acts |
| UNV-05 | Production indexes after the manual `prisma db push` of 2026-10-04 (legacy unique index on event and phone dropped, three plain indexes created) | If an old unique index remains, DONE-03 returns | The owner's second live booking passed on 2026-10-04; `admin:src/lib/index-guard.ts:74-83` logs `[index-guard] LEGACY UNIQUE INDEX` when it finds one | Check the Atlas Indexes tab and the admin function log | owner confirms |
| UNV-06 | Razorpay auto-capture is on | The webhook acts only on `payment.captured`; an authorised but uncaptured payment would never be recovered | `admin:src/app/api/razorpay/webhook/route.ts:56-59` | Check the capture setting in Razorpay | owner confirms |
| UNV-07 | `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` removed from the admin production environment after seeding | A top-level password sits in the Vercel environment for no reason; only the seed reads it | `admin:prisma/seed.ts:17`; `admin:.env.example:9-13` | Remove both keys in Vercel, then redeploy | owner acts |
| UNV-08 | Vercel plan (Hobby forbids commercial use) and Skew Protection | Terms risk; without Skew Protection an old tab cannot load lazy chunks after a deploy (BUG-16, and the PDF library on the site) | No setting in code: `site:astro.config.mjs:24`; `admin:vercel.json:1-5` | Move both projects to Pro and enable Skew Protection | yes |
| UNV-09 | A full paid booking on real phones after PR #27 and PR #30: UPI app switch and return, closing the Razorpay window, a tab lost mid-payment, the ticket mail sent with `keepalive` while the page navigates | The recovery code is covered by offline tests only | `site:src/lib/payment-flow.js:10,26-27`; `site:src/lib/pending-payment.js:13-14`; `site:src/lib/api.js:175-185` | Razorpay test-mode run on a preview PAIR with test keys: a site preview without `BACKEND_URL` talks to the LIVE admin (`site:src/lib/backend.js:18-24`) | owner acts |
| UNV-10 | Gate scanning on real phones: two phones scanning one group ticket at once (the compare-and-set write), camera start and re-scan after a dismiss, the self-hosted decoder file | Double admission, or a dead scanner at the gate | `admin:src/repositories/participant.repository.ts:318-345`; `admin:next.config.ts:5-19` | Two-phone test on a test event before the next event day | owner acts |
| UNV-11 | Database behaviour checked only against stubs: chest numbers through one raw `findAndModify`; the first push to the image-deletion queue on the Settings row; `NOT` and `isSet` filters on documents that lack a field | Duplicate chest numbers, images never deleted, wrong archive totals | `admin:src/repositories/event.repository.ts:325-336`; `admin:src/repositories/participant.repository.ts:281-286`; the tests refuse any real database (`admin:test/setup.ts:26-39`) | Watch the first competition booking and the first image delete in production | no |
| UNV-12 | Whether the Entry Type backfill script was run with `--apply` | Without it older bookings show an inferred Entry Type (a manual tick and an old complimentary booking both read "Paid") | `admin:src/lib/entry-type.ts:13-27`; `admin:scripts/backfill-entry-type.ts:14-19,39` (a dry run without `--apply`) | Run the dry run, review, then `--apply` (§11) | owner acts |
| UNV-13 | Legacy data in production: unpaid bookings (BUG-12); free bookings made before 2026-07-28 stored as unpaid (they show "Payment Required" and ticket mail answers 409); bookings from before 2026-06-07 with no `enteredCount` (the code copes); past drafts an older sweep marked COMPLETED and that still show in the public past list | Wrong labels on old bookings and events | `site:src/pages/api/send-ticket.js:73-77`; `admin:src/repositories/participant.repository.ts:333-344` | Owner checks the data and decides on a clean-up | yes |
| UNV-14 | The Upstash database region is Mumbai | A distant region adds latency to every public call, and a limiter slower than 2000 to 3000 ms fails open (SEC-09) | `admin:src/lib/ratelimit.ts:14-20` | Check the Upstash console | owner confirms |
| UNV-15 | The admin build and `npm run check:bundle` were not re-run on 2026-10-11 (last pass 2026-10-04) | The admin bundle baseline in §18.1 is one week older than the other figures | `admin:scripts/check-bundle.mjs`; `admin:package.json:7,12` | Re-run both at the next admin change | no |
| UNV-16 | Owner confirmations never recorded: both Brevo senders verified; the support mailbox is read; approval of the generated share image, the resized logos and favicons, the hero poster frames and the home page fallback text | Mail may land in spam; support requests may go unread | `site:src/lib/mailer.js:37-38`; `site:src/lib/contact.js:4` | Owner confirms each | owner confirms |
| UNV-17 | Site behaviour on real devices and old browsers: BUG-25, BUG-26; AVIF decoding and cross-origin poster loading on the ticket canvas; `:has()` on old Safari; a collapsing URL bar against the full-page pager; coverflow posters on a slow connection | Layout or ticket download faults on some phones | `site:src/lib/generate-ticket.js:43-51,70`; `site:src/styles/global.css:508` | Test on a low-end Android phone and an older iPhone | no |
| UNV-18 | Platform behaviour taken from code comments: Vercel overwrites `x-forwarded-for` on ingress; whether the site function keeps sending after the admin's 5000 ms ticket-mail timeout; the three site security headers on `/api/*` answers; whether a given env value is fixed at build or read at run time; `sameSite: "strict"` on staff links opened from another app | Rate-limit keys, log noise and env handling rest on these | `admin:src/lib/ratelimit.ts:202-208`; `admin:src/lib/site-ticket-mail.ts:5`; `site:scripts/fix-vercel-routes.mjs:22-28`; `admin:auth.config.ts:34` | Treat every env change as needing a redeploy (§12); check headers with a GET on production | no |
| UNV-19 | Whether Razorpay disables a webhook that keeps answering 500 (the K2 case is retried for up to 24 h) | Would silently stop lost-tab recovery for every buyer | `admin:src/app/api/razorpay/webhook/route.ts:201-204` | Check Razorpay's webhook policy; resolve with K2 | no |
| UNV-20 | Who or what made the unplanned commits of 2026-09-27 21:46 (site `c28b2ea`, admin `d3f60bd`) and 2026-10-04 17:47 to 17:48 (site `5988ff7`, admin `4f454da`): a second AI session with a global commit and push allow-list, or the editor's commit-and-sync | Half-finished work and a temporary test file were captured and pushed; nothing in code prevents a repeat | Outside both repos | Check `git status` and `git log -1` before and after every session (§2) | owner confirms |
| UNV-21 | Toolchain edges: `node --test tests/` on Node 21 or newer (portable form: `node --test "tests/**/*.test.mjs"`); the Node and Bun versions of Vercel's build image; `astro preview` with the Vercel adapter | Setup surprises on a new machine | `site:package.json:8-9` | Try on the new machine before relying on it (§14) | no |

### 17.8 Recently resolved

Since 2026-09-27, newest first. "Resolved on" is the day the fix reached `main`.

| ID | Item | Resolved on | Commit or PR |
|---|---|---|---|
| DONE-01 | Every ticket e-mail failed with "Cannot find module 'qrcode'" (since 2026-06-12): `qrcode` is now a static import and a build test checks it is packed. Delivery itself: UNV-01 | 2026-10-04 | site `187547e`, PR #27 |
| DONE-02 | Google sign-in returned to `https://localhost` and the ticket mailer's same-site check answered 403 (since 2026-09-28, Astro 5.18 host handling): `security.allowedDomains` added. Redirect confirmed live on 2026-10-11 | 2026-10-04 | site `187547e`, PR #27 |
| DONE-03 | A second paid booking with the same phone was charged and then refused (a legacy unique index survived in production from 2026-09-13) | 2026-10-04 | owner ran `prisma db push` on production; guard in admin `4f454da`, PR #30 |
| DONE-04 | No recovery after a lost tab or a failed confirmation (double-charge risk): order reuse for 15 min, verify retries, pending-payment record, `payment/status` route | 2026-10-04 | site `187547e`, PR #27; admin `4f454da`, PR #30 |
| DONE-05 | Bookings completed by the webhook got no ticket mail: signed `/api/internal/ticket-mail` route; `/api/send-ticket` refuses unpaid tickets with 409 | 2026-10-04 | site `5988ff7`, PR #27; admin `4f454da`, PR #30 |
| DONE-06 | The site proxy forwarded every header to any path: path, header and method allow-lists, 25 s write timeout | 2026-10-04 | site `5988ff7`, PR #27 |
| DONE-07 | Booking limit of 5 per hour per IP let shared networks exhaust each other: now 10 per hour per IP and phone plus 60 per hour per IP | 2026-10-04 | admin `4f454da`, PR #30 |
| DONE-08 | Revenue was an estimate; images were deleted while cached pages still showed them; chest-number allocation was not atomic; the Excel import wrote one row at a time | 2026-10-04 | admin `ad5620c`, PR #30 |
| DONE-09 | Google sign-in had no state nonce; code attempts were limited only by a cookie; `ulsaham_accounts` kept profiles after sign-out | 2026-10-04 | site `fcf2989`, PR #26 |
| DONE-10 | Staff sign-in answered faster for unknown usernames (timing leak) and wrote no LOGIN log row | 2026-10-04 | admin `fff7d52`, PR #29 |
| DONE-11 | Slow API (0.95 to 1.33 s per call, functions far from the database, nothing cached): both projects in `bom1`, edge cache, immutable `/_astro` files | 2026-09-28 | site `c28b2ea`, PR #25; admin `d3f60bd`, PR #28 |
| DONE-12 | The gate scanner loaded its decoder from a third-party CDN, and two gates could admit the same ticket | 2026-09-28 | admin `4b2ee48`, PR #28 |
| DONE-13 | npm `xlsx` 0.18.5 with known vulnerabilities, and an unused `sharp` dependency | 2026-09-28 | admin `d3f60bd`, PR #28 |
| DONE-14 | One real payment could be replayed for any event or seat count; the webhook trusted payer-set notes; the middleware never ran (its file sat outside `admin:src/`); sessions had no 24 h cap; the manual "Paid" tick box was removed | 2026-09-27 | admin `4a3f8a3`, PR #27 |
| DONE-15 | Reflected XSS and open redirect through `next` on `/auth/complete` | 2026-09-27 | site `a22a9ad`, PR #24 |

---

## 18. Testing, quality baselines and debugging recipes

Nothing here runs by itself: neither repo has CI or git hooks, and neither Vercel build runs a test, a linter or a budget (§12.7). A check counts only when a person has run it. In citations a bare `:N` continues the file cited just before it.

### 18.1 Baselines on 2026-10-11

Measured on the dev machine (Windows 11, Node v20.11.0, Bun 1.3.14, npm for the admin repo) at SITE `dev2` `187547e` and ADMIN `dev3` `ad5620c`. When a later run differs, find out why before accepting the new number.

| Check | Command (run inside) | Result |
|---|---|---|
| SITE tests, no build | `bun run test` (`apps/site/far-fusion`) = `node --test tests/` | 239 tests: 236 pass, 3 skipped (they need a build), 0 fail |
| SITE build | `bun run build` (app folder) = `astro build` | passes, about 35 s |
| SITE tests after a build | `BUNDLE_CHECK=1 node --test tests/` | 239 of 239 pass |
| SITE lint | `bun run lint` | 0 errors, 19 warnings (among them `react-hooks/set-state-in-effect` at `site:src/components/RegistrationForm.jsx:401` and `no-useless-escape` at `site:src/lib/next-path.js:26`) |
| SITE page script weight, gzip, measured by `site:tests/build/bundle-budget.test.mjs` | | `/events/detail` 86,178 B of 87,500; `/account` 81,712 of 83,500; `/` 71,419 of 74,500; `/events` 67,922 of 71,000; `/login` 65,430 of 68,500; `/auth/complete` 1,246 of 1,300; `/about`, `/privacy`, `/terms` 972 of 1,000 each; `/404` 0 of 1,000 |
| ADMIN type-check | `npm run typecheck` | 0 errors |
| ADMIN tests | `npm test` (Vitest) | 690 of 690 pass, 15 files, about 11 s |
| ADMIN lint | `npm run lint` | 0 errors, 2 warnings (`react-hooks/exhaustive-deps` at `admin:src/components/participants/global-qr-scanner.tsx:85` and `admin:src/components/participants/qr-scanner.tsx:130`) |
| ADMIN build and `npm run check:bundle` | | NOT re-run on 2026-10-11 (the AI session's permission system blocked the build). Last run 2026-10-04: build passed, bundle check passed |

- On this machine `bun --cwd <dir> run <script>` printed help instead of running. Run scripts from inside the folder, or use `npm --prefix <dir> run <script>`.
- SITE headroom under the budgets: `/events/detail` 1,322 B, `/account` 1,788 B, `/` 3,081 B, `/events` 3,078 B, `/login` 3,070 B. A feature added to the first two can easily exceed its budget; raise a budget only on purpose (§13.4). The three skipped tests are the two gated build tests and the browser-output scan (§18.2).

ADMIN bundle budgets: gzip KB (1 KB = 1000 bytes) of the JavaScript a first visit loads, per route (`admin:scripts/check-bundle.mjs:27-43`). A page without its own entry gets the largest budget, 224.

| Route | Budget KB | Set from the build of 2026-10-03 | Recorded on 2026-10-04 |
|---|---|---|---|
| `/` | 109 | 103.8 | not recorded |
| `/_not-found` | 110 | 104.6 | not recorded |
| `/login` | 126 | 119.8 | 119.8 |
| `/admin/dashboard` | 145 | 137.6 | 138.0 |
| `/admin/events` | 166 | 158.0 | 158.6 |
| `/admin/events/new` | 218 | 207.6 | 208.4 |
| `/admin/events/[id]/edit` | 224 | 213.2 | 214.0 |
| `/admin/events/[id]/participants` | 178 | 168.9 | 169.2 |
| `/admin/events/[id]/scan` | 152 | 143.9 | not recorded |
| `/admin/scan` | 153 | 144.8 | not recorded |
| `/admin/logs` | 163 | 154.8 | not recorded |
| `/admin/settings` | 196 | 185.9 | 186.4 |
| `/admin/admins` | 217 | 206.0 | 206.2 |

- The 2026-10-04 column comes from the work notes of that day's batches, not from a run on 2026-10-11; `/login` is the only row kept in a saved output file. Next's own "First Load JS" for the same build read 120 kB for `/login`, 140 kB for `/admin/events` and 155 kB for the participants page: the script counts a little more than Next does (`admin:scripts/check-bundle.mjs:9-11`).

### 18.2 Test map

SITE, `site:tests/`: 25 test files, 239 tests at run time (auth 25, build 14, contract 7, dev 4, lib 79, mail 66, proxy 44), run by Node's own runner with no test framework.

| Test file or folder | What it protects | Needs a build |
|---|---|---|
| `auth/` (`google`, `google-complete`, `next-path`) | Google sign-in start and callback: nonce cookie, state, refused callbacks, verified addresses only. The static `/auth/complete` step and the local account store. `safeNextPath`: no open redirect, no markup | No |
| `build/fix-vercel-routes.test.mjs` | The route patch: rule order, the exact three headers, a second run changes nothing, exit code 1 on failure (§13.1) | No |
| `build/bundle-budget.test.mjs` | Per-page script budgets; jsPDF is never loaded up front | 2 self-tests of the walker: no. The real-build test: yes, and `BUNDLE_CHECK=1` |
| `build/function-smoke.test.mjs` | The built function, copied away from the repo: `qrcode` is packed, the mail routes load and answer JSON, the Google `redirect_uri` is the site host | Yes, and `BUNDLE_CHECK=1` |
| `contract/public-event.test.mjs`, `public-event.json` | Every event field the site reads is on the copy of the admin allow-lists; no forbidden field is read | No |
| `dev/dev-proxy.test.mjs` | The dev proxy forwards only GET and HEAD; a write gets a local 403 (§13.2) | No |
| `lib/` (10 files), `fixtures/fee-cases.json` | Fee maths against the golden table of 30 cases; payment retry and order-reuse rules; the pending-payment record; the Razorpay script loader; API client paths and timeouts; booking-closed reasons; dates in IST under three time zones; Cloudinary URLs; `BACKEND_URL` defaults; the support-contact constant | No |
| `mail/` (`helpers`, `mailer`, `routes`, `internal-ticket-mail`) | SMTP transport options and the sender split; escaping; the limiter and the code primitives; `/api/send-ticket`, both code routes and `/api/internal/ticket-mail` end to end against a fake SMTP server; the signature vectors shared with the admin | No |
| `mail/client-bundle.test.mjs` | No mail or secret variable name, and no live secret value, in browser output | Yes: it skips itself when no build output exists (no gate variable) |
| `proxy/` (`proxy`, `prefetch`) | Path, method and header allow-lists; the 8 s and 25 s timeouts; error bodies; the edge-cache policy and its four lifetimes; the early-request paths of each page | No |
| `mail/support/` | No tests: helpers used by every area (§13.5). Moving the folder breaks the whole suite | n/a |

- Tests never execute a `.jsx` or `.astro` file: they read the source as text. Renaming the variables the contract test follows, or adding a component that takes an `event` prop without listing it in `CONSUMERS`, fails the suite (`site:tests/contract/public-event.test.mjs:25-41`).

ADMIN, `admin:test/`: 15 files, 690 tests, Vitest in the `node` environment. `admin:test/setup.ts` replaces Prisma, `fetch`, the rate limiters and Auth.js, so no file needs a database, the network or a build (§13.5).

| Test file | What it protects | Needs a build |
|---|---|---|
| `payment-routes.test.ts` | Payment verify, payment status, the webhook and the signed ticket-mail request: order binding, replay, duplicate payment | No |
| `booking-routes.test.ts` | Payment order, register, apply-coupon, participants check; rate-limit keys and their order; which requests may relay a visitor IP | No |
| `booking-logic.test.ts` | Coupon validation, constant-time compare, the legacy-index guard (cache and timeout), idempotent `registerParticipant` | No |
| `public-event.test.ts` | The public event allow-list: exact keys, no codes or ids, 404 | No |
| `pricing.test.ts`, `fixtures/fee-cases.json` | The golden fee table through `pricing.ts`, the public order route and the staff counter action | No |
| `event-time.test.ts` | IST maths and booking state under `TZ=UTC` and `TZ=Asia/Kolkata` with a fixed clock | No |
| `auth-config.test.ts`, `authorize.test.ts`, `login-action.test.ts` | Path by role matrix (every admin page must have a row), the 24 h session cap, the credential check, sign-in redirects and messages | No |
| `action-roles.test.ts` | Every exported server action has a role row and refuses a wrong role before any write | No |
| `env.test.ts` | Env schema: required keys, warn-once secrets, the `SITE_URL` default, the seed schema, webhook 500 without its secret | No |
| `data-queries.test.ts` | Chest-number allocation, status filters, dashboard revenue and seat totals, the prune writing totals before deleting | No |
| `staff-tools.test.ts` | Excel import (batches of 200, 1000-row cap), seat edits, counter checkout and counter payments | No |
| `content-forms.test.ts` | Event dates in IST, slug clashes, deferred image deletes, ticket contacts, the pairing logic of the payments report | No |
| `helpers.test.ts` | Input sanitising; `entryStatusOf` and its labels | No |

### 18.3 How to run each check

| Check | Run from | Command | Expected output |
|---|---|---|---|
| SITE tests | `apps/site/far-fusion` | `bun run test` | Closing summary: tests 239, pass 236, fail 0, skipped 3 |
| SITE build | same | `bun run build` | `prerendering static routes` with 10 files, `Copying static files to .vercel/output/static`, then `Complete!` after about 35 s |
| SITE tests with the build checks | same, after the build | `BUNDLE_CHECK=1 node --test tests/` | tests 239, pass 239, skipped 0; one line per page, `<page>: <n> B gzip of <budget> in <k> files` |
| SITE build checks only | same | `BUNDLE_CHECK=1 node --test tests/build/` | 14 tests, none skipped |
| One SITE file | same | `node --test tests/proxy/proxy.test.mjs` | That file's tests only |
| SITE lint | same | `bun run lint` | `✖ 19 problems (0 errors, 19 warnings)`; exit code 0 |
| ADMIN type-check | ADMIN repo root | `npm run typecheck` | No error lines; exit code 0 |
| ADMIN tests | same | `npm test` | `Test Files  15 passed (15)` and `Tests  690 passed (690)`, about 11 s |
| One ADMIN file | same | `npx vitest run test/pricing.test.ts` | Vitest's own filter; there is no repo script for it |
| ADMIN lint | same | `npm run lint` | `✖ 2 problems (0 errors, 2 warnings)` |
| ADMIN build, then bundle check | same | `npm run build`, then `npm run check:bundle` | Next's route table; then a table of page, first load and budget that ends `Bundle check passed.` |

- PowerShell has no `VAR=1 command` form: use `$env:BUNDLE_CHECK = '1'; node --test tests/`, then `Remove-Item Env:BUNDLE_CHECK` (§14.1).
- The SITE tests are real Node, not Bun's runner, and the path is relative: start them in the app folder, on Node 20 (§4.4). They need no `--env-file`: `setTestEnv()` deletes the 15 managed keys and sets dummies, and `loadSource()` throws `call setTestEnv() before loadSource()` in a test that skipped it, so a shell value or a stray env file cannot reach the code under test (`site:tests/mail/support/env.mjs:5-12,20-21`, `site:tests/mail/support/load.mjs:12-17`, §13.5). The one exception, on purpose, is the browser-output scan, which searches for the shell's real values.
- The build checks read whatever build is on disk: the app-folder copy wins over the root copy, and `admin:.next` may be old. Build first. Afterwards delete `site:.vercel/output` and `site:dist`, because a local server build holds this machine's secrets as literals (`site:tests/mail/client-bundle.test.mjs:5-9`, §12.5).
- `MAIL_SCAN_STRICT=1` makes the browser-output scan fail unless it read at least one script and the shell held 3 or more real credential values of 8 or more characters to search for (`site:tests/mail/client-bundle.test.mjs:44-52,106-111`). Only a variable NAME is ever printed.
- ADMIN tests stop with `Unit tests refuse to run: DATABASE_URL must point at localhost.` when the shell exports a remote `DATABASE_URL` (`admin:test/setup.ts:29-39`): unset it, never work around it. `npm run build` opens no database connection (§12.6); the AI session could not run it on 2026-10-11, so the owner does. Order of the checks before a release: §14.5.

### 18.4 What is not covered by automated tests

- **Browser flows.** No component is rendered in either repo: SITE tests read sources as text and Vitest has no DOM (`admin:vitest.config.ts:12`). The home pager, hero video, coverflow, booking form, My Bookings, sign-in form, every admin screen and dialog, the ticket image and both participation-card PDFs are checked by hand.
- **Payments end to end.** Razorpay Checkout in a browser, the UPI app switch, the real Orders API, a real webhook delivery and refunds: tests stub the SDK and `fetch`. Owner's live test on 2026-10-04: a first and, after the index fix, a second booking worked. Webhook deliveries in production are **unverified**.
- **The scanner.** Camera permission, decode speed, the wasm loading from `/zxing/`, two phones on one ticket. The compare-and-set of `addEnteredCount` and the scan actions' entry maths have no test.
- **E-mail delivery.** Tests talk to a fake SMTP server on `127.0.0.1`. Relay acceptance, sender verification, spam placement and the QR image in mail clients are untested; ticket mail in production since the 2026-10-04 fix is **unverified**.
- **Real MongoDB behaviour.** Any Prisma access in a test throws. Never exercised against a database: the indexes, the single `findAndModify` behind chest numbers, `updateMany` atomicity at the gate, filters on missing fields (`isSet`, `NOT`), the prune, the seed and the two data scripts.
- **Platform behaviour.** The CDN honouring `vercel-cdn-cache-control` and the `bom1` pin (both only seen by hand, §18.6), Fluid compute, work scheduled with `after()`, the cache header on live hashed assets, and Upstash itself (limiters are stubbed to allow; `runThrottled` is a no-op in tests).
- **Third parties and glue.** Google's and Cloudinary's real endpoints (the Cloudinary SDK is stubbed), the upload route beyond its path row in the page matrix, `admin:scripts/check-bundle.mjs`, and WHERE `admin:src/middleware.ts` sits: its callbacks are tested, its location is not. It sat at the repo root until 2026-09-27 and, according to the security scan of that day, had never run.
- **The two cross-repo copies.** Nothing compares `site:tests/fixtures/fee-cases.json` with `admin:test/fixtures/fee-cases.json` (same git blob, `3df58f4`, on 2026-10-11) or `site:tests/contract/public-event.json` with the admin allow-lists (in step on 2026-10-11; its `_source` hash is stale). Update each pair in one change (§7.9).

### 18.5 Debugging recipes

Start with the Vercel function log of the failing request (§12.7). Never reproduce a fault by sending a write to production (§18.6). The ids R1 to R20 are stable.

#### Build, deploy and tooling

| Symptom | Likely cause | Confirm | Fix |
|---|---|---|---|
| R1. Every `/api` route answers `FUNCTION_INVOCATION_FAILED`; pages still load | The deployed function is missing or stale. Seen twice: Vercel read the wrong output folder (until 2026-07-30), and a Turbo cache hit shipped a stale committed function (until 2026-08-01). When only some routes fail, a server dependency was left out of the function | The function log. `root:turbo.json:6` lists `.vercel/output/**`; `git ls-files .vercel .turbo` prints nothing; `root:vercel.json:6` has the copy step and no `outputDirectory` | Restore the broken rule (§12.2) and push. For a missing dependency: import it statically, then run the smoke test (R2) |
| R2. The function smoke test refuses to run | (a) Skipped: `set BUNDLE_CHECK=1 after a build to run this`. (b) `no built function found; run bun run build first`. (c) `<dir> has a node_modules folder; the copy would not be isolated`: the OS temp folder or a parent of it, often the user's home folder, holds a `node_modules` (`site:tests/build/function-smoke.test.mjs:69-81`) | Read the message | (a) Set the variable (§18.3). (b) Build in the app folder. (c) Remove that folder, or point `TEMP` and `TMP` (Windows) or `TMPDIR` at a path with no `node_modules` above it. Why the test insists: Node would load a missing package from a parent folder and hide the very fault the test exists for |
| R3. A bundle budget fails | A static import pulled a library into a page's first load; a dependency bump; a page added or removed without its budget entry; or a stale build on disk | Rebuild, rerun, read the message. SITE: `<page> loads <n> B gzip of JS, over its <b> B budget`, `has no budget`, `loads jsPDF up front` (`site:tests/build/bundle-budget.test.mjs:119-135`). ADMIN: `<route>: <x> KB gzip is over its <b> KB budget`, `first load contains SheetJS (xlsx)`, `first load references zxing` (`admin:scripts/check-bundle.mjs:114-129`) | Make the import lazy (`import()`, `next/dynamic`). Raise a budget only for a deliberate increase, in the same commit (§13.4) |
| R4. The dev server or the build fails after a dependency upgrade | ADMIN: `zxing-wasm` moved, so `next dev` and `next build` stop with `public/zxing/zxing_reader-<version>.wasm is missing: ...` (`admin:next.config.ts:11-19`); or the Prisma client was not regenerated. SITE: a new Astro minor changed host handling (R7); an adapter bump trips the route patch (§13.1); `root:bun.lock` was not committed, so the Vercel install fails. Stale tool caches (`site:.astro`, `admin:.next`) are a general suspect, **unverified** here | The first error line. The lockfile diff shows what moved, transitive packages included (`zxing-wasm` is one) | Copy the wasm file as the message says; `npm run db:generate` (no database connection); commit the lockfile. Then run every check in §18.3. Rules per package: §4.4 |
| R5. `Environment variable not found: DATABASE_URL` from the Prisma CLI | `npm run db:push` and `npm run db:studio` are bare CLI calls (`admin:package.json:15,17`). The CLI reads `.env`; this repo has only `.env.local`. Nothing was changed in the database | The repo root lists `.env.local` and no `.env` (file names only; never open them) | The owner runs the one-line command in §14.4. It acts on the database that `.env.local` names, which on the owner's machine is production. Do not add a `.env` copy: every CLI command would then reach production without a warning |

#### Customer site

| Symptom | Likely cause | Confirm | Fix |
|---|---|---|---|
| R6. Ticket e-mail not sent (`We couldn't email your ticket.`) | Read the status of `POST /api/send-ticket`. 500 with `Cannot find module 'qrcode'` in the log: the package is not in the function (the outage of 2026-06-12 to 2026-10-04). 503: an SMTP key is missing in the deployment. 500 with `[send-ticket] mail error:`: the relay refused (wrong key; a stray space gives 535, `site:.env.example:18-19`; sender not verified). 403 `Request blocked.`: host not in `allowedDomains`. 409: booking unpaid. 502: the admin look-up failed. 429: limits (§7.7) | Browser Network tab; SITE function log; the relay's log. For a booking the webhook completed: ADMIN log `[ticket-mail] The site answered <status> ...`, SITE log `[ticket-mail] refused: <reason>` | By cause; redeploy after an env change (§12.5). Keep `qrcode` a static import (`site:src/lib/ticket-mail.js:1-4`). Delivery since the fix is **unverified** |
| R7. Google sign-in returns to localhost | The host is not in `security.allowedDomains`, so Astro 5.18 or later builds the request URL as `https://localhost` and `redirect_uri` follows (`site:astro.config.mjs:10-21`, `site:src/pages/api/auth/google.js:16`). Production: 2026-09-28 to 2026-10-04 | Check 5 of §18.6 against that host. Locally the smoke test asserts it (`site:tests/build/function-smoke.test.mjs:131-135`) | Add the host, register its callback URL in the Google client, deploy (§12.3). An error on Google's own page instead means `GOOGLE_CLIENT_ID` is unset (sent as the text `undefined`) or the URI is not registered |
| R8. Sign-in codes fail in production | 503 `Sign-in is temporarily unavailable. Please try again later.`: `OTP_SECRET` or an SMTP key is missing in the deployment, often because it was added after the build (`site:src/pages/api/auth/send-otp.js:44`). 500 with `[send-otp] mail error:`: the relay, as in R6. 400 `Session expired or not found. Please request a new code.` on verify: the `otp_session` cookie did not come back (`Secure`, path `/api/auth`, 600 s; `site:src/lib/otp.js:64,83-93`, `site:src/pages/api/auth/send-otp.js:120`), for example send on one host and verify on another, or the secret changed in between. 429: limits (§7.7) | Status and text in the Network tab; `Set-Cookie` on the send answer; SITE log | Set the key and redeploy. Never deploy the placeholder value of `site:.env.example:6` (§6.7) |
| R9. An event edit does not show on the site | The edge cache, by design: up to 1 minute for the event page, 5 minutes for upcoming and featured lists, 1 hour for past lists and partners (§7.8). Or the event is still `ANNOUNCED`: drafts are never public | GET `https://ulsaham-admin-panel.vercel.app/api/public/events/<slug>` and the same path on the site, which shows `x-vercel-cache: HIT` or `STALE`; the site URL with `?fresh=1` skips the cache | Wait. If urgent, redeploy the SITE project; that a redeploy empties the cache is **unverified** (§12.4). Do not shorten a lifetime without the owner: `site:tests/proxy/proxy.test.mjs:89-99` pins the numbers |
| R10. 429 answers | Find who answered. SITE limiters (sign-in codes, ticket mail) live in memory and send `Retry-After`. ADMIN limiters come back through the proxy: bookings are 10 per hour per IP and phone and 60 per hour per IP (§7.7). Many unrelated visitors refused at once: `PROXY_SHARED_SECRET` is missing or differs, so all share one bucket | The `error` text; SITE log `[backend] PROXY_SHARED_SECRET is not set`; ADMIN log `[ratelimit] A request relayed a visitor IP (x-client-ip) without a valid x-proxy-key` | The same secret in both projects, then redeploy both (§12.5). Otherwise wait for the window. An Upstash outage cannot cause this: the admin limiters fail open |
| R11. The proxy answers 504 | The admin did not finish within 8000 ms (GET, HEAD) or 25000 ms (POST) (`site:src/pages/api/public/[...path].js:27-28,101-102`): a cold start with a first database connection, a slow database, a slow limiter store, or a function outside `bom1`. A 503 means the admin was unreachable or `BACKEND_URL` is wrong | Time a direct GET to the admin (check 4 of §18.6 with `-w "%{time_total}\n"`); `x-vercel-id` must read `bom1::bom1::`; `SERVER_TIMING=1` for a breakdown (§12.7) | Fix the slow part; do not raise the timeouts. A payment confirmation that timed out is retried by the browser after 1, 3 and 6 s and is safe to repeat |
| R12. Images do not show | SITE: `/_image` answers 403 by design; images are plain Cloudinary URLs (`site:astro.config.mjs:29-34`, `site:src/lib/image.js:8-12`). ADMIN: `next/image` accepts only `res.cloudinary.com/<cloud name>/**`, fixed at build (`admin:next.config.ts:21-45`). A replaced image is deleted from Cloudinary by the first housekeeping run 2 hours or more after the save (`admin:src/services/housekeeping.service.ts:9-14`). An upload over 4 MB, or not JPEG, PNG or WebP, is refused (`admin:src/app/api/admin/upload/route.ts:33-45`); PNG files are never downscaled in the browser (`admin:src/lib/image-resize.ts:7-14`) | Open the image URL itself; check its host and cloud-name segment; status in the Network tab | Upload again through the admin form; correct `CLOUDINARY_CLOUD_NAME` and rebuild. Never switch the site back to Astro's image service |
| R13. A hydration mismatch (React console warning, content jumps on load) | The first browser render differs from the server HTML. SITE islands are rendered at build time, with no `window` and no `localStorage`; ADMIN renders on the server, whose locale data and time zone are not the browser's. Usual triggers: reading the stored user, the URL or the clock during render; formatting with the runtime's locale (`en-IN` separators differ between Node and browsers, `admin:src/lib/utils.ts:10-11`) | Load a production build with DevTools open; look for browser-only reads outside `useEffect` | Read browser state in a mount effect, as the islands do (`site:src/components/RegistrationForm.jsx:399-403`, `site:src/components/AccountPage.jsx:503-507`); that is why lint warns `react-hooks/set-state-in-effect` there. In ADMIN format dates with `formatDate` and `formatDateTime` (`admin:src/lib/utils.ts:29-43`) |
| R14. Animations look static on the dev machine | The owner's Windows has "Animation effects" off, so Chrome there reports `prefers-reduced-motion: reduce` and anything that honours it stands still. Neither repo's own source queries the preference (no match in `site:src` or `admin:src` on 2026-10-11), so a frozen animation is new code or a library | Console: `matchMedia("(prefers-reduced-motion: reduce)").matches` is `true`. DevTools, Rendering panel: emulate `prefers-reduced-motion: no-preference` and the motion returns | Nothing is broken. Do not make the home coverflow honour the preference: on 2026-09-27 the owner asked for it to animate and auto-scroll regardless (`site:src/components/PastEventsCoverflow.jsx:127-135`, §2) |

#### Payments, admin panel and gate

| Symptom | Likely cause | Confirm | Fix |
|---|---|---|---|
| R15. A second booking is charged, then fails | A legacy unique index on (eventId, phone), `Participant_eventId_phone_key`, is still in the database, because the build never pushes the schema (§12.6). Production until 2026-10-04 | ADMIN log `[index-guard] LEGACY UNIQUE INDEX on Participant: ...` (`admin:src/lib/index-guard.ts:74-83`); payment order answers 409 `PHONE_ALREADY_REGISTERED` before any charge; the Indexes tab in Atlas (owner) | The owner runs the push in §14.4, then the payments report (R16). Do not rely on the guard: it switches itself off for 1 minute when the index list does not arrive within 3 s (`:13,18,57-61`), and it looks at the phone only |
| R16. Payment taken but no booking | The browser never reached verify and the webhook has not completed the booking (R17). Or booking closed between order and payment: verify answers 500 `REGISTRATION_FAILED` and the webhook fails on every retry (open rule K2, §17). Or the legacy index (R15) | The event's participants screen; ADMIN logs `Public payment verify error:` and `[Razorpay Webhook] Processing error:`; the payment and its webhook deliveries in the Razorpay dashboard; the owner's read-only report, `npx tsx scripts/report-unrecorded-payments.ts --days 30` (it prints personal data, §13.6) | Staff add the booking under Admin, Event, Participants, Add, quoting the Razorpay payment id; it is stored as Complimentary, so it does not count as revenue (`admin:scripts/report-unrecorded-payments.ts:103-107`). Or refund in the Razorpay dashboard. Never replay a verify call by hand |
| R17. The webhook answers 500 | `{"error":"Webhook not configured"}`: `RAZORPAY_WEBHOOK_SECRET` is not set in the deployment (`admin:src/app/api/razorpay/webhook/route.ts:34-38`). `{"error":"Processing failed"}`: the order fetch failed or passed 3000 ms, or the booking could not be written (closed event, legacy index, database error) (`:84,201-204`). Related: 401 `Invalid signature` when the secret differs from Razorpay's; 200 `{"status":"ignored"}` for any event but `payment.captured` | Delivery log in the Razorpay dashboard; ADMIN log lines starting `[Razorpay Webhook]` | Set the secret and redeploy, or fix the underlying error. The 500 is deliberate: Razorpay sends a failed delivery again. Keep the subscription on `payment.captured` at `<admin origin>/api/razorpay/webhook`. Deliveries in production are **unverified** |
| R18. A staff member is signed out after a day | By design. A session ends 24 h after sign-in however active it is (`SESSION_MAX_AGE_SECONDS`, `admin:auth.config.ts:19,77-83`). Why: the middleware re-issues the cookie on every request, so without the cap a session, even of a deactivated account, would never end. Mid-task it reads `Could not reach the server. Check your connection, refresh the page and try again.` (`ACTION_FAILED_MESSAGE`, `admin:src/constants/index.ts:27-31`) | The account's `LOGIN` row in the activity log is 24 h old | Sign in again; on an event day sign in at the start of the shift. Do not raise the cap while deactivating an account does not end its session (K5, §17). Test: `admin:test/auth-config.test.ts:91-148` |
| R19. The scanner says `Just scanned at another gate — rescan` | Two devices confirmed entry for the same ticket at the same moment. The write is a compare-and-set on `enteredCount`, and the device that lost wrote nothing (`admin:src/repositories/participant.repository.ts:318-345`). Why: two gates must not admit more people than the ticket covers | Scan the ticket again: it shows the seats left, or `Already Attended` (event scanner) or `Already Checked In` (global scanner) | Rescan, as the message says. On the per-event scanner the same code is ignored until the result card clears, 4 s after it shows (`admin:src/components/participants/qr-scanner.tsx:57-60,80`). Behaviour with two real phones is **unverified** |
| R20. A new admin endpoint answers 404 through the site | The path is not in the proxy allow-list `PATHS`, so the proxy answers 404 `Not found.` without calling the admin (`site:src/pages/api/public/[...path].js:20-21,50`). A slug with a capital letter, an underscore or a dot fails the same way | The same path answers on the admin host | Add the path to `PATHS` and a case to `site:tests/proxy/proxy.test.mjs`; deploy ADMIN first, then SITE |

### 18.6 Production smoke checks

**Rule: GET and HEAD only.** Never send POST, PUT, PATCH or DELETE to production as a test: a write can create a real booking, a real order or a real e-mail. Do not add `-L` to check 5.

| # | Command | Expected, all seen on 2026-10-11 |
|---|---|---|
| 1 | `curl -s -o /dev/null -D - https://www.ulsaaham.com/` | Status 200; `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`; `x-vercel-id` starts `bom1::` |
| 2 | `curl -s -o /dev/null -D - https://ulsaaham.com/` | Status 308 to `https://www.ulsaaham.com/` |
| 3 | `curl -s -o /dev/null -D - "https://www.ulsaaham.com/api/public/events?page=1&limit=8&upcoming=true"`, twice | `x-vercel-cache: MISS`, then `HIT`; `x-vercel-id` is `bom1::bom1::...` (edge and function both in Mumbai) |
| 4 | `curl -s -o /dev/null -D - "https://ulsaham-admin-panel.vercel.app/api/public/events?limit=1"` | Status 200; `x-vercel-id` is `bom1::bom1::...` |
| 5 | `curl -s -o /dev/null -D - "https://www.ulsaaham.com/api/auth/google?next=/account"` | A redirect to Google whose `location` carries `redirect_uri=https://www.ulsaaham.com/api/auth/google/callback`, percent-encoded |
| 6 | `curl -s -o /dev/null -w "%{http_code}\n" "https://www.ulsaaham.com/_image?href=<any image URL>"` | `403` |
| 7 | `curl -s https://www.ulsaaham.com/robots.txt` | The file is served (`site:public/robots.txt`) |

- What each proves: 1 the route patch ran and the edge region; 2 the apex redirect; 3 the edge cache and both regions (a first answer of `HIT` only means a visitor asked within the last 5 minutes); 4 the admin is up in `bom1`; 5 the host is trusted (R7); 6 the passthrough image service (R12); 7 static files.
- The commands are written for Git Bash. In Windows PowerShell 5.1 `curl` is an alias of another command: type `curl.exe`, and `-o NUL` in place of `-o /dev/null`.
- NOT checked on 2026-10-11, and not checkable with reads: e-mail delivery, payments, the webhook, the scanner. The owner confirms them by normal use after a deploy (§14.5).

---

## 19. History, branches and versioning

Read from the two local clones on 2026-10-11. Nothing was fetched, so `origin/...` means the local remote-tracking ref. Commit times are IST.

### 19.1 Branch conventions

| Topic | SITE, GitHub `jeff1999git/ulsaaham.com` | ADMIN, GitHub `jeff1999git/UlsahamAdminPanel` |
|---|---|---|
| Production branch | `main`; `origin/main` at `3b3de89` | `main`; `origin/main` at `cdfee7e` |
| Working branch | `dev2` at `187547e` (160 commits) | `dev3` at `ad5620c` (72 commits, linear) |
| Working branch against `origin/main` | 3 merge commits behind, identical content | 31 merge commits behind, identical content |
| How a change reaches `main` | Pull request `dev2` to `main`, merged by the owner in the GitHub UI as a merge commit, never squashed | The same, `dev3` to `main` |
| Pull requests in history | #1-#14 and #17-#27 (what #15 and #16 were is unknown) | #1-#30 |
| Source branch of each pull request | #1-#9 `dev`; #10, #11, #13, #14 `dev1`; #12 a Vercel bot branch; #17-#27 `dev2` | #1-#3 `dev`; #4-#13 `dev1`; #14 `dev2`; #15-#30 `dev3` |
| On `main` without a pull request | Merges `91ca670`, `340bf9d`, `513b908`, `06f7fae`; commits `fa30324`, `a4c2a9e`, `aff0b98`, `fd0ff33`, `1fa4929` (2026-07-28 to 2026-08-09) | Merge `2a8d2a6` (2026-08-09) |
| Local `main` | Stale: `06f7fae`, 25 commits behind `origin/main` | Stale: `12db376`, 22 commits behind `origin/main` |
| Stale branches, all merged into `origin/main` | `dev` `b597ed1`, `dev1` `3233bac`, `origin/vercel/install-vercel-speed-insights-xki5fb` `7cef99b` | `dev` `2a5e915`, `dev1` and `dev2` `d2898e4` |
| Extra worktree | `../web-app-hotfix`, branch `hotfix/ticket-mail-and-host` at `c904ae3` | None |

- Branch names are numbered and the highest number is the live one. Work only on `dev2` (SITE) and `dev3` (ADMIN), and compare against `origin/main`: the local `main` stopped in August 2026 and the lower-numbered branches in June 2026. Note that `dev2` is live on SITE and stale on ADMIN.
- The working branch is behind `main` by design: each pull-request merge adds a merge commit that only `main` has. Fast-forward the working branch to `origin/main` before a new round so the next pull request cannot conflict (done once on SITE, 2026-09-27: the parent of `c28b2ea` is merge `2c4cb21`). Who may commit, push and merge: §2 and §14.4.
- The hotfix worktree is obsolete: take nothing from it. It holds 2 modified files and 1 untracked file, no commit of its own and no upstream, and was never pushed. Its `site:astro.config.mjs` change is identical to `187547e`; its `site:src/pages/api/send-ticket.js` and smoke-test changes are superseded by `site:src/lib/ticket-mail.js:1-4` and `site:tests/build/function-smoke.test.mjs`. Removing it (`git worktree remove`, then deleting the branch) waits for the owner's confirmation (§17).
- Two things mislead in `git log`. Three fixes appear twice with the same subject because they were applied by hand to `main` and to `dev2`: `a4c2a9e` and `e250482`, `fd0ff33` and `56b6fb6` (its subject adds "(same as main fd0ff33)"), `1fa4929` and `aeb8ce7`. Since `dev2` was fast-forwarded, both copies are in its history. Subjects from `c28b2ea` and `d3f60bd` (2026-09-27 21:46) onwards read as generated (origin unconfirmed) and often name one part of a large commit: `c28b2ea` reads "Add comprehensive tests for proxy and backend interactions" and holds the whole C1 site round (66 files). Trust the diff or §20, not the subject.

### 19.2 Versioning

| Item | State |
|---|---|
| SITE package versions | `root:package.json` (package `web-app`) has no `version` field. `site:package.json:4` is `far-fusion` `0.0.1`, set in `becb603` (2025-11-08) and never changed |
| ADMIN package version | `admin:package.json:3` is `ulsaham-admin` `0.1.0`, set in `3528109` (2026-05-31) and never changed |
| Tags and release files | No git tag in either clone (`git tag -l` prints nothing). No changelog or release file in either repo. No code reads a package version, and no version is shown to users |

- A release is identified by its pull request number and its merge commit on `main`. In production on 2026-10-11: SITE PR #27, merge `3b3de89` (2026-10-04 22:14); ADMIN PR #30, merge `cdfee7e` (2026-10-04 22:13).
- Do not bump the package versions: nothing reads them, so a bump is only diff noise. Record a release as a §20 entry that names the pull request and the merge commit. What a release contained: `git log --oneline <previous merge>..<merge>` on `origin/main`. Dependency versions and pins: §4.

### 19.3 Timeline

Round names used here and in §20: security Batch 1 is the first set of fixes from the code scan of 2026-09-27; C1, C2 and C3 are the three checkpoints of the speed round that followed (C1 speed, C2 sign-in and tooling, C3 payment reliability).

#### SITE timeline

| Date | Event | Commit or PR |
|---|---|---|
| 2025-11-08 to 2025-11-09 | Scaffold from the Far Fusion Astro template with a three.js hero; first rebrand | `9e4cf5d`, `becb603`, `c22d59e`; PR #1-#3 |
| 2026-06-06 | Work resumes after a seven-month gap (previous commit `429ed77`, 2025-11-09) | `c6ed0bb` |
| 2026-06-07 to 2026-06-10 | First product build: events list and detail, registration, OTP and Google sign-in, the `/api/public` proxy, ticket image, legal pages, first `/api/send-ticket` | PR #4-#8 |
| 2026-06-12 | QR code in the ticket mail (the change that broke ticket mail, §19.5), early-bird prices, hero video, Cloudinary image helper, Speed Insights | PR #9-#14 |
| 2026-07-28 | Full-screen slide home page, accent colour change, brand partners, complimentary codes and fee breakdown in the form | `e44d623`, `9867020` to `bbdebc8`; merge `91ca670` |
| 2026-07-30 to 2026-08-08 | Three deploy incidents fixed directly on `main` (§19.5) | `a4c2a9e`, `fd0ff33`, `1fa4929` |
| 2026-08-06 to 2026-08-30 | Participation card PDF, event image gallery, start-time gating (replaced on 2026-09-13) | PR #17-#19; merge `06f7fae` |
| 2026-09-13 to 2026-09-14 | Proxy shared secret and client IP relay, Booking Closed, mail hardening, Brevo senders, first test suite | PR #20-#23 |
| 2026-09-27 | Security Batch 1, site half, and the home coverflow go live | `a22a9ad`, `aeacb6d`; PR #24 |
| 2026-09-28 | C1 and ESLint go live; the Astro 5.18 bump breaks Google sign-in until 2026-10-04 (§19.5) | `c28b2ea`, `c929124`; PR #25 |
| 2026-10-04 | C2 goes live at 17:00; C3 with the mail and host fixes goes live at 22:14 | `fcf2989`, PR #26; `5988ff7`, `187547e`, PR #27 |

#### ADMIN timeline

| Date | Event | Commit or PR |
|---|---|---|
| 2026-05-31 | Whole first version in one day: events, participants, scanner, activity logs, Excel export, hard delete | `3528109` plus 27 small commits; PR #1-#3 |
| 2026-06-06 to 2026-06-07 | USER role, group entry count, Razorpay order, verify and webhook, fees, payment rate limits, `DRAFT` renamed `ANNOUNCED`, auto-complete sweep, stored QR removed | PR #4-#10 |
| 2026-06-08 to 2026-06-16 | Ticket lookup by user, coupon codes, bulk Excel import, brand partners | PR #11-#14 |
| 2026-07-28 | Complimentary codes, platform fee switch | PR #15-#17 |
| 2026-08-06 to 2026-08-09 | Competition events, card PDF, chest numbers from 1001, gallery images | PR #18-#20; merge `2a8d2a6` |
| 2026-08-30 | Start-time gate, same-day events fix, revenue and Settings for SUPER_ADMIN only | PR #21-#24 |
| 2026-09-13 | Multi-booking with order-id idempotency (the schema drops two unique indexes, §19.5); `BOOKING_CLOSED` | `b75d66c`, PR #25; `42bfcfa`, PR #26 (merged 2026-09-14) |
| 2026-09-27 to 2026-09-28 | Entry Type and security Batch 1 go live, and `middleware.ts` moves to `admin:src/middleware.ts` (§19.5); C1 goes live | `4a3f8a3`, PR #27; `d3f60bd`, `4b2ee48`, PR #28 |
| 2026-10-04 | C2 goes live at 13:17; C3 goes live at 22:13; the owner drops the legacy unique index in production | `fff7d52`, PR #29; `4f454da`, `ad5620c`, PR #30 |

### 19.4 Things tried and later removed or rejected

| What | When | Why it went | Commit |
|---|---|---|---|
| three.js hero scene (`site:src/components/HeroScene.jsx`, `three`) and site password helpers (`hashPassword`, `verifyPassword`) | Hero off the home page 2026-06-07; both deleted 2026-09-27 | Dead code: the hero was unused, and sign-in is OTP and Google | `912bab8`, `c28b2ea` |
| `site:src/components/TicketChecker.jsx` and the `/ticket` page | 2026-06-07 to 2026-06-12 | Removed in the events overhaul; reason not recorded | `632f61d`, `8aaee6b` |
| Build output and Turbo cache committed to git | 2025-11-08 to 2026-08-01 | A stale copy was deployed (§19.5) | `fd0ff33`, `56b6fb6` |
| `qrcode` loaded through `createRequire` | 2026-06-12 to 2026-10-04 | File tracing left it out of the function (§19.5) | `d7f54a7`, `187547e` |
| Proxy route in TypeScript, `site:src/pages/api/public/[...path].ts` | 2026-06-08 to 2026-09-27 | The tests could not load it; now `.js` with `site:src/lib/edge-cache.js` | `94cd102`, `c28b2ea` |
| Google-hosted fonts; Astro image endpoint with remote patterns | 2025-11-08 to 2026-09-27 | Two extra origins per page; a public `/_image` would fetch and re-encode outside images (`site:astro.config.mjs:29-34`) | `c28b2ea` |
| Booking closes when the event starts | 2026-08-30 to 2026-09-13 | Owner rule: an event is bookable until it ends | `01ca3bc`, `cdae39a`; `7fe15be`, `42bfcfa` |
| One `EMAIL_FROM` sender for all mail | 2026-06-07 to 2026-09-14 | Brevo verifies senders per address | `8ede162` |
| Participation card drawn from the ticket canvas | 2026-08-06 to 2026-08-09 | Crashed for competition entries | `39da14e`, `c1a0f41` |
| Paid tick box (`toggleAmountPaid`) | 2026-05-31 to 2026-09-27 | Owner rule: Entry Type is set once and is read-only (§3) | `0f5c8d7`, `4a3f8a3` |
| One booking per phone, and per e-mail, per event | In the schema from 2026-05-31 (phone) and 2026-06-08 (e-mail) to 2026-09-13; database index dropped 2026-10-04 | It swallowed repeat paid bookings | `3528109`, `1cf59e0`, `b75d66c` |
| Stored QR image per booking (`qrCodeUrl`); `DRAFT` status | Both until 2026-06-07 | The QR is drawn where it is shown; `DRAFT` was renamed `ANNOUNCED` | `48c05d2`, `d7ccf69` |
| `xlsx` 0.18.5 from npm; `sharp` as an ADMIN dependency; zxing wasm from a public CDN | Until 2026-09-27 (first two) and 2026-09-28 | Known vulnerabilities in the npm build (now `admin:package.json:51`); unused; no third party at the gate | `d3f60bd`, `4b2ee48` |
| Booking limit of 5 per hour per IP | Registration from 2026-05-31, payment order from 2026-06-07, both to 2026-10-04 | Buyers on one shared network used up each other's attempts; now 10 per hour per IP and phone plus 60 per hour per IP (`admin:src/lib/ratelimit.ts:25-39,65-79`) | `3528109`, `4bf5e06`, `4f454da` |

- Options rejected before they reached a commit (Preact instead of React, honouring reduced motion on the home coverflow, a 12-poster coverflow, the Brevo HTTP API, a purge hook from the admin to the site edge) are listed with their reasons in §16.

### 19.5 Incidents

| Date | What broke | Root cause | Fix | Permanent guard |
|---|---|---|---|---|
| Until 2026-07-30 | 404 on static routes and `FUNCTION_INVOCATION_FAILED` on every API route | Vercel's output directory pointed at `site:dist`; the adapter writes to `site:.vercel/output` and the project root is the repo root | `a4c2a9e` (`main`), `e250482` (`dev2`) | The build command copies the adapter output to the repo root (`root:vercel.json:6`) |
| Until 2026-08-01 | Every `/api/*` call failed after a cache-hit build; static pages worked | The Turbo cache and a stale `site:.vercel/output` were in git; Turbo replayed the build and restored only `dist/**` | `fd0ff33` (`main`), `56b6fb6` (`dev2`) | `root:turbo.json:6`; `root:.gitignore:37,40`; `site:.gitignore:27,30`; 0 tracked build files on 2026-10-11 |
| Until 2026-08-08 | Google sign-in sent an undefined client id; mail and OTP secrets were missing | Private `import.meta.env` values are fixed at build time, and the variables were added after the build | `1fa4929` (`main`), `aeb8ce7` (`dev2`) | `?? process.env` reads (`site:src/lib/mailer.js:11-23`, `site:src/lib/backend.js:10-11`); no test asserts the pattern |
| 2026-05-31 to 2026-09-27 | ADMIN middleware never ran, per the code scan (**unverified** in production; what guarded pages meanwhile is unknown) | `admin:middleware.ts` sat at the repo root while the app lives in `admin:src/` | `4a3f8a3` | The file is `admin:src/middleware.ts`; no test checks its location |
| 2026-06-12 to 2026-10-04 | No ticket e-mail could be built: "Cannot find module 'qrcode'" | `d7f54a7` loaded `qrcode` through `createRequire`, so file tracing left it out of the function | `187547e` | Static import (`site:src/lib/ticket-mail.js:1-4`); `site:tests/build/function-smoke.test.mjs:76-87` |
| 2026-09-28 to 2026-10-04 | Google sign-in returned to `https://localhost`; the same-site check of `/api/send-ticket` answered 403 | `c28b2ea` raised Astro to 5.18, which ignores `Host` and `X-Forwarded-Host` unless `security.allowedDomains` lists the host | `187547e` | `site:astro.config.mjs:14-21`; the smoke test asserts the redirect URI (`:131-135`) |
| 2026-09-13 to 2026-10-04 | A second paid booking with the same phone was charged, then refused | `b75d66c` dropped the unique index from the schema, but no build runs `prisma db push`, so the index stayed in the database | Owner's manual push on 2026-10-04 (§14.4); code `4f454da` | `admin:src/lib/index-guard.ts:91-94`; 409 `PHONE_ALREADY_REGISTERED` before any order (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:123-128`) |
| 2026-06-08 to 2026-10-04, repeatedly | Commits and pushes nobody planned: junk log commits, then snapshots of unfinished work | Unconfirmed: the editor's commit-and-sync, or a second AI session allowed to commit and push | None | None in code. Check `git status` and `git log -1` before every write (§2) |
| Until 2026-09-27, security, no outage | One real payment could be replayed for any event or seat count | Booking data came from the request, and the webhook trusted notes the payer can set | `4a3f8a3` | Both read the order's own notes: `admin:src/app/api/public/events/[slug]/payment/verify/route.ts:122-130,163-168`; `admin:src/app/api/razorpay/webhook/route.ts:79-84` |
| Until 2026-09-27, security, no outage | Reflected XSS and an open redirect through `next` on `/auth/complete` | An unvalidated redirect target inside an inline script | `a22a9ad` | `site:src/lib/next-path.js:7-28`; `site:tests/auth/next-path.test.mjs` |

- Ticket mail: a local build hides a package the tracing missed, because Node finds it in a parent `node_modules`. The smoke test copies the built function to a temporary folder with no `node_modules` above it, and runs only with `BUNDLE_CHECK=1` after a build (§18). Customers who booked from 2026-06-12 to 2026-10-04 received no ticket e-mail; a re-send has not been requested (§17), and delivery since the fix is **unverified**.
- Legacy index: the guard can switch itself off. The index list is cached 10 minutes per instance, a failed check 1 minute, and a check unanswered after 3 s counts as "no legacy index" (`admin:src/lib/index-guard.ts:11,13,18`). It checks the phone only. The real protection is the manual push before the merge (§11, §14.4).
- Unplanned commits: Turbo-log and build-output commits `f21479c`, `0adc28a`, `6046102`, `fa30324`, `c73e570`, `e23b22c`, `e320f5b` (2026-06-08 to 2026-07-30), then snapshots `d3f60bd` and `c28b2ea` (2026-09-27 21:46) and `5988ff7` and `4f454da` (2026-10-04 17:47 and 17:48). All carry the owner's git identity. One snapshot swept up a temporary test, `admin:test/zz-probe.test.ts`, removed in `ad5620c`.

---

## 20. Changelog

Newest first. Entries dated before 2026-10-11 were reconstructed from git on that day, with small commits merged into one entry per piece of work. Their date is the last commit of the entry (IST); "live" names the pull request and its merge commit on `main`. Round names (security Batch 1, C1, C2, C3) are explained in §19.3. "Not recorded" under Verified means no test, measurement or note from that time survives. New entries go on top, using the template in §0.5.

#### 2026-10-17 - dev2 - site - Project handbook added
- **What:** new `root:project_context.md` (this file), covering both repos. `root:AGENTS.md` and `root:CLAUDE.md` (committed by the owner as `3bfdcea`) tell AI agents to read §0 to §4 first and to update this file after every change.
- **Why:** the owner asked for one source of truth that survives a move to another machine or coding tool.
- **Verified:** every section was drafted from fact-checked reads of the code at `187547e` (site) and `ad5620c` (admin), then checked against the code again. Quality baselines and production GET checks of 2026-10-11 are in §18.1 and §18.6. The final cross-section consistency review was stopped by the owner before it finished, so contradictions between sections are possible. The secret and personal-data scan of §0.6 was run on the assembled file.
- **Follow-ups:** a cross-section consistency pass; correct the stale `root:README.md` (§17.6); the companion repo has no copy of this file.

#### 2026-10-04 - dev2 - site - C3 payment reliability, with the ticket mail and Google redirect fixes
- **What:** `187547e`; live with PR #27, merge `3b3de89` (2026-10-04 22:14). Pay reuses its Razorpay order for 15 min (`site:src/lib/payment-flow.js:10`); verify is retried after 1, 3 and 6 s on status 0, 500, 502, 503 or 504 (`:26-27`); a pending payment is stored under `ulsaham_pending_payment`, looked up for 30 min and kept 24 h (`site:src/lib/pending-payment.js:9-14`), and polled every 3 s for 60 s (`site:src/components/RegistrationForm.jsx:35-36`); new `site:src/components/VerifyFailed.jsx`, `site:src/lib/fees.js`, `site:src/lib/razorpay.js`; `security.allowedDomains` (`site:astro.config.mjs:14-21`); static `qrcode` import (`site:src/lib/ticket-mail.js:1-4`); built-function smoke test.
- **Why:** A lost tab or a failed confirmation could leave a paid customer without a ticket. Google sign-in returned to localhost and no ticket mail could be built (§19.5).
- **Verified:** Re-run at this commit on 2026-10-11: 239 of 239 tests pass after a build, lint 0 errors (§18.1). Google redirect confirmed in production the same day (§18.6). Ticket e-mail delivery in production is **unverified**.
- **Follow-ups:** K2, D26; a ticket can be e-mailed twice; re-send for bookings made from 2026-06-12 to 2026-10-04; remove the hotfix worktree (§17).

#### 2026-10-04 - dev3 - admin - C3 staff tools, recorded revenue and deferred image deletes
- **What:** `ad5620c`; live with PR #30, merge `cdfee7e` (2026-10-04 22:13). Excel import writes 200 rows at a time and takes at most 1000 rows (`admin:src/services/participant.service.ts:198`, `admin:src/actions/participant.actions.ts:393`); chest numbers are reserved atomically; `amountPaidPaise` and `archivedRevenuePaise` record what Razorpay charged, in paise (`admin:prisma/schema.prisma:62,135`); a second payment on a paid ticket is logged for staff (`admin:src/lib/duplicate-payment.ts`); the public event detail also returns a cancelled event, so the site can show a notice instead of "not found" (`admin:src/repositories/event.repository.ts:43`); replaced images are deleted after 2 h (`admin:src/services/housekeeping.service.ts:14`); slug collision check; removes `admin:test/zz-probe.test.ts`.
- **Why:** Revenue was an estimate, and images were deleted while cached site pages still showed them.
- **Verified:** Recorded run of 2026-10-04: type-check 0 errors, 690 tests in 15 files, lint 0 errors, build and bundle check passed. Re-run on 2026-10-11 without the build: the same counts (§18.1). Atomic chest numbers and the image-delete queue are **unverified** against the production database.
- **Follow-ups:** K2, K3, K4, K6, K7. Staff adds to closed or full events, and keeping payment ids after the 14-day prune, are undecided (§17).

#### 2026-10-04 - dev3 - admin - C3 money path, payment status, legacy index guard and webhook ticket mail
- **What:** `4f454da`; live with PR #30. New `POST /api/public/events/<slug>/payment/status` (30 per minute, `admin:src/lib/ratelimit.ts:92-98`); one shared `validateCoupon` (`admin:src/lib/coupon.ts:18`); `admin:src/lib/index-guard.ts` and a 409 `PHONE_ALREADY_REGISTERED` before any order is created (`admin:src/app/api/public/events/[slug]/payment/order/route.ts:123-128`); the webhook asks the site to mail the ticket (`admin:src/lib/site-ticket-mail.ts:25-52`, 5 s timeout); booking limits become 10 per hour per IP and phone plus 60 per hour per IP (`admin:src/lib/ratelimit.ts:25-39,65-79,154-164`); `safeHexEqual`; `requestId` makes a free registration retry-safe; optional env key `SITE_URL` (`admin:src/lib/env-schema.ts:30-33`).
- **Why:** A retried verify answered 500, a lost tab had no recovery, and the legacy unique index charged a customer and then refused the booking (§19.5).
- **Verified:** 523 tests passed after review (batch summary of 2026-10-04); the guard is covered by `admin:test/booking-logic.test.ts`. The owner confirmed on 2026-10-04 that a second booking with the same phone works after the manual index push.
- **Follow-ups:** An unplanned snapshot commit that included a temporary probe test (§19.5). Whether webhook deliveries succeed is **unverified** (§17).

#### 2026-10-04 - dev2 - site - C3 server side, proxy allow-lists and the signed ticket mail route
- **What:** `5988ff7`; live with PR #27. The `/api/public` proxy forwards only 4 request headers, accepts GET, HEAD, POST and OPTIONS (anything else 405) and only the listed paths (anything else 404) (`site:src/pages/api/public/[...path].js:10-22,47-50`); writes time out after 25 s beside the 8 s read timeout, both answering 504 (`:27-28,101-104`); new signed route `/api/internal/ticket-mail` and shared mail builder `site:src/lib/ticket-mail.js`; `/api/send-ticket` answers 409 for an unpaid booking (`site:src/pages/api/send-ticket.js:73-76`); `site:src/lib/contact.js`.
- **Why:** A booking completed by the Razorpay webhook never got a ticket e-mail, and the proxy passed every request header but six on to the admin, cookies and `Authorization` included.
- **Verified:** 181 tests passed at that point (batch summary of 2026-10-04); covered by `site:tests/proxy/proxy.test.mjs` and `site:tests/mail/internal-ticket-mail.test.mjs`.
- **Follow-ups:** An unplanned snapshot commit (§19.5). Its mail builder still used `createRequire` until `187547e`.

#### 2026-10-03 - dev2 - site - C2 sign-in hardening and page weight budgets
- **What:** `fcf2989`; live with PR #26, merge `c904ae3` (2026-10-04 17:00). Google sign-in is bound to the browser by the cookie `g_oauth_nonce` and requires `verified_email` (`site:src/lib/google-oauth.js:8`, `site:src/pages/api/auth/google/callback.js:22,65`); wrong OTP guesses are capped in server memory at 10 per address per code and 30 per IP per hour (`site:src/pages/api/auth/verify-otp.js:16-17`); `/auth/complete` is prerendered; `ulsaham_accounts` keeps only a Google flag per address (`site:src/lib/auth.js:2-5`); nodemailer 6 to 10; the `lint` script; bundle-budget and public-event contract tests.
- **Why:** Scan findings: login CSRF on the Google callback, an OTP attempt counter the client could reset, and earlier visitors' profiles left in browser storage on a shared phone.
- **Verified:** Tests added in the commit (`site:tests/auth/`, `site:tests/build/bundle-budget.test.mjs`, `site:tests/contract/`); they are part of the 2026-10-11 run (§18.1).
- **Follow-ups:** The OTP ceilings are per server instance. Move them to a shared store before a code ever issues a server session (K1).

#### 2026-10-03 - dev3 - admin - C2 staff sign-in, env split, ESLint and the first tests
- **What:** `fff7d52` and `f1fe894` (`admin:.env.example` only); live with PR #29, merge `8498e38` (2026-10-04 13:17). Login is a `useActionState` form; every sign-in writes a `LOGIN` activity-log entry (`admin:src/lib/auth.ts:48-55`); unknown and inactive usernames get a dummy bcrypt compare (`admin:src/lib/auth.ts:14-18,35-39`); the env schema is split into runtime keys and seed-only keys (`admin:src/lib/env-schema.ts:7-42`); `admin:eslint.config.mjs`; `admin:scripts/check-bundle.mjs`; 9 test files and `admin:test/fixtures/fee-cases.json`; deletes 4 unused UI files and `admin:src/lib/qrcode.ts`.
- **Why:** Scan findings: response time revealed which usernames exist, and the `LOGIN` log entry was never written, because `auth()` cannot see the cookie `signIn` sets in the same request. Before the split the running app refused to start without the seed account's credentials.
- **Verified:** Tests added in the commit; they are part of the 690 that pass on 2026-10-11 (§18.1).
- **Follow-ups:** K5. The seed keys can now be removed from the production environment; not confirmed done (§17).

#### 2026-09-28 - dev2 - site - C1 speed round and ESLint
- **What:** `c28b2ea` (2026-09-27, 66 files) and `c929124`; live with PR #25, merge `7f3430f` (2026-09-28 06:48). `astro` `^5.15.4` to `^5.18.2`; the `/api/public` proxy rewritten as `.js` with edge caching (`site:src/lib/edge-cache.js`, table in §7); region `bom1`, a frozen lockfile and the route patch (`root:vercel.json:4-6`); `passthroughImageService`; self-hosted fonts; API prefetch (`site:src/lib/page-data.js`); lazy jsPDF; IST date helper; `site:src/components/SiteNav.astro`; 404 page; `site:public/robots.txt`; read-only dev proxy; `site:eslint.config.js`. Removes `site:src/components/HeroScene.jsx`, `three`, the password helpers, the nested `site:bun.lock` and `root:index.ts`.
- **Why:** Production API calls took 0.95 to 1.33 s, because the functions ran in `iad1` while the database is in Mumbai, and nothing was cached.
- **Verified:** Saved measurements: detail page script 209,816 to 83,087 B gzip, account page 205,448 to 79,405 B. Tests for the proxy, prefetch, dev proxy and route patch came with the commit. Edge `HIT` and `bom1` confirmed in production on 2026-10-11 (§18.6).
- **Follow-ups:** The Astro bump broke Google sign-in until `187547e` (§19.5). `c28b2ea` was an unplanned snapshot commit. Node is still not pinned (§17).

#### 2026-09-28 - dev3 - admin - C1 speed round, gate scanner and test harness
- **What:** `d3f60bd` (2026-09-27, 91 files) and `4b2ee48`; live with PR #28, merge `8eca18f` (2026-09-28 06:47). next `^15.5.26`, next-auth `^5.0.0-beta.32`, razorpay `^2.9.8`, SheetJS 0.20.3 from its own tarball (`admin:package.json:41-43,51`), `sharp` removed; `admin:vercel.json` (`bom1`, `fluid: true`); 4 MB upload cap with client downscale (`admin:src/constants/index.ts:6-9`); lazy xlsx and jsPDF; native header menu and filters; throttled housekeeping (`admin:src/lib/ratelimit.ts:172-186`); the rate limiter fails open (`:137-144`); loading and error boundaries. Scanner: self-hosted zxing wasm (`admin:next.config.ts:5-19`), QR-only decoding, compare-and-set entry count. Test harness: `admin:test/setup.ts`, `admin:vitest.config.ts`.
- **Why:** Slow pages and heavy first loads, known vulnerabilities in the npm build of `xlsx`, and a third-party CDN plus a camera restart per ticket at the gate.
- **Verified:** Recorded build figures of 2026-09-27: participants First Load JS 452 to 155 kB, events 197 to 140 kB. Review found and fixed a scanner regression for bookings without `enteredCount`. The two-phone gate test is **unverified**.
- **Follow-ups:** K7. `d3f60bd` was an unplanned snapshot commit (§19.5). PNG uploads over 4 MB are refused (§17).

#### 2026-09-27 - dev2 - site - Safe redirects after sign-in, and the home coverflow
- **What:** `a22a9ad` and `aeacb6d`; live with PR #24, merge `2c4cb21` (2026-09-27 14:40). `safeNextPath` (`site:src/lib/next-path.js:7-28`) checks `next` in the sign-in form, both Google routes and `/auth/complete`. The home events slide shows past events as a coverflow when there are no upcoming events (`site:src/components/HomeEventsSection.jsx:13`, `site:src/components/PastEventsCoverflow.jsx`).
- **Why:** Security Batch 1: reflected XSS and an open redirect through `next` on `/auth/complete`. The home events slide was empty without upcoming events.
- **Verified:** `site:tests/auth/next-path.test.mjs` came with the fix. The coverflow had no test: not recorded.
- **Follow-ups:** The coverflow ignores `prefers-reduced-motion` on purpose (owner decision of 2026-09-27, §16).

#### 2026-09-27 - dev3 - admin - Entry Type and security Batch 1
- **What:** `4a3f8a3`; live with PR #27, merge `179ae9d` (2026-09-27 14:41). `EntryType` enum `PAID`, `COMPLIMENTARY`, `FREE` (`admin:prisma/schema.prisma:85-90`) shown as a read-only column; `toggleAmountPaid` removed; verify and the webhook build the booking from the Razorpay order's notes (`fetchOrderBooking`, `admin:src/lib/razorpay.ts:112`); `admin:middleware.ts` moved to `admin:src/middleware.ts`; a session ends 24 h after sign-in (`admin:auth.config.ts:19,82-83`); the USER role loses the logs and scan pages and the participant list data; `admin:scripts/backfill-entry-type.ts` (a dry run unless `--apply`).
- **Why:** Owner rule of 2026-09-27: no Paid tick box, the entry type is set once when the booking is created. Scan findings: one real payment could be replayed for any event or seat count, and the middleware had never run (§19.5).
- **Verified:** Not recorded at the time. The role matrix and the session cap are covered since 2026-10-03 by `admin:test/auth-config.test.ts`.
- **Follow-ups:** Whether the backfill was run with `--apply` is unknown (§17). The optional `entryType` field needed no database push.

#### 2026-09-14 - dev2 - site - Brevo senders and the first offline test suite
- **What:** `8ede162` and `0543a43`; live with PR #23, merge `4dc9172` (2026-09-14 22:24). `sendMail` takes a sender key, `otp` or `ticket`, each with its own verified sender (`site:src/lib/mailer.js:36-39`; env keys `OTP_EMAIL_FROM`, `TICKET_EMAIL_FROM`); `EMAIL_FROM` is no longer read. A suite on `node --test` runs the real source against a throwaway SMTP server.
- **Why:** Brevo replaced the previous SMTP provider, and it verifies senders per address.
- **Verified:** By the suite added in `0543a43`: transport options, both mail routes end to end, and a scan of the browser bundle for credentials.
- **Follow-ups:** An AI session made these two commits. They are the last of 11 site and 4 admin commits (2026-06-07 to 2026-09-14) with an AI co-author trailer: the rule that only the owner commits dates from this day (§2). Run the suite with `bun run test`, never `bun test`, which would run the files on the Bun runtime instead of Node.

#### 2026-09-14 - dev2 - site - Hardened ticket and OTP mail
- **What:** `0bf3ec7` and `5521da9`; live with PR #22, merge `a177eaa` (2026-09-14 21:11). `/api/send-ticket` requires a same-origin request, looks the booking up in the admin and builds the mail from that record with every value escaped; a repeat send to the same address within 60 s is dropped (`site:src/lib/ticket-mail.js:18`); the OTP code left the subject line; per-IP and per-address send ceilings (§7); sign-in is refused when `OTP_SECRET` is missing in production (`site:src/lib/otp.js:13-22`); pooled SMTP with timeouts (`site:src/lib/mailer.js:70-77`); the success screen says so when a booking has no e-mail address.
- **Why:** The ticket endpoint accepted any JSON from anyone and mailed it, unescaped, from the company address.
- **Verified:** Not recorded at the time; covered by the suite added later the same day (`0543a43`).
- **Follow-ups:** The route still could not load `qrcode` in production, unnoticed until 2026-10-04 (§19.5).

#### 2026-09-13 - dev3 - admin - Multi-booking, order id idempotency and Booking Closed
- **What:** `b75d66c` (PR #25, merge `9d1d90a`, 2026-09-13) and `42bfcfa` (PR #26, merge `4a4b911`, 2026-09-14). Drops `@@unique([eventId, phone])` and `@@unique([eventId, email])`; adds `paymentOrderId`, `paymentId` and plain indexes (`admin:prisma/schema.prisma:124-127,142-149`); ticket codes derive from the Razorpay order id (`admin:src/lib/ticket-code.ts:24-32`); `PROXY_SHARED_SECRET` marks requests from the site proxy as trusted (`admin:src/lib/ratelimit.ts:188-195`); `admin:scripts/report-unrecorded-payments.ts`. New status `BOOKING_CLOSED` (`admin:prisma/schema.prisma:71-77`), `admin:src/lib/event-status.ts`, completion at the real end instant in IST; public payloads gain `bookingOpen`, `bookingClosedReason`, `bookingClosedMessage`.
- **Why:** Owner rules: a customer may hold several bookings for one event, with paid bookings idempotent on the order id (2026-09-08); booking stays open until the event ends, and `COMPLETED` is never chosen by hand (2026-09-13).
- **Verified:** Not recorded at the time; `admin:test/booking-logic.test.ts` and `admin:test/event-time.test.ts` were added later.
- **Follow-ups:** The index change needed a manual `prisma db push`, which did not happen until 2026-10-04: a second booking was charged and then refused (§19.5). K2.

#### 2026-09-13 - dev2 - site - Proxy shared secret, client IP relay and Booking Closed
- **What:** `8a69252` (PR #20, merge `c665910`, 2026-09-13) and `7fe15be` (PR #21, merge `b1181ac`, 2026-09-14). The proxy sends `x-client-ip` and `x-proxy-key` to the admin (`site:src/lib/backend.js:42-50`); My Bookings handles several tickets for one event; `site:src/lib/event-status.js` drives the cards, the detail page and the form from `bookingOpen` and `bookingClosedReason`, and an event stays bookable until its end time.
- **Why:** Behind the proxy every visitor shared one rate-limit bucket on the admin. Owner rule of 2026-09-13 on booking windows.
- **Verified:** Not recorded at the time; proxy tests exist since `c28b2ea`, `site:tests/lib/event-status.test.mjs` since `187547e`.
- **Follow-ups:** `PROXY_SHARED_SECRET` must be identical in both Vercel projects (§12).

#### 2026-08-30 - dev3 - admin - Start-time gate, same-day events fix, super admin only revenue and settings
- **What:** `cdae39a`, `c9fa9a1`, `2e2659b`, `fa2ce59`, `97c2f0c`; PR #21-#24 (2026-08-30). No booking after the start time; an event stays in the public upcoming list on its own day; dashboard revenue cards and the Settings page are for SUPER_ADMIN only; participant counts are seat-based (`sumParticipantsForEvents`, `admin:src/repositories/participant.repository.ts:220`).
- **Why:** `c9fa9a1`: the event date is stored as UTC midnight of the chosen day, so `date > now` dropped an event from the list hours before it started. No reasoning is recorded for the rest.
- **Verified:** Not recorded.
- **Follow-ups:** The start-time gate was replaced by the end-time rule on 2026-09-13 (`42bfcfa`).

#### 2026-08-30 - dev2 - site - Start-time gating
- **What:** `01ca3bc`; PR #19, merge `169ec68` (2026-08-30). New `site:src/lib/event-time.js`; the cards, the detail page and the form stop booking at the start time with an "event has started" message.
- **Why:** Stop bookings once an event has started, matching the admin gate of the same day (`cdae39a`).
- **Verified:** Not recorded.
- **Follow-ups:** Replaced two weeks later by the end-time rule (`7fe15be`); `hasEventStarted` was removed from `site:src/lib/event-time.js` in `c28b2ea` (the file itself stays).

#### 2026-08-09 - dev3 - admin - Competition events, participation card and gallery images
- **What:** `a9e5287`, `16fde1a`, `a18a068` (PR #18-#19, 2026-08-06); `c1a0f41` (merged without a pull request, `2a8d2a6`); `eda0e75` (PR #20, 2026-08-09). Events gain `isCompetition`, a participation type, a group extra amount, instructions and notes; the participation card is a plain PDF; chest numbers start at 1001 (`COMPETITION_NUMBER_BASE = 1000`, `admin:src/constants/index.ts:15`); multi-image gallery upload.
- **Why:** A new event type. `c1a0f41`: the card download referenced a removed variable and crashed for competition entries.
- **Verified:** Not recorded.
- **Follow-ups:** Chest numbers became atomic only in `ad5620c`.

#### 2026-08-09 - dev2 - site - Participation card PDF and event image gallery
- **What:** `961508d` (PR #17, merge `f3542c3`, 2026-08-06), `39da14e` (merged without a pull request, `06f7fae`), `a5d3245` (PR #18, merge `32308d4`). jsPDF and `site:src/lib/participation-card-pdf.js`; card download on the success screen and in My Bookings; the card is a plain details PDF with the chest number, not the ticket canvas; image gallery with navigation and auto-scroll in `site:src/components/EventDetail.jsx`.
- **Why:** Competition events and gallery images arrived in the admin the same week. The canvas path could throw for competition entries.
- **Verified:** Not recorded.
- **Follow-ups:** jsPDF became a lazy import in `c28b2ea`. The PDF uses jsPDF's built-in fonts (`site:src/lib/participation-card-pdf.js:65`), so text in Indic scripts is not expected to render: **unverified** (§17).

#### 2026-08-08 - main - site - Runtime env fallback for server secrets
- **What:** `1fa4929` on `main`, `aeb8ce7` on `dev2`. Server secrets are read as `import.meta.env.NAME ?? process.env.NAME` (`site:src/lib/mailer.js:11-23`, `site:src/lib/backend.js:10-11`). Google OAuth, SMTP and the OTP secret were affected.
- **Why:** Private `import.meta.env` values can be fixed at build time, so a deployment built before a variable was added kept serving `undefined` (§19.5).
- **Verified:** By the owner in production at the time, per the deploy note; **unverified** here.
- **Follow-ups:** Always read by name: indexing or spreading `import.meta.env` inlines the whole build environment into the bundle (`site:src/lib/mailer.js:6-10`). An env change still needs a redeploy (§12).

#### 2026-08-01 - main - site - Stop deploying stale build output
- **What:** `fd0ff33` on `main`, `56b6fb6` on `dev2`, after the empty redeploy commit `aff0b98`. Untracks the `.turbo/` folders and `site:.vercel/output` (189 files on `main`, 174 on `dev2`), ignores both (`root:.gitignore:37,40`, `site:.gitignore:27,30`) and adds `.vercel/output/**` to the Turbo build outputs (`root:turbo.json:6`).
- **Why:** With the Turbo cache in git, Vercel replayed a cached build, restored only `dist/**` and deployed the stale committed `site:.vercel/output`, so every function call failed (§19.5).
- **Verified:** By a production redeploy at the time, per the deploy note (**unverified** here). `git ls-files` shows 0 tracked build files on 2026-10-11, and the API routes answer in production that day (§18.6).
- **Follow-ups:** Never commit `.vercel/` or `.turbo/`.

#### 2026-07-30 - main - site - Vercel output directory fix
- **What:** `a4c2a9e` on `main`, `e250482` on `dev2`. The build command copies the adapter output from `site:.vercel/output` to `root:.vercel/output` (`root:vercel.json:6`), instead of pointing the output directory at `site:dist`.
- **Why:** The Vercel project root is the repo root, so Vercel never found the adapter output: static routes answered 404 and every API route `FUNCTION_INVOCATION_FAILED` (§19.5).
- **Verified:** By a production redeploy at the time (**unverified** here). Pages and API routes answer in production on 2026-10-11 (§18.6).
- **Follow-ups:** The same command gained the route patch in `c28b2ea` (§13.1).

#### 2026-07-28 - dev3 - admin - Complimentary codes and the platform fee switch
- **What:** `d2269fa`, `4b26e78`, `789f222`, `a76e87c`; PR #15-#17 (2026-07-28). Complimentary codes with `maxUses` and `usedCount` (`admin:prisma/schema.prisma:97-101`); a platform fee switch per event; stricter coupon and complimentary code validation; a free registration is stored with `amountPaid: true`.
- **Why:** New product features; no reasoning is recorded in the commits.
- **Verified:** Not recorded.
- **Follow-ups:** Code use is counted per booking, not per seat, and not atomically (K3). Free bookings made before this date are stored as unpaid (§17).

#### 2026-07-28 - dev2 - site - Home page redesign, complimentary codes and fee display
- **What:** `e44d623` (2026-06-17) and the 22 commits `9867020` to `bbdebc8`; merged into `main` without a pull request as `91ca670` (2026-07-28 22:50). Full-screen slide home page; accent colour `#fecc01` to `#9bca3b` (`fca5634`); explore button; footer; brand partners island (`site:src/components/BrandPartners.jsx`); complimentary-code handling in the form (`e3559fd`, `7c91f4c`); fee breakdown (`3c444d0`).
- **Why:** A redesign, plus the admin features of the same day (complimentary codes, platform fee) and its brand partners endpoint.
- **Verified:** Not recorded.
- **Follow-ups:** These commits also carried build output and Turbo logs, cleaned up on 2026-08-01.

#### 2026-06-16 - dev2 - admin - Bulk Excel import and brand partners
- **What:** `d47dbc6`, `797af2a`, `d2898e4`; PR #14, merge `46d5d7d` (2026-06-16). Bulk participant import from Excel with validation; brand partner management with logo crop and upload; the public `brand-partners` endpoint.
- **Why:** No reasoning is recorded. The import serves bulk entry by staff; the endpoint feeds the site's partners slide (`e44d623`).
- **Verified:** Not recorded.
- **Follow-ups:** The import was rewritten on 2026-10-04 (`ad5620c`). ADMIN `dev2` has been a stale branch ever since (§19.1).

#### 2026-06-12 - dev1 - site - Ticket mail QR, early-bird prices, hero video and the events overhaul
- **What:** PR #9-#14, all merged on 2026-06-12 (#9 from `dev`, #12 from a Vercel bot branch, the rest from `dev1`). `16f502e` adds `qrcode` to the ticket mail with a static import, and `d7f54a7` changes it to `createRequire`; early-bird pricing (`70d9111`); past-events runner (`a431921`); hero video with a sound toggle (`b597ed1`); `TicketChecker` and the `/ticket` page removed (`8aaee6b`); "ticket" reworded to "booking" (`0c660d8`, `7116953`); Cloudinary helper `site:src/lib/image.js` (`64e89c4`); Speed Insights from a Vercel bot pull request (`7cef99b`, PR #12).
- **Why:** Feature build-out; no reasoning is recorded in the commits.
- **Verified:** Not recorded.
- **Follow-ups:** `d7f54a7` is the root of the ticket mail outage of 2026-06-12 to 2026-10-04 (§19.5). The bot commit was the first to put `site:.vercel/output` into git.

#### 2026-06-09 - dev1 - admin - Roles, Razorpay payments, event statuses, ticket lookup and coupons
- **What:** PR #4-#13 (2026-06-07 to 2026-06-10). `USER` role with path restrictions (`5de249c`); `enteredCount` and partial entry for group tickets (`2a5e915`); Razorpay order and verify, the webhook, role checks on server actions, reworked CORS headers, fee calculation, the `my-tickets` endpoint and a 5 per hour limit on payment orders (`ba46e63`, `e07b11f`, `d18fa03`, `4bf5e06`); `DRAFT` renamed `ANNOUNCED` and a venue link (`d7ccf69`); auto-complete of expired events (`a7acb04`); past events (`d1ca279`); stored QR images removed (`48c05d2`); `my-tickets-by-user` endpoint (`1cf59e0`); coupon codes and the `apply-coupon` route (`74cc7e9`).
- **Why:** Paid events, counter staff and ticket recovery on the site; no reasoning is recorded in the commits.
- **Verified:** Not recorded.
- **Follow-ups:** `my-tickets-by-user` has no identity check (K1). The webhook trusted notes the payer can set until `4a3f8a3`.

#### 2026-06-09 - dev - site - First product build, sign-in and the API proxy
- **What:** PR #4-#8 (merged 2026-06-08 to 2026-06-10). Events list and detail with registration (`632f61d`); OTP sign-in (`7c3e646`, `c998f11`); ticket image drawn on a canvas (`4d37b62`); about, privacy and terms pages (`912bab8`); brand spelling fixed to "Ulsaham" (`3edf8f2`); Google OAuth (`1b4b56c`); the `/api/public` proxy route (`94cd102`); mobile navigation (`45cd210`); ticket recovery (`9876045`); sign-in and registration refactor with the first `/api/send-ticket` (`6386908`).
- **Why:** The first real product build. The proxy exists so the browser never calls the admin host directly.
- **Verified:** Not recorded.
- **Follow-ups:** The proxy was rewritten as `.js` with caching in `c28b2ea` and given allow-lists in `5988ff7`.

#### 2026-05-31 - dev - admin - First version
- **What:** `f382af8` (initial commit, one file), `3528109` (109 files) and 27 small commits up to `f02ea78`; PR #1-#3 (2026-05-31). Events, participants, QR scanner, activity logs, profile settings, Excel export, the Paid tick box (`0f5c8d7`), hard delete of participants with an archived count (`89ff98a`).
- **Why:** Project start.
- **Verified:** Not recorded.
- **Follow-ups:** `admin:middleware.ts` sat at the repo root from `3528109` and, per the code scan, did not run until 2026-09-27 (§19.5). The commit subjects of this day ("updates", "call") carry no reasoning.

#### 2025-11-09 - dev - site - Project scaffold
- **What:** `9e4cf5d`, `becb603`, `c22d59e`, `429ed77`; PR #1-#3 (2025-11-08 and 2025-11-09). Bun and Turborepo monorepo with the Far Fusion Astro template, a three.js hero, the first rebrand and the Vercel config.
- **Why:** Project start. No further commit until 2026-06-06.
- **Verified:** Not recorded.
- **Follow-ups:** The app folder and package are still named `far-fusion`. `.turbo/` logs and cache were tracked from `becb603` until 2026-08-01.

---

## 21. Glossary

Terms as THIS project uses them, in alphabetical order. Where the code's name differs from the word staff or customers use, both are given.

| Term | Meaning |
|---|---|
| Activity log | The `ActivityLog` table: who did what in the admin panel, plus rows written by the system. Kept 30 days and pruned when someone opens `/admin/logs` (§8.17) |
| ADMIN | Two meanings. The ADMIN repo: the Next.js app that is both the staff panel and the backend API (paths written `admin:`). The `ADMIN` role: middle staff role (§3.3) |
| Allow-list | A list of exactly what may pass. Used for the public event fields (`toPublicEvent`), the proxy's paths, methods and headers, and the hosts the site trusts |
| `amountPaid` | A Boolean on a booking meaning "settled", not an amount. The amount is `amountPaidPaise` (`admin:prisma/schema.prisma:120,135`) |
| `ANNOUNCED` | Event status for a draft: the default, hidden from the public site. It was called `DRAFT` until 2026-06-07 |
| Archived counts | `archivedParticipantCount` and `archivedRevenuePaise` on an event: seat and revenue totals saved just before its bookings are pruned |
| `bom1` | Vercel's Mumbai region. Both projects are pinned to it because the database is in Mumbai |
| Booking | One reservation for one event, covering 1 to 10 seats. One `Participant` row, one ticket code. The site says "booking"; the code mostly says "ticket" or "participant" |
| Booking closed | Any state in which the form refuses: reasons `ENDED`, `CANCELLED`, `NOT_PUBLISHED`, `CLOSED`, `FULL`. `BOOKING_CLOSED` is also a status a super admin sets by hand. The booking form reads "Booking Closed" for every reason, with one line of detail; a cancelled event's page says "Event Cancelled" instead |
| Booking window | From publication until the event's end instant: date plus end time, IST (§6.9) |
| Brand partner | A sponsor's name and logo, kept in `Settings.brandPartners` and shown on the home page partners slide |
| C1, C2, C3 | The three checkpoints of the work round of 2026-09-27 to 2026-10-04: speed, sign-in, payments. Used in §19 and §20; the names appear in neither repo |
| Capacity | Optional seat limit of an event. "Seats" and `registeredCount` mean the SUM of seats over bookings, not the number of bookings |
| Chest number | The number a competition entrant wears: `competitionNumber` in code, from 1001 upwards, handed out atomically per event |
| Competition | An event with `isCompetition`: entries get a chest number and a participation card instead of a QR ticket |
| `COMPLETED` | Event status set automatically once the end has passed; never chosen by hand. Completed events form the public Past lists |
| Complimentary code | A code that makes a whole booking on a paid event free. Has `maxUses`; one booking is one use. Sent to `register`, never to Razorpay |
| Counter staff | The `USER` role: staff who enrol walk-in customers at the venue. They see only the events list. Labelled "User" on the Accounts page |
| Coupon | A code for a flat rupee discount on the whole order. Always worth less than the per-person price; paid through Razorpay |
| db push | `prisma db push`: makes the database's indexes match the schema. There are no migrations. Never run by the build; the owner runs it by hand (G24) |
| Dev proxy | The Vite proxy used by `astro dev`: GET and HEAD go to the PRODUCTION admin, every other method gets a local 403 (§13.2) |
| Early bird | A per-event switch plus a lower price (`isEarlyBird`, `earlyBirdAmount`). Not tied to a date |
| Edge cache | Vercel's CDN storing some `GET /api/public` answers for the site, steered by the `vercel-cdn-cache-control` header: seconds fresh, then seconds served stale while it refreshes (§7.8) |
| Effective amount | The per-person price actually charged: the early-bird price while it is on, else `amount`; `null` for a free event |
| Effective status | The status as the clock sees it: an event past its end reads `COMPLETED` even when the database still says `PUBLISHED`. The public event API always sends this one; writing a paid booking checks the STORED status (G13) |
| Enrolled lock | After one enrolment, counter staff see a disabled "Enrolled" button for that event on that device (`localStorage` key `ulsaham_user_enrollments`). Nothing clears it |
| Entry type | How a booking was settled: `PAID`, `COMPLIMENTARY` or `FREE`. Set once at creation, read-only (G29) |
| Fail open | When a guard cannot answer, the request goes through. Used by the rate limiters, the housekeeping lock and the index guard |
| far-fusion | The site app's folder and package name (`apps/site/far-fusion`). Not a product name; believed to be the starter template's name (**unverified**). The build command hard-codes the folder (`root:vercel.json:6`) |
| Featured | A flag on an event: own section on `/events`, a badge on cards and on the event page |
| Fee fixture | `fee-cases.json`: 30 worked price cases, the same file in both repos, run by both test suites. Also called the golden fee table |
| Fluid compute | A Vercel function mode switched on for the ADMIN project (`admin:vercel.json:3`) |
| Gate scanner | The camera QR scanner in the admin panel: one per event and one global at `/admin/scan` (§8.14) |
| Group registration | A competition booking with 2 or more members. The first member pays the entry price, each further one `groupExtraAmount` |
| GST | Goods and Services Tax: 18% of the discounted base when switched on for the event |
| Housekeeping | Cleanup started by page views, never by a timer: prune old bookings, delete released images, prune old activity logs. At most once an hour (§10) |
| Idempotency key | What makes a repeated request return the first booking instead of a second: the Razorpay order id for paid bookings, `requestId` for free ones |
| Index guard | `admin:src/lib/index-guard.ts`: looks for a legacy unique index and, when it finds one, refuses a repeat phone with 409 before any money is taken |
| Island | A React component that becomes interactive in the browser inside an otherwise static Astro page (`client:load`, `client:idle`) |
| IST | India Standard Time, UTC+5:30, no daylight saving. An event's `date` is stored as UTC midnight of its Indian calendar day |
| K1 to K7, D26 | Business decisions deferred to the owner: seven rules and one refund question (§17). Never implement one unprompted |
| Legacy unique index | `Participant_eventId_phone_key`: one booking per phone per event. Dropped from the schema on 2026-09-13 and from production on 2026-10-04 |
| My Bookings | The customer's `/account` page: profile, bookings, downloads, re-send and re-payment (§8.7) |
| One-time code | The 6-digit sign-in code sent by e-mail, also called OTP. Valid 10 minutes, 5 guesses; only its hash travels, inside the signed cookie `otp_session` (§6.6) |
| Order notes | Fields the server writes on a Razorpay order (event, buyer, seats, coupon, ticket code for a re-payment). The only trusted source for a paid booking (G8) |
| Paise | 1 rupee = 100 paise. Razorpay amounts, `amountPaidPaise`, `archivedRevenuePaise` and `totalPaise` are integer paise; every other price is rupees |
| Participant | The database model for a BOOKING, not a person: one row covers `numberOfParticipants` seats |
| Participation card | The PDF a competition entrant downloads: chest number, details and a "Reference Code" (the ticket code) |
| Participation type | `INDIVIDUAL` (exactly 1), `GROUP` (2 or more) or `BOTH`, for competitions |
| Pending-payment record | `localStorage["ulsaham_pending_payment"]`: the one payment this browser is waiting to hear about. Looked up for 30 minutes, kept 24 hours (§8.5) |
| Platform fee | 2% of the discounted base, on by default per event |
| Prefetch | An inline script that starts a page's first API calls while the HTML is still parsing, parked in `window.__ulsPre` |
| Prerendered shell | A static HTML page built once. All 10 site pages are shells; `/events/detail` is one shell for every event and loads its data in the browser |
| Promo code | The customer-facing word for both a coupon and a complimentary code |
| Proxy | The site route `/api/public/*` that relays an allow-listed set of calls to the admin API. The browser never calls the admin host (§7.2) |
| Prune | Deleting an event's bookings 14 days after its date, after saving the archived counts. Also used for deleting activity logs after 30 days |
| Re-payment | Paying for an existing unpaid booking from My Bookings. The order's notes carry the ticket code, which the server reads back as kind `repay` (`admin:src/lib/razorpay.ts:73-76`) |
| `requestId` | The site's id for one free or complimentary submit, so a retry books once |
| Route patch | `site:scripts/fix-vercel-routes.mjs`, run after the build: puts the asset cache rule first and adds the security headers (§13.1) |
| Server action | A Next.js server function called from the admin UI: the panel's write path (image upload is the one HTTP route). Each checks the role itself (§10) |
| Shared proxy secret | `PROXY_SHARED_SECRET`, identical in both Vercel projects. Proves a request came from the site's proxy, and signs the admin's ticket-mail requests |
| Signed ticket-mail request | The admin's `POST /api/internal/ticket-mail` to the site, carrying `x-ulsaham-timestamp` and `x-ulsaham-signature` (§7.5) |
| SITE | The customer site repo and its app. Paths are written `site:` (inside `apps/site/far-fusion/`) or `root:` (repo root) |
| Slug | An event's URL name: lowercase letters, digits and hyphens. Event pages are `/events/detail?slug=<slug>` |
| Super admin | The `SUPER_ADMIN` role: full access. Created only by the seed script |
| Sweep | The job that stores `COMPLETED` on events whose end has passed. Started by list and dashboard reads, at most once a minute per server instance; no timer |
| `SYSTEM` | The role written on activity-log rows made by code, not staff: the Razorpay webhook and the payment confirmation route |
| Ticket | What a settled booking gives the customer: a QR code holding the ticket code, downloadable as a PNG and sent by e-mail |
| Ticket code | A booking's unique id, `UE-<6 slug characters>-<6 characters>`. For paid bookings it is derived from the Razorpay order id |
| Unpaid | A booking with `amountPaid` false: "Payment Required" on the site, "Unpaid" in the panel. No current code creates one; they exist only as older data |
| Verify | `POST payment/verify`: the browser's confirmation of a payment, which writes the booking. Safe to repeat. Its failure screen is the verify-failed panel (G11) |
| Webhook | `POST /api/razorpay/webhook`: Razorpay's own report of a captured payment. It completes a booking the browser never confirmed (§7.4) |
