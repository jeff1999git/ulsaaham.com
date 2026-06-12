export { renderers } from '../../../../renderers.mjs';

async function GET({ request, redirect, cookies }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error || !code) {
    return redirect("/login?error=google_denied");
  }
  let next = "/account";
  try {
    const stateData = JSON.parse(Buffer.from(stateParam || "", "base64").toString());
    if (stateData.next) next = stateData.next;
  } catch {
  }
  let access_token;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: undefined                                ,
        client_secret: undefined                                    ,
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: "authorization_code"
      })
    });
    if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status}`);
    ({ access_token } = await tokenRes.json());
  } catch (err) {
    console.error("[google/callback] token error:", err?.message);
    return redirect("/login?error=google_token");
  }
  let profile;
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!profileRes.ok) throw new Error(`profile fetch failed: ${profileRes.status}`);
    profile = await profileRes.json();
  } catch (err) {
    console.error("[google/callback] profile error:", err?.message);
    return redirect("/login?error=google_profile");
  }
  const user = {
    email: profile.email,
    name: profile.name,
    avatar: profile.picture,
    googleId: profile.id
  };
  const encoded = encodeURIComponent(JSON.stringify(user));
  cookies.set("google_auth_result", encoded, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    maxAge: 60,
    path: "/"
  });
  return redirect(`/auth/complete?next=${encodeURIComponent(next)}`);
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
