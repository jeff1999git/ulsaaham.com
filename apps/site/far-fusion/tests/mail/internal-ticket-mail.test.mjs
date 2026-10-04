// /api/internal/ticket-mail: the admin panel asks for a ticket email when it
// completes a booking itself (the Razorpay webhook). Driven end to end: the real
// handler, a throwaway SMTP server and a stubbed admin-panel lookup. Nothing
// here reaches the network.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { setTestEnv } from "./support/env.mjs";
import { loadSource } from "./support/load.mjs";
import { startFakeSmtp } from "./support/fake-smtp.mjs";
import { parseMail } from "./support/mime.mjs";
import { readJson } from "./support/context.mjs";

const smtpOptions = {};
const smtp = await startFakeSmtp(smtpOptions);

let ENV = setTestEnv({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(smtp.port) });
const resetEnv = (overrides = {}) => {
  ENV = setTestEnv({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(smtp.port), ...overrides });
  return ENV;
};

// The admin panel's participants/check, as the route's lookup sees it.
let backendReply = null;
const backendCalls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  backendCalls.push({ url: String(url), headers: init?.headers });
  if (backendReply === "throw") throw new Error("offline");
  return new Response(JSON.stringify(backendReply.body), {
    status: backendReply.status,
    headers: { "content-type": "application/json" },
  });
};

const logged = [];
const realError = console.error;
const realWarn = console.warn;
console.error = (...args) => logged.push(args.map(String).join(" "));
console.warn = (...args) => logged.push(args.map(String).join(" "));

after(async () => {
  globalThis.fetch = realFetch;
  console.error = realError;
  console.warn = realWarn;
  await smtp.close();
});

const BOOKING = (over = {}) => ({
  status: 200,
  body: {
    success: true,
    data: {
      ticketCode: "UE-ONAM-PAID01",
      participantName: "Ravi",
      eventName: "Onam Fest 2026",
      eventDate: "2026-09-20T00:00:00.000Z",
      eventVenue: "Kochi",
      numberOfParticipants: 2,
      attended: false,
      competitionNumber: null,
      isGroupRegistration: true,
      amountPaid: true,
      paymentId: "pay_WEBHOOK0001",
      ...over,
    },
  },
});

const loadRoute = () => loadSource("src/pages/api/internal/ticket-mail.js");

/** What the admin panel computes: lowercase hex HMAC-SHA256 of `${ts}.${body}`. */
const signature = (timestamp, body, secret = ENV.PROXY_SHARED_SECRET) =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

/**
 * The admin panel's request: no Origin, no cookies, only the signature. A
 * timestamp or signature given as null is left out; an omitted signature is
 * computed the way the admin panel does it.
 */
function adminRequest(payload, { raw, timestamp = String(Date.now()), sig, secret, headers = {} } = {}) {
  const body = raw ?? JSON.stringify(payload);
  const sent = {
    "content-type": "application/json",
    "x-ulsaham-timestamp": timestamp,
    "x-ulsaham-signature": sig === undefined ? signature(timestamp, body, secret) : sig,
    ...headers,
  };
  for (const [name, value] of Object.entries(sent)) if (value === null) delete sent[name];
  return {
    clientAddress: "198.51.100.250",
    request: new Request("https://www.ulsaaham.com/api/internal/ticket-mail", { method: "POST", headers: sent, body }),
  };
}

/** Nothing a caller or the log can see may hold a credential or a signature. */
function assertNothingLeaks(result, sig) {
  const haystacks = [result.text, ...[...result.headers].map(([, value]) => value), ...logged];
  for (const [name, value] of [["PROXY_SHARED_SECRET", ENV.PROXY_SHARED_SECRET], ["SMTP_PASS", ENV.SMTP_PASS], ["signature", sig]]) {
    if (!value) continue;
    for (const hay of haystacks) assert.ok(!String(hay).includes(value), `${name} reached an output`);
  }
}

test("a request the admin panel did not sign is refused before anything else happens", async () => {
  const { POST } = await loadRoute();
  backendReply = BOOKING();
  const payload = { ticketCode: "UE-ONAM-PAID01", email: "guest@example.test" };
  const body = JSON.stringify(payload);
  const now = String(Date.now());
  const good = signature(now, body);

  const cases = [
    ["no headers", { timestamp: null, sig: null }],
    ["no signature", { sig: null }],
    ["no timestamp", { timestamp: null, sig: good }],
    ["another secret", { secret: "not-the-shared-secret" }],
    ["a different body", { timestamp: now, sig: signature(now, JSON.stringify({ ...payload, email: "evil@example.test" })) }],
    ["a different timestamp", { timestamp: String(Number(now) + 1), sig: good }],
    ["upper-case hex", { timestamp: now, sig: good.toUpperCase() }],
    ["a truncated signature", { timestamp: now, sig: good.slice(0, 63) }],
    ["base64 instead of hex", { timestamp: now, sig: Buffer.from(good, "hex").toString("base64") }],
    ["a timestamp in seconds", { timestamp: String(Math.floor(Number(now) / 1000)) }],
    ["a timestamp that is not a number", { timestamp: "1.7e12" }],
  ];

  const before = backendCalls.length;
  const marker = smtp.mark();
  for (const [label, options] of cases) {
    const result = await readJson(await POST(adminRequest(payload, options)));
    assert.equal(result.status, 401, label);
    assert.deepEqual(result.body, { success: false, error: "Unauthorized." }, label);
    assertNothingLeaks(result, good);
  }
  assert.equal(backendCalls.length, before, "an unsigned request reached the admin panel");
  assert.equal(smtp.since(marker).messages.length, 0, "an unsigned request sent mail");
});

test("a request older or newer than five minutes is refused", async () => {
  const { POST } = await loadRoute();
  backendReply = BOOKING();
  const payload = { ticketCode: "UE-ONAM-PAID01", email: "late@example.test" };
  const marker = smtp.mark();

  for (const skew of [-6 * 60_000, 6 * 60_000, -24 * 60 * 60_000]) {
    const result = await readJson(await POST(adminRequest(payload, { timestamp: String(Date.now() + skew) })));
    assert.equal(result.status, 401, `skew ${skew}`);
  }
  assert.equal(smtp.since(marker).messages.length, 0);

  // Within the window either way, a clock a few minutes out still works.
  const result = await readJson(await POST(adminRequest(payload, { timestamp: String(Date.now() - 4 * 60_000) })));
  assert.equal(result.status, 200);
});

test("the admin panel's own signature vectors are accepted, over the exact bytes sent", async () => {
  // The fixed vectors in the admin panel's test/payment-routes.test.ts ("signs
  // `${timestamp}.${rawBody}` with HMAC-SHA256 as lowercase hex"): the same
  // secret, timestamp, bodies and signatures. The signing above is this file's
  // own, so only these catch the two sides drifting apart.
  const secret = "test-proxy-secret";
  const timestamp = "1759572000000";
  const vectors = [
    ['{"ticketCode":"UE-TESTEV-ABC123"}', "601a41fb84cb83a92f4b720fa955774729fad837d10ea53cbcbf8219a93fa648"],
    [
      '{"ticketCode":"UE-TESTEV-ABC123","email":"buyer@example.test"}',
      "e85ef5d5f927b0ecea057361ab09a556c7a0a44ee996d3813e8eafc7584f3072",
    ],
  ];
  resetEnv({ PROXY_SHARED_SECRET: secret });
  const realNow = Date.now;
  try {
    const { adminSignatureProblem } = await loadSource("src/lib/backend.js");
    for (const [body, sig] of vectors) {
      const at = Number(timestamp);
      assert.equal(adminSignatureProblem({ timestamp, signature: sig, body: Buffer.from(body), now: at }), null, body);
      assert.equal(adminSignatureProblem({ timestamp, signature: sig, body: Buffer.from(body), now: at + 5 * 60_000 }), null);
      assert.equal(adminSignatureProblem({ timestamp, signature: sig, body: Buffer.from(body), now: at + 5 * 60_000 + 1 }), "stale");
    }

    // Through the route at that moment. The lookup answering 404 shows the
    // signature passed: a refused one is a 401 before any lookup.
    const { POST } = await loadRoute();
    backendReply = { status: 404, body: { success: false, error: "Ticket code not found" } };
    Date.now = () => Number(timestamp);
    const before = backendCalls.length;
    for (const [raw, sig] of vectors) {
      const result = await readJson(await POST(adminRequest(undefined, { raw, timestamp, sig })));
      assert.equal(result.status, 404, raw);
    }
    assert.equal(backendCalls.length - before, 2);
    assert.match(backendCalls[before].url, /participants\/check\?ticketCode=UE-TESTEV-ABC123$/);

    // The signature covers the bytes as sent, not the JSON they parse to: the
    // same fields spaced differently need their own signature.
    const spaced = '{ "ticketCode": "UE-TESTEV-ABC123" }';
    const refused = await readJson(await POST(adminRequest(undefined, { raw: spaced, timestamp, sig: vectors[0][1] })));
    assert.equal(refused.status, 401);
    const own = createHmac("sha256", secret).update(`${timestamp}.${spaced}`).digest("hex");
    const accepted = await readJson(await POST(adminRequest(undefined, { raw: spaced, timestamp, sig: own })));
    assert.equal(accepted.status, 404);
  } finally {
    Date.now = realNow;
    resetEnv();
  }
});

test("a signed request mails the booking the admin panel holds", async () => {
  const { POST } = await loadRoute();
  backendReply = BOOKING();
  const marker = smtp.mark();
  const before = backendCalls.length;

  const ctx = adminRequest({ ticketCode: "ue-onam-paid01", email: "guest@example.test" });
  assert.equal(ctx.request.headers.get("origin"), null, "the admin panel sends no Origin");
  const result = await readJson(await POST(ctx));

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true });

  // Looked up exactly as /api/send-ticket does it, over the proxy handshake.
  const lookup = backendCalls[before];
  assert.equal(lookup.url, "http://127.0.0.1:9/api/public/participants/check?ticketCode=UE-ONAM-PAID01");
  assert.equal(lookup.headers.get("x-proxy-key"), ENV.PROXY_SHARED_SECRET);
  assert.equal(lookup.headers.get("x-client-ip"), "198.51.100.250");

  const sent = smtp.since(marker).messages;
  assert.equal(sent.length, 1);
  const mail = parseMail(sent[0].raw);
  assert.equal(mail.from.address, "tickets@ulsaaham.com");
  assert.equal(mail.to.address, "guest@example.test");
  assert.ok(mail.subject.includes("Onam Fest 2026"), "the subject does not name the event");
  assert.ok(mail.subject.includes("UE-ONAM-PAID01"), "the subject does not carry the code");
  assert.ok(mail.html.includes("pay_WEBHOOK0001"), "the booking's Payment ID is missing");
  assert.ok(mail.text.includes("Your ticket code is: UE-ONAM-PAID01"));
  assert.ok(mail.attachments.some((part) => part.mime === "image/png"), "the QR image is not attached");
  assertNothingLeaks(result);
});

test("the same request twice mails once", async () => {
  const { POST } = await loadRoute();
  backendReply = BOOKING({ ticketCode: "UE-ONAM-TWICE1" });
  // The same timestamp and body, so the same signature: an exact replay.
  const timestamp = String(Date.now());
  const ctx = () => adminRequest({ ticketCode: "UE-ONAM-TWICE1", email: "twice@example.test" }, { timestamp });
  const marker = smtp.mark();

  const first = await readJson(await POST(ctx()));
  const replay = await readJson(await POST(ctx()));

  assert.equal(first.status, 200);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.duplicate, true);
  assert.equal(smtp.since(marker).messages.length, 1, "a replayed request mailed the ticket again");
});

test("a booking awaiting payment is not mailed", async () => {
  const { POST } = await loadRoute();
  const marker = smtp.mark();

  // An answer that does not say counts as unpaid here: only an admin panel
  // that reports amountPaid calls this route.
  for (const over of [{ amountPaid: false, paymentId: null }, { amountPaid: undefined }]) {
    backendReply = BOOKING({ ticketCode: "UE-ONAM-UNPAID", ...over });
    const result = await readJson(await POST(adminRequest({ ticketCode: "UE-ONAM-UNPAID", email: "wait@example.test" })));
    assert.equal(result.status, 409, JSON.stringify(over));
    assert.match(result.body.error, /awaiting payment/i);
  }
  assert.equal(smtp.since(marker).messages.length, 0, "an unpaid booking was mailed");
});

test("a ticket the admin panel cannot confirm is never mailed", async () => {
  const { POST } = await loadRoute();
  const marker = smtp.mark();

  const cases = [
    [{ status: 404, body: { success: false, error: "Ticket code not found" } }, 404],
    [{ status: 429, body: { success: false, error: "slow down" } }, 429],
    ["throw", 502],
    [{ status: 200, body: { success: true, data: null } }, 502],
  ];
  for (const [reply, expected] of cases) {
    backendReply = reply;
    const result = await readJson(await POST(adminRequest({ ticketCode: "UE-FAKE-000001", email: "a@example.test" })));
    assert.equal(result.status, expected);
    assertNothingLeaks(result);
  }
  assert.equal(smtp.since(marker).messages.length, 0);
});

test("a signed body that is not a ticket request is refused before the lookup", async () => {
  const { POST } = await loadRoute();
  backendReply = BOOKING();
  const before = backendCalls.length;

  const cases = [
    [{ raw: "not json" }, /request body/i],
    [{ raw: "null" }, /ticket code/i],
    [{ raw: "{}" }, /ticket code/i],
    [{ raw: JSON.stringify({ ticketCode: "<script>" }) }, /ticket code/i],
    [{ raw: JSON.stringify({ ticketCode: "UE-ONAM-PAID01", email: "not-an-email" }) }, /email/i],
    [{ raw: JSON.stringify({ ticketCode: "UE-ONAM-PAID01", email: "a(b)@example.test" }) }, /email/i],
    [{ raw: JSON.stringify({ ticketCode: "UE-ONAM-PAID01", email: 42 }) }, /email/i],
  ];
  for (const [options, pattern] of cases) {
    const result = await readJson(await POST(adminRequest(undefined, options)));
    assert.equal(result.status, 400, options.raw);
    assert.match(result.body.error, pattern, options.raw);
  }
  assert.equal(backendCalls.length, before, "a bad body still reached the admin panel");
});

test("the address is the signed one, else the booking's own, else the request is refused", async () => {
  const { POST } = await loadRoute();
  const marker = smtp.mark();

  backendReply = BOOKING({ ticketCode: "UE-ONAM-NOMAIL" });
  const none = await readJson(await POST(adminRequest({ ticketCode: "UE-ONAM-NOMAIL" })));
  assert.equal(none.status, 422);
  assert.equal(none.body.code, "NO_EMAIL");
  assert.equal(smtp.since(marker).messages.length, 0);

  // A lookup that carries the booking's email is used when none was signed.
  backendReply = BOOKING({ ticketCode: "UE-ONAM-OWNMAIL", email: "owner@example.test" });
  const own = await readJson(await POST(adminRequest({ ticketCode: "UE-ONAM-OWNMAIL" })));
  assert.equal(own.status, 200);
  assert.equal(parseMail(smtp.since(marker).messages[0].raw).to.address, "owner@example.test");

  // A signed address wins over the booking's.
  backendReply = BOOKING({ ticketCode: "UE-ONAM-BOTH01", email: "owner@example.test" });
  const both = await readJson(await POST(adminRequest({ ticketCode: "UE-ONAM-BOTH01", email: "chosen@example.test" })));
  assert.equal(both.status, 200);
  assert.equal(parseMail(smtp.since(marker).messages[1].raw).to.address, "chosen@example.test");
});

test("a failed delivery is reported and can be asked for again", async () => {
  const { POST } = await loadRoute();
  backendReply = BOOKING({ ticketCode: "UE-ONAM-BOUNCE" });
  const marker = smtp.mark();
  const request = () => adminRequest({ ticketCode: "UE-ONAM-BOUNCE", email: "bounce@example.test" });

  smtpOptions.rejectRecipient = /bounce@/;
  try {
    const failed = await readJson(await POST(request()));
    assert.equal(failed.status, 500);
    assert.match(failed.body.error, /failed to send/i);
    assert.ok(logged.some((line) => line.startsWith("[ticket-mail] mail error:")), "the failure was not logged");
    assertNothingLeaks(failed);
  } finally {
    smtpOptions.rejectRecipient = undefined;
  }

  // Nothing was delivered, so the duplicate guard must not hold the address.
  const retried = await readJson(await POST(request()));
  assert.equal(retried.status, 200, "a failed send left the duplicate guard set");
  assert.equal(smtp.since(marker).messages.length, 1);
});

test("the route steps aside when the secret or the mail transport is missing", async () => {
  backendReply = BOOKING();
  const payload = { ticketCode: "UE-ONAM-PAID01", email: "guest@example.test" };

  // Without the secret nothing can be verified, signed or not.
  const signedWith = ENV.PROXY_SHARED_SECRET;
  resetEnv({ PROXY_SHARED_SECRET: undefined });
  let route = await loadRoute();
  const before = backendCalls.length;
  let result = await readJson(await route.POST(adminRequest(payload, { secret: signedWith })));
  assert.equal(result.status, 503);
  assert.equal(backendCalls.length, before);

  // Without SMTP a genuine request is answered 503; a forged one still 401.
  resetEnv({ SMTP_HOST: undefined });
  route = await loadRoute();
  const marker = smtp.mark();
  result = await readJson(await route.POST(adminRequest(payload)));
  assert.equal(result.status, 503);
  result = await readJson(await route.POST(adminRequest(payload, { secret: "wrong-secret" })));
  assert.equal(result.status, 401);
  assert.equal(backendCalls.length, before, "the lookup ran without a way to send");
  assert.equal(smtp.since(marker).connections, 0);

  resetEnv();
});
