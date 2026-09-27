// Where to send a visitor after sign-in. The value arrives in a query string,
// so anything other than a path on this site is refused: an absolute or
// protocol-relative URL is an open redirect, and a javascript: URL runs script
// on this origin.
const BASE = "https://ulsaaham.invalid";

export function safeNextPath(value, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;

  let url;
  try {
    url = new URL(value, BASE);
  } catch {
    return fallback;
  }
  // Catches "//host", "/\host" and tab or newline tricks, which the URL
  // parser resolves to another origin.
  if (url.origin !== BASE) return fallback;

  // Rebuilt from the parsed URL, so < > and " come back percent-encoded and the
  // result is safe to place inside an inline script.
  const path = url.pathname + url.search + url.hash;

  // Removing dot segments can leave a second leading slash ("/..//evil.com"
  // becomes "//evil.com"), which a browser reads as another host.
  if (/^\/[\/\\]/.test(path)) return fallback;
  return path;
}
