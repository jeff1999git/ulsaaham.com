const KEY = "ulsaham_user";

export function getUser() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function setUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  return !!getUser();
}

export function addTicket(ticket) {
  const user = getUser();
  if (!user) return;
  const tickets = user.tickets || [];
  if (!tickets.find((t) => t.ticketCode === ticket.ticketCode)) {
    tickets.unshift({ ...ticket, savedAt: new Date().toISOString() });
  }
  setUser({ ...user, tickets });
}

/**
 * Hash a password using email as a deterministic salt.
 * Uses Web Crypto SHA-256 — no packages needed.
 */
export async function hashPassword(password, email) {
  const data = new TextEncoder().encode(`${email.toLowerCase()}:${password}:ulsaham`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password, email, storedHash) {
  const hash = await hashPassword(password, email);
  return hash === storedHash;
}
