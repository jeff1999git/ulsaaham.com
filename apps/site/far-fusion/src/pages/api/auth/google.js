export async function GET({ request, redirect }) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/account";

  const state = Buffer.from(JSON.stringify({ next })).toString("base64");

  const params = new URLSearchParams({
    client_id: import.meta.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
