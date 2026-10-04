import { createRequire } from "module";
import { escapeHtml, renderDetailRows, renderEmailShell, SITE_URL } from "./mailer.js";

// The ticket email. Two routes send it: /api/send-ticket when a visitor asks,
// and /api/internal/ticket-mail when the admin panel completes a booking with
// no browser present. Both build it here, from the booking as the admin panel
// holds it (participants/check), so a ticket reads the same either way.

const _require = createRequire(import.meta.url);
const QRCode = _require("qrcode");

export const TICKET_CODE_RE = /^[A-Z0-9][A-Z0-9-]{3,39}$/;
const PAYMENT_ID_RE = /^[A-Za-z0-9_]{1,40}$/;

// An immediate repeat of the same send, from either route, is dropped: it also
// absorbs a replayed payment verification, which would otherwise mail the
// ticket twice.
export const DEDUPE_MS = 60 * 1000;
export const sentKey = (ticketCode, email) => `ticket-mail:sent:${ticketCode}:${email.toLowerCase()}`;

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

/**
 * Subject, bodies and attachments for one booking; the caller adds the
 * recipient. Every value, the Payment ID included, comes from the booking the
 * backend holds and never from a request body, so neither route can be used to
 * send made-up tickets or to slip markup into the message.
 */
export async function buildTicketMail(ticket) {
  const isEntryCard = ticket.competitionNumber !== null && ticket.competitionNumber !== undefined;
  const paymentId =
    typeof ticket.paymentId === "string" && PAYMENT_ID_RE.test(ticket.paymentId) ? ticket.paymentId : null;

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
      console.error("[ticket-mail] qr error:", err?.message);
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

  return {
    subject: isEntryCard
      ? `Your participation card for ${ticket.eventName} — Chest No ${ticket.competitionNumber}`
      : `Your ticket for ${ticket.eventName} — ${ticket.ticketCode}`,
    text: textLines.join("\n"),
    html,
    attachments: qrBuffer ? [{ filename: "ticket-qr.png", content: qrBuffer, cid: "ticket-qr" }] : [],
  };
}
