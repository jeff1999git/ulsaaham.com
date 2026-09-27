const BASE = "/api/public";

const tooMany = () => ({ ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again in a moment." } });

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
    return { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };
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

export async function registerForEvent(slug, body) {
  try {
    const res = await fetch(`${BASE}/events/${encodeURIComponent(slug)}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      return { ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again later." } };
    }
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };
  }
}

export async function createPaymentOrder(slug, body) {
  try {
    const res = await fetch(`${BASE}/events/${encodeURIComponent(slug)}/payment/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      return { ok: false, status: 429, data: { success: false, error: "Too many attempts. Please wait before trying again." } };
    }
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };
  }
}

export async function verifyPayment(slug, body) {
  try {
    const res = await fetch(`${BASE}/events/${encodeURIComponent(slug)}/payment/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      return { ok: false, status: 429, data: { success: false, error: "Too many attempts. Please wait before trying again." } };
    }
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };
  }
}

export async function validateCode(slug, code) {
  try {
    const res = await fetch(`${BASE}/events/${encodeURIComponent(slug)}/apply-coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode: code }),
    });
    if (res.status === 429) {
      return { ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again later." } };
    }
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };
  }
}

export async function fetchMyTickets(ticketCodes) {
  try {
    const res = await fetch(`${BASE}/participants/my-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketCodes }),
    });
    if (res.status === 429) {
      return { ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again later." } };
    }
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };
  }
}

/**
 * Ask the site to email a booking. Only the code and the recipient travel —
 * the mail itself is built on the server from the booking the backend holds.
 */
export async function sendTicketEmail({ ticketCode, email, paymentId = null }) {
  if (!ticketCode || !email) {
    return { ok: false, status: 0, data: { success: false, error: "Add an email address to receive your ticket." } };
  }
  try {
    const res = await fetch("/api/send-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketCode, email, paymentId }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { success: false, error: "Network error. Please try again." } };
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
