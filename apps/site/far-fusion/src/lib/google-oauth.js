import { randomBytes, timingSafeEqual } from "node:crypto";

// Binds a Google sign-in to the browser that started it. Without this, anyone
// could send a visitor a callback link carrying the sender's own Google code
// and sign that visitor in as the sender (login CSRF). /api/auth/google puts a
// random nonce both in the OAuth state and in a cookie; the callback accepts
// the code only when the two match.
export const NONCE_COOKIE = "g_oauth_nonce";

// Covers /api/auth/google and /api/auth/google/callback and nothing else. Lax,
// because the way back from Google is a top-level GET from another site.
export const NONCE_PATH = "/api/auth/google";

export const nonceCookieOptions = () => ({
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: "lax",
  maxAge: 600,
  path: NONCE_PATH,
});

export const newNonce = () => randomBytes(16).toString("base64url");

export const encodeState = (data) => Buffer.from(JSON.stringify(data)).toString("base64");

/** The state object Google handed back, or null when it is not one. */
export function decodeState(param) {
  try {
    const data = JSON.parse(Buffer.from(String(param || ""), "base64").toString());
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

/** Constant-time comparison; a missing or empty value on either side fails. */
export function nonceMatches(fromState, fromCookie) {
  if (typeof fromState !== "string" || typeof fromCookie !== "string") return false;
  if (!fromState || !fromCookie) return false;
  const a = Buffer.from(fromState);
  const b = Buffer.from(fromCookie);
  return a.length === b.length && timingSafeEqual(a, b);
}
