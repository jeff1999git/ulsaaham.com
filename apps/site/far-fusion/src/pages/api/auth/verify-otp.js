import {
  signCookie, verifyCookie, compareOtp,
  jsonErr, jsonOk,
  COOKIE_NAME, MAX_ATTEMPTS, COOKIE_OPTS,
} from "../../../lib/otp.js";

export async function POST({ request, cookies }) {
  let body;
  try { body = await request.json(); } catch { return jsonErr(400, "Invalid request body."); }

  const { email, otp } = body;
  if (!email || !otp) return jsonErr(400, "Email and OTP code are required.");

  const session = verifyCookie(cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return jsonErr(400, "Session expired or not found. Please request a new code.");
  }
  if (session.email !== email.trim().toLowerCase()) {
    return jsonErr(400, "Email does not match the OTP session.");
  }
  if (Date.now() > session.expiresAt) {
    cookies.delete(COOKIE_NAME, { path: "/" });
    return jsonErr(400, "OTP has expired. Please request a new code.");
  }
  if (session.attempts >= MAX_ATTEMPTS) {
    cookies.delete(COOKIE_NAME, { path: "/" });
    return jsonErr(429, "Too many incorrect attempts. Please request a new code.");
  }

  const valid = compareOtp(otp, session.hashedOtp);

  if (!valid) {
    const newAttempts = session.attempts + 1;
    const attemptsLeft = MAX_ATTEMPTS - newAttempts;

    if (attemptsLeft <= 0) {
      cookies.delete(COOKIE_NAME, { path: "/" });
      return jsonErr(429, "Too many incorrect attempts. Please request a new code.", { attemptsLeft: 0 });
    }

    const remaining = Math.ceil((session.expiresAt - Date.now()) / 1000);
    cookies.set(COOKIE_NAME, signCookie({ ...session, attempts: newAttempts }), COOKIE_OPTS(remaining));
    return jsonErr(400, "Incorrect code. Please try again.", { attemptsLeft });
  }

  // Verified — clear OTP cookie and return user data
  cookies.delete(COOKIE_NAME, { path: "/" });

  // Only return fields that were stored in the session (undefined is dropped by JSON)
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
