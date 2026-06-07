import { useState } from "react";
import { registerForEvent } from "../lib/api.js";

const empty = { name: "", phone: "", email: "", age: "", numberOfParticipants: "1" };

function TicketSuccess({ ticket }) {
  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(ticket.eventDate));
  return (
    <div className="ticket-success">
      <div className="ticket-success__header">
        <span className="text-accent text-xs font-semibold uppercase tracking-widest">Registration Confirmed ✓</span>
        <h3 className="font-serif text-xl text-light mt-1">{ticket.eventName}</h3>
      </div>
      <div className="ticket-success__body">
        {ticket.qrCodeUrl && (
          <img src={ticket.qrCodeUrl} alt="QR ticket" className="ticket-qr" />
        )}
        <div className="flex-1 min-w-0">
          <p className="ticket-code">{ticket.ticketCode}</p>
          <dl className="ticket-dl">
            <dt>Name</dt><dd>{ticket.participantName}</dd>
            <dt>Date</dt><dd>{date}</dd>
            <dt>Venue</dt><dd>{ticket.eventVenue}</dd>
            <dt>Participants</dt><dd>{ticket.numberOfParticipants}</dd>
            <dt>Entry</dt><dd>{ticket.isFree ? "Free" : `₹${ticket.amount}`}</dd>
          </dl>
        </div>
      </div>
      <p className="text-light/40 text-xs mt-5 text-center">
        Screenshot this ticket — show the QR code at the venue.
      </p>
    </div>
  );
}

export default function RegistrationForm({ event }) {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [ticket, setTicket] = useState(null);

  if (event.isFull) {
    return (
      <div className="reg-closed">
        <p className="font-serif text-2xl text-accent">Event Full</p>
        <p className="text-light/50 mt-2 text-sm">This event has reached its capacity.</p>
      </div>
    );
  }
  if (event.status !== "PUBLISHED") {
    return (
      <div className="reg-closed">
        <p className="font-serif text-2xl text-accent">Registration Closed</p>
        <p className="text-light/50 mt-2 text-sm">This event is no longer accepting registrations.</p>
      </div>
    );
  }
  if (ticket) return <TicketSuccess ticket={ticket} />;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => { const n = { ...fe }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setGlobalError(null);

    const body = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      age: Number(form.age),
      numberOfParticipants: Number(form.numberOfParticipants),
    };
    if (form.email.trim()) body.email = form.email.trim();

    const { ok, status, data } = await registerForEvent(event.slug, body);
    setSubmitting(false);

    if (ok) { setTicket(data.data); return; }
    if (status === 400 && data.fieldErrors) { setFieldErrors(data.fieldErrors); return; }
    setGlobalError(data.error || "Something went wrong. Please try again.");
  };

  return (
    <form onSubmit={handleSubmit} className="reg-form" noValidate>
      <h3 className="font-serif text-xl text-light mb-1">Register</h3>
      <p className="text-light/40 text-sm mb-5">
        {event.isFree ? "Free entry" : `₹${event.amount} per person`}
        {event.capacity && !event.isFull
          ? ` · ${event.capacity - event.registeredCount} spots left`
          : ""}
      </p>

      {globalError && <div className="reg-error">{globalError}</div>}

      <div className="reg-field">
        <label>Full Name *</label>
        <input type="text" value={form.name} onChange={set("name")} placeholder="Rahul Menon" required />
        {fieldErrors.name && <span className="reg-field-error">{fieldErrors.name[0]}</span>}
      </div>

      <div className="reg-field">
        <label>
          Phone *
          <span className="reg-field-hint">10 digits, no +91</span>
        </label>
        <input type="tel" value={form.phone} onChange={set("phone")} placeholder="9876543210" maxLength={10} required />
        {fieldErrors.phone && <span className="reg-field-error">{fieldErrors.phone[0]}</span>}
      </div>

      <div className="reg-field">
        <label>
          Email
          <span className="reg-field-hint">optional</span>
        </label>
        <input type="email" value={form.email} onChange={set("email")} placeholder="rahul@example.com" />
        {fieldErrors.email && <span className="reg-field-error">{fieldErrors.email[0]}</span>}
      </div>

      <div className="reg-row">
        <div className="reg-field">
          <label>Age *</label>
          <input type="number" value={form.age} onChange={set("age")} placeholder="25" min={1} max={120} required />
          {fieldErrors.age && <span className="reg-field-error">{fieldErrors.age[0]}</span>}
        </div>
        <div className="reg-field">
          <label>Participants *</label>
          <input type="number" value={form.numberOfParticipants} onChange={set("numberOfParticipants")} min={1} max={10} required />
          {fieldErrors.numberOfParticipants && <span className="reg-field-error">{fieldErrors.numberOfParticipants[0]}</span>}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="reg-submit">
        {submitting ? "Registering…" : `Register${event.isFree ? " — Free" : ` — ₹${event.amount}`}`}
      </button>
    </form>
  );
}
