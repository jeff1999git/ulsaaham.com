import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { registerForEvent, createPaymentOrder, verifyPayment, validateCode } from "../lib/api.js";
import { getUser, setUser as persistUser, addTicket } from "../lib/auth.js";
import { optimizeCloudinary } from "../lib/image.js";

function sendTicketEmail(email, ticketData) {
  if (!email) return;
  fetch("/api/send-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      ticketCode: ticketData.ticketCode,
      participantName: ticketData.participantName,
      eventName: ticketData.eventName,
      eventDate: ticketData.eventDate,
      eventVenue: ticketData.eventVenue,
      numberOfParticipants: ticketData.numberOfParticipants,
      competitionNumber: ticketData.competitionNumber ?? null,
      paymentId: ticketData.paymentId,
    }),
  }).catch(() => {});
}
import { generateTicketCanvas, downloadCanvasAsPng } from "../lib/generate-ticket.js";
import { downloadParticipationCardPdf } from "../lib/participation-card-pdf.js";

const GST_RATE = 0.18;
const PLATFORM_FEE_RATE = 0.02;

function calcFees(event, quantity, couponDiscount = 0) {
  const price = event.effectiveAmount ?? event.amount;
  // Competition group pricing: first member pays the entry price, each extra
  // member adds groupExtraAmount (falls back to the entry price if unset).
  const base = event.isCompetition
    ? price + (event.groupExtraAmount ?? price) * Math.max(0, quantity - 1)
    : price * quantity;
  const discountApplied = Math.min(couponDiscount, base);
  const discountedBase = Math.max(0, base - discountApplied);
  const gst = event.gstEnabled ? Math.round(discountedBase * GST_RATE * 100) / 100 : 0;
  const platformFee = event.platformFeeEnabled !== false ? Math.round(discountedBase * PLATFORM_FEE_RATE * 100) / 100 : 0;
  const total = Math.round((discountedBase + gst + platformFee) * 100) / 100;
  return { base, discount: discountApplied, discountedBase, gst, platformFee, total };
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

const confirmedBadge = { padding: "2px 9px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", display: "inline-block", background: "#064e3b", color: "#6ee7b7" };

function TicketSuccess({ ticket, event }) {
  const qrRef = useRef(null);
  const [dlLoading, setDlLoading] = useState(false);

  const isEntryCard = ticket.competitionNumber != null;
  const instructions = event?.competitionInstructions || null;
  const notes = event?.competitionNotes || null;

  const eventDateShort = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ticket.eventDate));
  const eventDateFull = new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(ticket.eventDate));

  const handleDownload = async () => {
    setDlLoading(true);
    try {
      if (isEntryCard) {
        // Competition participation card: plain details PDF, no ticket art / QR
        downloadParticipationCardPdf(
          {
            chestNumber: ticket.competitionNumber,
            participantName: ticket.participantName,
            eventName: ticket.eventName,
            eventDate: eventDateShort,
            eventVenue: ticket.eventVenue,
            numberOfParticipants: ticket.numberOfParticipants,
            ticketCode: ticket.ticketCode,
            instructions,
            notes,
          },
          `participation-card-${ticket.ticketCode}.pdf`
        );
        return;
      }

      const svgEl = qrRef.current?.querySelector("svg");
      if (!svgEl) return;
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
      alert(`Failed to generate ${isEntryCard ? "participation card" : "ticket"}. Please try again.`);
    } finally {
      setDlLoading(false);
    }
  };

  return (
    <div className="my-ticket">
      {ticket.bannerImageUrl && (
        <img
          src={optimizeCloudinary(ticket.bannerImageUrl, 600)}
          alt={ticket.eventName}
          loading="lazy"
          decoding="async"
          width="480"
          height="600"
          style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", display: "block" }}
        />
      )}
      <div className="my-ticket__info">
        <div style={{ marginBottom: 6 }}><span style={confirmedBadge}>Confirmed ✓</span></div>
        <p className="text-light font-semibold text-sm leading-snug mt-1">{ticket.eventName}</p>
        <p className="text-light/50 text-xs mt-1">{eventDateFull}{ticket.eventVenue ? ` · ${ticket.eventVenue}` : ""}</p>
        <p className="text-light/40 text-xs mt-1">
          {ticket.participantName} · {ticket.numberOfParticipants} participant{ticket.numberOfParticipants !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Hidden QR SVG — used only by canvas generator (not needed for participation cards) */}
      {!isEntryCard && (
        <div ref={qrRef} style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none" }}>
          <QRCode value={ticket.ticketCode} size={260} />
        </div>
      )}

      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {isEntryCard ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: "12px 24px", width: "fit-content", margin: "0 auto 8px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#666", margin: 0 }}>CHEST NO</p>
            <p style={{ fontSize: 44, fontWeight: 700, color: "#014421", margin: 0, lineHeight: 1.15 }}>{ticket.competitionNumber}</p>
          </div>
        ) : ticket.qrCodeUrl ? (
          <img src={ticket.qrCodeUrl} alt="QR code" style={{ width: "100%", maxWidth: 150, display: "block", margin: "0 auto 8px" }} />
        ) : (
          <div style={{ background: "#fff", padding: 8, width: "fit-content", margin: "0 auto 8px", borderRadius: 6 }}>
            <QRCode value={ticket.ticketCode} size={130} />
          </div>
        )}
        <p style={{ fontFamily: "monospace", fontSize: "0.8rem", textAlign: "center", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
          {ticket.ticketCode}
        </p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={handleDownload} disabled={dlLoading} className="account-btn" style={{ fontSize: 11, padding: "5px 12px" }}>
            {dlLoading ? "Generating…" : isEntryCard ? "Download Participation Card (PDF)" : "Download Ticket"}
          </button>
          <a href="/account" className="text-accent text-xs font-semibold uppercase tracking-widest hover:underline">
            View My Bookings →
          </a>
        </div>
        {isEntryCard && (instructions?.trim() || notes?.trim()) && (
          <p style={{ fontSize: 10, textAlign: "center", color: "rgba(255,255,255,0.35)", margin: "8px 0 0" }}>
            Includes the competition instructions — read them before the event.
          </p>
        )}
      </div>
    </div>
  );
}

function CompleteProfileStep({ user, onComplete }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", age: user?.age ? String(user.age) : "" });
  const [errors, setErrors] = useState({});

  const set = (f) => (e) => {
    setForm((prev) => ({ ...prev, [f]: e.target.value }));
    setErrors((prev) => { const n = { ...prev }; delete n[f]; return n; });
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    const phone = form.phone.trim();
    if (!phone) errs.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(phone)) errs.phone = "Enter a valid 10-digit mobile number.";
    const age = Number(form.age);
    if (!form.age.trim()) errs.age = "Age is required.";
    else if (!Number.isInteger(age) || age < 1 || age > 120) errs.age = "Enter a valid age (1–120).";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onComplete({ name: form.name.trim(), phone, age });
  };

  return (
    <form onSubmit={submit} className="reg-form" noValidate>
      <h3 className="font-serif text-xl text-light mb-1">Complete Your Profile</h3>
      <p className="text-light/40 text-sm mb-5">We need a few more details to book you for this event.</p>
      <div className="reg-field">
        <label>Full Name *</label>
        <input type="text" value={form.name} onChange={set("name")} placeholder="Rahul Menon" autoFocus required />
        {errors.name && <span className="reg-field-error">{errors.name}</span>}
      </div>
      <div className="reg-field">
        <label>Mobile Number * <span className="reg-field-hint">10 digits, no +91</span></label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone")({ target: { value: e.target.value.replace(/\D/g, "").slice(0, 10) } })}
          placeholder="9876543210"
          maxLength={10}
          required
        />
        {errors.phone && <span className="reg-field-error">{errors.phone}</span>}
      </div>
      <div className="reg-field">
        <label>Age *</label>
        <input type="number" value={form.age} onChange={set("age")} placeholder="25" min={1} max={120} required />
        {errors.age && <span className="reg-field-error">{errors.age}</span>}
      </div>
      <button type="submit" className="reg-submit">Continue →</button>
    </form>
  );
}

export default function RegistrationForm({ event }) {
  // Competition entry rules: 1 person = individual entry, 2+ = group entry
  const isCompetitionEvent = !!event.isCompetition;
  const participationType = event.participationType || "INDIVIDUAL";
  const individualOnly = isCompetitionEvent && participationType === "INDIVIDUAL";
  const groupOnly = isCompetitionEvent && participationType === "GROUP";
  const minMembers = groupOnly ? 2 : 1;

  const [authStatus, setAuthStatus] = useState("loading"); // "loading" | "guest" | "user"
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", age: "", numberOfParticipants: String(minMembers) });
  const [phase, setPhase] = useState("form"); // "form" | "breakdown" | "paying" | "verifying" | "success"
  const [ticket, setTicket] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);

  // Promo code state — appliedCode: null | { type:"coupon"|"complimentary", code, discount?, remainingUses? }
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState(null);
  const [promoError, setPromoError] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);

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
      numberOfParticipants: String(minMembers),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <p className="font-serif text-2xl text-accent">Booking Closed</p>
        <p className="text-light/50 mt-2 text-sm">This event is no longer accepting bookings.</p>
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
          Sign in to book this event and access your bookings.
        </p>
        <a href={`/login?next=${next}`} className="reg-submit" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          Login / Sign Up →
        </a>
      </div>
    );
  }

  if (phase === "success") return <TicketSuccess ticket={ticket} event={event} />;

  const needsProfile = !user?.name?.trim() || !user?.phone?.trim() || !user?.age;
  if (needsProfile) {
    return (
      <CompleteProfileStep
        user={user}
        onComplete={(profileData) => {
          const updated = { ...user, ...profileData };
          persistUser(updated);
          setUser(updated);
          setForm((f) => ({ ...f, name: profileData.name, phone: profileData.phone, age: String(profileData.age) }));
        }}
      />
    );
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const isComplimentary = appliedCode?.type === "complimentary";
  const isFreeEntry = event.isFree || isComplimentary;
  const count = individualOnly ? 1 : Number(form.numberOfParticipants) || minMembers;
  const appliedDiscount = appliedCode?.type === "coupon" ? (appliedCode.discount ?? 0) : 0;
  const effectivePrice = event.effectiveAmount ?? event.amount;
  const extraMemberPrice = event.groupExtraAmount ?? effectivePrice;
  const fees = !isFreeEntry ? calcFees(event, count, appliedDiscount) : null;
  const spotsLeft = event.capacity ? event.capacity - event.registeredCount : null;
  const feeNoteParts = [];
  if (event.gstEnabled) feeNoteParts.push("18% GST");
  if (event.platformFeeEnabled) feeNoteParts.push("2% platform fee");
  const feeNote = feeNoteParts.length ? ` (+ ${feeNoteParts.join(" + ")})` : "";
  const priceSuffix = isCompetitionEvent
    ? individualOnly
      ? "entry"
      : groupOnly
      ? `first member · +₹${extraMemberPrice} per extra member`
      : `individual · +₹${extraMemberPrice} per extra group member`
    : "per person";

  // ── Field setter with inline participants validation ─────────────────────────
  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((fe) => { const n = { ...fe }; delete n[field]; return n; });
    setGlobalError(null);
    if (field === "numberOfParticipants" && isComplimentary && appliedCode.remainingUses != null) {
      const n = Number(value);
      if (n > appliedCode.remainingUses) {
        setFieldErrors((fe) => ({ ...fe, numberOfParticipants: ["This code doesn't cover that many participants."] }));
      }
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = ["Full name is required."];
    const phone = form.phone.trim();
    if (!phone) errors.phone = ["Phone number is required."];
    else if (!/^\d{10}$/.test(phone)) errors.phone = ["Enter a valid 10-digit phone number."];
    const age = Number(form.age);
    if (!form.age.trim()) errors.age = ["Age is required."];
    else if (!Number.isInteger(age) || age < 1 || age > 120) errors.age = ["Enter a valid age between 1 and 120."];
    if (isComplimentary && appliedCode.remainingUses != null && count > appliedCode.remainingUses) {
      errors.numberOfParticipants = ["This code doesn't cover that many participants."];
    }
    if (groupOnly && count < 2) {
      errors.numberOfParticipants = ["This competition accepts group entries only — minimum 2 members."];
    }
    return errors;
  };

  const buildBody = () => {
    const body = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      age: Number(form.age),
      numberOfParticipants: count,
    };
    if (form.email.trim()) body.email = form.email.trim();
    // Include code only for complimentary on paid events (free events don't need it)
    if (!event.isFree && isComplimentary) body.code = appliedCode.code;
    return body;
  };

  // ── Promo code handlers ──────────────────────────────────────────────────────
  const handleApplyCode = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);

    const { ok, data } = await validateCode(event.slug, code);
    setPromoLoading(false);

    if (!ok) {
      setAppliedCode(null);
      setPromoError(data?.error || "Invalid code.");
      return;
    }

    const cd = data.data;
    setAppliedCode({ type: cd.type, code: cd.couponCode, discount: cd.discount, remainingUses: cd.remainingUses });
    setPromoError(null);
    // Clear any participant count error that may have been showing
    setFieldErrors((fe) => { const n = { ...fe }; delete n.numberOfParticipants; return n; });
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setPromoInput("");
    setPromoError(null);
  };

  // ── Free / complimentary registration (no payment) ───────────────────────────
  const handleFreeRegistration = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setPhase("paying");
    setFieldErrors({});
    setGlobalError(null);

    const { ok, status, data } = await registerForEvent(event.slug, buildBody());
    if (ok) {
      const ticketData = data.data;
      addTicket({ ...ticketData, registeredAt: new Date().toISOString() });
      sendTicketEmail(form.email, ticketData);
      setTicket(ticketData);
      setPhase("success");
      return;
    }
    setPhase("form");
    if (status === 400 && data.fieldErrors) { setFieldErrors(data.fieldErrors); return; }
    if (status === 409) { setGlobalError("This phone number is already booked for this event, try with another phone number."); return; }
    if (status === 410) { setGlobalError("This event is now full."); return; }
    if (status === 429) { setGlobalError("Too many requests. Please try again in a moment."); return; }
    setGlobalError(data?.error || "Something went wrong. Please try again.");
  };

  // ── Paid event: show breakdown before Razorpay ───────────────────────────────
  const handlePaidSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
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
    if (appliedCode?.type === "coupon") body.couponCode = appliedCode.code;
    const { ok, status, data } = await createPaymentOrder(event.slug, body);
    if (!ok) {
      setPhase("breakdown");
      if (status === 410) { setGlobalError("This event is now full."); return; }
      if (status === 404 && appliedCode) {
        setAppliedCode(null);
        setPromoError("Code is no longer valid. Please try again without it.");
        setGlobalError("Promo code rejected. Please review and try again.");
        return;
      }
      if (status === 429) { setGlobalError("Too many requests. Please try again in a moment."); return; }
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
        sendTicketEmail(form.email, ticketData);
        setTicket(ticketData);
        setPhase("success");
      },
      modal: {
        ondismiss: () => setPhase("breakdown"),
      },
    });
    rzp.open();
  };

  // ── Paying / Verifying spinner ───────────────────────────────────────────────
  if (phase === "paying" || phase === "verifying") {
    return (
      <div className="reg-form" style={{ minHeight: "160px", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
        <p className="text-light/40 text-sm mt-4">
          {phase === "verifying" ? "Confirming your payment…" : isComplimentary ? "Registering…" : "Opening payment gateway…"}
        </p>
      </div>
    );
  }

  // ── Breakdown: fee table before Razorpay ─────────────────────────────────────
  if (phase === "breakdown" && fees) {
    const bd = fees;
    return (
      <div className="reg-form">
        <h3 className="font-serif text-xl text-light mb-1">Order Summary</h3>
        <p className="text-light/40 text-sm mb-5">{event.name}</p>

        {globalError && <div className="reg-error">{globalError}</div>}

        <div className="fee-breakdown">
          <div className="fee-breakdown__row">
            <span>
              {isCompetitionEvent && count > 1 ? (
                <>
                  ₹{effectivePrice} + {count - 1} × ₹{extraMemberPrice}
                  <span style={{ opacity: 0.6, fontSize: "11px", marginLeft: "4px" }}>group entry · {count} members</span>
                </>
              ) : isCompetitionEvent ? (
                <>
                  ₹{effectivePrice}
                  <span style={{ opacity: 0.6, fontSize: "11px", marginLeft: "4px" }}>individual entry</span>
                </>
              ) : (
                <>{count} × ₹{effectivePrice}</>
              )}
              {event.isEarlyBird && event.earlyBirdAmount != null && (
                <span style={{ color: "#9bca3b", fontSize: "11px", marginLeft: "4px" }}>early bird</span>
              )}
            </span>
            <span>₹{bd.base.toFixed(2)}</span>
          </div>
          {bd.discount > 0 && appliedCode && (
            <>
              <div className="fee-breakdown__row" style={{ color: "#22c55e" }}>
                <span>Promo ({appliedCode.code})</span>
                <span>−₹{bd.discount.toFixed(2)}</span>
              </div>
              <div className="fee-breakdown__row">
                <span>Subtotal</span>
                <span>₹{bd.discountedBase.toFixed(2)}</span>
              </div>
            </>
          )}
          {bd.gst > 0 && (
            <div className="fee-breakdown__row">
              <span>GST (18%)</span>
              <span>₹{bd.gst.toFixed(2)}</span>
            </div>
          )}
          {bd.platformFee > 0 && (
            <div className="fee-breakdown__row">
              <span>Platform fee (2%)</span>
              <span>₹{bd.platformFee.toFixed(2)}</span>
            </div>
          )}
          <div className="fee-breakdown__divider" />
          <div className="fee-breakdown__total">
            <span>Total</span>
            <span>₹{bd.total.toFixed(2)}</span>
          </div>
        </div>

        {promoError && <p className="text-red-400 text-xs mt-2">{promoError}</p>}
        <p className="text-light/40 text-xs mb-4">Booking as: <strong className="text-light/70">{form.name}</strong> (+91 {form.phone})</p>

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
  const handleSubmit = isFreeEntry ? handleFreeRegistration : handlePaidSubmit;
  const isSubmitting = phase === "paying" || phase === "verifying";

  return (
    <form onSubmit={handleSubmit} className="reg-form" noValidate>
      <h3 className="font-serif text-xl text-light mb-1">Book</h3>
      <p className="text-light/40 text-sm mb-5" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        {event.isFree || isComplimentary ? (
          <span style={{ color: "#22c55e", fontWeight: 600 }}>{isComplimentary ? "Free — promo applied" : "Free"}</span>
        ) : event.isEarlyBird && event.earlyBirdAmount != null ? (
          <>
            <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.5)", textDecorationColor: "rgba(255,255,255,0.6)" }}>₹{event.amount}</span>
            <span style={{ color: "#9bca3b", fontWeight: 600 }}>₹{event.earlyBirdAmount}</span>
            <span style={{ background: "rgba(155,202,59,0.15)", color: "#9bca3b", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(155,202,59,0.3)" }}>Early Bird</span>
            <span style={{ opacity: 0.45 }}>{priceSuffix}{feeNote}</span>
          </>
        ) : (
          <span>₹{event.amount} {priceSuffix}{feeNote}</span>
        )}
        {spotsLeft != null && !event.isFull ? <span> · {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span> : ""}
      </p>

      {isCompetitionEvent && event.competitionNotes && (
        <div style={{ background: "rgba(155,202,59,0.07)", border: "1px solid rgba(155,202,59,0.25)", borderRadius: 8, padding: "12px 14px", marginBottom: 18 }}>
          <p className="text-accent text-xs font-semibold uppercase tracking-widest" style={{ marginBottom: 6 }}>
            📋 Competition Notes
          </p>
          <p className="text-light/70 text-xs" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
            {event.competitionNotes}
          </p>
        </div>
      )}

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
        {!individualOnly && (
          <div className="reg-field">
            <label>
              {isCompetitionEvent ? (groupOnly ? "Group Members *" : "Members *") : "Participants *"}
              {isCompetitionEvent && participationType === "BOTH" && (
                <span className="reg-field-hint">1 = individual · 2+ = group</span>
              )}
            </label>
            <input type="number" value={form.numberOfParticipants} onChange={set("numberOfParticipants")} min={minMembers} max={isComplimentary && appliedCode.remainingUses != null ? appliedCode.remainingUses : 10} required />
            {fieldErrors.numberOfParticipants && <span className="reg-field-error">{fieldErrors.numberOfParticipants[0]}</span>}
          </div>
        )}
      </div>

      {/* Promo code section — only for paid events */}
      {!event.isFree && (
        <div className="coupon-section">
          {!appliedCode ? (
            <>
              <button
                type="button"
                onClick={() => setPromoOpen((o) => !o)}
                className="coupon-toggle"
              >
                {promoOpen ? "▾" : "▸"} Have a promo code?
              </button>
              {promoOpen && (
                <div className="coupon-input-row">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                    placeholder="ENTER CODE"
                    className="coupon-input"
                    maxLength={32}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCode(); } }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCode}
                    disabled={promoLoading || !promoInput.trim()}
                    className="coupon-apply-btn"
                  >
                    {promoLoading ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {promoError && <p className="coupon-error">{promoError}</p>}
            </>
          ) : (
            <div className="coupon-applied">
              {appliedCode.type === "complimentary" ? (
                <span className="coupon-applied__text">
                  ✓ <strong>{appliedCode.code}</strong> — Free entry
                </span>
              ) : (
                <span className="coupon-applied__text">
                  ✓ <strong>{appliedCode.code}</strong> — ₹{appliedCode.discount} off
                </span>
              )}
              <button type="button" onClick={handleRemoveCode} className="coupon-remove">×</button>
            </div>
          )}
        </div>
      )}

      {fees && (
        <p className="text-light/40 text-xs">
          Estimated total: <strong className="text-accent">₹{fees.total.toFixed(2)}</strong>
          {event.isEarlyBird && event.earlyBirdAmount != null && (
            <span style={{ color: "#9bca3b", marginLeft: "6px" }}>🎟 early bird price</span>
          )}
          {" "}(breakdown shown before payment)
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="reg-submit">
        {isSubmitting
          ? "Processing…"
          : event.isFree
          ? "Book — Free"
          : isComplimentary
          ? "Register — Free →"
          : `Pay & Book — ₹${fees ? fees.total.toFixed(2) : "…"}`}
      </button>
    </form>
  );
}
