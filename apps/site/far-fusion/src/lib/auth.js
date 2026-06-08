const KEY = "ulsaham_user";
// Persists through logout so returning users are routed correctly
const ACCOUNTS_KEY = "ulsaham_accounts";

export function getUser() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function setUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
  if (user.email) {
    try {
      const map = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
      map[user.email.toLowerCase()] = {
        name: user.name,
        phone: user.phone,
        age: user.age,
        passwordHash: user.passwordHash,
        hasGoogle: !!user.googleId,
        googleId: user.googleId,
      };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
    } catch {}
  }
}

export function clearUser() {
  localStorage.removeItem(KEY);
  // Intentionally keep ACCOUNTS_KEY so re-login routing works after logout
}

export function isLoggedIn() {
  return !!getUser();
}

export function getKnownAccount(email) {
  try {
    const map = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
    return map[email.toLowerCase()] || null;
  } catch { return null; }
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
