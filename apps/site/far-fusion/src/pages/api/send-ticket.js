import { jsonErr, jsonOk, isSameOrigin } from "../../lib/http.js";
import { isMailConfigured, sendMail, EMAIL_RE } from "../../lib/mailer.js";
import { fetchTicketByCode } from "../../lib/backend.js";
import { buildTicketMail, sentKey, DEDUPE_MS, TICKET_CODE_RE } from "../../lib/ticket-mail.js";
import { getClientIp, rateLimit, releaseLimit, HOUR_MS } from "../../lib/rate-limit.js";

// One visitor emailing their own bookings, a single booking being emailed to a
// few addresses, and an immediate repeat of the same send are three different
// things, so each gets its own ceiling. The last one also absorbs a replayed
// payment verification, which would otherwise mail the ticket twice.
const SENDS_PER_IP_PER_HOUR = 12;
const SENDS_PER_TICKET_PER_HOUR = 6;

export async function POST(context) {
  const { request } = context;

  // Only this site's own pages may send mail from the company's address.
  if (!isSameOrigin(request)) return jsonErr(403, "Request blocked.");
  if (!isMailConfigured()) return jsonErr(503, "Email is not available right now. Please download your ticket instead.");

  let body;
  try { body = await request.json(); } catch { return jsonErr(400, "Invalid request body."); }

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const ticketCode = typeof body?.ticketCode === "string" ? body.ticketCode.trim().toUpperCase() : "";

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return jsonErr(400, "Valid email is required.");
  if (!TICKET_CODE_RE.test(ticketCode)) return jsonErr(400, "Valid ticket code is required.");

  const ip = getClientIp(context);
  const ipKey = `ticket-mail:ip:${ip || "unknown"}`;
  const ticketKey = `ticket-mail:code:${ticketCode}`;
  const dedupeKey = sentKey(ticketCode, email);

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
  // An unpaid booking is not a ticket yet, so it is not mailed as one. An admin
  // panel too old to say whether it is paid leaves the field out, and the mail
  // goes as it always has.
  if (ticket.amountPaid === false) {
    releaseLimit(ipKey);
    releaseLimit(ticketKey);
    return jsonErr(409, "This booking is awaiting payment, so there is no ticket to email yet.");
  }

  const dedupe = rateLimit(dedupeKey, { limit: 1, windowMs: DEDUPE_MS });
  if (!dedupe.allowed) {
    releaseLimit(ipKey);
    releaseLimit(ticketKey);
    return jsonErr(429, "That ticket was just emailed. Please check your inbox, including spam.", {
      retryAfter: dedupe.retryAfter,
    });
  }

  const mail = await buildTicketMail(ticket);
  try {
    await sendMail({ to: email, ...mail }, "ticket");
  } catch (err) {
    console.error("[send-ticket] mail error:", err?.message);
    // Nothing was delivered, so let the visitor try again straight away.
    releaseLimit(dedupeKey);
    return jsonErr(500, "Failed to send the ticket email. Please try again.");
  }

  return jsonOk();
}
