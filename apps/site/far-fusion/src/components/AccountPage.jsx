import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "react-qr-code";
import { getUser, setUser, clearUser, addTicket } from "../lib/auth.js";
import { fetchMyTickets, getTicketCodesByIdentifier, createPaymentOrder, verifyPayment, sendTicketEmail } from "../lib/api.js";
import { generateTicketCanvas, downloadCanvasAsPng } from "../lib/generate-ticket.js";
import { downloadParticipationCardPdf, warmParticipationCardPdf } from "../lib/participation-card-pdf.js";
import { optimizeCloudinary } from "../lib/image.js";
import { hasEventEnded } from "../lib/event-time.js";
import { formatDateShort, formatDateMedium } from "../lib/format-date.js";
import { calcFees } from "../lib/fees.js";
import { loadRazorpay } from "../lib/razorpay.js";
import { orderKey, keepOrder, reusableOrder, verifyWithRetry, verifyFailureMessage } from "../lib/payment-flow.js";
import VerifyFailed from "./VerifyFailed.jsx";

const priceNotice = { background: "rgba(234,179,8,0.12)", borderColor: "rgba(234,179,8,0.45)", color: "#fde68a", marginTop: 12 };

// My Bookings: the backend reads at most this many ticket codes per request.
const MAX_CODES = 20;
// A pending payment is checked this often, for this long; a tab left open
// in the background should not poll for ever.
const POLL_EVERY_MS = 30_000;
const POLL_FOR_MS = 10 * 60_000;
// Coming back to the tab reloads the bookings unless they are this fresh.
const RELOAD_AFTER_MS = 30_000;

const isCancelled = (ticket) => ticket.event?.status === "CANCELLED";

// An unpaid booking that can still be paid (one for a cancelled event cannot).
const awaitingPayment = (ticket) => !ticket.amountPaid && !isCancelled(ticket);

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ ticket }) {
  const base = { padding: "2px 9px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", display: "inline-block" };
  const entered = ticket.enteredCount || 0;
  const total = ticket.numberOfParticipants || 0;
  if (isCancelled(ticket))
    return <span style={{ ...base, background: "#7f1d1d", color: "#fecaca" }}>Cancelled</span>;
  if (!ticket.amountPaid)
    return <span style={{ ...base, background: "#78350f", color: "#fde68a" }}>Payment Required</span>;
  if (ticket.attended)
    return <span style={{ ...base, background: "#064e3b", color: "#6ee7b7" }}>Attended ✓</span>;
  // Part of a group is in; the rest can still enter on the same ticket.
  if (entered > 0 && entered < total)
    return <span style={{ ...base, background: "#064e3b", color: "#6ee7b7" }}>{entered} of {total} entered</span>;
  // Only once the event is over: event.date alone is midnight UTC, 05:30 IST
  // on the day itself. Without an end time this falls back to 23:59 IST.
  if (ticket.event?.date && hasEventEnded(ticket.event))
    return <span style={{ ...base, background: "#1f2937", color: "#9ca3af" }}>Not Attended</span>;
  return <span style={{ ...base, background: "#064e3b", color: "#6ee7b7" }}>Confirmed</span>;
}

// ── Re-payment modal ──────────────────────────────────────────────────────────

// Priced from the event My Bookings already loaded with the ticket, so it opens
// at once. The server charges its own current price; when that differs, its
// figures are shown before anything is paid. A payment whose confirmation
// failed is held by AccountPage (`issue`), so closing this panel keeps it.
function RepayPanel({ ticket, user, issue, onPaid, onFailed, onRetryIssue, onClose }) {
  const ev = ticket.event;
  const count = ticket.numberOfParticipants;
  // No price means nothing to pay here: a free event's unpaid booking waits on the organiser.
  const fees = ev.isFree ? null : calcFees(ev, count);
  const [phase, setPhase] = useState("breakdown"); // "breakdown" | "paying" | "verifying"
  const [error, setError] = useState(null);
  // The server's order, when its total differs from the one shown.
  const [quote, setQuote] = useState(null);
  // { key, order, at }: reused by the next Pay for the same ticket (payment-flow.js).
  const orderRef = useRef(null);
  // Bumped by every Pay and when the panel closes; an older attempt's answer is ignored.
  const attemptRef = useRef(0);

  // checkout.js downloads while the price is on screen.
  useEffect(() => {
    const attempts = attemptRef;
    if (fees) loadRazorpay();
    return () => {
      attempts.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async () => {
    const attempt = ++attemptRef.current;
    setError(null);
    setPhase("paying");

    // ticketCode tells the backend this payment settles THIS unpaid ticket
    // (rather than creating a new booking). The server uses the ticket's own
    // quantity for the amount.
    const body = {
      name: user.name,
      phone: user.phone,
      age: user.age,
      numberOfParticipants: ticket.numberOfParticipants,
      ticketCode: ticket.ticketCode,
      ...(user.email ? { email: user.email } : {}),
    };
    const key = orderKey(ev.slug, body);
    const saved = reusableOrder(orderRef.current, key);
    const [loaded, res] = await Promise.all([
      loadRazorpay(),
      saved ? { ok: true, data: { data: saved } } : createPaymentOrder(ev.slug, body),
    ]);
    if (res.ok && !saved) orderRef.current = keepOrder(key, res.data.data);
    if (attempt !== attemptRef.current) return;
    if (!res.ok) { setError(res.data?.error || "Could not initiate payment."); setPhase("breakdown"); return; }
    if (!loaded) { setError("Could not load the payment gateway. Please check your connection and try again."); setPhase("breakdown"); return; }

    const ord = res.data.data;
    if (ord.amount !== (quote ? quote.amount : fees.totalPaise)) {
      setQuote(ord);
      setPhase("breakdown");
      return;
    }
    const rzp = new window.Razorpay({
      key: ord.keyId,
      amount: ord.amount,
      currency: ord.currency,
      name: "Ulsaham Entertainments",
      description: ev.name,
      order_id: ord.orderId,
      prefill: { name: user.name, email: user.email || "", contact: user.phone },
      theme: { color: "#014421" },
      handler: async (response) => {
        setPhase("verifying");
        // Safe to repeat, so a lost answer or a server error is asked again.
        const vBody = { ...response, ...body };
        const result = await verifyWithRetry(() => verifyPayment(ev.slug, vBody));
        if (result.ok) {
          onPaid(ticket.ticketCode, result.data.data);
          return;
        }
        onFailed({
          ticketCode: ticket.ticketCode,
          slug: ev.slug,
          vBody,
          paymentId: response.razorpay_payment_id,
          message: verifyFailureMessage(result),
        });
        setPhase("breakdown");
      },
      modal: { ondismiss: () => setPhase("breakdown") },
    });
    rzp.open();
  };

  const verifying = phase === "verifying";
  const bd = quote?.breakdown ?? fees;
  const price = fees?.effectiveAmount;
  const extraPrice = ev.groupExtraAmount ?? price;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#011a01", border: "1px solid rgba(155,202,59,0.2)", borderRadius: 12, padding: "28px 24px", maxWidth: 420, width: "100%" }}>
        {/* Not while a payment is being confirmed: its outcome belongs on screen. */}
        <button
          onClick={onClose}
          disabled={verifying}
          aria-label="Close"
          style={{ float: "right", background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: verifying ? "not-allowed" : "pointer", opacity: verifying ? 0.4 : 1, fontSize: 20, lineHeight: 1 }}
        >
          ✕
        </button>
        <h3 className="font-serif text-xl text-light mb-1">Complete Payment</h3>

        {issue ? (
          <div style={{ marginTop: 12 }}>
            <VerifyFailed message={issue.message} paymentId={issue.paymentId} onRetry={onRetryIssue} retrying={!!issue.retrying} accountLink={false} />
          </div>
        ) : !fees ? (
          <p className="text-light/50 text-sm mt-4">
            Awaiting the organiser. There is nothing to pay for this booking; it shows as confirmed once the organiser approves it.
          </p>
        ) : phase === "breakdown" ? (
          <>
            {error && <div className="reg-error" style={{ marginTop: 12 }}>{error}</div>}
            {quote && (
              <div className="reg-error" style={priceNotice}>
                The price changed to ₹{(quote.amount / 100).toFixed(2)}. Please review.
              </div>
            )}
            <p className="text-light/40 text-sm mb-4">{ev.name}</p>
            <div className="fee-breakdown">
              <div className="fee-breakdown__row">
                <span>
                  {quote
                    ? `${count} participant${count !== 1 ? "s" : ""}`
                    : ev.isCompetition && count > 1
                    ? `₹${price} + ${count - 1} × ₹${extraPrice} (group entry)`
                    : ev.isCompetition
                    ? `₹${price} (individual entry)`
                    : `₹${price} × ${count} person${count !== 1 ? "s" : ""}`}
                </span>
                <span>₹{bd.base.toFixed(2)}</span>
              </div>
              {bd.gst > 0 && <div className="fee-breakdown__row"><span>GST (18%)</span><span>₹{bd.gst.toFixed(2)}</span></div>}
              {bd.platformFee > 0 && <div className="fee-breakdown__row"><span>Platform fee (2%)</span><span>₹{bd.platformFee.toFixed(2)}</span></div>}
              <div className="fee-breakdown__divider" />
              <div className="fee-breakdown__total"><span>Total</span><span>₹{bd.total.toFixed(2)}</span></div>
            </div>
            <button onClick={handlePay} className="reg-submit">Pay ₹{bd.total.toFixed(2)} & Book →</button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
            <p className="text-light/40 text-sm mt-4">{verifying ? "Confirming payment…" : "Opening payment gateway…"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ticket card ───────────────────────────────────────────────────────────────

function TicketCard({ ticket, onRepay, userEmail }) {
  const qrRef = useRef(null);
  const [dlLoading, setDlLoading] = useState(false);
  // null | { state: "sending" | "sent" | "failed", message? }
  const [mail, setMail] = useState(null);

  // Covers every booking the automatic send missed — a payment finished by the
  // Razorpay webhook after the browser closed, a send that failed at the time,
  // or a ticket the visitor simply wants again.
  const handleEmailTicket = async () => {
    if (!userEmail || mail?.state === "sending") return;
    setMail({ state: "sending" });
    const { ok, data } = await sendTicketEmail({ ticketCode: ticket.ticketCode, email: userEmail });
    setMail(ok ? { state: "sent" } : { state: "failed", message: data?.error });
  };

  const name = ticket.event?.name;
  const date = formatDateMedium(ticket.event?.date);
  const venue = ticket.event?.venue;
  const banner = ticket.event?.bannerImageUrl;
  const isEntryCard = ticket.competitionNumber != null;
  const instructions = ticket.event?.competitionInstructions || null;
  const notes = ticket.event?.competitionNotes || null;
  const canDownloadCard = isEntryCard && !!ticket.amountPaid;

  useEffect(() => {
    if (canDownloadCard) warmParticipationCardPdf();
  }, [canDownloadCard]);

  const handleDownloadTicket = async () => {
    setDlLoading(true);
    try {
      if (isEntryCard) {
        // Competition participation card: plain details PDF, no ticket art / QR
        await downloadParticipationCardPdf(
          {
            chestNumber: ticket.competitionNumber,
            participantName: ticket.participantName,
            eventName: name,
            eventDate: date,
            eventVenue: venue,
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
      const eventDate = formatDateShort(ticket.event?.date);
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
          alt={name}
          loading="lazy"
          decoding="async"
          width="480"
          height="600"
          style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", display: "block" }}
        />
      )}
      <div className="my-ticket__info">
        <div style={{ marginBottom: 6 }}><StatusBadge ticket={ticket} /></div>
        <p className="text-light font-semibold text-sm leading-snug mt-1">{name}</p>
        <p className="text-light/50 text-xs mt-1">{date}{venue ? ` · ${venue}` : ""}</p>
        <p className="text-light/40 text-xs mt-1">
          {ticket.participantName} · {ticket.numberOfParticipants} participant{ticket.numberOfParticipants !== 1 ? "s" : ""}
        </p>
      </div>

      {ticket.amountPaid ? (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {isEntryCard ? (
            <div style={{ background: "#fff", borderRadius: 8, padding: "12px 24px", width: "fit-content", margin: "0 auto 8px", textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#666", margin: 0 }}>CHEST NO</p>
              <p style={{ fontSize: 44, fontWeight: 700, color: "#014421", margin: 0, lineHeight: 1.15 }}>{ticket.competitionNumber}</p>
            </div>
          ) : (
            <div ref={qrRef} style={{ background: "#fff", padding: 8, display: "block", width: "fit-content", margin: "0 auto 8px", borderRadius: 6 }}>
              <QRCode value={ticket.ticketCode} size={130} />
            </div>
          )}
          <p style={{ fontFamily: "monospace", fontSize: "0.8rem", textAlign: "center", letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
            {ticket.ticketCode}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleDownloadTicket} disabled={dlLoading} className="account-btn" style={{ fontSize: 11, padding: "5px 12px" }}>
              {dlLoading ? "Generating…" : isEntryCard ? "Download Participation Card (PDF)" : "Download Ticket"}
            </button>
            {userEmail && (
              <button
                onClick={handleEmailTicket}
                disabled={mail?.state === "sending"}
                className="account-btn"
                style={{ fontSize: 11, padding: "5px 12px" }}
              >
                {mail?.state === "sending" ? "Sending…" : "Email Ticket"}
              </button>
            )}
          </div>
          {mail && mail.state !== "sending" && (
            <p
              style={{
                fontSize: 10,
                textAlign: "center",
                margin: "8px 0 0",
                color: mail.state === "sent" ? "rgba(255,255,255,0.4)" : "#fca5a5",
              }}
            >
              {mail.state === "sent" ? `Sent to ${userEmail}` : mail.message || "Could not send the email."}
            </p>
          )}
          {isEntryCard && (instructions?.trim() || notes?.trim()) && (
            <p style={{ fontSize: 10, textAlign: "center", color: "rgba(255,255,255,0.35)", margin: "8px 0 0" }}>
              Includes the competition instructions — read them before the event.
            </p>
          )}
        </div>
      ) : isCancelled(ticket) ? (
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-light/40 text-xs text-center">This event has been cancelled.</p>
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
  // A repayment Razorpay took whose confirmation failed, kept here so that
  // closing the panel does not lose the Payment ID:
  // { ticketCode, slug, vBody, paymentId, message, retrying? }
  const [payIssue, setPayIssue] = useState(null);
  // The ticket email after a repayment: null | { state: "sending" | "sent" | "failed" | "skipped", email?, error? }
  const [repayMail, setRepayMail] = useState(null);
  const [polling, setPolling] = useState(false);

  const userRef = useRef(null);
  const autoRefreshRef = useRef(null);
  const inFlightRef = useRef(false);
  const reloadRef = useRef(false);
  const lastLoadAtRef = useRef(0);

  const stopPolling = useCallback(() => {
    clearInterval(autoRefreshRef.current);
    autoRefreshRef.current = null;
    setPolling(false);
  }, []);

  const saveTickets = useCallback((tickets) => {
    const next = { ...userRef.current, tickets };
    try { setUser(next); } catch { /* storage full or blocked: kept for this visit only */ }
    userRef.current = next;
    setUserState(next);
  }, []);

  const loadTickets = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    // One load at a time. A load asked for meanwhile (Refresh, a payment just
    // settled) runs as soon as this one ends, so it still sees the latest state.
    if (inFlightRef.current) { reloadRef.current = true; return; }
    inFlightRef.current = true;
    lastLoadAtRef.current = Date.now();

    try {
      let stored = u.tickets || [];
      const storedCodes = stored.map((t) => t.ticketCode).slice(0, MAX_CODES);

      // Merge in every booking the backend knows for this phone/email, so tickets
      // booked on another device (or before localStorage was cleared) show up too.
      // That lookup and the details of the bookings stored here are requested
      // together rather than one after the other.
      const identifier = u.phone || u.email;
      const [lookup, first] = await Promise.all([
        identifier ? getTicketCodesByIdentifier(identifier) : null,
        storedCodes.length > 0 ? fetchMyTickets(storedCodes) : null,
      ]);
      const remoteCodes = lookup?.ok ? lookup.data?.data?.ticketCodes || [] : [];
      const known = new Set(stored.map((t) => t.ticketCode));
      const missing = remoteCodes.filter((code) => !known.has(code)).map((code) => ({ ticketCode: code }));
      if (missing.length > 0) {
        stored = [...stored, ...missing];
        saveTickets(stored);
      }

      if (stored.length === 0) {
        setLiveTickets([]);
        setTicketsError(null);
        setTicketsLoading(false);
        stopPolling();
        return;
      }

      // A second request, for the whole set, only when the lookup added codes
      // that fit under the cap; the order and the cap stay as they were.
      const codes = stored.map((t) => t.ticketCode).slice(0, MAX_CODES);
      const unchanged = first && codes.length === storedCodes.length && codes.every((c, i) => c === storedCodes[i]);
      const { ok, data } = unchanged ? first : await fetchMyTickets(codes);
      setTicketsLoading(false);

      if (!ok) { setTicketsError("Could not load booking details. Tap to retry."); return; }
      const fetched = data.data?.tickets || [];
      setLiveTickets(fetched);
      setTicketsError(null);

      // Bookings are deleted 14 days after their event. A code this request
      // asked about that did not come back is gone for good, so it goes from
      // here too. Codes beyond the cap were not asked about and stay.
      const sent = new Set(codes);
      const live = new Set(fetched.map((t) => t.ticketCode));
      const kept = stored.filter((t) => !sent.has(t.ticketCode) || live.has(t.ticketCode));
      if (kept.length < stored.length) saveTickets(kept);

      // While a payment is pending, check again every 30 s, skipping ticks
      // while the tab is hidden, and give up after 10 minutes. Once it has
      // stopped, the next load that still finds one pending (coming back to
      // the tab, Refresh) starts it again.
      if (!fetched.some(awaitingPayment)) {
        stopPolling();
      } else if (!autoRefreshRef.current) {
        const until = Date.now() + POLL_FOR_MS;
        autoRefreshRef.current = setInterval(() => {
          if (Date.now() > until) stopPolling();
          else if (!document.hidden) loadTickets();
        }, POLL_EVERY_MS);
        setPolling(true);
      }
    } catch {
      setTicketsLoading(false);
      setTicketsError("Could not load booking details. Tap to retry.");
    } finally {
      inFlightRef.current = false;
      if (reloadRef.current) {
        reloadRef.current = false;
        loadTickets();
      }
    }
  }, [saveTickets, stopPolling]);

  useEffect(() => {
    const u = getUser();
    if (!u) { window.location.replace("/login?next=/account"); return; }
    userRef.current = u;
    setUserState(u);
    setForm({ name: u.name, email: u.email || "", age: String(u.age || "") });
    loadTickets();

    // Coming back to the tab shows fresh bookings, unless they were only just loaded.
    const onVisible = () => {
      if (document.hidden || inFlightRef.current) return;
      if (Date.now() - lastLoadAtRef.current < RELOAD_AFTER_MS) return;
      loadTickets();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
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

  // A repayment is confirmed: the card turns paid at once, the bookings reload
  // behind it, and the ticket is emailed, with the outcome shown above them.
  const handleRepaid = (ticketCode, ticketData) => {
    // Only this ticket's failed confirmation is settled; another ticket's
    // stays on screen with its Payment ID.
    setPayIssue((issue) => (issue?.ticketCode === ticketCode ? null : issue));
    setRepayTarget(null);
    addTicket({ ...ticketData, registeredAt: new Date().toISOString() });
    setLiveTickets((tickets) => tickets.map((t) => (t.ticketCode === ticketCode ? { ...t, amountPaid: true } : t)));
    loadTickets();
    const email = userRef.current?.email;
    if (!email) { setRepayMail({ state: "skipped" }); return; }
    setRepayMail({ state: "sending", email });
    sendTicketEmail({ ticketCode, email }).then(({ ok, data }) =>
      setRepayMail(ok ? { state: "sent", email } : { state: "failed", email, error: data?.error })
    );
  };

  // Asks for the failed confirmation again; it is safe to repeat.
  const retryPayIssue = async () => {
    const issue = payIssue;
    if (!issue || issue.retrying) return;
    setPayIssue({ ...issue, retrying: true });
    const result = await verifyWithRetry(() => verifyPayment(issue.slug, issue.vBody));
    if (result.ok) { handleRepaid(issue.ticketCode, result.data.data); return; }
    setPayIssue({ ...issue, retrying: false, message: verifyFailureMessage(result) });
  };

  const storedCount = (user.tickets || []).length;

  return (
    <>
      {repayTarget && (
        <RepayPanel
          ticket={repayTarget}
          user={user}
          issue={payIssue?.ticketCode === repayTarget.ticketCode ? payIssue : null}
          onPaid={handleRepaid}
          onFailed={setPayIssue}
          onRetryIssue={retryPayIssue}
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

        {/* ── My Bookings ── */}
        <div className="account-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 className="text-base font-semibold uppercase tracking-[0.15em] text-accent">My Bookings</h3>
            {!ticketsLoading && (
              <button onClick={loadTickets} className="text-light/30 text-xs uppercase tracking-widest hover:text-light/60 transition">
                ↻ Refresh
              </button>
            )}
          </div>

          {/* A failed confirmation stays here after its panel is closed. */}
          {payIssue && !repayTarget && (
            <div className="reg-form" style={{ marginBottom: "1.5rem" }}>
              <VerifyFailed
                message={payIssue.message}
                paymentId={payIssue.paymentId}
                onRetry={retryPayIssue}
                retrying={!!payIssue.retrying}
                accountLink={false}
              />
            </div>
          )}

          {repayMail && (
            <p className="text-xs mb-4" role="status" style={{ color: repayMail.state === "failed" ? "#fca5a5" : "rgba(255,255,255,0.5)" }}>
              Payment confirmed.{" "}
              {repayMail.state === "sending"
                ? "Emailing your ticket…"
                : repayMail.state === "sent"
                ? `Ticket emailed to ${repayMail.email}.`
                : repayMail.state === "failed"
                ? `${repayMail.error || "We couldn't email your ticket."} Use Email Ticket on the booking to try again.`
                : "Add an email to your profile to have tickets mailed to you."}
            </p>
          )}

          {ticketsLoading && <div className="spinner" style={{ margin: "32px auto" }} />}

          {ticketsError && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p className="text-light/40 text-sm mb-3">{ticketsError}</p>
              <button onClick={loadTickets} className="account-btn">Retry</button>
            </div>
          )}

          {!ticketsLoading && !ticketsError && storedCount === 0 && (
            <div className="text-center py-16">
              <p className="text-light/30 text-sm">No bookings yet.</p>
              <a href="/events" className="text-accent text-xs font-semibold uppercase tracking-widest mt-3 inline-block hover:underline">
                Browse Events →
              </a>
            </div>
          )}

          {!ticketsLoading && !ticketsError && liveTickets.length > 0 && (
            <>
              {polling && (
                <p className="text-light/40 text-xs mb-4">
                  Auto-refreshing every 30 s for pending payments.
                </p>
              )}
              <div className="my-tickets-grid">
                {liveTickets.map((t) => (
                  <TicketCard key={t.ticketCode} ticket={t} onRepay={setRepayTarget} userEmail={user?.email} />
                ))}
              </div>
            </>
          )}

          {!ticketsLoading && !ticketsError && storedCount > 0 && liveTickets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-light/30 text-sm">Could not load live booking details.</p>
              <button onClick={loadTickets} className="account-btn mt-3">Retry</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
