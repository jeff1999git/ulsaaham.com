// The first reads each page's islands make, kept in one place. The islands
// request these, and the page starts the same requests from an inline script
// while its HTML is still parsing (src/components/ApiPrefetch.astro), so the
// data arrives alongside the island JS instead of after it. A request that
// differs by a single character would not be picked up, and would miss the
// edge cache, which keeps exactly these URLs (src/lib/edge-cache.js).
import { eventsPath, BRAND_PARTNERS_PATH } from "./api.js";

// Home: the events slide and the partners slide.
export const HOME_UPCOMING = { upcoming: true, limit: 8 };
export const HOME_PAST = { past: true, limit: 30 };

// /events. Upcoming leaves out featured events, which have their own section.
export const EVENTS_FEATURED = { featured: true, limit: 12 };
export const EVENTS_UPCOMING = { featured: false, upcoming: true, limit: 12 };
export const EVENTS_PAST = { past: true, limit: 8 };

export const HOME_PREFETCH = [eventsPath(HOME_UPCOMING), eventsPath(HOME_PAST), BRAND_PARTNERS_PATH];
export const EVENTS_PREFETCH = [EVENTS_FEATURED, EVENTS_UPCOMING, EVENTS_PAST].map((query) => eventsPath(query));
