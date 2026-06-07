import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const secret = () =>
  import.meta.env.OTP_SECRET || "dev-otp-secret-change-in-prod";

export function signCookie(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyCookie(token) {
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

export function generateOtp() {
  return String(randomInt(100000, 1000000)).padStart(6, "0");
}

export function hashOtp(otp) {
  return createHmac("sha256", secret()).update(otp.trim()).digest("hex");
}

export function compareOtp(input, storedHash) {
  const inputHash = hashOtp(input);
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function jsonErr(status, message, extra = {}) {
  return new Response(JSON.stringify({ success: false, error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonOk(data = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const COOKIE_NAME = "otp_session";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 3;
export const SEND_WINDOW_MS = 60 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

export const COOKIE_OPTS = (maxAgeSeconds) => ({
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  maxAge: maxAgeSeconds,
  path: "/",
});
