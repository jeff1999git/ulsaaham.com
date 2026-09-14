import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const DEV_SECRET = "dev-otp-secret-change-in-prod";

const configuredSecret = () => import.meta.env.OTP_SECRET || process.env.OTP_SECRET || "";

/**
 * The OTP secret both signs the session cookie and keys the code hash, so a
 * known fallback value in production would let anyone forge a session or
 * recover a code from the cookie. Deployments without it are refused; local
 * development still runs on the placeholder.
 */
export function isOtpConfigured() {
  return Boolean(configuredSecret()) || !import.meta.env.PROD;
}

const secret = () => {
  const value = configuredSecret();
  if (value) return value;
  if (import.meta.env.PROD) throw new Error("OTP_SECRET is not set");
  return DEV_SECRET;
};

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
    const session = JSON.parse(Buffer.from(data, "base64url").toString());
    return session && typeof session === "object" ? session : null;
  } catch {
    return null;
  }
}

export function generateOtp() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

export function hashOtp(otp) {
  return createHmac("sha256", secret()).update(String(otp).trim()).digest("hex");
}

export function compareOtp(input, storedHash) {
  if (typeof storedHash !== "string" || !/^[0-9a-f]{64}$/.test(storedHash)) return false;
  const inputHash = hashOtp(input);
  const a = Buffer.from(inputHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const COOKIE_NAME = "otp_session";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 3;
export const SEND_WINDOW_MS = 60 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

/**
 * The send allowance for the current hour. Once the window has elapsed a fresh
 * one starts, so the cap keeps applying instead of lapsing after the first
 * hour the way a never-reset counter would.
 */
export function currentSendWindow(session, now) {
  if (!session || typeof session.firstSentAt !== "number" || now - session.firstSentAt >= SEND_WINDOW_MS) {
    return { firstSentAt: now, sendCount: 0 };
  }
  return { firstSentAt: session.firstSentAt, sendCount: Number(session.sendCount) || 0 };
}

export const COOKIE_OPTS = (maxAgeSeconds) => ({
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  maxAge: maxAgeSeconds,
  path: "/",
});
