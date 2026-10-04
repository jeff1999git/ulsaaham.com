// Runs the built Vercel function the way production does: copied away from the
// repo, so it can only load what the deployment's file tracing packed, and
// called with the headers Vercel forwards. Two outages got past every other
// test this way:
// - qrcode was loaded through createRequire, the tracing left it out, and
//   /api/send-ticket failed with "Cannot find module 'qrcode'" on every call
//   (the mail builder, now src/lib/ticket-mail.js, imports it statically);
// - Astro 5.18 ignores Host / X-Forwarded-Host unless security.allowedDomains
//   lists the host, so every request URL became https://localhost: Google
//   sign-in returned to localhost and the mailer's same-site check refused
//   the site's own pages.
//
// The requests are refused before any booking lookup or email, so nothing
// leaves the machine. Like the bundle budgets, this needs a build and runs only
// when asked:
//   bun run build && BUNDLE_CHECK=1 node --test tests/build/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { APP_ROOT, REPO_ROOT } from "../mail/support/paths.mjs";

const SITE_HOST = "www.ulsaaham.com";

const FUNCTION_DIRS = [
  path.join(APP_ROOT, ".vercel", "output", "functions", "_render.func"),
  path.join(REPO_ROOT, ".vercel", "output", "functions", "_render.func"),
];

// The headers Vercel's edge sends to the function for a visitor on the site.
const VERCEL_HEADERS = {
  host: SITE_HOST,
  "x-forwarded-host": SITE_HOST,
  "x-forwarded-proto": "https",
  "x-forwarded-for": "203.0.113.7",
};

function request(port, method, urlPath, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, method, path: urlPath, headers: { ...VERCEL_HEADERS, ...headers } },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text }));
      }
    );
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

function jsonBody(res) {
  try {
    return JSON.parse(res.text);
  } catch {
    return null;
  }
}

test(
  "the built function loads its mail routes and sees the site's own host, as on Vercel",
  { skip: process.env.BUNDLE_CHECK !== "1" && "set BUNDLE_CHECK=1 after a build to run this" },
  async (t) => {
    const source = FUNCTION_DIRS.find((dir) => fs.existsSync(path.join(dir, ".vc-config.json")));
    assert.ok(source, `no built function found; run bun run build first (looked in ${FUNCTION_DIRS.join(", ")})`);

    // Anything the tracing missed must fail here as it does in production, so
    // the copy may not sit below a node_modules folder it could fall back to.
    const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "ulsaham-func-"));
    t.after(() => fs.rmSync(isolated, { recursive: true, force: true }));
    for (let dir = path.dirname(isolated); ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, "node_modules")), `${dir} has a node_modules folder; the copy would not be isolated`);
      if (path.dirname(dir) === dir) break;
    }
    fs.cpSync(source, isolated, { recursive: true });

    assert.ok(
      fs.existsSync(path.join(isolated, "node_modules", "qrcode", "package.json")),
      "qrcode is not packed into the function, so the ticket mail routes cannot load"
    );

    const { handler } = JSON.parse(fs.readFileSync(path.join(isolated, ".vc-config.json"), "utf8"));
    const { default: handle } = await import(pathToFileURL(path.join(isolated, handler)).href);
    const server = http.createServer((req, res) => {
      Promise.resolve(handle(req, res)).catch((err) => {
        res.statusCode = 599;
        res.end(String(err?.stack || err));
      });
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const { port } = server.address();

    const postJson = (urlPath, body, headers = {}) =>
      request(port, "POST", urlPath, {
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
      });

    // An invalid address is refused after the same-site check and before any
    // lookup or send: 400 when this build has SMTP settings, 503 when it has
    // none. A 403 means the same-site check failed; a 500 means the route did
    // not load.
    const ticket = await postJson(
      "/api/send-ticket",
      { ticketCode: "TEST-0000", email: "not-an-address" },
      { origin: `https://${SITE_HOST}` }
    );
    assert.ok([400, 503].includes(ticket.status), `send-ticket answered ${ticket.status}: ${ticket.text.slice(0, 300)}`);
    assert.equal(typeof jsonBody(ticket)?.error, "string", "send-ticket did not answer with a JSON error");

    // The admin's webhook mail route loads the same mail builder. Unsigned, it
    // is refused before anything else: 401, or 503 when this build has no
    // PROXY_SHARED_SECRET.
    const internal = await postJson("/api/internal/ticket-mail", { ticketCode: "TEST-0000" });
    assert.ok([401, 503].includes(internal.status), `internal ticket-mail answered ${internal.status}: ${internal.text.slice(0, 300)}`);
    assert.equal(typeof jsonBody(internal)?.error, "string", "internal ticket-mail did not answer with a JSON error");

    // The same for the OTP route: no address, so nothing is sent.
    const otp = await postJson("/api/auth/send-otp", {}, { origin: `https://${SITE_HOST}` });
    assert.ok([400, 503].includes(otp.status), `send-otp answered ${otp.status}: ${otp.text.slice(0, 300)}`);
    assert.equal(typeof jsonBody(otp)?.error, "string", "send-otp did not answer with a JSON error");

    // Google must be told to come back to the site, never to localhost.
    const google = await request(port, "GET", "/api/auth/google?next=/account");
    assert.equal(google.status, 302, `google answered ${google.status}: ${google.text.slice(0, 300)}`);
    const redirectUri = new URL(google.headers.location).searchParams.get("redirect_uri");
    assert.equal(redirectUri, `https://${SITE_HOST}/api/auth/google/callback`);
  }
);
