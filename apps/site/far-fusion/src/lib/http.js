// JSON helpers shared by every API route.

export function jsonOk(data = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function jsonErr(status, message, extra = {}) {
  const { retryAfter, ...rest } = extra;
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return new Response(JSON.stringify({ success: false, error: message, ...rest }), { status, headers });
}

// Blocks a POST that did not come from a page on this site. Browsers always
// send Origin on a cross-origin POST, so an attacker's page and a bare curl
// call are both rejected while the site's own fetch passes.
export function isSameOrigin(request) {
  let host;
  try {
    host = new URL(request.url).host;
  } catch {
    return false;
  }
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}
