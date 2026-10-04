const BASE = "/api/public";

const tooMany = () => ({ ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again in a moment." } });

// Offline, aborted, timed out, or an answer that is not JSON: all of them read
// as a lost connection, status 0, which the payment screens treat as "try again".
const networkError = () => ({ ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } });

// How long the browser waits on each payment call before treating it as lost.
// The proxy gives up on the admin panel after 25 s; a verification abandoned
// here may still finish there, which is fine because verify is safe to repeat.
export const ORDER_TIMEOUT_MS = 25000;
export const VERIFY_TIMEOUT_MS = 20000;
const STATUS_TIMEOUT_MS = 10000;

/**
 * A signal that aborts after `ms`, or as soon as the caller's own `signal`
 * does. Built on a timer rather than AbortSignal.timeout/any, which older
 * phones lack.
 */
function deadline(ms, signal) {
  if (!ms && !signal) return { signal: undefined, done() {} };
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = ms ? setTimeout(abort, ms) : null;
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  return {
    signal: controller.signal,
    done() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    },
  };
}

/** A JSON POST through the proxy. `limited` is the message shown on a 429. */
async function postJson(path, body, { timeoutMs = 0, signal, limited = "Too many requests. Please try again later." } = {}) {
  const limit = deadline(timeoutMs, signal);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: limit.signal,
    });
    if (res.status === 429) {
      return { ok: false, status: 429, data: { success: false, error: limited } };
    }
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch {
    return networkError();
  } finally {
    limit.done();
  }
}

/**
 * The response an inline page script already requested for this path
 * (src/components/ApiPrefetch.astro), handed out once: a later call, such as
 * a pager or a retry, fetches afresh.
 */
function takePrefetched(path) {
  if (typeof window === "undefined") return null;
  const store = window.__ulsPre;
  const entry = store && store[path];
  if (!entry) return null;
  delete store[path];
  return entry;
}

async function apiFetch(path, init) {
  const prefetched = init ? null : takePrefetched(path);
  if (prefetched) {
    // Settles to null when the early request failed; ask again below.
    const result = await prefetched;
    if (result) return result.status === 429 ? tooMany() : result;
  }
  try {
    const res = await fetch(`${BASE}${path}`, init);
    if (res.status === 429) {
      return tooMany();
    }
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch {
    return networkError();
  }
}

/**
 * The list URL for a query. The parameter order is part of the contract: the
 * edge cache only keeps URLs written exactly this way (src/lib/edge-cache.js).
 */
export function eventsPath({ page = 1, limit = 12, featured, upcoming, past } = {}) {
  const p = new URLSearchParams({ page, limit });
  if (featured) p.set("featured", "true");
  else if (featured === false) p.set("featured", "false");
  if (upcoming) p.set("upcoming", "true");
  if (past) p.set("past", "true");
  return `/events?${p}`;
}

export function getEvents(query) {
  return apiFetch(eventsPath(query));
}

/**
 * fresh: skip the edge cache, e.g. after the server has turned a booking down.
 * The admin panel ignores the parameter; it only makes the URL one the cache
 * does not keep.
 */
export function getEvent(slug, { fresh = false } = {}) {
  return apiFetch(`/events/${encodeURIComponent(slug)}${fresh ? "?fresh=1" : ""}`);
}

export const BRAND_PARTNERS_PATH = "/brand-partners";

export function getBrandPartners() {
  return apiFetch(BRAND_PARTNERS_PATH);
}

/**
 * A free or complimentary booking. `requestId` names this attempt: sending the
 * same one again (a retry after a lost answer) returns the booking it already
 * made instead of a second one.
 */
export function registerForEvent(slug, body, { requestId } = {}) {
  return postJson(`/events/${encodeURIComponent(slug)}/register`, requestId ? { ...body, requestId } : body);
}

const PAYMENT_LIMITED = "Too many attempts. Please wait before trying again.";

/** A timeout (ORDER_TIMEOUT_MS unless given) answers status 0, like a lost connection. */
export function createPaymentOrder(slug, body, { signal, timeoutMs = ORDER_TIMEOUT_MS } = {}) {
  return postJson(`/events/${encodeURIComponent(slug)}/payment/order`, body, { signal, timeoutMs, limited: PAYMENT_LIMITED });
}

/**
 * Safe to repeat: the admin panel answers a payment it has already recorded
 * with the same booking. A timeout (VERIFY_TIMEOUT_MS unless given) answers
 * status 0, like a lost connection.
 */
export function verifyPayment(slug, body, { signal, timeoutMs = VERIFY_TIMEOUT_MS } = {}) {
  return postJson(`/events/${encodeURIComponent(slug)}/payment/verify`, body, { signal, timeoutMs, limited: PAYMENT_LIMITED });
}

/**
 * Whether the booking for a Razorpay order exists yet, for a payment whose
 * answer never reached this page. data.data is the ticket once it does;
 * data.pending is true until then, and also when the phone is not the one on
 * the booking.
 */
export function getPaymentStatus(slug, { orderId, phone }, { signal, timeoutMs = STATUS_TIMEOUT_MS } = {}) {
  return postJson(`/events/${encodeURIComponent(slug)}/payment/status`, { orderId, phone }, {
    signal,
    timeoutMs,
    limited: "Too many requests. Please try again in a moment.",
  });
}

export function validateCode(slug, code) {
  return postJson(`/events/${encodeURIComponent(slug)}/apply-coupon`, { couponCode: code });
}

export function fetchMyTickets(ticketCodes) {
  return postJson("/participants/my-tickets", { ticketCodes });
}

/**
 * Ask the site to email a booking. Only the code and the recipient travel —
 * the mail itself, Payment ID included, is built on the server from the
 * booking the backend holds.
 */
export async function sendTicketEmail({ ticketCode, email }) {
  if (!ticketCode || !email) {
    return { ok: false, status: 0, data: { success: false, error: "Add an email address to receive your ticket." } };
  }
  try {
    const res = await fetch("/api/send-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketCode, email }),
      // The visitor may leave the success screen at once; the send still goes.
      keepalive: true,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return networkError();
  }
}

// Looks up ticket codes by phone (10-digit string) or email after re-login
export function getTicketCodesByIdentifier(identifier) {
  const key = /^\d{10}$/.test(String(identifier)) ? "phone" : "email";
  return apiFetch("/participants/my-tickets-by-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [key]: String(identifier) }),
  });
}
