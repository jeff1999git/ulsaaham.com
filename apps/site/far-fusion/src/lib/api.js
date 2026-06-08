const BASE = "/api/public";

async function apiFetch(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  if (res.status === 429) {
    return { ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again in a moment." } };
  }
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export function getEvents({ page = 1, limit = 12, featured, upcoming, past } = {}) {
  const p = new URLSearchParams({ page, limit });
  if (featured) p.set("featured", "true");
  if (upcoming) p.set("upcoming", "true");
  if (past) p.set("past", "true");
  return apiFetch(`/events?${p}`);
}

export function getEvent(slug) {
  return apiFetch(`/events/${encodeURIComponent(slug)}`);
}

export async function registerForEvent(slug, body) {
  const res = await fetch(`${BASE}/events/${encodeURIComponent(slug)}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    return { ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again later." } };
  }
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function checkTicket(ticketCode) {
  const res = await fetch(`${BASE}/participants/check?ticketCode=${encodeURIComponent(ticketCode)}`);
  if (res.status === 429) {
    return { ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again later." } };
  }
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function createPaymentOrder(slug, body) {
  const res = await fetch(`${BASE}/events/${encodeURIComponent(slug)}/payment/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    return { ok: false, status: 429, data: { success: false, error: "Too many attempts. Please wait before trying again." } };
  }
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function verifyPayment(slug, body) {
  const res = await fetch(`${BASE}/events/${encodeURIComponent(slug)}/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    return { ok: false, status: 429, data: { success: false, error: "Too many attempts. Please wait before trying again." } };
  }
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function fetchMyTickets(ticketCodes) {
  const res = await fetch(`${BASE}/participants/my-tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketCodes }),
  });
  if (res.status === 429) {
    return { ok: false, status: 429, data: { success: false, error: "Too many requests. Please try again later." } };
  }
  return { ok: res.ok, status: res.status, data: await res.json() };
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
