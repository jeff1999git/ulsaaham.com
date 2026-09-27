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
