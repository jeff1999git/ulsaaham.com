// What the site's CDN may keep from the /api/public proxy, and for how long.
//
// The site edge is the only cache for public data: the admin panel sends no
// CDN lifetimes of its own, so this file is the whole policy. Only the exact
// URLs the site's own pages request are kept (see src/lib/page-data.js); any
// other query, including ?fresh=1, goes straight to the admin panel. Booking
// and payment requests always do, and the admin panel re-checks capacity and
// booking state on every one of them, so a stale card costs a retry, never an
// overbooking.

// Seconds fresh, then seconds served stale while the CDN refreshes in the
// background. The sum is the worst-case age a visitor can see.
export const PROFILES = {
  // Upcoming and featured lists: seat counts and "Booking Closed" badges.
  LIVE: { maxAge: 60, swr: 240 },
  PAST: { maxAge: 600, swr: 3000 },
  // One event's page: seats left and whether booking is open.
  DETAIL: { maxAge: 15, swr: 45 },
  PARTNERS: { maxAge: 300, swr: 3300 },
};

// page and limit as the site writes them, then featured, upcoming and past in
// the order src/lib/api.js adds them. featured=false is the /events Upcoming
// section.
const EVENTS_QUERY = /^\?page=[1-9]\d{0,3}&limit=[1-9]\d{0,3}(?:&featured=(?:true|false))?(?:&upcoming=true)?(?:&past=true)?$/;
// One slug: no further segments, no dot segments, nothing still encoded.
const EVENT_DETAIL = /^events\/(?!\.\.?$)[^/\\%]+$/;

/**
 * The profile name for a proxied response, or null when it must not be stored.
 *
 * Only GET 200s are stored. A HEAD response has no body, and a cached empty
 * body would blank the lists for everyone. 404, 410, 429 and 5xx would outlive
 * the moment that caused them.
 *
 * x-astro-path makes the Vercel adapter run a different route than the URL
 * names (serverless/entrypoint.js), so its answer must not be stored under
 * this URL.
 */
export function edgePolicy(method, path, search, status, reqHeaders) {
  if (method !== "GET" || status !== 200) return null;
  if (reqHeaders?.has?.("x-astro-path")) return null;

  if (path === "brand-partners") return search === "" ? "PARTNERS" : null;
  if (EVENT_DETAIL.test(path)) return search === "" ? "DETAIL" : null;
  if (path === "events" && EVENTS_QUERY.test(search)) {
    return search.endsWith("&past=true") ? "PAST" : "LIVE";
  }
  // participants/* (ticket lookups carry personal data) and anything else.
  return null;
}

/**
 * Response headers for a profile. Browsers always revalidate; only Vercel's
 * CDN reads Vercel-CDN-Cache-Control, and it strips that header before the
 * response leaves the edge.
 *
 * If a deployment ever shows the CDN ignoring it (x-vercel-cache stays MISS),
 * the fallback is a single header:
 * `Cache-Control: public, max-age=0, s-maxage=<maxAge>, stale-while-revalidate=<swr>`.
 */
export function cacheHeaders(profile) {
  const rule = profile ? PROFILES[profile] : null;
  if (!rule) return { "cache-control": "no-store" };
  return {
    "cache-control": "public, max-age=0, must-revalidate",
    "vercel-cdn-cache-control": `max-age=${rule.maxAge}, stale-while-revalidate=${rule.swr}`,
  };
}
