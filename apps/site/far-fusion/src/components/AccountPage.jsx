import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { getUser, setUser, clearUser, addTicket } from "../lib/auth.js";
import { fetchMyTickets, getTicketCodesByIdentifier, getEvent, createPaymentOrder, verifyPayment } from "../lib/api.js";
import { generateTicketCanvas, downloadCanvasAsPng } from "../lib/generate-ticket.js";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function calcFees(amount, count) {
  const base = amount * count;
  const gst = Math.round(base * 0.18 * 100) / 100;
  const platformFee = Math.round(base * 0.02 * 100) / 100;
  const total = Math.round((base + gst + platformFee) * 100) / 100;
  return { base, gst, platformFee, total };
}

function fmtDate(d) {
  try { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(d)); }
  catch { return d || ""; }
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ ticket }) {
  const base = { padding: "2px 9px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", display: "inline-block" };
  if (!ticket.amountPaid)
    return <span style={{ ...base, background: "#78350f", color: "#fde68a" }}>Payment Required</span>;
  if (ticket.attended)
    return <span style={{ ...base, background: "#064e3b", color: "#6ee7b7" }}>Attended ✓</span>;
  if (new Date(ticket.event?.date) < new Date())
    return <span style={{ ...base, background: "#1f2937", color: "#9ca3af" }}>Not Attended</span>;
  return <span style={{ ...base, background: "#064e3b", color: "#6ee7b7" }}>Confirmed</span>;
}

// ── Re-payment modal ──────────────────────────────────────────────────────────

function RepayPanel({ ticket, user, onSuccess, onClose }) {
  const [event, setEvent] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    getEvent(ticket.event.slug)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data?.error || "Event not found.");
        setEvent(data.data.event);
        setPhase("breakdown");
      })
      .catch((err) => { setError(err.message); setPhase("error"); });
  }, [ticket.event.slug]);

  const handlePay = async () => {
    setError(null);
    setPhase("paying");
    const loaded = await loadRazorpay();
    if (!loaded) { setError("Could not load payment gateway."); setPhase("breakdown"); return; }

    const body = {
      name: user.name,
      phone: user.phone,
      age: user.age,
      numberOfParticipants: ticket.numberOfParticipants,
      ...(user.email ? { email: user.email } : {}),
    };

    const { ok, data } = await createPaymentOrder(ticket.event.slug, body);
    if (!ok) { setError(data?.error || "Could not initiate payment."); setPhase("breakdown"); return; }

    const ord = data.data;
    const rzp = new window.Razorpay({
      key: ord.keyId,
      amount: ord.amount,
      currency: ord.currency,
      name: "Ulsaham Entertainments",
      description: event.name,
      order_id: ord.orderId,
      prefill: { name: user.name, email: user.email || "", contact: user.phone },
      theme: { color: "#014421" },
      handler: async (response) => {
        setPhase("verifying");
        const result = await verifyPayment(ticket.event.slug, { ...response, ...body });
        if (!result.ok) {
          setError(`Payment received but confirmation failed. Save your Payment ID: ${response.razorpay_payment_id} and contact support@ulsaham.com.`);
          setPhase("breakdown");
          return;
        }
        addTicket({ ...result.data.data, registeredAt: new Date().toISOString() });
        onSuccess();
      },
      modal: { ondismiss: () => setPhase("breakdown") },
    });
    rzp.open();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#011a01", border: "1px solid rgba(254,204,1,0.2)", borderRadius: 12, padding: "28px 24px", maxWidth: 420, width: "100%" }}>
        <button onClick={onClose} style={{ float: "right", background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
        <h3 className="font-serif text-xl text-light mb-1">Complete Payment</h3>

        {error && <div className="reg-error" style={{ marginTop: 12 }}>{error}</div>}

        {phase === "loading" && <div className="spinner" style={{ margin: "32px auto" }} />}

        {event && phase === "breakdown" && (() => {
          const fees = calcFees(event.amount, ticket.numberOfParticipants);
          return (
            <>
              <p className="text-light/40 text-sm mb-4">{event.name}</p>
              <div className="fee-breakdown">
                <div className="fee-breakdown__row">
                  <span>₹{event.amount} × {ticket.numberOfParticipants} person{ticket.numberOfParticipants !== 1 ? "s" : ""}</span>
                  <span>₹{fees.base.toFixed(2)}</span>
                </div>
                <div className="fee-breakdown__row"><span>GST (18%)</span><span>₹{fees.gst.toFixed(2)}</span></div>
                <div className="fee-breakdown__row"><span>Platform fee (2%)</span><span>₹{fees.platformFee.toFixed(2)}</span></div>
                <div className="fee-breakdown__divider" />
                <div className="fee-breakdown__total"><span>Total</span><span>₹{fees.total.toFixed(2)}</span></div>
              </div>
              <button onClick={handlePay} className="reg-submit">Pay ₹{fees.total.toFixed(2)} & Register →</button>
            </>
          );
        })()}

        {(phase === "paying" || phase === "verifying") && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
            <p className="text-light/40 text-sm mt-4">{phase === "verifying" ? "Confirming payment…" : "Opening payment gateway…"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ticket card ───────────────────────────────────────────────────────────────

function TicketCard({ ticket, onRepay }) {
  const qrRef = useRef(null);
  const [dlLoading, setDlLoading] = useState(false);

  const name = ticket.event?.name;
  const date = fmtDate(ticket.event?.date);
  const venue = ticket.event?.venue;
  const banner = ticket.event?.bannerImageUrl;

  const handleDownloadTicket = async () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    setDlLoading(true);
    try {
      const eventDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ticket.event?.date));
      const canvas = await generateTicketCanvas(svgEl, {
        ticketCode: ticket.ticketCode,
        participantName: ticket.participantName,
        eventName: name,
        eventDate,
        eventVenue: venue,
        numberOfParticipants: ticket.numberOfParticipants,
        bannerImageUrl: banner,
      });
      downloadCanvasAsPng(canvas, `ticket-${ticket.ticketCode}.png`);
    } catch {
      alert("Failed to generate ticket. Please try again.");
    } finally {
      setDlLoading(false);
    }
  };

  return (
    <div className="my-ticket">
      {banner && (
        <img src={banner} alt={name} style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", display: "block" }} />
      )}
      <div className="my-ticket__info">
        <div style={{ marginBottom: 6 }}><StatusBadge ticket={ticket} /></div>
        <p className="text-light font-semibold text-sm leading-snug mt-1">{name}</p>
        <p className="text-light/50 text-xs mt-1">{date}{venue ? ` · ${venue}` : ""}</p>
        <p className="text-light/40 text-xs mt-1">
          {ticket.participantName} · {ticket.numberOfParticipants} participant{ticket.numberOfParticipants !== 1 ? "s" : ""}
        </p>
      </div>

      {/* QR rendered off-screen — always present for confirmed tickets, canvas reads it */}
      {ticket.amountPaid && (
        <div ref={qrRef} style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none" }}>
          <QRCode value={ticket.ticketCode} size={260} />
        </div>
      )}

      {ticket.amountPaid ? (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {ticket.qrCodeUrl ? (
            <img src={ticket.qrCodeUrl} alt="QR code" style={{ width: "100%", maxWidth: 150, display: "block", margin: "0 auto 8px" }} />
          ) : (
            <div style={{ background: "#fff", padding: 8, display: "block", width: "fit-content", margin: "0 auto 8px", borderRadius: 6 }}>
              <QRCode value={ticket.ticketCode} size={130} />
            </div>
          )}
          <p style={{ fontFamily: "monospace", fontSize: "0.8rem", textAlign: "center", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
            {ticket.ticketCode}
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={handleDownloadTicket} disabled={dlLoading} className="account-btn" style={{ fontSize: 11, padding: "5px 12px" }}>
              {dlLoading ? "Generating…" : "Download Ticket"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => onRepay(ticket)} className="reg-submit" style={{ width: "100%", padding: "10px 16px", margin: 0 }}>
            Complete Payment →
          </button>
          <p className="text-light/30 text-xs text-center mt-2">
            If you already paid, wait 30 s and refresh.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AccountPage() {
  const [user, setUserState] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", age: "" });
  const [saveError, setSaveError] = useState(null);

  const [liveTickets, setLiveTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);
  const [repayTarget, setRepayTarget] = useState(null);

  const userRef = useRef(null);
  const autoRefreshRef = useRef(null);

  const loadTickets = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    let stored = u.tickets || [];

    // No tickets in localStorage (e.g. after logout + re-login) — try recovering from backend
    if (stored.length === 0) {
      const identifier = u.phone || u.email;
      if (!identifier) { setTicketsLoading(false); return; }
      const { ok, data } = await getTicketCodesByIdentifier(identifier);
      if (ok && data.data?.ticketCodes?.length > 0) {
        stored = data.data.ticketCodes.map((code) => ({ ticketCode: code }));
        const restored = { ...u, tickets: stored };
        setUser(restored);
        userRef.current = restored;
        setUserState(restored);
      } else {
        setTicketsLoading(false);
        return;
      }
    }

    const codes = stored.map((t) => t.ticketCode).slice(0, 20);
    const { ok, data } = await fetchMyTickets(codes);
    setTicketsLoading(false);

    if (!ok) { setTicketsError("Could not load ticket details. Tap to retry."); return; }
    const fetched = data.data?.tickets || [];
    setLiveTickets(fetched);
    setTicketsError(null);

    // Auto-refresh every 30s while any ticket shows unpaid
    clearInterval(autoRefreshRef.current);
    if (fetched.some((t) => !t.amountPaid)) {
      autoRefreshRef.current = setInterval(loadTickets, 30000);
    }
  }, []);

  useEffect(() => {
    const u = getUser();
    if (!u) { window.location.replace("/login?next=/account"); return; }
    userRef.current = u;
    setUserState(u);
    setForm({ name: u.name, email: u.email || "", age: String(u.age || "") });
    loadTickets();

    const onVisible = () => { if (!document.hidden) loadTickets(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(autoRefreshRef.current);
    };
  }, [loadTickets]);

  if (!user) {
    return <div className="event-detail-state"><div className="spinner" /></div>;
  }

  const handleSave = (e) => {
    e.preventDefault();
    setSaveError(null);
    const name = form.name.trim();
    const age = Number(form.age);
    if (name.length < 2) { setSaveError("Name must be at least 2 characters."); return; }
    if (!form.age || isNaN(age) || age < 1 || age > 120) { setSaveError("Enter a valid age."); return; }
    const updated = { ...user, name, email: form.email.trim() || undefined, age };
    setUser(updated);
    userRef.current = updated;
    setUserState(updated);
    setEditing(false);
  };

  const handleLogout = () => { clearUser(); window.location.replace("/"); };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const storedCount = (user.tickets || []).length;

  return (
    <>
      {repayTarget && (
        <RepayPanel
          ticket={repayTarget}
          user={user}
          onSuccess={() => { setRepayTarget(null); loadTickets(); }}
          onClose={() => setRepayTarget(null)}
        />
      )}

      <div className="account-page">
        {/* ── Profile ── */}
        <div className="account-section">
          <div className="account-profile">
            <div>
              <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-1">Your Account</p>
              <h2 className="font-serif text-2xl text-light">{user.name}</h2>
              {user.phone && <p className="text-light/50 text-sm mt-1">+91 {user.phone}</p>}
              {user.email && <p className="text-light/50 text-sm">{user.email}</p>}
              {user.age && <p className="text-light/40 text-xs mt-1">Age: {user.age}</p>}
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0 flex-wrap">
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
                  <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
                </div>
                <div className="reg-field">
                  <label>Age *</label>
                  <input type="number" value={form.age} onChange={set("age")} min={1} max={120} required />
                </div>
              </div>
              <button type="submit" className="reg-submit" style={{ width: "auto", padding: "0.6rem 1.75rem" }}>Save Changes</button>
            </form>
          )}
        </div>

        {/* ── My Tickets ── */}
        <div className="account-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-accent">My Tickets</h3>
            {!ticketsLoading && (
              <button onClick={loadTickets} className="text-light/30 text-xs uppercase tracking-widest hover:text-light/60 transition">
                ↻ Refresh
              </button>
            )}
          </div>

          {ticketsLoading && <div className="spinner" style={{ margin: "32px auto" }} />}

          {ticketsError && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p className="text-light/40 text-sm mb-3">{ticketsError}</p>
              <button onClick={loadTickets} className="account-btn">Retry</button>
            </div>
          )}

          {!ticketsLoading && !ticketsError && storedCount === 0 && (
            <div className="text-center py-16">
              <p className="text-light/30 text-sm">No tickets yet.</p>
              <a href="/events" className="text-accent text-xs font-semibold uppercase tracking-widest mt-3 inline-block hover:underline">
                Browse Events →
              </a>
            </div>
          )}

          {!ticketsLoading && !ticketsError && liveTickets.length > 0 && (
            <>
              {liveTickets.some((t) => !t.amountPaid) && (
                <p className="text-light/40 text-xs mb-4">
                  Auto-refreshing every 30 s for pending payments.
                </p>
              )}
              <div className="my-tickets-grid">
                {liveTickets.map((t) => (
                  <TicketCard key={t.ticketCode} ticket={t} onRepay={setRepayTarget} />
                ))}
              </div>
            </>
          )}

          {!ticketsLoading && !ticketsError && storedCount > 0 && liveTickets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-light/30 text-sm">Could not load live ticket details.</p>
              <button onClick={loadTickets} className="account-btn mt-3">Retry</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
