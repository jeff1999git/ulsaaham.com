import { createHmac, timingSafeEqual } from "node:crypto";

// The admin panel API. Both the /api/public proxy and the ticket mailer reach
// the backend through here so the host and the proxy handshake live in one
// place. Requests the admin panel signs for this site (/api/internal/*) are
// checked here too, against the same shared secret.

// Read by name, never through a computed lookup on import.meta.env — that
// would inline the whole build-time environment into the bundle.
const BACKEND_ORIGIN = import.meta.env.BACKEND_URL ?? process.env.BACKEND_URL;
const PROXY_SHARED_SECRET = import.meta.env.PROXY_SHARED_SECRET ?? process.env.PROXY_SHARED_SECRET;

const PRODUCTION_BACKEND = "https://ulsaham-admin-panel.vercel.app/api/public";
// Outside a production build an unset BACKEND_URL means a local admin panel,
// never the live one, so a dev session cannot write to production by default.
const LOCAL_BACKEND = "http://localhost:3000/api/public";

function resolveBackendUrl(value) {
  const url = String(value ?? "").trim().replace(/\/+$/, "");
  if (!url) {
    if (import.meta.env.PROD) return PRODUCTION_BACKEND;
    console.warn(`BACKEND_URL is not set; using ${LOCAL_BACKEND}.`);
    return LOCAL_BACKEND;
  }
  // A bare origin ("https://admin.example.com") gets the public API path.
  try {
    if (new URL(url).pathname === "/") return `${url}/api/public`;
  } catch {
    // Not a URL; fetch will report it.
  }
  return url;
}

export const BACKEND_URL = resolveBackendUrl(BACKEND_ORIGIN);

/**
 * Relay the visitor's own IP so the backend rate-limits per person rather than
 * per proxy egress address. Vercel overwrites x-forwarded-for on ingress, so it
 * travels in x-client-ip and the backend only trusts it when
 * PROXY_SHARED_SECRET matches on both sides.
 */
export function applyProxyHeaders(headers, clientIp) {
  const proxyKey = PROXY_SHARED_SECRET;
  if (!proxyKey) warnMissingSecret();
  if (clientIp && proxyKey) {
    headers.set("x-client-ip", clientIp);
    headers.set("x-proxy-key", proxyKey);
  }
  return headers;
}

let warnedMissingSecret = false;

// Once per instance, and only in production: a local build runs without the
// secret on purpose. Bookings keep working without it, so nothing a visitor
// sees would point at it.
function warnMissingSecret() {
  if (warnedMissingSecret || !import.meta.env.PROD) return;
  warnedMissingSecret = true;
  console.warn(
    "[backend] PROXY_SHARED_SECRET is not set: the admin panel rate-limits every visitor together as this " +
      "server's address, and /api/internal/ticket-mail refuses every request. Set it to the admin panel's value."
  );
}

export const hasProxySecret = () => Boolean(PROXY_SHARED_SECRET);

// How far the admin panel's timestamp may be from this server's clock, either
// way. A captured request stops working once it is this old.
export const SIGNATURE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Why a request the admin panel signed should be refused, or null when it is
 * genuine. x-ulsaham-signature is the lowercase hex HMAC-SHA256 of
 * `${timestamp}.${body}` keyed with PROXY_SHARED_SECRET, where the timestamp is
 * x-ulsaham-timestamp (Unix epoch milliseconds) and body the exact bytes sent.
 */
export function adminSignatureProblem({ timestamp, signature, body, now = Date.now() }) {
  if (!PROXY_SHARED_SECRET) return "no secret";
  if (!timestamp || !signature) return "unsigned";
  if (!/^\d{1,16}$/.test(timestamp)) return "bad timestamp";
  if (Math.abs(now - Number(timestamp)) > SIGNATURE_WINDOW_MS) return "stale";

  const expected = createHmac("sha256", PROXY_SHARED_SECRET).update(`${timestamp}.`).update(body).digest("hex");
  const a = Buffer.from(String(signature));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? null : "bad signature";
}

/**
 * Look a booking up by its ticket code. Returns the backend's status so the
 * caller can tell "no such ticket" from "backend unreachable".
 */
export async function fetchTicketByCode(ticketCode, clientIp) {
  const url = `${BACKEND_URL}/participants/check?ticketCode=${encodeURIComponent(ticketCode)}`;
  const headers = applyProxyHeaders(new Headers({ Accept: "application/json" }), clientIp);

  let res;
  try {
    res = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(10000) });
  } catch {
    return { ok: false, status: 0, data: null };
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON error page from the platform.
  }

  return { ok: res.ok && Boolean(body?.data), status: res.status, data: body?.data ?? null };
}
