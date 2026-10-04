import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { registerForEvent, createPaymentOrder, verifyPayment, getPaymentStatus, validateCode, sendTicketEmail } from "../lib/api.js";
import { getUser, setUser as persistUser, addTicket } from "../lib/auth.js";
import { optimizeCloudinary } from "../lib/image.js";
import { getBookingClosedReason, getBookingClosedDetail } from "../lib/event-status.js";
import { generateTicketCanvas, downloadCanvasAsPng } from "../lib/generate-ticket.js";
import { downloadParticipationCardPdf, warmParticipationCardPdf } from "../lib/participation-card-pdf.js";
import { formatDateShort, formatDateFull } from "../lib/format-date.js";
import { SUPPORT_EMAIL } from "../lib/contact.js";
import { calcFees } from "../lib/fees.js";
import { loadRazorpay } from "../lib/razorpay.js";
import {
  orderKey,
  keepOrder,
  reusableOrder,
  verifyWithRetry,
  isFinalAnswer,
  verifyFailureMessage,
  bookingErrorAction,
  newRequestId,
} from "../lib/payment-flow.js";
import {
  savePendingPayment,
  readPendingPayment,
  updatePendingPayment,
  clearPendingPayment,
  isRecoverable,
} from "../lib/pending-payment.js";
import VerifyFailed from "./VerifyFailed.jsx";

// The admin panel takes at most this many people on one booking.
const MAX_PARTICIPANTS = 10;
// A payment whose answer never arrived is looked up this often, for this long.
const CHECK_EVERY_MS = 3000;
const CHECK_FOR_MS = 60_000;

const priceNotice = { background: "rgba(234,179,8,0.12)", borderColor: "rgba(234,179,8,0.45)", color: "#fde68a" };

const confirmedBadge = { padding: "2px 9px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", display: "inline-block", background: "#064e3b", color: "#6ee7b7" };

// Delivery of the ticket email, reported on the success screen so a failed
// send is visible instead of silent.
function TicketEmailStatus({ status, onRetry }) {
  if (!status) return null;

  const base = { fontSize: 11, textAlign: "center", margin: "10px 0 0" };

  if (status.state === "skipped") {
    return (
      <p style={{ ...base, color: "rgba(255,255,255,0.35)" }}>
        No email address on this booking, so nothing was sent. Download your ticket above, or add an
        email in your <a href="/account" style={{ color: "#9bca3b" }}>account</a> to have it mailed.
      </p>
    );
  }
  if (status.state === "sending") {
    return <p style={{ ...base, color: "rgba(255,255,255,0.35)" }}>Emailing your ticket…</p>;
  }
  if (status.state === "sent") {
    return <p style={{ ...base, color: "rgba(255,255,255,0.45)" }}>Ticket emailed to {status.email}</p>;
  }
  return (
    <p style={{ ...base, color: "#fca5a5" }}>
      {status.error || "We couldn't email your ticket."}{" "}
      <button
        type="button"
        onClick={onRetry}
        style={{ background: "none", border: "none", padding: 0, color: "#9bca3b", font: "inherit", cursor: "pointer", textDecoration: "underline" }}
      >
        Send again
      </button>
    </p>
  );
}

function TicketSuccess({ ticket, event, emailStatus, onResendEmail }) {
  const qrRef = useRef(null);
  const [dlLoading, setDlLoading] = useState(false);

  const isEntryCard = ticket.competitionNumber != null;
  const instructions = event?.competitionInstructions || null;
  const notes = event?.competitionNotes || null;
  // The booking response carries no banner; the event on this page has it.
  const banner = ticket.bannerImageUrl || event?.bannerImageUrl || null;

  const eventDateShort = formatDateShort(ticket.eventDate);
  const eventDateFull = formatDateFull(ticket.eventDate);

  useEffect(() => {
    if (isEntryCard) warmParticipationCardPdf();
  }, [isEntryCard]);

  const handleDownload = async () => {
    setDlLoading(true);
    try {
      if (isEntryCard) {
        // Competition participation card: plain details PDF, no ticket art / QR
        await downloadParticipationCardPdf(
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

      // The on-screen QR, copied at the ticket's 260 px so it stays sharp.
      const shown = qrRef.current?.querySelector("svg");
      if (!shown) throw new Error("QR code not rendered");
      const svgEl = shown.cloneNode(true);
      svgEl.setAttribute("width", "260");
      svgEl.setAttribute("height", "260");
      const canvas = await generateTicketCanvas(svgEl, {
        ticketCode: ticket.ticketCode,
        participantName: ticket.participantName,
        eventName: ticket.eventName,
        eventDate: eventDateShort,
        eventVenue: ticket.eventVenue,
        numberOfParticipants: ticket.numberOfParticipants,
        bannerImageUrl: banner,
      });
      downloadCanvasAsPng(canvas, `ticket-${ticket.ticketCode}.png`);
    } catch (err) {
      alert(err?.chunkLoad ? err.message : `Failed to generate ${isEntryCard ? "participation card" : "ticket"}. Please try again.`);
    } finally {
      setDlLoading(false);
    }
  };

  return (
    <div className="my-ticket">
      {banner && (
        <img
          src={optimizeCloudinary(banner, 600)}
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

      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {isEntryCard ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: "12px 24px", width: "fit-content", margin: "0 auto 8px", textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#666", margin: 0 }}>CHEST NO</p>
            <p style={{ fontSize: 44, fontWeight: 700, color: "#014421", margin: 0, lineHeight: 1.15 }}>{ticket.competitionNumber}</p>
          </div>
        ) : (
          <div ref={qrRef} style={{ background: "#fff", padding: 8, width: "fit-content", margin: "0 auto 8px", borderRadius: 6 }}>
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
        <TicketEmailStatus status={emailStatus} onRetry={onResendEmail} />
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

export default function RegistrationForm({ event, onEventStale }) {
  // Competition entry rules: 1 person = individual entry, 2+ = group entry
  const isCompetitionEvent = !!event.isCompetition;
  const participationType = event.participationType || "INDIVIDUAL";
  const individualOnly = isCompetitionEvent && participationType === "INDIVIDUAL";
  const groupOnly = isCompetitionEvent && participationType === "GROUP";
  const minMembers = groupOnly ? 2 : 1;

  const [authStatus, setAuthStatus] = useState("loading"); // "loading" | "guest" | "user"
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", age: "", numberOfParticipants: String(minMembers) });
  // "form" | "breakdown" | "paying" | "verifying" | "verify-failed" | "success"
  const [phase, setPhase] = useState("form");
  const [ticket, setTicket] = useState(null);
  // null | { state: "sending" | "sent" | "failed", email, error? }
  const [emailStatus, setEmailStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  // A payment Razorpay took whose booking could not be confirmed:
  // { message, paymentId, vBody }, vBody being what Retry sends to verify.
  const [failure, setFailure] = useState(null);
  // The server's order, when its total differs from the one this page showed.
  const [quote, setQuote] = useState(null);
  // The look for an earlier payment's booking: null | { state: "checking" |
  // "none", panel?, paymentId? }. A panel replaces the form while it checks.
  const [recovery, setRecovery] = useState(null);

  // Promo code state — appliedCode: null | { type:"coupon"|"complimentary", code, discount?, remainingUses? }
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState(null);
  const [promoError, setPromoError] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);

  // { key, order, at }: the Razorpay order the next Pay reuses (payment-flow.js).
  const orderRef = useRef(null);
  // Bumped by every Pay and by Cancel; an answer for an older attempt is ignored.
  const attemptRef = useRef(0);
  // { key, id }: the request id of a free booking, kept while its details stay the same.
  const requestRef = useRef(null);
  // The payment status check in progress, if any.
  const checkRef = useRef(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // checkout.js downloads while the visitor reads the order summary.
  useEffect(() => {
    if (phase === "breakdown") loadRazorpay();
  }, [phase]);

  // Any change to what is being booked means the next Pay needs a new order.
  useEffect(() => {
    orderRef.current = null;
  }, [form, appliedCode]);

  // Sends the ticket email without holding up the success screen, and records
  // how it went so the visitor can retry a failed send instead of never
  // learning it failed. Defined above the early returns so the success screen
  // can call it again. The Payment ID in the mail comes from the booking the
  // server holds, so none is sent from here.
  const deliverTicketEmail = (ticketData, to = form.email.trim()) => {
    if (!ticketData?.ticketCode) {
      setEmailStatus(null);
      return;
    }
    // The email field is optional, so say plainly that nothing was sent rather
    // than leaving the visitor to wonder.
    if (!to) {
      setEmailStatus({ state: "skipped" });
      return;
    }
    setEmailStatus({ state: "sending", email: to });
    sendTicketEmail({ ticketCode: ticketData.ticketCode, email: to })
      .then(({ ok, data }) =>
        setEmailStatus({ state: ok ? "sent" : "failed", email: to, error: ok ? null : data?.error })
      )
      .catch(() => setEmailStatus({ state: "failed", email: to }));
  };

  // The booking exists: keep it on this device, email it and show it. `email`
  // is given when the booking was found after a reload, before the form is filled.
  const showTicket = (ticketData, email) => {
    orderRef.current = null;
    addTicket({ ...ticketData, registeredAt: new Date().toISOString() });
    deliverTicketEmail(ticketData, email);
    setTicket(ticketData);
    setPhase("success");
  };

  const stopCheck = () => {
    clearTimeout(checkRef.current?.timer);
    checkRef.current = null;
  };

  // Asks every 3 s, for about a minute, whether `record`'s order has its
  // booking yet (verify or the Razorpay webhook may have made it while this
  // page was not listening). Defined above the early returns, like the
  // functions it calls, because the mount effect starts it.
  const startCheck = (record, panel) => {
    stopCheck();
    const check = { until: Date.now() + CHECK_FOR_MS, timer: null };
    checkRef.current = check;
    setRecovery({ state: "checking", panel });
    const ask = async () => {
      const { ok, status, data } = await getPaymentStatus(record.slug, { orderId: record.orderId, phone: record.phone });
      if (checkRef.current !== check) return;
      if (ok && data?.data?.ticketCode) {
        checkRef.current = null;
        clearPendingPayment(record.orderId);
        setRecovery(null);
        showTicket(data.data, record.email || "");
        return;
      }
      // 400 and 404: a record the server cannot match, or an event that is
      // gone; asking again changes nothing.
      if (status === 400 || status === 404) {
        checkRef.current = null;
        clearPendingPayment(record.orderId);
        setRecovery(null);
        return;
      }
      if (Date.now() >= check.until) {
        checkRef.current = null;
        updatePendingPayment(record.orderId, { checkedAt: Date.now() });
        setRecovery({ state: "none", paymentId: record.paymentId || null });
        return;
      }
      check.timer = setTimeout(ask, CHECK_EVERY_MS);
    };
    ask();
  };

  // Confirms a payment Razorpay reported, asking again after a lost answer or a
  // server error (it is safe to repeat). The verify-failed panel's Retry runs
  // it too. The pending record goes once the server has given a final answer.
  const confirmPayment = async (vBody) => {
    setPhase("verifying");
    const result = await verifyWithRetry(() => verifyPayment(event.slug, vBody));
    if (result.ok) {
      clearPendingPayment(vBody.razorpay_order_id);
      showTicket(result.data.data);
      return;
    }
    if (isFinalAnswer(result.status)) clearPendingPayment(vBody.razorpay_order_id);
    setFailure({ message: verifyFailureMessage(result), paymentId: vBody.razorpay_payment_id, vBody });
    setPhase("verify-failed");
  };

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

    // A payment opened here in the last half hour that never reported back.
    // Unless an earlier check already came up empty, the form waits for this
    // one: after a reload a new Pay would make a second order, and a second charge.
    const record = readPendingPayment();
    if (isRecoverable(record, event.slug)) startCheck(record, !record.checkedAt || !!record.paymentId);

    // Back from a UPI app or another tab: look again, beside the form.
    const onVisible = () => {
      if (document.hidden || checkRef.current || !["form", "breakdown"].includes(phaseRef.current)) return;
      const latest = readPendingPayment();
      if (isRecoverable(latest, event.slug)) startCheck(latest, false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      stopCheck();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A payment in progress or settled is shown even if booking has closed since:
  // the money has moved, and the visitor needs the ticket or the Payment ID.
  if (phase === "success")
    return (
      <TicketSuccess
        ticket={ticket}
        event={event}
        emailStatus={emailStatus}
        onResendEmail={() => deliverTicketEmail(ticket, emailStatus?.email || form.email.trim())}
      />
    );

  if (phase === "verify-failed") {
    return (
      <div className="reg-form">
        <VerifyFailed message={failure.message} paymentId={failure.paymentId} onRetry={() => confirmPayment(failure.vBody)} />
      </div>
    );
  }

  if (phase === "verifying" || (phase === "form" && recovery?.state === "checking" && recovery.panel)) {
    return (
      <div className="reg-form" role="status" style={{ minHeight: "160px", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div className="spinner" />
        <p className="text-light/40 text-sm mt-4">
          {phase === "verifying" ? "Confirming your payment…" : "Checking your last payment…"}
        </p>
        {phase !== "verifying" && <p className="text-light/30 text-xs">This takes up to a minute. Please don&apos;t pay again meanwhile.</p>}
      </div>
    );
  }

  // Closed because the admin closed it, the event is over or cancelled, or
  // every seat is taken — the visitor sees one consistent "Booking Closed".
  const closedReason = getBookingClosedReason(event);
  if (closedReason) {
    return (
      <div className="reg-closed">
        <p className="font-serif text-2xl text-accent">Booking Closed</p>
        <p className="text-light/50 mt-2 text-sm">{getBookingClosedDetail(closedReason)}</p>
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
  // A change also drops a repriced order's figures; the order itself goes in
  // the effect above.
  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((fe) => { const n = { ...fe }; delete n[field]; return n; });
    setGlobalError(null);
    setQuote(null);
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
    // A whole number in range, so the total shown is never negative or fractional.
    const people = Number(form.numberOfParticipants);
    if (!individualOnly && (!Number.isInteger(people) || people < minMembers || people > MAX_PARTICIPANTS)) {
      errors.numberOfParticipants = [`Enter a whole number from ${minMembers} to ${MAX_PARTICIPANTS}.`];
    }
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
    setQuote(null);

    const { ok, status, data } = await validateCode(event.slug, code);
    setPromoLoading(false);

    if (!ok) {
      setAppliedCode(null);
      setPromoError(data?.error || "Invalid code.");
      // 410: booking closed or the event was cancelled since this page loaded;
      // the fresh event replaces the form with the reason.
      if (status === 410) onEventStale?.();
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
    setQuote(null);
  };

  // ── A refused order or registration (payment-flow.js bookingErrorAction) ─────
  const applyBookingError = (res) => {
    const action = bookingErrorAction(res, { hasCode: !!appliedCode });
    if (action.kind === "fields") {
      setFieldErrors(action.fieldErrors);
      setGlobalError("Please check the details below.");
      setPhase("form");
      return;
    }
    if (action.kind === "coupon") {
      setAppliedCode(null);
      setPromoInput("");
      setPromoError(action.message || "Code is no longer valid. Please try again without it.");
      setGlobalError("Promo code rejected. Please review and try again.");
      return;
    }
    // Closed, full, or switched between free and paid since this page loaded:
    // the fresh event re-renders the form (or Booking Closed) to match.
    if (action.kind === "stale") onEventStale?.();
    setGlobalError(action.message || "Something went wrong. Please try again.");
  };

  // ── Free / complimentary registration (no payment) ───────────────────────────
  const handleFreeRegistration = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setPhase("paying");
    setFieldErrors({});
    setGlobalError(null);

    // One id per submit, kept while the details stay the same: pressing the
    // button again after a lost answer returns that booking, not a second one.
    const body = buildBody();
    const key = orderKey(event.slug, body);
    if (requestRef.current?.key !== key) requestRef.current = { key, id: newRequestId() };
    const res = await registerForEvent(event.slug, body, { requestId: requestRef.current.id });
    if (res.ok) {
      requestRef.current = null;
      showTicket(res.data.data);
      return;
    }
    setPhase("form");
    applyBookingError(res);
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

  // The script and the order load together. The same request within 15
  // minutes reuses its order, so closing the payment window and paying again
  // neither makes a second order nor uses up the hourly limit.
  const handlePay = async () => {
    const attempt = ++attemptRef.current;
    stopCheck();
    setRecovery(null);
    setGlobalError(null);
    setPhase("paying");

    const body = buildBody();
    if (appliedCode?.type === "coupon") body.couponCode = appliedCode.code;
    const key = orderKey(event.slug, body);
    const saved = reusableOrder(orderRef.current, key);
    const [loaded, res] = await Promise.all([
      loadRazorpay(),
      saved ? { ok: true, data: { data: saved } } : createPaymentOrder(event.slug, body),
    ]);
    // Kept even when this attempt was cancelled meanwhile: the next Pay uses it.
    if (res.ok && !saved) orderRef.current = keepOrder(key, res.data.data);
    if (attempt !== attemptRef.current) return;

    if (!res.ok) {
      setPhase("breakdown");
      applyBookingError(res);
      return;
    }
    if (!loaded) {
      setGlobalError("Could not load the payment gateway. Please check your connection and try again.");
      setPhase("breakdown");
      return;
    }

    // The server prices from its own copy of the event. When that is not what
    // this page showed, the visitor sees the server's total before paying it;
    // the next Pay opens this same order.
    const order = res.data.data;
    if (order.amount !== (quote ? quote.amount : fees.totalPaise)) {
      setQuote(order);
      setPhase("breakdown");
      onEventStale?.();
      return;
    }
    openCheckout(order, body);
  };

  const cancelOpening = () => {
    attemptRef.current += 1;
    setPhase("breakdown");
  };

  const openCheckout = (order, body) => {
    // Written before the window opens: if this page never hears back (a UPI
    // app switch, a tab the phone reloaded), the next visit looks for the booking.
    savePendingPayment({
      slug: event.slug,
      orderId: order.orderId,
      phone: body.phone,
      total: order.amount / 100,
      createdAt: Date.now(),
      ...(body.email ? { email: body.email } : {}),
    });
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Ulsaham Entertainments",
      description: event.name,
      order_id: order.orderId,
      prefill: { name: form.name, email: form.email || "", contact: form.phone },
      theme: { color: "#014421" },
      handler: (response) => {
        updatePendingPayment(order.orderId, { paymentId: response.razorpay_payment_id });
        confirmPayment({ ...response, ...body });
      },
      modal: {
        // Closed without a word from Razorpay. A UPI payment approved in the
        // app may still have gone through, so its booking is looked for while
        // the summary shows; paying again opens the same order.
        ondismiss: () => {
          setPhase("breakdown");
          const record = readPendingPayment();
          if (isRecoverable(record, event.slug)) startCheck(record, false);
        },
      },
    });
    rzp.open();
  };

  // ── Paying spinner ───────────────────────────────────────────────────────────
  if (phase === "paying") {
    return (
      <div className="reg-form" style={{ minHeight: "160px", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
        <p className="text-light/40 text-sm mt-4">{isFreeEntry ? "Registering…" : "Opening payment gateway…"}</p>
        {!isFreeEntry && (
          <button
            type="button"
            onClick={cancelOpening}
            className="text-light/30 text-xs uppercase tracking-widest hover:text-light/60 transition"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  // Where the look for an earlier payment has got to, above the form or summary.
  const recoveryNote = recovery && (
    <p className="text-light/50 text-xs" role="status">
      {recovery.state === "checking"
        ? "Checking your last payment…"
        : recovery.paymentId
        ? `We could not find a booking for your last payment (Payment ID ${recovery.paymentId}) yet. If you were charged, please contact ${SUPPORT_EMAIL} with that ID before paying again.`
        : "No completed payment found — you can book again."}
    </p>
  );

  // ── Breakdown: fee table before Razorpay ─────────────────────────────────────
  if (phase === "breakdown" && fees) {
    // The server's own figures once it has priced the order differently.
    const bd = quote?.breakdown ?? fees;
    return (
      <div className="reg-form">
        <h3 className="font-serif text-xl text-light mb-1">Order Summary</h3>
        <p className="text-light/40 text-sm mb-5">{event.name}</p>

        {recoveryNote}
        {globalError && <div className="reg-error">{globalError}</div>}
        {quote && (
          <div className="reg-error" style={priceNotice}>
            The price changed to ₹{(quote.amount / 100).toFixed(2)}. Please review.
          </div>
        )}

        <div className="fee-breakdown">
          <div className="fee-breakdown__row">
            <span>
              {/* The page's unit price may be the old one until the event reloads. */}
              {quote ? (
                <>{count} participant{count !== 1 ? "s" : ""}</>
              ) : isCompetitionEvent && count > 1 ? (
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

      {recoveryNote}
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
            <input type="number" value={form.numberOfParticipants} onChange={set("numberOfParticipants")} min={minMembers} max={isComplimentary && appliedCode.remainingUses != null ? appliedCode.remainingUses : MAX_PARTICIPANTS} step={1} required />
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
