import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { registerForEvent, createPaymentOrder, verifyPayment } from "../lib/api.js";
import { getUser, addTicket } from "../lib/auth.js";
import { generateTicketCanvas, downloadCanvasAsPng } from "../lib/generate-ticket.js";

function calcFees(amount, count) {
  const base = amount * count;
  const gst = Math.round(base * 0.18 * 100) / 100;
  const platformFee = Math.round(base * 0.02 * 100) / 100;
  const total = Math.round((base + gst + platformFee) * 100) / 100;
  return { base, gst, platformFee, total };
}

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

function TicketSuccess({ ticket }) {
  const qrRef = useRef(null);
  const [dlLoading, setDlLoading] = useState(false);

  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(ticket.eventDate));
  const eventDateShort = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ticket.eventDate));

  const handleDownload = async () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    setDlLoading(true);
    try {
      const canvas = await generateTicketCanvas(svgEl, {
        ticketCode: ticket.ticketCode,
        participantName: ticket.participantName,
        eventName: ticket.eventName,
        eventDate: eventDateShort,
        eventVenue: ticket.eventVenue,
        numberOfParticipants: ticket.numberOfParticipants,
        bannerImageUrl: ticket.bannerImageUrl || null,
      });
      downloadCanvasAsPng(canvas, `ticket-${ticket.ticketCode}.png`);
    } catch {
      alert("Failed to generate ticket. Please try again.");
    } finally {
      setDlLoading(false);
    }
  };

  return (
    <div className="ticket-success">
      <div className="ticket-success__header">
        <span className="text-accent text-xs font-semibold uppercase tracking-widest">Registration Confirmed ✓</span>
        <h3 className="font-serif text-xl text-light mt-1">{ticket.eventName}</h3>
      </div>
      <div className="ticket-success__body">
        {/* Hidden QR SVG — used only by canvas generator */}
        <div ref={qrRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", width: 0, height: 0, overflow: "hidden" }}>
          <QRCode value={ticket.ticketCode} size={260} />
        </div>
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
            {ticket.paymentId && <><dt>Payment</dt><dd className="text-xs opacity-60">{ticket.paymentId}</dd></>}
          </dl>
        </div>
      </div>
      <p className="text-light/40 text-xs mt-5 text-center">
        Screenshot this ticket — show the QR code at the venue. It's also saved in your account.
      </p>
      <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
        <button onClick={handleDownload} disabled={dlLoading} className="account-btn" style={{ fontSize: 12, padding: "6px 16px" }}>
          {dlLoading ? "Generating…" : "Download Ticket"}
        </button>
        <a href="/account" className="text-accent text-xs font-semibold uppercase tracking-widest hover:underline">
          View My Tickets →
        </a>
      </div>
    </div>
  );
}

export default function RegistrationForm({ event }) {
  const [authStatus, setAuthStatus] = useState("loading"); // "loading" | "guest" | "user"
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", age: "", numberOfParticipants: "1" });
  const [phase, setPhase] = useState("form"); // "form" | "breakdown" | "paying" | "verifying" | "success"
  const [ticket, setTicket] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { setAuthStatus("guest"); return; }
    setUser(u);
    setAuthStatus("user");
    setForm({
      name: u.name || "",
      phone: u.phone || "",
      email: u.email || "",
      age: u.age ? String(u.age) : "",
      numberOfParticipants: "1",
    });
  }, []);

  if (event.isFull) {
    return (
      <div className="reg-closed">
        <p className="font-serif text-2xl text-accent">Event Full</p>
        <p className="text-light/50 mt-2 text-sm">This event has reached its capacity.</p>
      </div>
    );
  }
  if (new Date(event.date) < new Date()) {
    return (
      <div className="reg-closed">
        <p className="font-serif text-2xl text-light/60">This event has ended.</p>
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

  if (authStatus === "loading") {
    return <div className="reg-closed" style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>;
  }

  if (authStatus === "guest") {
    const next = encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/events");
    return (
      <div className="auth-gate">
        <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-2">Login Required</p>
        <p className="text-light/60 text-sm mb-6">
          Sign in to register for this event and access your tickets.
        </p>
        <a href={`/login?next=${next}`} className="reg-submit" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          Login / Sign Up →
        </a>
      </div>
    );
  }

  if (phase === "success") return <TicketSuccess ticket={ticket} />;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => { const n = { ...fe }; delete n[field]; return n; });
    setGlobalError(null);
  };

  const buildBody = () => {
    const body = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      age: Number(form.age),
      numberOfParticipants: Number(form.numberOfParticipants),
    };
    if (form.email.trim()) body.email = form.email.trim();
    return body;
  };

  // ── Free event: direct registration ──────────────────────────────────────────
  const handleFreeSubmit = async (e) => {
    e.preventDefault();
    setPhase("paying");
    setFieldErrors({});
    setGlobalError(null);

    const { ok, status, data } = await registerForEvent(event.slug, buildBody());
    if (ok) {
      const ticketData = data.data;
      addTicket({ ...ticketData, registeredAt: new Date().toISOString() });
      setTicket(ticketData);
      setPhase("success");
      return;
    }
    setPhase("form");
    if (status === 400 && data.fieldErrors) { setFieldErrors(data.fieldErrors); return; }
    if (status === 409) { setGlobalError("This phone number is already registered for this event."); return; }
    if (status === 410) { setGlobalError("This event is now full."); return; }
    setGlobalError(data?.error || "Something went wrong. Please try again.");
  };

  // ── Paid event: show breakdown before opening Razorpay ──────────────────────
  const handlePaidSubmit = (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setPhase("breakdown");
  };

  const handlePay = async () => {
    setGlobalError(null);
    setPhase("paying");

    const loaded = await loadRazorpay();
    if (!loaded) {
      setGlobalError("Could not load the payment gateway. Please check your connection and try again.");
      setPhase("breakdown");
      return;
    }

    const body = buildBody();
    const { ok, status, data } = await createPaymentOrder(event.slug, body);
    if (!ok) {
      setPhase("breakdown");
      if (status === 409) { setGlobalError("This phone number is already registered for this event."); return; }
      if (status === 410) { setGlobalError("This event is now full."); return; }
      setGlobalError(data?.error || "Could not initiate payment. Please try again.");
      return;
    }

    const orderData = data.data;
    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Ulsaham Entertainments",
      description: event.name,
      order_id: orderData.orderId,
      prefill: { name: form.name, email: form.email || "", contact: form.phone },
      theme: { color: "#014421" },
      handler: async (response) => {
        setPhase("verifying");
        const vBody = { ...response, ...body };
        const result = await verifyPayment(event.slug, vBody);
        if (!result.ok) {
          const pid = response.razorpay_payment_id;
          setGlobalError(
            `Payment was received but we couldn't confirm your registration. Please save your Payment ID: ${pid} and contact support@ulsaham.com.`
          );
          setPhase("form");
          return;
        }
        const ticketData = result.data.data;
        addTicket({ ...ticketData, registeredAt: new Date().toISOString() });
        setTicket(ticketData);
        setPhase("success");
      },
      modal: {
        ondismiss: () => setPhase("breakdown"),
      },
    });
    rzp.open();
  };

  const count = Number(form.numberOfParticipants) || 1;
  const fees = !event.isFree ? calcFees(event.amount, count) : null;
  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;

  // ── Paying / Verifying spinner ───────────────────────────────────────────────
  if (phase === "paying" || phase === "verifying") {
    return (
      <div className="reg-form" style={{ minHeight: "160px", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
        <p className="text-light/40 text-sm mt-4">
          {phase === "verifying" ? "Confirming your payment…" : "Opening payment gateway…"}
        </p>
      </div>
    );
  }

  // ── Breakdown: show fee table before Razorpay ────────────────────────────────
  if (phase === "breakdown" && fees) {
    const bd = calcFees(event.amount, count);
    return (
      <div className="reg-form">
        <h3 className="font-serif text-xl text-light mb-1">Order Summary</h3>
        <p className="text-light/40 text-sm mb-5">{event.name}</p>

        {globalError && <div className="reg-error">{globalError}</div>}

        <div className="fee-breakdown">
          <div className="fee-breakdown__row">
            <span>₹{event.amount} × {count} person{count !== 1 ? "s" : ""}</span>
            <span>₹{bd.base.toFixed(2)}</span>
          </div>
          <div className="fee-breakdown__row">
            <span>GST (18%)</span>
            <span>₹{bd.gst.toFixed(2)}</span>
          </div>
          <div className="fee-breakdown__row">
            <span>Platform fee (2%)</span>
            <span>₹{bd.platformFee.toFixed(2)}</span>
          </div>
          <div className="fee-breakdown__divider" />
          <div className="fee-breakdown__total">
            <span>Total</span>
            <span>₹{bd.total.toFixed(2)}</span>
          </div>
        </div>

        <p className="text-light/40 text-xs mb-4">Registered as: <strong className="text-light/70">{form.name}</strong> (+91 {form.phone})</p>

        <button onClick={handlePay} className="reg-submit">
          Pay ₹{bd.total.toFixed(2)} →
        </button>
        <button
          onClick={() => { setPhase("form"); setGlobalError(null); }}
          className="text-light/30 text-xs uppercase tracking-widest hover:text-light/60 transition mt-2 text-center"
        >
          ← Edit Details
        </button>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  const handleSubmit = event.isFree ? handleFreeSubmit : handlePaidSubmit;
  const isSubmitting = phase === "paying" || phase === "verifying";

  return (
    <form onSubmit={handleSubmit} className="reg-form" noValidate>
      <h3 className="font-serif text-xl text-light mb-1">Register</h3>
      <p className="text-light/40 text-sm mb-5">
        {event.isFree ? "Free entry" : `₹${event.amount} per person (+ 18% GST + 2% platform fee)`}
        {spotsLeft != null && !event.isFull ? ` · ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left` : ""}
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
          <span className="reg-field-hint">optional — for receipt</span>
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

      {fees && (
        <p className="text-light/40 text-xs">
          Estimated total: <strong className="text-accent">₹{calcFees(event.amount, count).total.toFixed(2)}</strong> (breakdown shown before payment)
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="reg-submit">
        {isSubmitting
          ? "Processing…"
          : event.isFree
          ? "Register — Free"
          : `Pay & Register — ₹${fees ? calcFees(event.amount, count).total.toFixed(2) : "…"}`}
      </button>
    </form>
  );
}
