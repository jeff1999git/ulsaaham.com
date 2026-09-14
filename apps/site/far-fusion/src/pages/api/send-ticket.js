import { createRequire } from "module";
import { jsonErr, jsonOk, isSameOrigin } from "../../lib/http.js";
import { escapeHtml, isMailConfigured, renderDetailRows, renderEmailShell, sendMail, SITE_URL } from "../../lib/mailer.js";
import { fetchTicketByCode } from "../../lib/backend.js";
import { getClientIp, rateLimit, releaseLimit, HOUR_MS } from "../../lib/rate-limit.js";

const _require = createRequire(import.meta.url);
const QRCode = _require("qrcode");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TICKET_CODE_RE = /^[A-Z0-9][A-Z0-9-]{3,39}$/;
const PAYMENT_ID_RE = /^[A-Za-z0-9_]{1,40}$/;

// One visitor emailing their own bookings, a single booking being emailed to a
// few addresses, and an immediate repeat of the same send are three different
// things, so each gets its own ceiling. The last one also absorbs a replayed
// payment verification, which would otherwise mail the ticket twice.
const SENDS_PER_IP_PER_HOUR = 12;
const SENDS_PER_TICKET_PER_HOUR = 6;
const DEDUPE_MS = 60 * 1000;

function formatEventDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    // Pinned to India Standard Time: the server runs in UTC, and an event day
    // stored as UTC midnight would otherwise be liable to read as the day
    // before. The clock time is not shown because the stored value is the
    // calendar day, not the start time.
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(date);
  } catch {
    return date.toDateString();
  }
}

function renderCardBox(ticket, isEntryCard, hasQr) {
  const box = (inner) =>
    `<div style="background:rgba(155,202,59,.08);border:1px solid rgba(155,202,59,.3);border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center">${inner}</div>`;

  if (isEntryCard) {
    return box(`
        <p style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(155,202,59,.7);margin:0 0 6px">Chest No</p>
        <p style="font-size:52px;font-weight:700;color:#9bca3b;margin:0;line-height:1.1">${escapeHtml(ticket.competitionNumber)}</p>
        <p style="font-size:11px;color:rgba(255,255,255,.3);margin:10px 0 0">Show this participation card at the venue</p>`);
  }

  return box(`
        ${hasQr ? `<img src="cid:ticket-qr" width="160" height="160" alt="QR code" style="display:block;margin:0 auto 16px;border-radius:8px" />` : ""}
        <p style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:rgba(155,202,59,.7);margin:0 0 6px">Ticket Code</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:.2em;color:#9bca3b;margin:0;font-family:monospace">${escapeHtml(ticket.ticketCode)}</p>
        <p style="font-size:11px;color:rgba(255,255,255,.3);margin:10px 0 0">${hasQr ? "Scan the QR code or show the ticket code at the venue" : "Show this ticket code at the venue"}</p>`);
}

export async function POST(context) {
  const { request } = context;

  // Only this site's own pages may send mail from the company's address.
  if (!isSameOrigin(request)) return jsonErr(403, "Request blocked.");
  if (!isMailConfigured()) return jsonErr(503, "Email is not available right now. Please download your ticket instead.");

  let body;
  try { body = await request.json(); } catch { return jsonErr(400, "Invalid request body."); }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const ticketCode = typeof body?.ticketCode === "string" ? body.ticketCode.trim().toUpperCase() : "";
  const paymentId =
    typeof body?.paymentId === "string" && PAYMENT_ID_RE.test(body.paymentId) ? body.paymentId : null;

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return jsonErr(400, "Valid email is required.");
  if (!TICKET_CODE_RE.test(ticketCode)) return jsonErr(400, "Valid ticket code is required.");

  const ip = getClientIp(context);
  const ipKey = `ticket-mail:ip:${ip || "unknown"}`;
  const ticketKey = `ticket-mail:code:${ticketCode}`;
  const dedupeKey = `ticket-mail:sent:${ticketCode}:${email.toLowerCase()}`;

  const ipLimit = rateLimit(ipKey, { limit: SENDS_PER_IP_PER_HOUR, windowMs: HOUR_MS });
  if (!ipLimit.allowed)
    return jsonErr(429, "Too many ticket emails from this device. Please try again later.", {
      retryAfter: ipLimit.retryAfter,
    });

  const ticketLimit = rateLimit(ticketKey, { limit: SENDS_PER_TICKET_PER_HOUR, windowMs: HOUR_MS });
  if (!ticketLimit.allowed) {
    releaseLimit(ipKey);
    return jsonErr(429, "This ticket has already been emailed several times. Please try again later.", {
      retryAfter: ticketLimit.retryAfter,
    });
  }

  // The mail is built from the booking the backend holds, never from the
  // request body, so the endpoint cannot be used to send made-up tickets or to
  // slip markup into the message.
  const lookup = await fetchTicketByCode(ticketCode, ip);
  if (lookup.status === 404) {
    releaseLimit(ipKey);
    releaseLimit(ticketKey);
    return jsonErr(404, "We could not find that ticket.");
  }
  if (lookup.status === 429) {
    releaseLimit(ipKey);
    releaseLimit(ticketKey);
    return jsonErr(429, "Too many requests. Please try again in a moment.");
  }
  if (!lookup.ok || !lookup.data) {
    releaseLimit(ipKey);
    releaseLimit(ticketKey);
    return jsonErr(502, "Could not confirm your ticket right now. Please try again.");
  }

  const ticket = lookup.data;
  const dedupe = rateLimit(dedupeKey, { limit: 1, windowMs: DEDUPE_MS });
  if (!dedupe.allowed) {
    releaseLimit(ipKey);
    releaseLimit(ticketKey);
    return jsonErr(429, "That ticket was just emailed. Please check your inbox, including spam.", {
      retryAfter: dedupe.retryAfter,
    });
  }

  const isEntryCard = ticket.competitionNumber !== null && ticket.competitionNumber !== undefined;

  let qrBuffer = null;
  if (!isEntryCard) {
    try {
      qrBuffer = await QRCode.toBuffer(ticket.ticketCode, {
        width: 220,
        margin: 2,
        color: { dark: "#9bca3b", light: "#023301" },
      });
    } catch (err) {
      // The code in the body is enough to get in; send the mail without the image.
      console.error("[send-ticket] qr error:", err?.message);
    }
  }

  const eventDate = formatEventDate(ticket.eventDate);
  const rows = [
    ["Name", ticket.participantName],
    ["Event", ticket.eventName],
    eventDate ? ["Date", eventDate] : null,
    ticket.eventVenue ? ["Venue", ticket.eventVenue] : null,
    ticket.numberOfParticipants ? [isEntryCard ? "Members" : "Participants", ticket.numberOfParticipants] : null,
    isEntryCard ? ["Reference Code", ticket.ticketCode] : null,
    paymentId ? ["Payment ID", paymentId] : null,
  ];

  const html = renderEmailShell({
    title: isEntryCard ? "You're registered!" : "You're booked!",
    subtitle: ticket.eventName,
    bodyHtml: `${renderCardBox(ticket, isEntryCard, Boolean(qrBuffer))}${renderDetailRows(rows)}`,
    footerHtml: `Screenshot or save this email — ${
      isEntryCard ? "show your chest number at the venue" : "bring your QR code to the venue"
    }. You can also view your bookings in your <a href="${escapeHtml(SITE_URL)}/account" style="color:#9bca3b">Ulsaham account</a>.`,
  });

  const textLines = [
    `Hi ${ticket.participantName},`,
    "",
    isEntryCard
      ? `Your chest number is: ${ticket.competitionNumber}\nReference code: ${ticket.ticketCode}`
      : `Your ticket code is: ${ticket.ticketCode}`,
    "",
    `Event: ${ticket.eventName}`,
    eventDate ? `Date: ${eventDate}` : null,
    ticket.eventVenue ? `Venue: ${ticket.eventVenue}` : null,
    ticket.numberOfParticipants ? `${isEntryCard ? "Members" : "Participants"}: ${ticket.numberOfParticipants}` : null,
    paymentId ? `Payment ID: ${paymentId}` : null,
    "",
    isEntryCard ? "Show your chest number at the venue." : "Show this code at the venue for entry.",
    "",
    "Ulsaham Entertainments",
  ].filter((line) => line !== null);

  try {
    await sendMail({
      to: email,
      subject: isEntryCard
        ? `Your participation card for ${ticket.eventName} — Chest No ${ticket.competitionNumber}`
        : `Your ticket for ${ticket.eventName} — ${ticket.ticketCode}`,
      text: textLines.join("\n"),
      html,
      attachments: qrBuffer ? [{ filename: "ticket-qr.png", content: qrBuffer, cid: "ticket-qr" }] : [],
    });
  } catch (err) {
    console.error("[send-ticket] mail error:", err?.message);
    // Nothing was delivered, so let the visitor try again straight away.
    releaseLimit(dedupeKey);
    return jsonErr(500, "Failed to send the ticket email. Please try again.");
  }

  return jsonOk();
}
