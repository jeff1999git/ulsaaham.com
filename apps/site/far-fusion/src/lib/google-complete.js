import { getUser, setUser } from "./auth.js";
import { safeNextPath } from "./next-path.js";

// The last step of a Google sign-in, run by the static /auth/complete page.
// The callback leaves the profile in a short-lived cookie that script can
// read; this picks it up, clears it, signs the visitor in on this device and
// says where to go next. Nothing from the cookie is ever written into the page.
export const RESULT_COOKIE = "google_auth_result";

const PROFILE_FIELDS = ["email", "name", "avatar", "googleId"];

/** The Google profile in a document.cookie string, or null. */
export function readGoogleResult(cookieString) {
  for (const part of String(cookieString || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1 || part.slice(0, eq).trim() !== RESULT_COOKIE) continue;
    let data;
    try {
      data = JSON.parse(decodeURIComponent(part.slice(eq + 1).trim()));
    } catch {
      return null;
    }
    if (!data || typeof data !== "object" || typeof data.email !== "string" || !data.email) return null;
    // Only the fields the callback sets, and only as text.
    const profile = {};
    for (const field of PROFILE_FIELDS) {
      if (typeof data[field] === "string" && data[field]) profile[field] = data[field];
    }
    return profile;
  }
  return null;
}

/**
 * Stores the Google profile as the signed-in user. The same person signing in
 * again keeps what this device already holds for them (phone, age, tickets);
 * after a logout nothing is held, so they start from the Google profile.
 */
export function signInWithGoogle(profile) {
  const existing = getUser();
  const same =
    typeof existing?.email === "string" && existing.email.toLowerCase() === profile.email.toLowerCase();
  const user = { tickets: [], ...(same ? existing : {}), ...profile };
  setUser(user);
  return user;
}

/** Where /auth/complete sends the visitor, given its document and location. */
export function completeGoogleSignIn(doc, loc) {
  const profile = readGoogleResult(doc.cookie);
  // Cleared on every visit, read or not, with the path the callback set it on.
  doc.cookie =
    `${RESULT_COOKIE}=; Max-Age=0; path=/; SameSite=Lax` + (loc.protocol === "https:" ? "; Secure" : "");
  if (!profile) return "/login?error=no_auth_result";

  try {
    signInWithGoogle(profile);
  } catch {
    // Storage blocked or full: nothing was saved, so the visitor is not signed in.
    return "/login?error=auth_failed";
  }
  return safeNextPath(new URLSearchParams(loc.search).get("next"));
}
