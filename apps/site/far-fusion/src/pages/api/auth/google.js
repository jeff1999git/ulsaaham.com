import { safeNextPath } from "../../../lib/next-path.js";
import { encodeState, newNonce, nonceCookieOptions, NONCE_COOKIE } from "../../../lib/google-oauth.js";

export async function GET({ request, redirect, cookies }) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));

  // The same nonce goes into the state and into a cookie only this browser
  // holds; the callback checks that they agree.
  const nonce = newNonce();
  cookies.set(NONCE_COOKIE, nonce, nonceCookieOptions());
  const state = encodeState({ next, nonce });

  const params = new URLSearchParams({
    client_id: import.meta.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
