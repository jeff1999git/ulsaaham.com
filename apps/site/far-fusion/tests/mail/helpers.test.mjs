// The pieces the mail routes lean on for safety: escaping, the same-origin
// guard, the rate limiter and the one-time-code primitives. The Brevo migration
// does not change any of them, which is exactly why they are pinned here.
import test from "node:test";
import assert from "node:assert/strict";

import { setTestEnv } from "./support/env.mjs";
import { loadSource } from "./support/load.mjs";
import { decodeWords, decodeQuotedPrintable, parseAddress } from "./support/mime.mjs";

setTestEnv();

const HOSTILE = '<img src=x onerror="alert(1)">&\'';

test("values are escaped before they reach the message body", async () => {
  const { escapeHtml } = await loadSource("src/lib/mailer.js");

  const escaped = escapeHtml(HOSTILE);
  assert.ok(!escaped.includes("<"), "an angle bracket survived");
  assert.ok(!escaped.includes(">"), "an angle bracket survived");
  assert.ok(escaped.includes("&lt;img"), "the tag was not neutralised");
  assert.ok(escaped.includes("&quot;"), "a double quote survived");
  assert.ok(escaped.includes("&#39;"), "a single quote survived");
  assert.ok(escaped.includes("&amp;"), "an ampersand survived");

  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(42), "42");
});

test("the layout escapes its own text but trusts assembled markup", async () => {
  const { renderEmailShell } = await loadSource("src/lib/mailer.js");

  const html = renderEmailShell({
    title: HOSTILE,
    subtitle: HOSTILE,
    bodyHtml: "<b>body</b>",
    footerHtml: "<i>foot</i>",
  });

  assert.ok(!html.includes('onerror="alert'), "the hostile title was not escaped");
  assert.ok(html.includes("<b>body</b>"), "caller markup was mangled");
  assert.ok(html.includes("<i>foot</i>"), "caller markup was mangled");

  const noSubtitle = renderEmailShell({ title: "Hi", bodyHtml: "" });
  assert.ok(!noSubtitle.includes("undefined"), "a missing subtitle leaked into the body");
});

test("detail rows drop empty entries and escape both cells", async () => {
  const { renderDetailRows } = await loadSource("src/lib/mailer.js");

  const rows = renderDetailRows([["Name", HOSTILE], null, ["Event", "Fine & Dandy"], undefined]);

  assert.equal((rows.match(/<tr>/g) || []).length, 2, "empty rows were rendered");
  assert.ok(!rows.includes('onerror="alert'), "a row value was not escaped");
  assert.ok(rows.includes("Fine &amp; Dandy"), "an ampersand was not escaped");
});

test("JSON replies carry the right status and never cache", async () => {
  const { jsonOk, jsonErr } = await loadSource("src/lib/http.js");

  const ok = jsonOk({ data: { a: 1 } });
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get("content-type"), /application\/json/);
  assert.equal(ok.headers.get("cache-control"), "no-store");
  assert.deepEqual(await ok.json(), { success: true, data: { a: 1 } });

  const err = jsonErr(429, "slow down", { retryAfter: 30, attemptsLeft: 2 });
  assert.equal(err.status, 429);
  assert.equal(err.headers.get("retry-after"), "30");
  const body = await err.json();
  assert.equal(body.success, false);
  assert.equal(body.error, "slow down");
  assert.equal(body.attemptsLeft, 2);
  assert.equal(body.retryAfter, undefined, "retryAfter belongs in the header, not the body");
});

test("only this site can ask the server to send a ticket", async () => {
  const { isSameOrigin } = await loadSource("src/lib/http.js");
  const request = (headers) =>
    new Request("https://www.ulsaaham.com/api/send-ticket", { method: "POST", headers });

  assert.equal(isSameOrigin(request({ origin: "https://www.ulsaaham.com" })), true);
  assert.equal(isSameOrigin(request({ referer: "https://www.ulsaaham.com/events/x" })), true);
  assert.equal(isSameOrigin(request({ origin: "https://evil.example" })), false);
  assert.equal(isSameOrigin(request({})), false);
  assert.equal(isSameOrigin(request({ origin: "not a url" })), false);
});

test("the rate limiter counts, refuses and reopens", async () => {
  const { rateLimit, releaseLimit } = await loadSource("src/lib/rate-limit.js");

  const key = "case-a";
  assert.equal(rateLimit(key, { limit: 3, windowMs: 60000 }).allowed, true);
  assert.equal(rateLimit(key, { limit: 3, windowMs: 60000 }).allowed, true);
  assert.equal(rateLimit(key, { limit: 3, windowMs: 60000 }).allowed, true);

  const denied = rateLimit(key, { limit: 3, windowMs: 60000 });
  assert.equal(denied.allowed, false);
  assert.ok(denied.retryAfter >= 1 && denied.retryAfter <= 60, "the wait is not a sane number of seconds");

  // Work that did not happen gives its slot back.
  releaseLimit(key);
  assert.equal(rateLimit(key, { limit: 3, windowMs: 60000 }).allowed, true);

  const short = "case-b";
  assert.equal(rateLimit(short, { limit: 1, windowMs: 40 }).allowed, true);
  assert.equal(rateLimit(short, { limit: 1, windowMs: 40 }).allowed, false);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(rateLimit(short, { limit: 1, windowMs: 40 }).allowed, true, "the window never reopened");
});

test("the visitor address comes from Astro first, then the proxy header", async () => {
  const { getClientIp } = await loadSource("src/lib/rate-limit.js");

  assert.equal(getClientIp({ clientAddress: "203.0.113.9" }), "203.0.113.9");
  assert.equal(
    getClientIp({ request: { headers: new Headers({ "x-forwarded-for": "198.51.100.7, 10.0.0.1" }) } }),
    "198.51.100.7"
  );
  assert.equal(getClientIp({}), "");
});

test("codes are six digits and compare in constant time", async () => {
  const otp = await loadSource("src/lib/otp.js");

  const codes = Array.from({ length: 300 }, () => otp.generateOtp());
  assert.ok(codes.every((code) => /^\d{6}$/.test(code)), "a code was not six digits");

  const code = otp.generateOtp();
  const hash = otp.hashOtp(code);
  assert.equal(otp.compareOtp(code, hash), true);
  assert.equal(otp.compareOtp(" " + code + " ", hash), true, "surrounding space should be tolerated");
  assert.equal(otp.compareOtp(code === "000000" ? "111111" : "000000", hash), false);
  assert.equal(otp.compareOtp(code, "not-a-hash"), false);
  assert.equal(otp.compareOtp(code, undefined), false);
});

test("the sign-in cookie is signed and rejects tampering", async () => {
  const otp = await loadSource("src/lib/otp.js");

  const token = otp.signCookie({ email: "a@b.test", attempts: 0 });
  assert.equal(otp.verifyCookie(token).email, "a@b.test");
  assert.equal(otp.verifyCookie("x" + token), null, "a changed payload was accepted");
  assert.equal(otp.verifyCookie(token.slice(0, -2) + "zz"), null, "a changed signature was accepted");
  assert.equal(otp.verifyCookie(""), null);
  assert.equal(otp.verifyCookie(undefined), null);

  // A cookie minted under a different secret must not survive a rotation.
  setTestEnv();
  const rotated = await loadSource("src/lib/otp.js");
  assert.equal(rotated.verifyCookie(token), null, "a cookie from the old secret was accepted");
});

test("the hourly send allowance rolls over instead of lapsing", async () => {
  const otp = await loadSource("src/lib/otp.js");
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  assert.equal(otp.currentSendWindow(null, now).sendCount, 0);
  assert.equal(otp.currentSendWindow({ firstSentAt: now - 1000, sendCount: 2 }, now).sendCount, 2);

  const rolled = otp.currentSendWindow({ firstSentAt: now - hour - 1000, sendCount: 3 }, now);
  assert.equal(rolled.sendCount, 0, "the window never reset");
  assert.equal(rolled.firstSentAt, now);

  assert.equal(otp.currentSendWindow({ firstSentAt: now - 1000, sendCount: "abc" }, now).sendCount, 0);
});

test("production refusal, with NODE_ENV standing in for import.meta.env.PROD", async () => {
  // The shipped condition is import.meta.env.PROD, which only a real build can
  // set. The loader maps it to NODE_ENV, so this proves the branch, not the
  // deployed predicate.
  setTestEnv({ NODE_ENV: "production", OTP_SECRET: undefined });
  const otp = await loadSource("src/lib/otp.js");

  assert.equal(otp.isOtpConfigured(), false, "sign-in would run on a known secret");
  assert.throws(() => otp.signCookie({ email: "a@b.test" }), /OTP_SECRET is not set/);
  assert.equal(otp.COOKIE_OPTS(600).secure, true, "the cookie is not marked secure in production");

  setTestEnv({ NODE_ENV: "production" });
  const configured = await loadSource("src/lib/otp.js");
  assert.equal(configured.isOtpConfigured(), true);

  setTestEnv();
});

test("the MIME reader survives how nodemailer folds a long subject", async () => {
  // nodemailer splits a folded subject mid-word, so decoding each encoded word
  // on its own inserts a space inside it. The suite would then pass or fail for
  // reasons that have nothing to do with the mail.
  const folded =
    "=?UTF-8?Q?Your_participation_card_for_Fest_=3Cscri?=\r\n =?UTF-8?Q?pt=3E_=E2=80=94_Chest_No_42?=";
  const unfolded = folded.replace(/\r\n([ \t])/g, "$1");

  assert.equal(decodeWords(unfolded), "Your participation card for Fest <script> — Chest No 42");
  assert.equal(decodeQuotedPrintable("a=\r\nbc"), "abc");
  assert.deepEqual(parseAddress("Tickets Ulsaham <tickets@ulsaaham.com>"), {
    name: "Tickets Ulsaham",
    address: "tickets@ulsaaham.com",
  });
});
