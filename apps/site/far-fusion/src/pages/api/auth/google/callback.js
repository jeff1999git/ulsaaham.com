import { safeNextPath } from "../../../../lib/next-path.js";
import { decodeState, nonceMatches, NONCE_COOKIE, NONCE_PATH } from "../../../../lib/google-oauth.js";

export async function GET({ request, redirect, cookies }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // One use only, whatever happens next.
  const nonce = cookies.get(NONCE_COOKIE)?.value;
  cookies.delete(NONCE_COOKIE, { path: NONCE_PATH });

  if (error || !code) {
    return redirect("/login?error=google_denied");
  }

  // A code that arrives without the nonce this browser was given was not
  // started here: someone else's sign-in link, or one left open past ten
  // minutes. Checked before the code is spent.
  const stateData = decodeState(stateParam);
  if (!nonceMatches(stateData?.nonce, nonce)) {
    return redirect("/login?error=google_state");
  }

  // state round-trips through Google unsigned, so it is re-checked here.
  const next = safeNextPath(stateData.next);

  // Exchange auth code for access token
  let access_token;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: import.meta.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status}`);
    ({ access_token } = await tokenRes.json());
  } catch (err) {
    console.error("[google/callback] token error:", err?.message);
    return redirect("/login?error=google_token");
  }

  // Fetch user profile from Google
  let profile;
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) throw new Error(`profile fetch failed: ${profileRes.status}`);
    profile = await profileRes.json();
  } catch (err) {
    console.error("[google/callback] profile error:", err?.message);
    return redirect("/login?error=google_profile");
  }

  // The address becomes the visitor's identity here (bookings, ticket mail),
  // so only one Google has confirmed is accepted.
  if (!profile?.email || profile.verified_email !== true) {
    return redirect("/login?error=google_unverified");
  }

  const user = {
    email: profile.email,
    name: profile.name,
    avatar: profile.picture,
    googleId: profile.id,
  };

  // A short-lived cookie that script can read, for the static /auth/complete
  // page to pick up and clear (src/lib/google-complete.js). Astro percent-
  // encodes the value once, which also keeps it to valid cookie characters,
  // so the page decodes it once.
  cookies.set("google_auth_result", JSON.stringify(user), {
    httpOnly: false,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60,
    path: "/",
  });

  return redirect(`/auth/complete?next=${encodeURIComponent(next)}`);
}
