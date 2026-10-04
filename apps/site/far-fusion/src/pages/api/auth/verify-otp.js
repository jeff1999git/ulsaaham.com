import { jsonErr, jsonOk } from "../../../lib/http.js";
import { getClientIp, rateLimit, releaseLimit, HOUR_MS } from "../../../lib/rate-limit.js";
import {
  signCookie, verifyCookie, compareOtp, isOtpConfigured,
  COOKIE_NAME, COOKIE_PATH, MAX_ATTEMPTS, OTP_TTL_MS, COOKIE_OPTS,
} from "../../../lib/otp.js";

const OTP_RE = /^\d{6}$/;

// The attempt counter in the cookie resets whenever a client re-sends the
// cookie it was first given, so these ceilings are kept in the server's own
// memory too. Like every limit in lib/rate-limit.js they are best effort, per
// instance: a guess spread over many cold starts gets further. That is fine
// while a verified code only proves an address to this browser; move them to a
// shared store before a code ever issues a server-side session.
const GUESSES_PER_EMAIL = 10; // per code lifetime
const GUESSES_PER_IP_PER_HOUR = 30;

export async function POST(context) {
  const { request, cookies } = context;

  if (!isOtpConfigured())
    return jsonErr(503, "Sign-in is temporarily unavailable. Please try again later.");

  let body;
  try { body = await request.json(); } catch { return jsonErr(400, "Invalid request body."); }

  // Coerced rather than trusted: a number or an object here used to reach the
  // hashing call and throw an unhandled 500.
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const otp = typeof body?.otp === "string" || typeof body?.otp === "number" ? String(body.otp).trim() : "";

  if (!email || !otp) return jsonErr(400, "Email and OTP code are required.");
  if (!OTP_RE.test(otp)) return jsonErr(400, "Enter the 6-digit code.");

  const session = verifyCookie(cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return jsonErr(400, "Session expired or not found. Please request a new code.");
  }
  if (session.email !== email) {
    return jsonErr(400, "Email does not match the OTP session.");
  }
  if (typeof session.expiresAt !== "number" || Date.now() > session.expiresAt) {
    cookies.delete(COOKIE_NAME, { path: COOKIE_PATH });
    return jsonErr(400, "OTP has expired. Please request a new code.");
  }

  const attempts = Number(session.attempts) || 0;
  if (attempts >= MAX_ATTEMPTS) {
    cookies.delete(COOKIE_NAME, { path: COOKIE_PATH });
    return jsonErr(429, "Too many incorrect attempts. Please request a new code.");
  }

  // Taken before the comparison, so parallel guesses cannot slip past, and
  // handed back below when the code is right: only wrong guesses count.
  const ipKey = `otp:verify-ip:${getClientIp(context) || "unknown"}`;
  const emailKey = `otp:verify:${email}`;

  const ipLimit = rateLimit(ipKey, { limit: GUESSES_PER_IP_PER_HOUR, windowMs: HOUR_MS });
  if (!ipLimit.allowed)
    return jsonErr(429, "Too many incorrect codes from this device. Please try again later.", {
      retryAfter: ipLimit.retryAfter,
    });

  const emailLimit = rateLimit(emailKey, { limit: GUESSES_PER_EMAIL, windowMs: OTP_TTL_MS });
  if (!emailLimit.allowed) {
    releaseLimit(ipKey);
    return jsonErr(429, "Too many incorrect codes for this email. Please wait a few minutes and request a new code.", {
      retryAfter: emailLimit.retryAfter,
    });
  }

  if (!compareOtp(otp, session.hashedOtp)) {
    const newAttempts = attempts + 1;
    const attemptsLeft = MAX_ATTEMPTS - newAttempts;

    if (attemptsLeft <= 0) {
      cookies.delete(COOKIE_NAME, { path: COOKIE_PATH });
      return jsonErr(429, "Too many incorrect attempts. Please request a new code.", { attemptsLeft: 0 });
    }

    const remaining = Math.ceil((session.expiresAt - Date.now()) / 1000);
    cookies.set(COOKIE_NAME, signCookie({ ...session, attempts: newAttempts }), COOKIE_OPTS(remaining));
    return jsonErr(400, "Incorrect code. Please try again.", { attemptsLeft });
  }

  releaseLimit(ipKey);
  releaseLimit(emailKey);

  // Verified — clear the OTP cookie. The code proves the address and nothing
  // more, so the address is all that comes back.
  cookies.delete(COOKIE_NAME, { path: COOKIE_PATH });

  return jsonOk({ data: { email: session.email, tickets: [] } });
}
