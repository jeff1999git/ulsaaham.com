import { BACKEND_URL, applyProxyHeaders } from "../../../lib/backend.js";
import { getClientIp } from "../../../lib/rate-limit.js";
import { edgePolicy, cacheHeaders } from "../../../lib/edge-cache.js";

// The only request headers the admin panel is sent. Cookies, Authorization,
// the visitor's own x-client-ip and x-proxy-key, Origin and every other header
// stay here; applyProxyHeaders then adds the proxy's own handshake. Reads also
// lose the browser's validators this way, so the admin panel always answers
// with a full body the CDN can keep, never a 304.
const FORWARD = ["content-type", "accept", "accept-language", "user-agent"];

const METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
const ALLOW = [...METHODS].join(", ");

// Every admin panel endpoint the site calls, and nothing else. Slugs are
// lowercase letters, digits and hyphens (the admin panel enforces it), so a
// path that matches cannot climb out of /api/public. Anything still encoded,
// any dot segment and any backslash is refused before the match. A new
// endpoint has to be added here before the site can reach it.
const PATHS =
  /^(events(\/[a-z0-9-]+(\/(register|apply-coupon|payment\/(order|verify|status)))?)?|brand-partners|participants\/(check|my-tickets|my-tickets-by-user))$/;
const UNSAFE = /%|\.\.|\\/;

// A read that has not finished by then ends in a clear error instead of a
// spinner. Writes get longer, because a payment verification waits on
// Razorpay; the browser retries a verification that runs out.
const READ_TIMEOUT_MS = 8000;
const WRITE_TIMEOUT_MS = 25000;

// Statuses whose response may not carry a body, not even an empty one.
const NULL_BODY = new Set([101, 103, 204, 205, 304]);

const TIMEOUT_ERROR = "The server took too long to respond. Please try again.";
const UNAVAILABLE_ERROR = "Service temporarily unavailable. Please try again.";

const jsonError = (status, error, headers = {}) =>
  new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });

const isJson = (type) => /json/i.test(type ?? "");

/** @type {import("astro").APIRoute} */
export const ALL = async (context) => {
  const { request, params } = context;
  if (!METHODS.has(request.method)) return jsonError(405, "Method not allowed.", { allow: ALLOW });

  const path = params.path ?? "";
  if (UNSAFE.test(path) || !PATHS.test(path)) return jsonError(404, "Not found.");

  const url = new URL(request.url);
  const target = upstreamUrl(path, url.search);
  if (!target) return jsonError(503, UNAVAILABLE_ERROR);

  const headers = new Headers();
  for (const name of FORWARD) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Relay the visitor's own IP so the backend rate-limits per person, not per
  // proxy egress address shared by every visitor of the site (5 bookings/hour
  // for everyone combined would otherwise block repeat bookings).
  applyProxyHeaders(headers, getClientIp(context));

  if (request.method === "GET" || request.method === "HEAD") {
    return read(request, target, headers, path, url.search);
  }
  return write(request, target, headers);
};

let reportedBadBackend = false;

/**
 * The admin panel URL for an allowed path, or null when it would land outside
 * the public API. The path list already rules that out, so only a BACKEND_URL
 * that points somewhere else gets here.
 */
function upstreamUrl(path, search) {
  try {
    const base = new URL(`${BACKEND_URL}/`);
    const target = new URL(`${path}${search}`, base);
    if (target.origin === base.origin && target.pathname.startsWith("/api/public/")) return target.href;
  } catch {
    // Not a URL; reported below.
  }
  if (!reportedBadBackend) {
    reportedBadBackend = true;
    console.error("[proxy] BACKEND_URL does not lead to the admin panel's /api/public; every request is refused.");
  }
  return null;
}

/** A 429 or 503 says when to try again; the browser should hear it too. */
function retryAfter(res) {
  const value = res.ok ? null : res.headers.get("retry-after");
  return value ? { "retry-after": value } : {};
}

function unreachable(err) {
  if (err?.name === "TimeoutError") return jsonError(504, TIMEOUT_ERROR);
  return jsonError(503, UNAVAILABLE_ERROR);
}

/**
 * GET and HEAD. The body is read in full before answering: the JSON is a few
 * KB, the timeout then covers the body as well as the headers, and the CDN
 * stores a complete response.
 */
async function read(request, target, headers, path, search) {
  let res;
  let body = null;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
    if (request.method !== "HEAD" && !NULL_BODY.has(res.status)) body = await res.arrayBuffer();
  } catch (err) {
    return unreachable(err);
  }

  // Only JSON is stored: an HTML page the fetch reached through a redirect (a
  // login or platform page) must not stand in for the data until it expires.
  const profile = isJson(res.headers.get("content-type"))
    ? edgePolicy(request.method, path, search, res.status, request.headers)
    : null;
  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
      ...cacheHeaders(profile),
      ...retryAfter(res),
    },
  });
}

/**
 * POST and OPTIONS. The request body is a few hundred bytes of JSON, so it is
 * read in full and sent as bytes: fetch needs no streaming mode and the admin
 * panel gets exactly what the browser sent. The answer is read in full too, so
 * the timeout covers it. Nothing here is ever stored.
 */
async function write(request, target, headers) {
  let res;
  let body = null;
  try {
    res = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });
    if (!NULL_BODY.has(res.status)) body = await res.arrayBuffer();
  } catch (err) {
    return unreachable(err);
  }

  // A platform error page (an HTML 502 or 504) would make the browser's
  // res.json() throw, and the visitor would read it as a lost connection. The
  // status is what the site acts on, so it is kept and the body becomes JSON.
  const type = res.headers.get("content-type");
  if (!res.ok && !NULL_BODY.has(res.status) && !isJson(type)) {
    return jsonError(res.status, upstreamError(res.status), retryAfter(res));
  }

  return new Response(body, {
    status: res.status,
    headers: { "content-type": type ?? "application/json", "cache-control": "no-store", ...retryAfter(res) },
  });
}

function upstreamError(status) {
  if (status === 404) return "Not found.";
  if (status === 429) return "Too many requests. Please try again in a moment.";
  if (status === 504) return TIMEOUT_ERROR;
  if (status >= 500) return UNAVAILABLE_ERROR;
  return "The request could not be completed. Please try again.";
}
