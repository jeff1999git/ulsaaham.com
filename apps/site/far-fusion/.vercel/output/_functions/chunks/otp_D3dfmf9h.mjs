import { createHmac, timingSafeEqual, randomInt } from 'node:crypto';

const secret = () => "dev-otp-secret-change-in-prod";
function signCookie(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}
function verifyCookie(token) {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const expected = createHmac("sha256", secret()).update(data).digest("base64url");
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}
function generateOtp() {
  return String(randomInt(1e5, 1e6)).padStart(6, "0");
}
function hashOtp(otp) {
  return createHmac("sha256", secret()).update(otp.trim()).digest("hex");
}
function compareOtp(input, storedHash) {
  const inputHash = hashOtp(input);
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function jsonErr(status, message, extra = {}) {
  return new Response(JSON.stringify({ success: false, error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function jsonOk(data = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { "Content-Type": "application/json" }
  });
}
const COOKIE_NAME = "otp_session";
const OTP_TTL_MS = 10 * 60 * 1e3;
const RESEND_COOLDOWN_MS = 60 * 1e3;
const MAX_SENDS_PER_HOUR = 3;
const SEND_WINDOW_MS = 60 * 60 * 1e3;
const MAX_ATTEMPTS = 5;
const COOKIE_OPTS = (maxAgeSeconds) => ({
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: maxAgeSeconds,
  path: "/"
});

export { COOKIE_NAME as C, MAX_SENDS_PER_HOUR as M, OTP_TTL_MS as O, RESEND_COOLDOWN_MS as R, SEND_WINDOW_MS as S, COOKIE_OPTS as a, jsonOk as b, MAX_ATTEMPTS as c, compareOtp as d, generateOtp as g, hashOtp as h, jsonErr as j, signCookie as s, verifyCookie as v };
