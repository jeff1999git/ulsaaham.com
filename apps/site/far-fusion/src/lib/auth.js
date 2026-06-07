const KEY = "ulsaaham_user";

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
