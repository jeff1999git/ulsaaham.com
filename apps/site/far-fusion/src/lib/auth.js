const KEY = "ulsaham_user";
// Persists through logout so a returning visitor is sent to the sign-in method
// they used. It holds one flag per email and nothing else: on a shared phone,
// the next person must not find earlier visitors' names, phones or ages here.
const ACCOUNTS_KEY = "ulsaham_accounts";

export function getUser() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

// The addresses that sign in with Google. Read this way, a profile an older
// version stored alongside is never used, and the next write drops it.
function googleFlags() {
  const flags = {};
  try {
    const map = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
    for (const email in map) if (map[email]?.hasGoogle === true) flags[email] = { hasGoogle: true };
  } catch {}
  return flags;
}

export function setUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
  if (user.email) {
    try {
      const flags = googleFlags();
      const email = user.email.toLowerCase();
      if (user.hasGoogle || user.googleId) flags[email] = { hasGoogle: true };
      else delete flags[email];
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(flags));
    } catch {}
  }
}

export function clearUser() {
  localStorage.removeItem(KEY);
  // The flags stay so re-login routing works after logout; rewriting them
  // also clears any profile an older version kept alongside.
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(googleFlags())); } catch {}
}

/** `{ hasGoogle: true }` for an address that signs in with Google, else null. */
export function getKnownAccount(email) {
  return googleFlags()[String(email).toLowerCase()] || null;
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
