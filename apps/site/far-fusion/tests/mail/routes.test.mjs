// The two mail routes, driven end to end: the real handlers, a throwaway SMTP
// server, and a stubbed admin-panel lookup. Nothing here reaches the network.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import nodemailer from "nodemailer";

import { setTestEnv } from "./support/env.mjs";
import { loadSource } from "./support/load.mjs";
import { startFakeSmtp } from "./support/fake-smtp.mjs";
import { parseMail } from "./support/mime.mjs";
import { makeContext, makeCookieJar, readJson } from "./support/context.mjs";

const smtpOptions = {};
const smtp = await startFakeSmtp(smtpOptions);

let ENV = setTestEnv({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(smtp.port) });
const resetEnv = (overrides = {}) => {
  ENV = setTestEnv({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(smtp.port), ...overrides });
  return ENV;
};

// Counted, not replaced: these tests exercise the real transport against the
// fake server, and the count is how the retry path is observed.
const realCreateTransport = nodemailer.createTransport;
let transports = 0;
nodemailer.createTransport = (options) => {
  transports += 1;
  return realCreateTransport(options);
};

// The admin panel stands in for a lookup that must never be skipped.
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

const consoleErrors = [];
const realConsoleError = console.error;
console.error = (...args) => consoleErrors.push(args.map(String).join(" "));

after(async () => {
  nodemailer.createTransport = realCreateTransport;
  globalThis.fetch = realFetch;
  console.error = realConsoleError;
  await smtp.close();
});

const OTP_HELPER = await loadSource("src/lib/otp.js");

const TICKET = (over = {}) => ({
  status: 200,
  body: {
    success: true,
    data: {
      ticketCode: "UE-DANCE-ABC123",
      // Hostile values, as if the database held them. The mail must neutralise
      // them, and it must use these rather than anything the caller sent.
      participantName: '<img src=x onerror="alert(1)">Ravi',
      eventName: "Onam Fest <b>2026</b>",
      eventDate: "2026-09-20T00:00:00.000Z",
      eventVenue: "Kochi & Co",
      numberOfParticipants: 2,
      competitionNumber: null,
      ...over,
    },
  },
});

/** A private copy of a route: its own rate-limit buckets and its own transport. */
const loadTicketRoute = () => loadSource("src/pages/api/send-ticket.js");
const loadOtpRoute = () => loadSource("src/pages/api/auth/send-otp.js");
const loadVerifyRoute = () => loadSource("src/pages/api/auth/verify-otp.js");

/**
 * Nothing the visitor can see, and nothing written to the log, may contain a
 * credential. Message bodies are checked after decoding, because a soft line
 * break in quoted-printable can split a string that is plainly there.
 */
function assertNoSecrets(result, marker) {
  const secrets = [
    ["SMTP_PASS", ENV.SMTP_PASS],
    ["SMTP_USER", ENV.SMTP_USER],
    ["OTP_SECRET", ENV.OTP_SECRET],
    ["PROXY_SHARED_SECRET", ENV.PROXY_SHARED_SECRET],
  ];

  const haystacks = [result.text];
  for (const [, value] of result.headers) haystacks.push(value);
  for (const message of smtp.messages.slice(marker.messages)) {
    haystacks.push(...parseMail(message.raw).searchable());
  }
  haystacks.push(...consoleErrors);

  for (const [name, value] of secrets) {
    if (!value) continue;
    for (const hay of haystacks) {
      assert.ok(!String(hay).includes(value), name + " reached an output the caller or the log can see");
    }
  }

  for (const message of smtp.messages.slice(marker.messages)) {
    const mail = parseMail(message.raw);
    assert.ok(mail.from.address !== ENV.SMTP_USER, "a message was sent from the SMTP login");
    assert.ok(!mail.from.address.endsWith("@smtp-brevo.com"), "a message was sent from the login domain");
  }

  for (const auth of smtp.auths.slice(marker.auths)) {
    assert.ok(auth.user === ENV.SMTP_USER, "the server was given a login that is not SMTP_USER");
    assert.ok(auth.pass === ENV.SMTP_PASS, "the server was given a password that is not SMTP_PASS");
  }
}

// ---------------------------------------------------------------- send-ticket

test("a ticket cannot be mailed from another site", async () => {
  const { POST } = await loadTicketRoute();
  backendReply = TICKET();

  for (const headers of [{ origin: "https://evil.example" }, { origin: null }]) {
    const marker = smtp.mark();
    const result = await readJson(
      await POST(makeContext({ body: { ticketCode: "UE-DANCE-ABC123", email: "a@b.test" }, ...headers }))
    );
    assert.equal(result.status, 403);
    assert.equal(smtp.since(marker).messages.length, 0, "a blocked request still sent mail");
    assertNoSecrets(result, marker);
  }
});

test("a malformed request is refused before the backend is asked", async () => {
  const { POST } = await loadTicketRoute();
  backendReply = TICKET();
  const before = backendCalls.length;

  const cases = [
    [{ raw: "not json" }, /request body/i],
    [{ body: { ticketCode: "UE-DANCE-ABC123", email: "not-an-email" } }, /email/i],
    [{ body: { ticketCode: "<script>", email: "a@b.test" } }, /ticket code/i],
  ];

  for (const [options, pattern] of cases) {
    const marker = smtp.mark();
    const result = await readJson(await POST(makeContext(options)));
    assert.equal(result.status, 400);
    assert.match(result.body.error, pattern);
    assertNoSecrets(result, marker);
  }

  assert.equal(backendCalls.length, before, "a malformed request still hit the backend");
});

test("the ticket mail is built from the booking the backend holds", async () => {
  const { POST } = await loadTicketRoute();
  backendReply = TICKET();
  const marker = smtp.mark();
  const before = backendCalls.length;

  const result = await readJson(
    await POST(
      makeContext({
        body: { ticketCode: "ue-dance-abc123", email: "guest@example.test", paymentId: "pay_ABC123" },
        ip: "203.0.113.5",
      })
    )
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);

  // The lookup happened, over the shared-secret handshake, with the code
  // normalised to upper case.
  const lookup = backendCalls[before];
  assert.ok(lookup.url.includes("ticketCode=UE-DANCE-ABC123"), "the lookup used a different code");
  assert.equal(lookup.headers.get("x-client-ip"), "203.0.113.5");
  assert.ok(
    lookup.headers.get("x-proxy-key") === ENV.PROXY_SHARED_SECRET,
    "the backend handshake header was not sent"
  );

  const sent = smtp.since(marker).messages;
  assert.equal(sent.length, 1);
  const mail = parseMail(sent[0].raw);

  assert.equal(mail.from.address, "tickets@ulsaaham.com");
  assert.equal(mail.from.name, "Tickets Ulsaham");
  assert.equal(sent[0].envelopeFrom, "tickets@ulsaaham.com");
  assert.equal(mail.to.address, "guest@example.test");
  assert.ok(mail.subject.includes("Onam Fest"), "the subject does not name the event");
  assert.ok(mail.subject.includes("UE-DANCE-ABC123"), "the subject does not carry the code");

  // Hostile stored values survive only as inert characters. The one real image
  // is the QR the route attaches itself.
  assert.ok(!mail.html.includes("<img src=x"), "an injected tag survived into the body");
  assert.equal((mail.html.match(/<img/g) || []).length, 1);
  assert.ok(mail.html.includes('<img src="cid:ticket-qr"'), "the QR reference is missing");
  assert.ok(mail.html.includes("&lt;img src=x"), "the hostile name was not escaped");
  assert.ok(mail.html.includes("&lt;b&gt;2026&lt;/b&gt;"), "event markup was not escaped");
  assert.ok(mail.html.includes("Kochi &amp; Co"), "an ampersand was not escaped");
  assert.ok(mail.html.includes("pay_ABC123"), "the payment id row is missing");

  // Stored as UTC midnight; a mail rendered in the server zone would say the
  // day before.
  assert.match(mail.html, /20 September,? 2026/);
  assert.ok(!mail.html.includes("19 September"), "the date was not rendered in India Standard Time");

  assert.ok(mail.text.includes("Your ticket code is: UE-DANCE-ABC123"), "the plain text part is wrong");

  const qr = mail.attachments.find((part) => part.mime === "image/png");
  assert.ok(qr, "the QR image is not attached");
  assert.equal(qr.headers["content-id"], "<ticket-qr>");
  assert.equal(qr.buffer.subarray(0, 4).toString("latin1"), "\x89PNG");

  assertNoSecrets(result, marker);
});

test("the same ticket is not mailed twice to one address", async () => {
  const { POST } = await loadTicketRoute();
  backendReply = TICKET();

  const send = async (email, ip) =>
    readJson(await POST(makeContext({ body: { ticketCode: "UE-DANCE-ABC123", email }, ip })));

  const first = await send("guest@example.test", "203.0.113.6");
  assert.equal(first.status, 200);

  const marker = smtp.mark();
  const repeat = await send("guest@example.test", "203.0.113.6");
  assert.equal(repeat.status, 429);
  assert.match(repeat.body.error, /just emailed/i);
  assert.equal(smtp.since(marker).messages.length, 0, "the duplicate was still sent");

  // A different address is a different delivery, not a duplicate.
  const other = await send("friend@example.test", "203.0.113.7");
  assert.equal(other.status, 200);
});

test("a ticket the backend does not know is never mailed", async () => {
  const { POST } = await loadTicketRoute();

  const cases = [
    [{ status: 404, body: { success: false, error: "not found" } }, 404],
    [{ status: 429, body: { success: false, error: "slow down" } }, 429],
    ["throw", 502],
    [{ status: 200, body: { success: true, data: null } }, 502],
  ];

  for (const [reply, expected] of cases) {
    backendReply = reply;
    const marker = smtp.mark();
    const result = await readJson(
      await POST(makeContext({ body: { ticketCode: "UE-FAKE-000001", email: "a@b.test" }, ip: "203.0.113.8" }))
    );
    assert.equal(result.status, expected);
    assert.equal(smtp.since(marker).messages.length, 0, "mail was sent without a confirmed booking");
    assertNoSecrets(result, marker);
  }
});

test("a competition entry is sent as a participation card", async () => {
  const { POST } = await loadTicketRoute();
  backendReply = TICKET({ ticketCode: "UE-RACE-CHEST1", competitionNumber: 42 });
  const marker = smtp.mark();

  const result = await readJson(
    await POST(makeContext({ body: { ticketCode: "UE-RACE-CHEST1", email: "runner@example.test" } }))
  );
  assert.equal(result.status, 200);

  const mail = parseMail(smtp.since(marker).messages[0].raw);
  assert.ok(mail.subject.includes("participation card"), "the subject is not the card wording");
  assert.ok(mail.subject.includes("Chest No 42"), "the subject does not carry the chest number");
  assert.ok(mail.html.includes(">42<"), "the chest number is missing from the body");
  assert.ok(mail.text.toLowerCase().includes("chest number"), "the plain text part is wrong");
  assert.equal(mail.from.address, "tickets@ulsaaham.com");
  assert.ok(!mail.parts.some((part) => part.mime === "image/png"), "a card should not carry a QR image");

  assertNoSecrets(result, marker);
});

test("one booking cannot be sprayed to many addresses", async () => {
  const { POST } = await loadTicketRoute();
  backendReply = TICKET({ ticketCode: "UE-DANCE-LIMIT1" });

  let last = 0;
  for (let i = 0; i < 8; i += 1) {
    const response = await POST(
      makeContext({ body: { ticketCode: "UE-DANCE-LIMIT1", email: `x${i}@example.test` }, ip: "198.51.100." + i })
    );
    last = response.status;
  }
  assert.equal(last, 429, "the per-ticket ceiling never applied");
});

test("one device cannot mail an unlimited number of bookings", async () => {
  const { POST } = await loadTicketRoute();

  let last = 0;
  for (let i = 0; i < 14; i += 1) {
    backendReply = TICKET({ ticketCode: "UE-DANCE-IP" + i });
    const response = await POST(
      makeContext({ body: { ticketCode: "UE-DANCE-IP" + i, email: `y${i}@example.test` }, ip: "198.51.100.200" })
    );
    last = response.status;
  }
  assert.equal(last, 429, "the per-device ceiling never applied");
});

test("a refused delivery is reported and can be retried at once", async () => {
  const { POST } = await loadTicketRoute();
  backendReply = TICKET({ ticketCode: "UE-DANCE-BOUNCE" });
  smtpOptions.rejectRecipient = /bounce@/;

  const marker = smtp.mark();
  const failed = await readJson(
    await POST(makeContext({ body: { ticketCode: "UE-DANCE-BOUNCE", email: "bounce@example.test" }, ip: "198.51.100.30" }))
  );

  assert.equal(failed.status, 500);
  assert.match(failed.body.error, /Failed to send/i);
  assert.ok(
    consoleErrors.some((line) => line.startsWith("[send-ticket] mail error:")),
    "the failure was not logged"
  );
  assertNoSecrets(failed, marker);

  // Nothing was delivered, so the duplicate guard must not hold the address.
  smtpOptions.rejectRecipient = undefined;
  const retried = await readJson(
    await POST(makeContext({ body: { ticketCode: "UE-DANCE-BOUNCE", email: "bounce@example.test" }, ip: "198.51.100.30" }))
  );
  assert.equal(retried.status, 200, "a failed send left the duplicate guard set");
});

test("the ticket route steps aside when SMTP is not configured", async () => {
  resetEnv({ SMTP_HOST: undefined });
  const { POST } = await loadTicketRoute();
  const marker = smtp.mark();

  const result = await readJson(
    await POST(makeContext({ body: { ticketCode: "UE-DANCE-ABC123", email: "a@b.test" } }))
  );
  assert.equal(result.status, 503);
  assert.match(result.body.error, /download your ticket/i);
  assert.equal(smtp.since(marker).connections, 0);

  resetEnv();
});

// ------------------------------------------------------------------- send-otp

test("a sign-in code is mailed from the OTP sender and kept out of the subject", async () => {
  const { POST } = await loadOtpRoute();
  const jar = makeCookieJar();
  const marker = smtp.mark();

  const result = await readJson(
    await POST(makeContext({ body: { email: "  User@Example.test " }, cookies: jar, ip: "198.51.100.1" }))
  );

  assert.equal(result.status, 200);
  const sent = smtp.since(marker).messages;
  assert.equal(sent.length, 1);

  const mail = parseMail(sent[0].raw);
  assert.equal(mail.from.address, "noreply@ulsaaham.com");
  assert.equal(mail.from.name, "Ulsaham Entertainments");
  assert.equal(sent[0].envelopeFrom, "noreply@ulsaaham.com");
  assert.equal(mail.to.address, "user@example.test", "the address was not normalised");

  assert.equal(mail.subject, "Your Ulsaham verification code");
  assert.ok(!/\d{4}/.test(mail.subject), "the code is visible in the subject");

  const code = (mail.text.match(/code is: (\d{6})/) || [])[1];
  assert.ok(code, "the code is missing from the plain text part");
  assert.ok(mail.html.includes(code), "the code is missing from the html part");
  assert.ok(mail.text.includes("10 minutes"), "the expiry is not stated");

  // The cookie is the whole session, so its shape matters.
  const written = jar.last("otp_session");
  assert.ok(written, "no sign-in cookie was issued");
  assert.equal(written.options.httpOnly, true);
  assert.equal(written.options.sameSite, "lax");
  assert.equal(written.options.maxAge, 600);
  assert.equal(written.options.path, "/");

  const session = OTP_HELPER.verifyCookie(written.value);
  assert.equal(session.email, "user@example.test");
  assert.equal(session.attempts, 0);
  assert.equal(session.sendCount, 1);
  assert.ok(session.hashedOtp === OTP_HELPER.hashOtp(code), "the cookie holds a different code");
  assert.ok(!written.value.includes(code), "the raw code is sitting in the cookie");

  assertNoSecrets(result, marker);
});

test("codes cannot be requested in a burst", async () => {
  const { POST } = await loadOtpRoute();
  const jar = makeCookieJar();

  const first = await readJson(
    await POST(makeContext({ body: { email: "burst@example.test" }, cookies: jar, ip: "198.51.100.2" }))
  );
  assert.equal(first.status, 200);

  const marker = smtp.mark();
  const again = await readJson(
    await POST(makeContext({ body: { email: "burst@example.test" }, cookies: jar, ip: "198.51.100.2" }))
  );
  assert.equal(again.status, 429);
  assert.match(again.body.error, /wait \d+ seconds/i);
  assert.ok(Number(again.headers.get("retry-after")) > 0, "no Retry-After was sent");
  assert.equal(smtp.since(marker).messages.length, 0, "a second code went out inside the cooldown");
});

test("the hourly allowance applies and then rolls over", async () => {
  const { POST } = await loadOtpRoute();
  const now = Date.now();

  const spent = OTP_HELPER.signCookie({
    email: "spent@example.test",
    hashedOtp: OTP_HELPER.hashOtp("111111"),
    expiresAt: now + 60000,
    attempts: 0,
    lastSentAt: now - 120000,
    firstSentAt: now - 10 * 60 * 1000,
    sendCount: 3,
  });
  const blocked = await readJson(
    await POST(
      makeContext({
        body: { email: "spent@example.test" },
        cookies: makeCookieJar({ otp_session: spent }),
        ip: "198.51.100.3",
      })
    )
  );
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /hour/i);

  const stale = OTP_HELPER.signCookie({
    email: "stale@example.test",
    hashedOtp: OTP_HELPER.hashOtp("111111"),
    expiresAt: now - 1000,
    attempts: 0,
    lastSentAt: now - 3 * 60 * 60 * 1000,
    firstSentAt: now - 3 * 60 * 60 * 1000,
    sendCount: 3,
  });
  const allowed = await readJson(
    await POST(
      makeContext({
        body: { email: "stale@example.test" },
        cookies: makeCookieJar({ otp_session: stale }),
        ip: "198.51.100.4",
      })
    )
  );
  assert.equal(allowed.status, 200, "the allowance never reopened after the hour");
});

test("server-side ceilings hold when the client drops its cookie", async () => {
  const perEmail = await loadOtpRoute();
  let last = 0;
  for (let i = 0; i < 7; i += 1) {
    const response = await perEmail.POST(
      makeContext({ body: { email: "fixed@example.test" }, cookies: makeCookieJar(), ip: "203.0.113." + (20 + i) })
    );
    last = response.status;
  }
  assert.equal(last, 429, "the per-address ceiling never applied");

  const perDevice = await loadOtpRoute();
  last = 0;
  for (let i = 0; i < 10; i += 1) {
    const response = await perDevice.POST(
      makeContext({ body: { email: `who${i}@example.test` }, cookies: makeCookieJar(), ip: "203.0.113.99" })
    );
    last = response.status;
  }
  assert.equal(last, 429, "the per-device ceiling never applied");
});

test("a failed send leaves no session behind and can be retried", async () => {
  const { POST } = await loadOtpRoute();
  smtpOptions.rejectRecipient = /refused@/;
  const jar = makeCookieJar();
  const marker = smtp.mark();

  const failed = await readJson(
    await POST(makeContext({ body: { email: "refused@example.test" }, cookies: jar, ip: "203.0.113.40" }))
  );

  assert.equal(failed.status, 500);
  assert.match(failed.body.error, /Failed to send/i);
  assert.equal(smtp.since(marker).messages.length, 0);
  assert.equal(jar.sets.length, 0, "a cookie was written for a code that never arrived");
  assert.ok(
    consoleErrors.some((line) => line.startsWith("[send-otp] mail error:")),
    "the failure was not logged"
  );
  assertNoSecrets(failed, marker);

  smtpOptions.rejectRecipient = undefined;
  const retried = await readJson(
    await POST(makeContext({ body: { email: "refused@example.test" }, cookies: makeCookieJar(), ip: "203.0.113.40" }))
  );
  assert.equal(retried.status, 200, "the failed attempt burned the allowance");
});

test("a dead connection is retried once on a new transport", async () => {
  // A port nothing is listening on: the failure lands at the connection stage,
  // which is the case the retry exists for.
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const deadPort = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));

  resetEnv({ SMTP_PORT: String(deadPort) });
  const { POST } = await loadOtpRoute();

  const before = transports;
  const result = await readJson(
    await POST(makeContext({ body: { email: "dead@example.test" }, cookies: makeCookieJar(), ip: "203.0.113.50" }))
  );

  assert.equal(result.status, 500);
  assert.equal(transports - before, 2, "the dead pool was not replaced and retried exactly once");

  resetEnv();
});

test("sign-in steps aside when the secret or SMTP is missing", async () => {
  resetEnv({ SMTP_HOST: undefined });
  let route = await loadOtpRoute();
  let result = await readJson(
    await route.POST(makeContext({ body: { email: "a@b.test" }, cookies: makeCookieJar() }))
  );
  assert.equal(result.status, 503);

  // Production without a signing secret must refuse rather than fall back to a
  // known value. NODE_ENV stands in for import.meta.env.PROD here.
  resetEnv({ NODE_ENV: "production", OTP_SECRET: undefined });
  route = await loadOtpRoute();
  result = await readJson(
    await route.POST(makeContext({ body: { email: "a@b.test" }, cookies: makeCookieJar() }))
  );
  assert.equal(result.status, 503);

  resetEnv();
});

// ----------------------------------------------------------------- verify-otp

test("a code is checked without trusting the shape of the request", async () => {
  const { POST } = await loadVerifyRoute();
  const code = "045678";
  const session = {
    email: "v@example.test",
    hashedOtp: OTP_HELPER.hashOtp(code),
    expiresAt: Date.now() + 60000,
    attempts: 0,
    name: "Ravi",
  };
  const jar = () => makeCookieJar({ otp_session: OTP_HELPER.signCookie(session) });

  // A number or an object used to reach the hashing call and throw a 500.
  for (const otp of [45678, { evil: true }, ["045678"]]) {
    const result = await readJson(await POST(makeContext({ body: { email: session.email, otp }, cookies: jar() })));
    assert.equal(result.status, 400, "a non-string code was not refused cleanly");
  }

  const wrong = await readJson(
    await POST(makeContext({ body: { email: session.email, otp: "999999" }, cookies: jar() }))
  );
  assert.equal(wrong.status, 400);
  assert.equal(wrong.body.attemptsLeft, 4);

  const right = await readJson(
    await POST(makeContext({ body: { email: session.email, otp: code }, cookies: jar() }))
  );
  assert.equal(right.status, 200, "a code with a leading zero was rejected");
  assert.equal(right.body.data.name, "Ravi");
  assert.equal(right.body.data.email, session.email);
});

test("a spent or expired session is cleared", async () => {
  const { POST } = await loadVerifyRoute();
  const code = "123456";
  const base = {
    email: "v@example.test",
    hashedOtp: OTP_HELPER.hashOtp(code),
    expiresAt: Date.now() + 60000,
    attempts: 0,
  };

  const burned = makeCookieJar({ otp_session: OTP_HELPER.signCookie({ ...base, attempts: 5 }) });
  const exhausted = await readJson(
    await POST(makeContext({ body: { email: base.email, otp: code }, cookies: burned }))
  );
  assert.equal(exhausted.status, 429);
  assert.ok(burned.deletes.some((entry) => entry.name === "otp_session"), "the spent session was kept");

  const stale = makeCookieJar({ otp_session: OTP_HELPER.signCookie({ ...base, expiresAt: Date.now() - 1000 }) });
  const expired = await readJson(await POST(makeContext({ body: { email: base.email, otp: code }, cookies: stale })));
  assert.equal(expired.status, 400);
  assert.match(expired.body.error, /expired/i);

  const forged = makeCookieJar({ otp_session: "forged.token" });
  const rejected = await readJson(await POST(makeContext({ body: { email: base.email, otp: code }, cookies: forged })));
  assert.equal(rejected.status, 400);
});
