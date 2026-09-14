import { jsonErr, jsonOk } from "../../../lib/http.js";
import {
  signCookie, verifyCookie, compareOtp, isOtpConfigured,
  COOKIE_NAME, MAX_ATTEMPTS, COOKIE_OPTS,
} from "../../../lib/otp.js";

const OTP_RE = /^\d{6}$/;

export async function POST({ request, cookies }) {
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
    cookies.delete(COOKIE_NAME, { path: "/" });
    return jsonErr(400, "OTP has expired. Please request a new code.");
  }

  const attempts = Number(session.attempts) || 0;
  if (attempts >= MAX_ATTEMPTS) {
    cookies.delete(COOKIE_NAME, { path: "/" });
    return jsonErr(429, "Too many incorrect attempts. Please request a new code.");
  }

  if (!compareOtp(otp, session.hashedOtp)) {
    const newAttempts = attempts + 1;
    const attemptsLeft = MAX_ATTEMPTS - newAttempts;

    if (attemptsLeft <= 0) {
      cookies.delete(COOKIE_NAME, { path: "/" });
      return jsonErr(429, "Too many incorrect attempts. Please request a new code.", { attemptsLeft: 0 });
    }

    const remaining = Math.ceil((session.expiresAt - Date.now()) / 1000);
    cookies.set(COOKIE_NAME, signCookie({ ...session, attempts: newAttempts }), COOKIE_OPTS(remaining));
    return jsonErr(400, "Incorrect code. Please try again.", { attemptsLeft });
  }

  // Verified — clear the OTP cookie and return the stored profile.
  cookies.delete(COOKIE_NAME, { path: "/" });

  // Only fields the session actually carried (undefined is dropped by JSON).
  return jsonOk({
    data: {
      email: session.email,
      name: session.name,
      phone: session.phone,
      age: session.age,
      passwordHash: session.passwordHash,
      tickets: [],
    },
  });
}
