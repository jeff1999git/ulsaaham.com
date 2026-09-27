// The `astro dev` proxy to the live admin panel, limited to reads.
//
// Vite's proxy runs ahead of Astro's own /api/public route, so without this a
// booking, payment or coupon request made while developing would be written to
// the production database. GET and HEAD are forwarded; every other method is
// answered here with a JSON 403 and never leaves the machine.

const READ_METHODS = new Set(["GET", "HEAD"]);

export function readOnlyBypass(req, res) {
  if (READ_METHODS.has(req.method)) return undefined;

  const body = JSON.stringify({
    success: false,
    error: `Local dev only reads from the production API; ${req.method} requests are refused so nothing is written there.`,
  });
  res.writeHead(403, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
  // Vite treats a string as "handled"; with the response already ended it
  // returns without proxying (viteProxyMiddleware checks res.writableEnded).
  return req.url;
}

export function readOnlyProxy(target) {
  return { target, changeOrigin: true, secure: true, bypass: readOnlyBypass };
}
