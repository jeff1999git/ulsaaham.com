import { useState, useEffect } from "react";
import { getUser, setUser, clearUser } from "../lib/auth.js";

function TicketCard({ ticket }) {
  const date = (() => {
    try { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(ticket.eventDate)); }
    catch { return ticket.eventDate; }
  })();
  return (
    <div className="my-ticket">
      {ticket.qrCodeUrl && (
        <img src={ticket.qrCodeUrl} alt="QR code" className="my-ticket__qr" />
      )}
      <div className="my-ticket__info">
        <p className="ticket-code" style={{ fontSize: "0.95rem", letterSpacing: "0.1em" }}>{ticket.ticketCode}</p>
        <p className="text-light font-semibold text-sm mt-1 leading-snug">{ticket.eventName}</p>
        <p className="text-light/50 text-xs mt-1">{date}</p>
        <p className="text-light/50 text-xs">{ticket.eventVenue}</p>
        <p className="text-light/40 text-xs">{ticket.numberOfParticipants} participant{ticket.numberOfParticipants !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [user, setUserState] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", age: "" });
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { window.location.replace("/login?next=/account"); return; }
    setUserState(u);
    setForm({ name: u.name, email: u.email || "", age: String(u.age) });
  }, []);

  if (!user) {
    return (
      <div className="event-detail-state">
        <div className="spinner" />
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    setSaveError(null);
    const name = form.name.trim();
    const age = Number(form.age);
    if (name.length < 2) { setSaveError("Name must be at least 2 characters."); return; }
    if (!form.age || isNaN(age) || age < 1 || age > 120) { setSaveError("Enter a valid age."); return; }
    const updated = { ...user, name, email: form.email.trim() || null, age };
    setUser(updated);
    setUserState(updated);
    setEditing(false);
  };

  const handleLogout = () => {
    clearUser();
    window.location.replace("/");
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="account-page">
      <div className="account-section">
        <div className="account-profile">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">Your Account</p>
            <h2 className="font-serif text-2xl text-light">{user.name}</h2>
            <p className="text-light/50 text-sm mt-1">+91 {user.phone}</p>
            {user.email && <p className="text-light/50 text-sm">{user.email}</p>}
            <p className="text-light/40 text-xs mt-1">Age: {user.age}</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button onClick={() => { setEditing(!editing); setSaveError(null); }} className="account-btn">
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <button onClick={handleLogout} className="account-btn account-btn--danger">Logout</button>
          </div>
        </div>

        {editing && (
          <form onSubmit={handleSave} className="account-edit-form" noValidate>
            {saveError && <div className="reg-error">{saveError}</div>}
            <div className="reg-field">
              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={set("name")} required />
            </div>
            <div className="reg-row">
              <div className="reg-field">
                <label>Email <span className="reg-field-hint">optional</span></label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="rahul@example.com" />
              </div>
              <div className="reg-field">
                <label>Age *</label>
                <input type="number" value={form.age} onChange={set("age")} min={1} max={120} required />
              </div>
            </div>
            <button type="submit" className="reg-submit" style={{ width: "auto", padding: "0.6rem 1.75rem" }}>
              Save Changes
            </button>
          </form>
        )}
      </div>

      <div className="account-section">
        <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-accent mb-6">My Tickets</h3>
        {!user.tickets || user.tickets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-light/30 text-sm">No tickets yet.</p>
            <a href="/events" className="text-accent text-xs font-semibold uppercase tracking-widest mt-3 inline-block hover:underline">
              Browse Events →
            </a>
          </div>
        ) : (
          <div className="my-tickets-grid">
            {user.tickets.map((t) => (
              <TicketCard key={t.ticketCode} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
