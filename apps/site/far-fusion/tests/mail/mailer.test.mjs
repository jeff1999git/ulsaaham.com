// The transport and the sender split: what the Brevo migration actually changed.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";

import { setTestEnv } from "./support/env.mjs";
import { loadSource } from "./support/load.mjs";

// Installed at module scope, before any test can import the mailer, so nothing
// here can dial the host named in the environment. Every transport assertion
// re-checks it: losing the patch would silently turn a unit test into a live
// login attempt against Brevo.
const realCreateTransport = nodemailer.createTransport;

let created = [];
let sent = [];
let closed = 0;
let failOnce = null;

nodemailer.createTransport = (options) => {
  created.push(options);
  return {
    async sendMail(payload) {
      sent.push(payload);
      if (failOnce) {
        const error = failOnce;
        failOnce = null;
        throw error;
      }
      return { accepted: [payload.to] };
    },
    close() {
      closed += 1;
    },
  };
};

after(() => {
  nodemailer.createTransport = realCreateTransport;
});

const OTP_SENDER = '"Ulsaham Entertainments" <noreply@ulsaaham.com>';
const TICKET_SENDER = '"Tickets Ulsaham" <tickets@ulsaaham.com>';
const MESSAGE = { to: "someone@example.test", subject: "Hello", text: "Hi", html: "<p>Hi</p>" };

async function freshMailer(overrides) {
  const env = setTestEnv(overrides);
  created = [];
  sent = [];
  closed = 0;
  failOnce = null;
  assert.ok(
    nodemailer.createTransport !== realCreateTransport,
    "the createTransport patch is not installed; a real connection could be opened"
  );
  return { mailer: await loadSource("src/lib/mailer.js"), env };
}

test("the transport points at the Brevo relay on port 587", async () => {
  const { mailer } = await freshMailer();
  await mailer.sendMail(MESSAGE, "otp");

  assert.equal(created.length, 1);
  assert.equal(created[0].host, "smtp-relay.brevo.com");
  assert.equal(created[0].port, 587);
  assert.equal(typeof created[0].port, "number");
  // 587 is the STARTTLS port: nodemailer upgrades as soon as the relay
  // advertises it, so "not secure on connect" is the correct setting here.
  assert.equal(created[0].secure, false);
});

test("credentials come from the environment", async () => {
  const { mailer, env } = await freshMailer();
  await mailer.sendMail(MESSAGE, "otp");

  // Compared as booleans, never as assert.equal operands: a failed equality
  // assertion prints both values, which would put the key in the output.
  assert.ok(created[0].auth.user === env.SMTP_USER, "auth.user does not match SMTP_USER");
  assert.ok(created[0].auth.pass === env.SMTP_PASS, "auth.pass does not match SMTP_PASS");
  assert.ok(created[0].auth.pass !== "", "auth.pass is empty");
});

test("connection pooling and timeouts survive the move", async () => {
  const { mailer } = await freshMailer();
  await mailer.sendMail(MESSAGE, "otp");

  assert.equal(created[0].pool, true);
  assert.equal(created[0].maxConnections, 1);
  assert.equal(created[0].maxMessages, 50);
  assert.equal(created[0].connectionTimeout, 10000);
  assert.equal(created[0].greetingTimeout, 10000);
  assert.equal(created[0].socketTimeout, 20000);
});

test("the port and TLS mode follow the environment", async () => {
  let loaded = await freshMailer({ SMTP_SECURE: "true", SMTP_PORT: "465" });
  await loaded.mailer.sendMail(MESSAGE, "otp");
  assert.equal(created[0].secure, true);
  assert.equal(created[0].port, 465);

  loaded = await freshMailer({ SMTP_PORT: undefined });
  await loaded.mailer.sendMail(MESSAGE, "otp");
  assert.equal(created[0].port, 587);
});

test("the sign-in code is sent from the OTP sender", async () => {
  const { mailer, env } = await freshMailer();
  await mailer.sendMail(MESSAGE, "otp");

  assert.equal(sent[0].from, env.OTP_EMAIL_FROM);
  assert.match(sent[0].from, /noreply@ulsaaham\.com/);
  assert.equal(sent[0].to, MESSAGE.to);
  assert.equal(sent[0].subject, MESSAGE.subject);
  assert.equal(sent[0].html, MESSAGE.html);
});

test("the ticket is sent from the ticket sender", async () => {
  const { mailer, env } = await freshMailer();
  await mailer.sendMail(MESSAGE, "ticket");

  assert.equal(sent[0].from, env.TICKET_EMAIL_FROM);
  assert.match(sent[0].from, /tickets@ulsaaham\.com/);
});

test("a sender pasted with surrounding quotes still parses", async () => {
  const { mailer } = await freshMailer({
    OTP_EMAIL_FROM: '"Ulsaham Entertainments <noreply@ulsaaham.com>"',
  });
  await mailer.sendMail(MESSAGE, "otp");

  // Left as pasted, nodemailer reads the whole value as a display name and the
  // address vanishes from the header.
  assert.equal(sent[0].from, "Ulsaham Entertainments <noreply@ulsaaham.com>");
});

test("an unset sender variable falls back to the verified Brevo address", async () => {
  const { mailer } = await freshMailer({ OTP_EMAIL_FROM: undefined, TICKET_EMAIL_FROM: undefined });

  await mailer.sendMail(MESSAGE, "otp");
  await mailer.sendMail(MESSAGE, "ticket");

  assert.equal(sent[0].from, OTP_SENDER);
  assert.equal(sent[1].from, TICKET_SENDER);
});

test("EMAIL_FROM is no longer consulted", async () => {
  const { mailer } = await freshMailer({
    OTP_EMAIL_FROM: undefined,
    TICKET_EMAIL_FROM: undefined,
    EMAIL_FROM: "Old Provider <someone@gmail.test>",
  });

  await mailer.sendMail(MESSAGE, "otp");
  assert.equal(sent[0].from, OTP_SENDER);
  assert.ok(!sent[0].from.includes("gmail"), "the retired sender variable is still being read");
});

test("a missing or unknown sender fails before any connection", async () => {
  const { mailer } = await freshMailer();

  await assert.rejects(() => mailer.sendMail(MESSAGE), /Unknown mail sender/);
  await assert.rejects(() => mailer.sendMail(MESSAGE, "marketing"), /Unknown mail sender/);
  await assert.rejects(() => mailer.sendMail(MESSAGE, "constructor"), /Unknown mail sender/);

  assert.equal(created.length, 0, "a transport was created for an invalid sender");
  assert.equal(sent.length, 0);
});

test("a From in the message cannot override the sender", async () => {
  const { mailer, env } = await freshMailer();
  await mailer.sendMail({ ...MESSAGE, from: "attacker@example.test" }, "otp");

  assert.equal(sent[0].from, env.OTP_EMAIL_FROM);
});

test("sending is refused when SMTP is not configured", async () => {
  const { mailer } = await freshMailer({ SMTP_HOST: undefined });

  assert.equal(mailer.isMailConfigured(), false);
  await assert.rejects(() => mailer.sendMail(MESSAGE, "otp"), /SMTP is not configured/);
  assert.equal(created.length, 0);
});

test("the transport is created once and reused", async () => {
  const { mailer } = await freshMailer();
  await mailer.sendMail(MESSAGE, "otp");
  await mailer.sendMail(MESSAGE, "ticket");

  assert.equal(created.length, 1);
  assert.equal(sent.length, 2);
});

test("a connection-stage failure is retried on a fresh transport", async () => {
  const { mailer } = await freshMailer();
  failOnce = Object.assign(new Error("socket closed"), { code: "ECONNRESET" });

  await mailer.sendMail(MESSAGE, "ticket");

  assert.equal(created.length, 2, "the dead pool was not replaced");
  assert.equal(closed, 1, "the dead pool was not closed");
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0], sent[1], "the retry sent a different message");
});

test("a rejection by the server is not retried", async () => {
  for (const code of ["EENVELOPE", "EAUTH", "EMESSAGE"]) {
    const { mailer } = await freshMailer();
    failOnce = Object.assign(new Error("refused"), { code });

    await assert.rejects(() => mailer.sendMail(MESSAGE, "otp"), /refused/);
    assert.equal(created.length, 1, code + " should not create a second transport");
    assert.equal(closed, 0, code + " should not close the pool");
    assert.equal(sent.length, 1, code + " should not be sent twice");
  }
});

test("neither sender is the SMTP login", async () => {
  const { mailer, env } = await freshMailer();
  await mailer.sendMail(MESSAGE, "otp");
  await mailer.sendMail(MESSAGE, "ticket");

  for (const payload of sent) {
    // Brevo treats the login as a credential, not an address, and refuses it
    // in a From header.
    assert.ok(payload.from !== env.SMTP_USER, "a sender is set to the SMTP login");
    assert.ok(!payload.from.includes("@smtp-brevo.com"), "a sender uses the SMTP login domain");
    const name = payload.from.split("<")[0].trim().replace(/^"|"$/g, "");
    assert.ok(name.length > 0 && name.length < 70, "display name is missing or too long");
  }
});

test("SITE_URL defaults and loses a trailing slash", async () => {
  let loaded = await freshMailer({ SITE_URL: undefined });
  assert.equal(loaded.mailer.SITE_URL, "https://www.ulsaaham.com");

  loaded = await freshMailer({ SITE_URL: "https://staging.ulsaaham.com///" });
  assert.equal(loaded.mailer.SITE_URL, "https://staging.ulsaaham.com");
});
