// The admin panel API. Both the /api/public proxy and the ticket mailer reach
// the backend through here so the host and the proxy handshake live in one
// place.

// Read by name, never through a computed lookup on import.meta.env — that
// would inline the whole build-time environment into the bundle.
const BACKEND_ORIGIN = process.env.BACKEND_URL;
const PROXY_SHARED_SECRET = import.meta.env.PROXY_SHARED_SECRET ?? process.env.PROXY_SHARED_SECRET;

export const BACKEND_URL = String(
  BACKEND_ORIGIN || "https://ulsaham-admin-panel.vercel.app/api/public"
).replace(/\/+$/, "");

/**
 * Relay the visitor's own IP so the backend rate-limits per person rather than
 * per proxy egress address. Vercel overwrites x-forwarded-for on ingress, so it
 * travels in x-client-ip and the backend only trusts it when
 * PROXY_SHARED_SECRET matches on both sides.
 */
export function applyProxyHeaders(headers, clientIp) {
  const proxyKey = PROXY_SHARED_SECRET;
  if (clientIp && proxyKey) {
    headers.set("x-client-ip", clientIp);
    headers.set("x-proxy-key", proxyKey);
  }
  return headers;
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
