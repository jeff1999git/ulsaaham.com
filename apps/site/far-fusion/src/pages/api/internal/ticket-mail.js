import { jsonErr, jsonOk } from "../../../lib/http.js";
import { isMailConfigured, sendMail, EMAIL_RE } from "../../../lib/mailer.js";
import { adminSignatureProblem, fetchTicketByCode, hasProxySecret } from "../../../lib/backend.js";
import { buildTicketMail, sentKey, DEDUPE_MS, TICKET_CODE_RE } from "../../../lib/ticket-mail.js";
import { getClientIp, rateLimit, releaseLimit } from "../../../lib/rate-limit.js";

// The admin panel asks for a ticket email here when it completes a booking with
// no browser waiting for the answer: the Razorpay webhook created the booking,
// or turned an unpaid ticket into a paid one. Server to server, so there is no
// Origin to check. Instead the request carries x-ulsaham-timestamp and
// x-ulsaham-signature, an HMAC of the timestamp and the exact body under
// PROXY_SHARED_SECRET (see adminSignatureProblem in src/lib/backend.js).
//
// Body: {"ticketCode": "UE-…"} plus, optionally, "email". The booking itself
// is read back from the admin panel and the mail is built from that, exactly as
// /api/send-ticket does. The address is the signed "email", or the booking's
// own when the admin panel's lookup includes one.

export async function POST(context) {
  const { request } = context;
  if (!hasProxySecret()) return jsonErr(503, "Ticket mail is not configured.");

  let raw;
  try {
    raw = Buffer.from(await request.arrayBuffer());
  } catch {
    return jsonErr(400, "Invalid request body.");
  }

  const problem = adminSignatureProblem({
    timestamp: request.headers.get("x-ulsaham-timestamp"),
    signature: request.headers.get("x-ulsaham-signature"),
    body: raw,
  });
  if (problem) {
    // Names the check that failed (a wrong secret, a skewed clock) and nothing
    // the caller sent.
    console.warn("[ticket-mail] refused:", problem);
    return jsonErr(401, "Unauthorized.");
  }

  if (!isMailConfigured()) return jsonErr(503, "Email is not configured.");

  let body;
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    return jsonErr(400, "Invalid request body.");
  }

  const ticketCode = typeof body?.ticketCode === "string" ? body.ticketCode.trim().toUpperCase() : "";
  if (!TICKET_CODE_RE.test(ticketCode)) return jsonErr(400, "Valid ticket code is required.");

  const given = body.email ?? "";
  const signedEmail = typeof given === "string" ? given.trim() : null;
  if (signedEmail === null || (signedEmail && !isEmail(signedEmail))) return jsonErr(400, "Valid email is required.");

  const lookup = await fetchTicketByCode(ticketCode, getClientIp(context));
  if (lookup.status === 404) return jsonErr(404, "We could not find that ticket.");
  if (lookup.status === 429) return jsonErr(429, "Too many requests. Please try again in a moment.");
  if (!lookup.ok || !lookup.data) return jsonErr(502, "Could not confirm the ticket right now.");

  const ticket = lookup.data;
  // Only a paid booking is mailed as a ticket. Unlike /api/send-ticket, an
  // answer that does not say is refused too: only an admin panel that reports
  // amountPaid ever calls this route.
  if (ticket.amountPaid !== true) return jsonErr(409, "This booking is awaiting payment.");

  const bookingEmail = typeof ticket.email === "string" ? ticket.email.trim() : "";
  const to = signedEmail || (isEmail(bookingEmail) ? bookingEmail : "");
  if (!to) return jsonErr(422, "This booking has no email address.", { code: "NO_EMAIL" });

  // A replayed request, or a visitor's own send a moment earlier, is not mailed
  // again; the ticket is already on its way.
  const dedupeKey = sentKey(ticketCode, to);
  if (!rateLimit(dedupeKey, { limit: 1, windowMs: DEDUPE_MS }).allowed) return jsonOk({ duplicate: true });

  const mail = await buildTicketMail(ticket);
  try {
    await sendMail({ to, ...mail }, "ticket");
  } catch (err) {
    console.error("[ticket-mail] mail error:", err?.message);
    releaseLimit(dedupeKey);
    return jsonErr(500, "Failed to send the ticket email.");
  }

  return jsonOk();
}

const isEmail = (value) => value.length <= 254 && EMAIL_RE.test(value);
